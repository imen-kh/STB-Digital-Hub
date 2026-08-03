using Microsoft.EntityFrameworkCore;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class DigiCompteService(StbDigitalHubDbContext db)
{
    public async Task<IReadOnlyList<AccountSummaryDto>> GetAccountsAsync(
        long clientId,
        string? typeFilter = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);

        var query = db.ComptesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId);

        if (!string.IsNullOrWhiteSpace(typeFilter)
            && Enum.TryParse<TypeCompte>(typeFilter, true, out var type))
        {
            query = query.Where(c => c.Type == type);
        }

        var accounts = await query
            .OrderBy(c => c.Type)
            .ThenBy(c => c.IdCompte)
            .ToListAsync(cancellationToken);

        return accounts.Select(ToSummaryDto).ToList();
    }

    public async Task<AccountDetailDto?> GetAccountAsync(
        long clientId,
        long accountId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);

        var account = await db.ComptesBancaires.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId && c.IdCompte == accountId, cancellationToken);

        return account is null ? null : ToDetailDto(account);
    }

    public async Task<IReadOnlyList<AccountTransactionDto>> GetTransactionsAsync(
        long clientId,
        long accountId,
        CancellationToken cancellationToken = default)
    {
        var owned = await db.ComptesBancaires.AsNoTracking()
            .AnyAsync(c => c.IdClient == clientId && c.IdCompte == accountId, cancellationToken);

        if (!owned)
        {
            return [];
        }

        var transactions = await db.TransactionsCompte.AsNoTracking()
            .Where(t => t.IdCompte == accountId)
            .OrderByDescending(t => t.DateTransactionUtc)
            .Take(100)
            .ToListAsync(cancellationToken);

        return transactions.Select(ToTransactionDto).ToList();
    }

    public async Task<(AccountDetailDto? Source, AccountDetailDto? Destination, string? Error)> TransferAsync(
        long clientId,
        long sourceAccountId,
        TransferRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Montant <= 0)
        {
            return (null, null, "Le montant doit être supérieur à zéro.");
        }

        if (request.DestinationAccountId == sourceAccountId)
        {
            return (null, null, "Choisissez un compte de destination différent.");
        }

        var source = await db.ComptesBancaires
            .FirstOrDefaultAsync(c => c.IdClient == clientId && c.IdCompte == sourceAccountId, cancellationToken);
        var destination = await db.ComptesBancaires
            .FirstOrDefaultAsync(c => c.IdClient == clientId && c.IdCompte == request.DestinationAccountId, cancellationToken);

        if (source is null || destination is null)
        {
            return (null, null, "Compte introuvable.");
        }

        if (source.Statut != StatutCompte.Actif || destination.Statut != StatutCompte.Actif)
        {
            return (null, null, "Les deux comptes doivent être actifs pour un virement.");
        }

        var montant = Math.Round(request.Montant, 2);
        if (montant > source.Solde)
        {
            return (null, null, $"Solde insuffisant ({source.Solde:N2} DT).");
        }

        var motif = string.IsNullOrWhiteSpace(request.Motif)
            ? $"Virement vers {destination.Libelle}"
            : request.Motif.Trim();

        var stamp = DateTime.UtcNow;
        var refBase = $"VIR-{stamp:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        source.Solde -= montant;
        destination.Solde += montant;

        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = source.IdCompte,
            Reference = $"{refBase}-OUT",
            Montant = montant,
            DateTransactionUtc = stamp,
            Libelle = motif,
            TypeMouvement = TypeMouvementCompte.VirementSortant,
            Statut = StatutTransaction.Valide
        });

        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = destination.IdCompte,
            Reference = $"{refBase}-IN",
            Montant = montant,
            DateTransactionUtc = stamp,
            Libelle = string.IsNullOrWhiteSpace(request.Motif)
                ? $"Virement depuis {source.Libelle}"
                : request.Motif.Trim(),
            TypeMouvement = TypeMouvementCompte.VirementEntrant,
            Statut = StatutTransaction.Valide
        });

        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(source), ToDetailDto(destination), null);
    }

    private async Task EnsureSeedAsync(long clientId, CancellationToken cancellationToken)
    {
        var hasAccounts = await db.ComptesBancaires
            .AnyAsync(c => c.IdClient == clientId, cancellationToken);

        if (hasAccounts)
        {
            return;
        }

        var clientExists = await db.Clients.AnyAsync(c => c.IdClient == clientId, cancellationToken);
        if (!clientExists)
        {
            return;
        }

        var suffix = clientId.ToString().PadLeft(6, '0');
        var accounts = new List<CompteBancaire>
        {
            CreateAccount(
                clientId,
                "Compte courant principal",
                TypeCompte.Courant,
                $"20{suffix}0001",
                8500.00m),
            CreateAccount(
                clientId,
                "Compte courant secondaire",
                TypeCompte.Courant,
                $"20{suffix}0002",
                1250.50m),
            CreateAccount(
                clientId,
                "Compte épargne",
                TypeCompte.Epargne,
                $"25{suffix}0001",
                15000.00m)
        };

        db.ComptesBancaires.AddRange(accounts);
        await db.SaveChangesAsync(cancellationToken);

        var seedTx = new List<TransactionCompte>
        {
            new()
            {
                IdCompte = accounts[0].IdCompte,
                Reference = $"CRD-{suffix}-001",
                Montant = 2000m,
                Libelle = "Virement salaire",
                TypeMouvement = TypeMouvementCompte.Credit,
                DateTransactionUtc = DateTime.UtcNow.AddDays(-12)
            },
            new()
            {
                IdCompte = accounts[0].IdCompte,
                Reference = $"DBT-{suffix}-001",
                Montant = 85.400m,
                Libelle = "Paiement facture STEG",
                TypeMouvement = TypeMouvementCompte.Debit,
                DateTransactionUtc = DateTime.UtcNow.AddDays(-5)
            },
            new()
            {
                IdCompte = accounts[1].IdCompte,
                Reference = $"CRD-{suffix}-002",
                Montant = 500m,
                Libelle = "Dépôt guichet",
                TypeMouvement = TypeMouvementCompte.Credit,
                DateTransactionUtc = DateTime.UtcNow.AddDays(-8)
            },
            new()
            {
                IdCompte = accounts[2].IdCompte,
                Reference = $"CRD-{suffix}-003",
                Montant = 1000m,
                Libelle = "Versement épargne",
                TypeMouvement = TypeMouvementCompte.Credit,
                DateTransactionUtc = DateTime.UtcNow.AddDays(-20)
            }
        };

        db.TransactionsCompte.AddRange(seedTx);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static CompteBancaire CreateAccount(
        long clientId,
        string libelle,
        TypeCompte type,
        string numero,
        decimal solde)
    {
        var rib = BuildRib(numero);
        return new CompteBancaire
        {
            IdClient = clientId,
            Libelle = libelle,
            Type = type,
            Statut = StatutCompte.Actif,
            NumeroCompte = numero,
            Rib = rib,
            Iban = BuildIban(rib),
            Solde = solde,
            Devise = "TND",
            DateOuvertureUtc = DateTime.UtcNow.AddMonths(-18)
        };
    }

    private static string BuildRib(string numeroCompte)
    {
        // Simulation RIB tunisien : code banque(2) + agence(3) + compte(13) + clé(2)
        var body = ("10" + "001" + numeroCompte.PadLeft(13, '0'))[..18];
        return body + "42";
    }

    private static string BuildIban(string rib) => $"TN59{rib}";

    private static string MaskAccount(string numero)
    {
        if (numero.Length <= 4)
        {
            return numero;
        }

        return $"{new string('•', Math.Max(0, numero.Length - 4))}{numero[^4..]}";
    }

    private static string MaskRib(string rib)
    {
        if (rib.Length <= 4)
        {
            return rib;
        }

        return $"{rib[..4]}••••••••••••{rib[^4..]}";
    }

    private static string MaskIban(string iban)
    {
        if (iban.Length <= 8)
        {
            return iban;
        }

        return $"{iban[..4]} •••• •••• {iban[^4..]}";
    }

    private static AccountSummaryDto ToSummaryDto(CompteBancaire c) => new(
        c.IdCompte,
        c.Libelle,
        FormatType(c.Type),
        FormatStatut(c.Statut),
        MaskAccount(c.NumeroCompte),
        c.Solde,
        c.Devise);

    private static AccountDetailDto ToDetailDto(CompteBancaire c) => new(
        c.IdCompte,
        c.Libelle,
        FormatType(c.Type),
        FormatStatut(c.Statut),
        c.NumeroCompte,
        MaskRib(c.Rib),
        MaskIban(c.Iban),
        c.Rib,
        c.Iban,
        c.Solde,
        c.Devise,
        c.DateOuvertureUtc.ToString("dd/MM/yyyy"));

    private static AccountTransactionDto ToTransactionDto(TransactionCompte t) => new(
        t.IdTransaction,
        t.Reference,
        t.Montant,
        t.DateTransactionUtc.ToString("o"),
        t.Libelle,
        FormatMouvement(t.TypeMouvement),
        FormatStatutTransaction(t.Statut));

    private static string FormatType(TypeCompte type) => type switch
    {
        TypeCompte.Courant => "Courant",
        TypeCompte.Epargne => "Épargne",
        _ => type.ToString()
    };

    private static string FormatStatut(StatutCompte statut) => statut switch
    {
        StatutCompte.Actif => "Actif",
        StatutCompte.Bloque => "Bloqué",
        StatutCompte.Cloture => "Clôturé",
        _ => statut.ToString()
    };

    private static string FormatMouvement(TypeMouvementCompte type) => type switch
    {
        TypeMouvementCompte.Credit => "Crédit",
        TypeMouvementCompte.Debit => "Débit",
        TypeMouvementCompte.VirementEntrant => "Virement entrant",
        TypeMouvementCompte.VirementSortant => "Virement sortant",
        _ => type.ToString()
    };

    private static string FormatStatutTransaction(StatutTransaction statut) => statut switch
    {
        StatutTransaction.Valide => "Validée",
        StatutTransaction.EnAttente => "En attente",
        StatutTransaction.Refusee => "Non valide",
        _ => statut.ToString()
    };
}
