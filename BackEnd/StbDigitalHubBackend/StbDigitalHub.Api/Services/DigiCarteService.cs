using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class DigiCarteService(
    StbDigitalHubDbContext db,
    OtpService otpService,
    NotificationService notificationService,
    DigiCompteService digiCompteService)
{
    private static readonly string[] Commercants =
    [
        "Carrefour Tunis", "Shell Station", "Amazon", "Monoprix", "Ooredoo",
        "Tunisie Telecom", "Zara", "Decathlon", "Pharmacie Centrale", "Uber Eats"
    ];

    private static readonly (string Name, string Pays, string Devise, decimal TauxApprox)[] TravelMerchants =
    [
        ("Galeries Lafayette", "France", "EUR", 3.35m),
        ("Zara Madrid", "Espagne", "EUR", 3.35m),
        ("Starbucks London", "Royaume-Uni", "GBP", 3.90m),
        ("Apple Store NYC", "États-Unis", "USD", 3.10m),
        ("Hilton Dubai", "Émirats arabes unis", "AED", 0.85m),
        ("ATM Paris Charles-de-Gaulle", "France", "EUR", 3.35m),
        ("Booking.com Hotel Rome", "Italie", "EUR", 3.35m),
        ("Uber Berlin", "Allemagne", "EUR", 3.35m)
    ];

    private const decimal TravelAllocationDefault = 6000m;
    private const decimal TravelRechargeMax = 3000m;
    private const decimal TravelSoldeMax = 6000m;

    static DigiCarteService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<IReadOnlyList<CardSummaryDto>> GetCardsAsync(
        long clientId,
        StatutCarte? statutFilter,
        CancellationToken cancellationToken = default)
    {
        await NormalizeLegacyCardsAsync(clientId, cancellationToken);
        await EnsureSeedAsync(clientId, cancellationToken);
        await ClearExpiredTemporaryLimitsForClientAsync(clientId, cancellationToken);

        var query = db.CartesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId);

        if (statutFilter.HasValue)
        {
            query = query.Where(c => c.Statut == statutFilter.Value);
        }

        var cards = await query
            .OrderBy(c => c.Type)
            .ThenBy(c => c.IdCarte)
            .ToListAsync(cancellationToken);

        return cards.Select(ToSummaryDto).ToList();
    }

    public async Task<CardDetailDto?> GetCardAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        await NormalizeLegacyCardsAsync(clientId, cancellationToken);
        await EnsureSeedAsync(clientId, cancellationToken);

        var card = await db.CartesBancaires
            .FirstOrDefaultAsync(c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);

        if (card is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(card.NumeroComplet))
        {
            card.NumeroComplet = DeriveNumeroComplet(card.NumeroMasque);
        }

        if (EnsureTravelAllocationYear(card))
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        await ClearExpiredTemporaryLimitAsync(card, cancellationToken);
        return ToDetailDto(card);
    }

    public async Task<(CardDetailDto? Card, string? Error)> BlockAsync(
        long clientId,
        long cardId,
        bool confirm,
        CancellationToken cancellationToken = default)
    {
        if (!confirm)
        {
            return (null, "Veuillez confirmer le blocage de la carte.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (card.Statut == StatutCarte.Expiree)
        {
            return (null, "Impossible de bloquer une carte expirée.");
        }

        card.Statut = StatutCarte.Bloquee;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> UnblockAsync(
        long clientId,
        long cardId,
        bool confirm,
        CancellationToken cancellationToken = default)
    {
        if (!confirm)
        {
            return (null, "Veuillez confirmer le déblocage de la carte.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (card.Statut != StatutCarte.Bloquee)
        {
            return (null, "Seule une carte bloquée peut être débloquée.");
        }

        card.Statut = StatutCarte.Active;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> SetOnlinePaymentsAsync(
        long clientId,
        long cardId,
        bool actif,
        bool confirm,
        CancellationToken cancellationToken = default)
    {
        if (!confirm)
        {
            return (null, "Veuillez confirmer cette action.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (card.Statut is StatutCarte.Bloquee or StatutCarte.Expiree)
        {
            return (null, "Cette carte ne permet pas de modifier les paiements en ligne.");
        }

        card.PaiementsEnLigneActifs = actif;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(OtpChallengeResponse? Response, string? Error)> RequestLimitsOtpAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var client = await GetClientWithCardAsync(clientId, cardId, cancellationToken);
        if (client is null)
        {
            return (null, "Carte introuvable.");
        }

        var (challenge, expiresIn, _, _) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — Confirmation modification de plafond",
            "Votre code de confirmation pour modifier les plafonds est",
            cancellationToken);

        return (new OtpChallengeResponse(challenge.Id, "Un code de confirmation a été envoyé à votre e-mail.", expiresIn), null);
    }

    public async Task<(OtpChallengeResponse? Response, string? Error)> RequestTemporaryLimitOtpAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var client = await GetClientWithCardAsync(clientId, cardId, cancellationToken);
        if (client is null)
        {
            return (null, "Carte introuvable.");
        }

        var (challenge, expiresIn, _, _) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — Confirmation plafond temporaire",
            "Votre code de confirmation pour le plafond temporaire est",
            cancellationToken);

        return (new OtpChallengeResponse(challenge.Id, "Un code de confirmation a été envoyé à votre e-mail.", expiresIn), null);
    }

    public async Task<(OtpChallengeResponse? Response, string? Error)> RequestRevealNumberOtpAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var client = await GetClientWithCardAsync(clientId, cardId, cancellationToken);
        if (client is null)
        {
            return (null, "Carte introuvable.");
        }

        var (challenge, expiresIn, _, _) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — Affichage du numéro de carte",
            "Votre code pour afficher le numéro complet de la carte est",
            cancellationToken);

        return (new OtpChallengeResponse(challenge.Id, "Un code de confirmation a été envoyé à votre e-mail.", expiresIn), null);
    }

    public async Task<(RevealNumberResponse? Response, string? Error)> RevealNumberAsync(
        long clientId,
        long cardId,
        CardOtpVerifyRequest request,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        var otpError = await VerifyOtpForClientAsync(clientId, request, cancellationToken);
        if (otpError is not null)
        {
            return (null, otpError);
        }

        return (new RevealNumberResponse(card.NumeroComplet, "Numéro de carte affiché."), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> UpdateLimitsAsync(
        long clientId,
        long cardId,
        UpdateLimitsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.PlafondPaiement <= 0 || request.PlafondRetrait <= 0)
        {
            return (null, "Les plafonds doivent être supérieurs à zéro.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        var otpError = await VerifyOtpForClientAsync(clientId, new CardOtpVerifyRequest(request.ChallengeId, request.OtpCode), cancellationToken);
        if (otpError is not null)
        {
            return (null, otpError);
        }

        card.PlafondPaiement = request.PlafondPaiement;
        card.PlafondRetrait = request.PlafondRetrait;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> SetTemporaryLimitAsync(
        long clientId,
        long cardId,
        TemporaryLimitRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.PlafondTemporaire <= 0)
        {
            return (null, "Le plafond temporaire doit être supérieur à zéro.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.DateFin <= today)
        {
            return (null, "La date de fin du plafond temporaire doit être postérieure à aujourd'hui.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        await ClearExpiredTemporaryLimitAsync(card, cancellationToken);

        if (request.PlafondTemporaire < card.PlafondPaiement)
        {
            return (null, "Le plafond temporaire doit être supérieur ou égal au plafond de paiement.");
        }

        var otpError = await VerifyOtpForClientAsync(clientId, new CardOtpVerifyRequest(request.ChallengeId, request.OtpCode), cancellationToken);
        if (otpError is not null)
        {
            return (null, otpError);
        }

        card.PlafondTemporaire = request.PlafondTemporaire;
        card.DateFinPlafondTemporaire = request.DateFin;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<IReadOnlyList<TransactionDto>> GetTransactionsAsync(
        long clientId,
        long cardId,
        TypeOperation? typeFilter,
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        var card = await db.CartesBancaires.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);

        if (card is null)
        {
            return [];
        }

        var query = db.TransactionsCarte.AsNoTracking()
            .Where(t => t.IdCarte == cardId);

        if (typeFilter.HasValue)
        {
            query = query.Where(t => t.TypeOperation == typeFilter.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(t => t.DateTransactionUtc >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(t => t.DateTransactionUtc <= to.Value);
        }

        var transactions = await query
            .OrderByDescending(t => t.DateTransactionUtc)
            .ToListAsync(cancellationToken);

        return transactions.Select(ToTransactionDto).ToList();
    }

    public async Task<(TransactionDto? Transaction, string? Error)> GenerateFakeTransactionAsync(
        long clientId,
        long cardId,
        FakeTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        await ClearExpiredTemporaryLimitAsync(card, cancellationToken);

        if (card.Statut is StatutCarte.Bloquee or StatutCarte.Expiree or StatutCarte.Inactive)
        {
            return (null, "Cette carte n'accepte pas de nouvelles transactions.");
        }

        if (request.Montant <= 0)
        {
            return (null, "Le montant doit être supérieur à zéro.");
        }

        if (!TryParseOperationType(request.TypeOperation, out var type))
        {
            return (null, "Type de paiement invalide. Choisissez Paiement, Retrait ou PaiementEnLigne.");
        }

        if (type == TypeOperation.Recharge)
        {
            return (null, "Utilisez la fonction Recharge pour créditer une carte.");
        }

        var montant = Math.Round(request.Montant, 2);
        var plafondApplicable = type == TypeOperation.Retrait
            ? card.PlafondRetrait
            : GetEffectivePaymentLimit(card);

        if (type == TypeOperation.PaiementEnLigne && !card.PaiementsEnLigneActifs)
        {
            return await PersistRejectedTransactionAsync(
                clientId,
                card,
                montant,
                type,
                "Paiement en ligne refusé",
                $"Tentative de paiement en ligne de {montant:N2} DT refusée : les paiements en ligne sont désactivés sur la carte {card.NumeroMasque}.",
                cancellationToken);
        }

        if (IsTravel(card.Type) && type == TypeOperation.PaiementEnLigne && !IsEcommerceIntlActive(card))
        {
            return await PersistRejectedTransactionAsync(
                clientId,
                card,
                montant,
                type,
                "E-commerce international inactif",
                $"Paiement en ligne à l'étranger de {montant:N2} DT refusé : activez l'e-commerce international (et sa période) sur votre carte Travel {card.NumeroMasque}.",
                cancellationToken);
        }

        if (montant > plafondApplicable)
        {
            var label = type == TypeOperation.Retrait ? "retrait" : "paiement";
            return await PersistRejectedTransactionAsync(
                clientId,
                card,
                montant,
                type,
                "Plafond dépassé",
                $"Transaction de {montant:N2} DT refusée : le montant dépasse le plafond de {label} ({plafondApplicable:N2} DT) sur la carte {card.NumeroMasque}.",
                cancellationToken);
        }

        if (IsPrepaidBalance(card.Type))
        {
            if (montant > card.Solde)
            {
                return await PersistRejectedTransactionAsync(
                    clientId,
                    card,
                    montant,
                    type,
                    IsTravel(card.Type) ? "Solde Travel insuffisant" : "Solde C-Cash insuffisant",
                    $"Transaction de {montant:N2} DT refusée : solde insuffisant ({card.Solde:N2} DT) sur la carte {card.NumeroMasque}.",
                    cancellationToken);
            }
        }
        else
        {
            var compte = await GetPrimaryCourantAccountAsync(clientId, cancellationToken);
            if (compte is null)
            {
                return (null, "Aucun compte courant actif n'est lié à cette carte classique.");
            }

            if (montant > compte.Solde)
            {
                return await PersistRejectedTransactionAsync(
                    clientId,
                    card,
                    montant,
                    type,
                    "Solde compte insuffisant",
                    $"Transaction de {montant:N2} DT refusée : solde insuffisant sur le compte {compte.Libelle} ({compte.Solde:N2} DT).",
                    cancellationToken);
            }
        }

        string commercant;
        string? devise = null;
        decimal? montantDevise = null;
        string? pays = null;

        if (IsTravel(card.Type))
        {
            var merchant = ResolveTravelMerchant(request);
            commercant = merchant.Name;
            pays = merchant.Pays;
            devise = merchant.Devise;
            montantDevise = merchant.MontantDevise > 0
                ? merchant.MontantDevise
                : Math.Round(montant / merchant.TauxApprox, 2);
        }
        else
        {
            commercant = Commercants[Random.Shared.Next(Commercants.Length)];
        }

        var now = DateTime.UtcNow;
        var anomaly = await notificationService.DetectAnomalyAsync(
            card.IdCarte,
            montant,
            type,
            now,
            card,
            excludeTransactionId: null,
            cancellationToken);

        if (anomaly is not null)
        {
            return await PersistPendingTransactionAsync(
                clientId, card, montant, type, anomaly, commercant, devise, montantDevise, pays, cancellationToken);
        }

        return await PersistValidatedTransactionAsync(
            clientId, card, montant, type, cancellationToken, commercant, devise: devise, montantDevise: montantDevise, pays: pays);
    }

    private static (string Name, string Pays, string Devise, decimal TauxApprox, decimal MontantDevise) ResolveTravelMerchant(
        FakeTransactionRequest request)
    {
        var pick = TravelMerchants[Random.Shared.Next(TravelMerchants.Length)];
        var pays = string.IsNullOrWhiteSpace(request.Pays) ? pick.Pays : request.Pays.Trim();
        var devise = string.IsNullOrWhiteSpace(request.Devise) ? pick.Devise : request.Devise.Trim().ToUpperInvariant();
        var match = TravelMerchants.FirstOrDefault(m => m.Devise == devise);
        var taux = string.IsNullOrEmpty(match.Devise) ? pick.TauxApprox : match.TauxApprox;

        return (pick.Name, pays, devise, taux, request.MontantDevise ?? 0);
    }

    private async Task<(TransactionDto? Transaction, string? Error)> PersistPendingTransactionAsync(
        long clientId,
        CarteBancaire card,
        decimal montant,
        TypeOperation type,
        string anomalyReason,
        string commercant,
        string? devise,
        decimal? montantDevise,
        string? pays,
        CancellationToken cancellationToken)
    {
        var random = Random.Shared;
        var transaction = new TransactionCarte
        {
            IdCarte = card.IdCarte,
            Reference = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{random.Next(1000, 9999)}",
            Montant = montant,
            DateTransactionUtc = DateTime.UtcNow,
            Commercant = commercant,
            TypeOperation = type,
            Statut = StatutTransaction.EnAttente,
            Devise = devise,
            MontantDevise = montantDevise,
            Pays = pays
        };

        db.TransactionsCarte.Add(transaction);
        await db.SaveChangesAsync(cancellationToken);

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is not null)
        {
            await notificationService.CreatePendingConfirmationNotificationAsync(
                client,
                card,
                transaction,
                anomalyReason,
                cancellationToken);
        }

        return (ToTransactionDto(transaction), null);
    }

    private async Task<(TransactionDto? Transaction, string? Error)> PersistValidatedTransactionAsync(
        long clientId,
        CarteBancaire card,
        decimal montant,
        TypeOperation type,
        CancellationToken cancellationToken,
        string? commercant = null,
        string? reference = null,
        DateTime? dateUtc = null,
        string? devise = null,
        decimal? montantDevise = null,
        string? pays = null)
    {
        if (IsPrepaidBalance(card.Type))
        {
            if (montant > card.Solde)
            {
                return (null, $"Solde insuffisant ({card.Solde:N2} DT).");
            }

            card.Solde = Math.Max(0, card.Solde - montant);
        }
        else
        {
            var compte = await GetPrimaryCourantAccountAsync(clientId, cancellationToken);
            if (compte is null)
            {
                return (null, "Aucun compte courant actif n'est lié à cette carte classique.");
            }

            if (montant > compte.Solde)
            {
                return (null, $"Solde insuffisant sur le compte {compte.Libelle} ({compte.Solde:N2} DT).");
            }

            compte.Solde -= montant;
            db.TransactionsCompte.Add(new TransactionCompte
            {
                IdCompte = compte.IdCompte,
                Reference = $"DBT-CARD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}",
                Montant = montant,
                DateTransactionUtc = DateTime.UtcNow,
                Libelle = $"{FormatOperation(type)} carte {card.NumeroMasque}",
                TypeMouvement = TypeMouvementCompte.Debit,
                Statut = StatutTransaction.Valide
            });
        }

        var random = Random.Shared;
        var transaction = new TransactionCarte
        {
            IdCarte = card.IdCarte,
            Reference = reference ?? $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{random.Next(1000, 9999)}",
            Montant = montant,
            DateTransactionUtc = dateUtc ?? DateTime.UtcNow,
            Commercant = commercant ?? Commercants[random.Next(Commercants.Length)],
            TypeOperation = type,
            Statut = StatutTransaction.Valide,
            Devise = devise,
            MontantDevise = montantDevise,
            Pays = pays
        };

        db.TransactionsCarte.Add(transaction);
        await db.SaveChangesAsync(cancellationToken);

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is not null)
        {
            await notificationService.CreateTransactionNotificationsAsync(client, card, transaction, cancellationToken);
            await TrySendMarteAlertAsync(client, card, transaction, cancellationToken);
        }

        return (ToTransactionDto(transaction), null);
    }

    public async Task<(OtpChallengeResponse? Response, string? Error)> RequestConfirmPendingTransactionOtpAsync(
        long clientId,
        long cardId,
        long transactionId,
        CancellationToken cancellationToken = default)
    {
        var pending = await GetOwnedPendingTransactionAsync(clientId, cardId, transactionId, cancellationToken);
        if (pending is null)
        {
            return (null, "Transaction en attente introuvable.");
        }

        var client = await db.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        var (challenge, expiresIn, _, _) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — Confirmation transaction inhabituelle",
            $"Votre code pour valider la transaction {pending.Reference} ({pending.Montant:N2} DT) est",
            cancellationToken);

        return (new OtpChallengeResponse(challenge.Id, "Un code de confirmation a été envoyé à votre e-mail.", expiresIn), null);
    }

    public async Task<(PendingTransactionActionResponse? Response, string? Error)> ConfirmPendingTransactionAsync(
        long clientId,
        long cardId,
        long transactionId,
        ConfirmPendingTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        var transaction = await GetOwnedPendingTransactionAsync(clientId, cardId, transactionId, cancellationToken);
        if (transaction is null)
        {
            return (null, "Transaction en attente introuvable.");
        }

        if (card.Statut is StatutCarte.Bloquee or StatutCarte.Expiree or StatutCarte.Inactive)
        {
            return (null, "Cette carte n'accepte pas de nouvelles transactions.");
        }

        var otpError = await VerifyOtpForClientAsync(
            clientId,
            new CardOtpVerifyRequest(request.ChallengeId, request.OtpCode),
            cancellationToken);
        if (otpError is not null)
        {
            return (null, otpError);
        }

        if (IsPrepaidBalance(card.Type))
        {
            if (transaction.Montant > card.Solde)
            {
                transaction.Statut = StatutTransaction.Refusee;
                await db.SaveChangesAsync(cancellationToken);
                return (null, $"Solde insuffisant ({card.Solde:N2} DT). La transaction a été refusée.");
            }

            card.Solde = Math.Max(0, card.Solde - transaction.Montant);
        }
        else
        {
            var compte = await GetPrimaryCourantAccountAsync(clientId, cancellationToken);
            if (compte is null)
            {
                return (null, "Aucun compte courant actif n'est lié à cette carte classique.");
            }

            if (transaction.Montant > compte.Solde)
            {
                transaction.Statut = StatutTransaction.Refusee;
                await db.SaveChangesAsync(cancellationToken);
                return (null, $"Solde insuffisant sur le compte {compte.Libelle}. La transaction a été refusée.");
            }

            compte.Solde -= transaction.Montant;
            db.TransactionsCompte.Add(new TransactionCompte
            {
                IdCompte = compte.IdCompte,
                Reference = $"DBT-CARD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}",
                Montant = transaction.Montant,
                DateTransactionUtc = DateTime.UtcNow,
                Libelle = $"{FormatOperation(transaction.TypeOperation)} carte {card.NumeroMasque}",
                TypeMouvement = TypeMouvementCompte.Debit,
                Statut = StatutTransaction.Valide
            });
        }

        transaction.Statut = StatutTransaction.Valide;
        await db.SaveChangesAsync(cancellationToken);

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is not null)
        {
            await notificationService.CreateTransactionNotificationsAsync(client, card, transaction, cancellationToken);
            await TrySendMarteAlertAsync(client, card, transaction, cancellationToken);
        }

        return (new PendingTransactionActionResponse(
            "Transaction validée et débitée.",
            ToTransactionDto(transaction),
            ToDetailDto(card)), null);
    }

    public async Task<(PendingTransactionActionResponse? Response, string? Error)> RefusePendingTransactionAsync(
        long clientId,
        long cardId,
        long transactionId,
        bool confirm,
        CancellationToken cancellationToken = default)
    {
        if (!confirm)
        {
            return (null, "Confirmation requise pour refuser la transaction.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        var transaction = await GetOwnedPendingTransactionAsync(clientId, cardId, transactionId, cancellationToken);
        if (transaction is null)
        {
            return (null, "Transaction en attente introuvable.");
        }

        transaction.Statut = StatutTransaction.Refusee;
        await db.SaveChangesAsync(cancellationToken);

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is not null)
        {
            await notificationService.CreateRejectedTransactionNotificationAsync(
                client,
                card,
                transaction,
                "Transaction refusée",
                $"Vous avez refusé la transaction inhabituelle de {transaction.Montant:N2} DT chez {transaction.Commercant} sur la carte {card.NumeroMasque}. Aucun débit n'a été effectué.",
                cancellationToken);
        }

        return (new PendingTransactionActionResponse(
            "Transaction refusée. Aucun débit n'a été effectué.",
            ToTransactionDto(transaction),
            ToDetailDto(card)), null);
    }

    private async Task<TransactionCarte?> GetOwnedPendingTransactionAsync(
        long clientId,
        long cardId,
        long transactionId,
        CancellationToken cancellationToken)
    {
        return await db.TransactionsCarte
            .Include(t => t.Carte)
            .FirstOrDefaultAsync(
                t => t.IdTransaction == transactionId
                     && t.IdCarte == cardId
                     && t.Carte!.IdClient == clientId
                     && t.Statut == StatutTransaction.EnAttente,
                cancellationToken);
    }

    private async Task<(TransactionDto? Transaction, string? Error)> PersistRejectedTransactionAsync(
        long clientId,
        CarteBancaire card,
        decimal montant,
        TypeOperation type,
        string titre,
        string message,
        CancellationToken cancellationToken)
    {
        var random = Random.Shared;
        var transaction = new TransactionCarte
        {
            IdCarte = card.IdCarte,
            Reference = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{random.Next(1000, 9999)}",
            Montant = montant,
            DateTransactionUtc = DateTime.UtcNow,
            Commercant = Commercants[random.Next(Commercants.Length)],
            TypeOperation = type,
            Statut = StatutTransaction.Refusee
        };

        db.TransactionsCarte.Add(transaction);
        await db.SaveChangesAsync(cancellationToken);

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is not null)
        {
            await notificationService.CreateRejectedTransactionNotificationAsync(
                client,
                card,
                transaction,
                titre,
                message,
                cancellationToken);
        }

        return (ToTransactionDto(transaction), null);
    }

    public async Task<(OtpChallengeResponse? Response, string? Error)> RequestRechargeOtpAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (!IsRechargeable(card.Type))
        {
            return (null, "Seules les cartes STB C-Cash et Travel peuvent être rechargées.");
        }

        if (card.Statut is not StatutCarte.Active)
        {
            return (null, "La carte doit être active pour être rechargée.");
        }

        EnsureTravelAllocationYear(card);

        var label = IsTravel(card.Type) ? "Travel" : "C-Cash";
        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        var (challenge, expiresIn, _, _) = await otpService.CreateAndSendAsync(
            client,
            $"STB Digital Hub — Confirmation recharge {label}",
            $"Votre code de confirmation pour recharger la carte {label} est",
            cancellationToken);

        return (new OtpChallengeResponse(challenge.Id, "Un code de confirmation a été envoyé à votre e-mail.", expiresIn), null);
    }

    public async Task<(TransactionDto? Transaction, CardDetailDto? Card, string? Error)> RechargeAsync(
        long clientId,
        long cardId,
        RechargeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Montant <= 0)
        {
            return (null, null, "Le montant doit être supérieur à zéro.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, null, "Carte introuvable.");
        }

        if (!IsRechargeable(card.Type))
        {
            return (null, null, "Seules les cartes STB C-Cash et Travel peuvent être rechargées.");
        }

        if (card.Statut is not StatutCarte.Active)
        {
            return (null, null, "La carte doit être active pour être rechargée.");
        }

        EnsureTravelAllocationYear(card);

        var otpError = await VerifyOtpForClientAsync(
            clientId,
            new CardOtpVerifyRequest(request.ChallengeId, request.OtpCode),
            cancellationToken);
        if (otpError is not null)
        {
            return (null, null, otpError);
        }

        var montant = Math.Round(request.Montant, 2);
        if (card.PlafondRecharge > 0 && montant > card.PlafondRecharge)
        {
            return (null, null, $"Le montant dépasse le plafond de recharge ({card.PlafondRecharge:N2} DT).");
        }

        if (IsTravel(card.Type))
        {
            var restante = GetAllocationRestante(card);
            if (montant > restante)
            {
                return (null, null,
                    $"Le montant dépasse le reste d'allocation touristique ({restante:N2} DT / {card.AllocationAnnuelle:N2} DT en {card.AnneeAllocation}).");
            }
        }

        if (card.SoldeMaximal > 0 && card.Solde + montant > card.SoldeMaximal)
        {
            return (null, null,
                $"Le solde maximal de la carte ({card.SoldeMaximal:N2} DT) serait dépassé. Solde actuel : {card.Solde:N2} DT.");
        }

        await digiCompteService.GetAccountsAsync(clientId, "Courant", cancellationToken);

        var compte = await db.ComptesBancaires
            .FirstOrDefaultAsync(
                c => c.IdCompte == request.CompteSourceId
                    && c.IdClient == clientId
                    && c.Type == TypeCompte.Courant,
                cancellationToken);

        if (compte is null)
        {
            return (null, null, "Compte courant source introuvable.");
        }

        if (compte.Statut != StatutCompte.Actif)
        {
            return (null, null, "Le compte source doit être actif.");
        }

        if (montant > compte.Solde)
        {
            return (null, null, $"Solde insuffisant sur le compte {compte.Libelle} ({compte.Solde:N2} DT).");
        }

        var cardLabel = IsTravel(card.Type) ? "Travel" : "C-Cash";

        await using var dbTx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            compte.Solde -= montant;
            card.Solde += montant;
            if (IsTravel(card.Type))
            {
                card.AllocationConsommeeAnnee += montant;
            }

            var stamp = DateTime.UtcNow;
            var refBase = $"RCH-{stamp:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

            var cardTx = new TransactionCarte
            {
                IdCarte = card.IdCarte,
                Reference = $"{refBase}-CARD",
                Montant = montant,
                DateTransactionUtc = stamp,
                Commercant = $"Recharge depuis {compte.Libelle}",
                TypeOperation = TypeOperation.Recharge,
                Statut = StatutTransaction.Valide,
                Devise = "TND",
                MontantDevise = montant,
                Pays = "Tunisie"
            };

            var accountTx = new TransactionCompte
            {
                IdCompte = compte.IdCompte,
                Reference = $"{refBase}-CPT",
                Montant = montant,
                DateTransactionUtc = stamp,
                Libelle = $"Recharge {cardLabel} {card.NumeroMasque}",
                TypeMouvement = TypeMouvementCompte.Debit,
                Statut = StatutTransaction.Valide
            };

            db.TransactionsCarte.Add(cardTx);
            db.TransactionsCompte.Add(accountTx);
            await db.SaveChangesAsync(cancellationToken);
            await dbTx.CommitAsync(cancellationToken);

            var client = await db.Clients.AsNoTracking()
                .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
            if (client is not null)
            {
                await notificationService.CreateTransactionNotificationsAsync(client, card, cardTx, cancellationToken);
                await TrySendMarteAlertAsync(client, card, cardTx, cancellationToken);
            }

            return (ToTransactionDto(cardTx), ToDetailDto(card), null);
        }
        catch
        {
            await dbTx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<(byte[]? Pdf, string? Error)> GenerateAssistanceCertificateAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var card = await db.CartesBancaires.AsNoTracking()
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);

        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (!IsTravel(card.Type))
        {
            return (null, "L'attestation d'assistance voyage est réservée à la carte STB Travel.");
        }

        var client = card.Client;
        var validUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1));
        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(50);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Text("STB BANK").Bold().FontSize(18).FontColor(Colors.Blue.Darken3);
                    col.Item().Text("Attestation d'assistance voyage — Carte STB Travel")
                        .Bold().FontSize(14).FontColor(Colors.Blue.Medium);
                });

                page.Content().PaddingVertical(24).Column(col =>
                {
                    col.Item().Text(
                        $"Je soussigné(e), STB Digital Hub, certifie que {client.Prenom} {client.Nom} " +
                        $"est titulaire de la carte STB Travel {card.NumeroMasque} et bénéficie de l'assistance " +
                        "et de l'assurance voyage associées.");
                    col.Item().PaddingTop(12).Text("Couverture :").Bold();
                    col.Item().Text("• Couverture médicale et assistance jusqu'à 50 000 USD / an");
                    col.Item().Text("• Titulaire, conjoint(e) et jusqu'à 3 enfants à charge");
                    col.Item().Text("• Assurance perte / vol de carte (frais d'opposition et usages frauduleux)");
                    col.Item().PaddingTop(12).Text($"Carte : {card.NumeroMasque} — Expire {card.DateExpiration:MM/yyyy}");
                    col.Item().Text($"Valable jusqu'au : {validUntil:dd/MM/yyyy}");
                    col.Item().PaddingTop(12).Text("Contacts assistance :").Bold();
                    col.Item().Text("International (hors USA) : 001 817 826 7014");
                    col.Item().Text("USA : 866 273 9079");
                    col.Item().Text("Opposition cartes SMT : 80 100 115 / 70 155 840");
                    col.Item().PaddingTop(20).Text(
                        "Document généré pour dossier visa / voyage. Présentable auprès des autorités compétentes.");
                });

                page.Footer().AlignCenter().Text($"Émis le {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC — STB Digital Hub");
            });
        }).GeneratePdf();

        return (pdf, null);
    }

    public TravelAssistanceInfoDto GetTravelAssistanceInfo() => new(
        "Assistance & assurance voyage STB Travel",
        "Jusqu'à 50 000 USD / an",
        "Titulaire, conjoint(e) et jusqu'à 3 enfants à charge",
        "001 817 826 7014 (hors USA)",
        "866 273 9079 (USA)",
        "80 100 115 / 70 155 840 (opposition SMT 24h/24)",
        [
            "Frais médicaux et évacuation à l'étranger",
            "Assurance perte / vol de carte",
            "Assistance Mastercard Global Service",
            "Attestation téléchargeable pour visa Schengen"
        ]);

    public async Task<(OtpChallengeResponse? Response, string? Error)> RequestEcommerceIntlOtpAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (!IsTravel(card.Type))
        {
            return (null, "Réservé à la carte STB Travel.");
        }

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        var (challenge, expiresIn, _, _) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — E-commerce international Travel",
            "Votre code pour modifier l'activation e-commerce international est",
            cancellationToken);

        return (new OtpChallengeResponse(challenge.Id, "Un code de confirmation a été envoyé à votre e-mail.", expiresIn), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> SetEcommerceInternationalAsync(
        long clientId,
        long cardId,
        UpdateEcommerceIntlRequest request,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (!IsTravel(card.Type))
        {
            return (null, "Réservé à la carte STB Travel.");
        }

        var otpError = await VerifyOtpForClientAsync(
            clientId,
            new CardOtpVerifyRequest(request.ChallengeId, request.OtpCode),
            cancellationToken);
        if (otpError is not null)
        {
            return (null, otpError);
        }

        if (request.Actif)
        {
            if (request.DateDebut.HasValue && request.DateFin.HasValue && request.DateFin < request.DateDebut)
            {
                return (null, "La date de fin doit être postérieure à la date de début.");
            }

            card.EcommerceInternationalActif = true;
            card.DateDebutEcommerceIntl = request.DateDebut ?? DateOnly.FromDateTime(DateTime.UtcNow);
            card.DateFinEcommerceIntl = request.DateFin ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3));
        }
        else
        {
            card.EcommerceInternationalActif = false;
            card.DateDebutEcommerceIntl = null;
            card.DateFinEcommerceIntl = null;
        }

        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> SetMarteAlertsAsync(
        long clientId,
        long cardId,
        UpdateMarteAlertsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!request.Confirm)
        {
            return (null, "Confirmation requise.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (!IsTravel(card.Type))
        {
            return (null, "Réservé à la carte STB Travel.");
        }

        card.AlertesMarteActives = request.Actif;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(CardDetailDto? Card, string? Error)> SetPreferredCurrencyAsync(
        long clientId,
        long cardId,
        UpdatePreferredCurrencyRequest request,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        if (!IsTravel(card.Type))
        {
            return (null, "Réservé à la carte STB Travel.");
        }

        var devise = (request.Devise ?? "EUR").Trim().ToUpperInvariant();
        if (GetExchangeRate(devise) is null && devise != "TND")
        {
            return (null, "Devise non supportée. Choisissez EUR, USD, GBP, AED ou TND.");
        }

        card.DevisePreferee = devise;
        await db.SaveChangesAsync(cancellationToken);
        return (ToDetailDto(card), null);
    }

    public async Task<(TransactionDto? Transaction, CardDetailDto? Card, string? Error)> CreditDetaxeAsync(
        long clientId,
        long cardId,
        DetaxeCreditRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Montant <= 0)
        {
            return (null, null, "Le montant de détaxe doit être supérieur à zéro.");
        }

        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, null, "Carte introuvable.");
        }

        if (!IsTravel(card.Type))
        {
            return (null, null, "La détaxe est réservée à la carte STB Travel.");
        }

        if (card.Statut is not StatutCarte.Active)
        {
            return (null, null, "La carte doit être active.");
        }

        var montant = Math.Round(request.Montant, 2);
        if (card.SoldeMaximal > 0 && card.Solde + montant > card.SoldeMaximal)
        {
            return (null, null,
                $"Le solde maximal ({card.SoldeMaximal:N2} DT) serait dépassé. Solde actuel : {card.Solde:N2} DT.");
        }

        card.Solde += montant;
        var pays = string.IsNullOrWhiteSpace(request.PaysOrigine) ? "France" : request.PaysOrigine.Trim();
        var reference = string.IsNullOrWhiteSpace(request.ReferenceDetaxe)
            ? $"DTX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}"
            : request.ReferenceDetaxe.Trim();

        var tx = new TransactionCarte
        {
            IdCarte = card.IdCarte,
            Reference = reference.Length > 40 ? reference[..40] : reference,
            Montant = montant,
            DateTransactionUtc = DateTime.UtcNow,
            Commercant = $"Crédit détaxe — {pays}",
            TypeOperation = TypeOperation.Detaxe,
            Statut = StatutTransaction.Valide,
            Devise = "TND",
            MontantDevise = montant,
            Pays = pays
        };

        db.TransactionsCarte.Add(tx);
        await db.SaveChangesAsync(cancellationToken);

        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is not null)
        {
            await notificationService.CreateTransactionNotificationsAsync(client, card, tx, cancellationToken);
            await TrySendMarteAlertAsync(client, card, tx, cancellationToken);
        }

        return (ToTransactionDto(tx), ToDetailDto(card), null);
    }

    public IReadOnlyList<TravelAdvantageDto> GetTravelAdvantages() =>
    [
        new("Cleartrip", "Remise systématique sur hôtels et vols via cleartrip.com", "https://www.cleartrip.com", "Voyage"),
        new("Outlet villages", "10 % de réduction dans les outlets France, Italie, Espagne, Allemagne, UK", null, "Shopping"),
        new("Mastercard Buy 1 Get 1", "2e place offerte dans des loisirs / restaurants partenaires", null, "Loisirs"),
        new("Priceless Specials", "Expériences exclusives Mastercard dans les grandes villes", "https://www.priceless.com", "Expériences"),
        new("Emirates", "Offres promotionnelles sur billets Emirates (sous conditions)", null, "Vols"),
        new("Assistance voyage", "Couverture jusqu'à 50 000 USD + attestation visa", null, "Assurance")
    ];

    public IReadOnlyList<TravelAtmDto> GetTravelAtms(string? pays = null)
    {
        var all = new List<TravelAtmDto>
        {
            new("BNP Paribas ATM", "16 bd des Italiens", "Paris", "France", "Mastercard", 48.8719, 2.3355),
            new("Société Générale ATM", "29 bd Haussmann", "Paris", "France", "Mastercard", 48.8738, 2.3321),
            new("CaixaBank ATM", "Passeig de Gràcia 90", "Barcelone", "Espagne", "Mastercard", 41.3947, 2.1632),
            new("Barclays ATM", "1 Churchill Place", "Londres", "Royaume-Uni", "Mastercard", 51.5054, -0.0235),
            new("Deutsche Bank ATM", "Taunusanlage 12", "Francfort", "Allemagne", "Mastercard", 50.1136, 8.6724),
            new("Emirates NBD ATM", "Sheikh Zayed Road", "Dubaï", "Émirats arabes unis", "Mastercard", 25.2048, 55.2708),
            new("Chase ATM", "270 Park Avenue", "New York", "États-Unis", "Mastercard", 40.7557, -73.9755),
            new("UniCredit ATM", "Piazza Gae Aulenti", "Milan", "Italie", "Mastercard", 45.4833, 9.1900)
        };

        if (string.IsNullOrWhiteSpace(pays))
        {
            return all;
        }

        var filter = pays.Trim();
        return all
            .Where(a => a.Pays.Contains(filter, StringComparison.OrdinalIgnoreCase)
                        || a.Ville.Contains(filter, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public IReadOnlyList<ExchangeRateDto> GetExchangeRates() =>
    [
        new("EUR", "Euro", 3.35m, "Indicatif démo"),
        new("USD", "Dollar US", 3.10m, "Indicatif démo"),
        new("GBP", "Livre sterling", 3.90m, "Indicatif démo"),
        new("AED", "Dirham ÉAU", 0.85m, "Indicatif démo"),
        new("TND", "Dinar tunisien", 1.00m, "Référence")
    ];

    public async Task<(byte[]? Pdf, string? Error)> GenerateStatementAsync(
        long clientId,
        long cardId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        if (to < from)
        {
            return (null, "La date de fin doit être postérieure à la date de début.");
        }

        var card = await db.CartesBancaires.AsNoTracking()
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);

        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        var fromUtc = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtc = to.ToDateTime(new TimeOnly(23, 59, 59), DateTimeKind.Utc);

        var transactions = await db.TransactionsCarte.AsNoTracking()
            .Where(t => t.IdCarte == cardId
                && t.DateTransactionUtc >= fromUtc
                && t.DateTransactionUtc <= toUtc)
            .OrderByDescending(t => t.DateTransactionUtc)
            .ToListAsync(cancellationToken);

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text("STB Digital Hub — Relevé de carte").Bold().FontSize(16).FontColor(Colors.Blue.Darken3);
                    col.Item().Text($"Client : {card.Client.Prenom} {card.Client.Nom}");
                    col.Item().Text($"Carte : {card.NumeroMasque} ({FormatType(card.Type)})");
                    col.Item().Text($"Période : {from:dd/MM/yyyy} — {to:dd/MM/yyyy}");
                });

                page.Content().PaddingVertical(20).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Référence").FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Date").FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Montant").FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Commerçant").FontColor(Colors.White);
                        header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Type").FontColor(Colors.White);
                    });

                    foreach (var tx in transactions)
                    {
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(tx.Reference);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(tx.DateTransactionUtc.ToString("dd/MM/yyyy HH:mm"));
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text($"{tx.Montant:N2} DT");
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(tx.Commercant);
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(FormatOperation(tx.TypeOperation));
                    }
                });

                page.Footer().AlignCenter().Text($"Généré le {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC");
            });
        }).GeneratePdf();

        return (pdf, null);
    }

    private async Task NormalizeLegacyCardsAsync(long clientId, CancellationToken cancellationToken)
    {
        // Anciennes cartes rechargeables (type 1) → C-Cash : renseigner plafonds si manquants
        var legacyCCash = await db.CartesBancaires
            .Where(c => c.IdClient == clientId && c.Type == TypeCarte.CCash)
            .ToListAsync(cancellationToken);

        var updated = false;
        foreach (var card in legacyCCash)
        {
            if (card.PlafondRecharge <= 0)
            {
                card.PlafondRecharge = 2000m;
                updated = true;
            }

            if (card.SoldeMaximal <= 0)
            {
                card.SoldeMaximal = 5000m;
                updated = true;
            }

            if (card.TokenCarte.Contains("-RCH-", StringComparison.Ordinal))
            {
                card.TokenCarte = card.TokenCarte.Replace("-RCH-", "-CCS-", StringComparison.Ordinal);
                updated = true;
            }
        }

        var travelCards = await db.CartesBancaires
            .Where(c => c.IdClient == clientId && c.Type == TypeCarte.Travel)
            .ToListAsync(cancellationToken);

        foreach (var card in travelCards)
        {
            if (EnsureTravelAllocationYear(card))
            {
                updated = true;
            }

            if (card.AllocationAnnuelle <= 0)
            {
                card.AllocationAnnuelle = TravelAllocationDefault;
                updated = true;
            }

            if (card.PlafondRecharge <= 0)
            {
                card.PlafondRecharge = TravelRechargeMax;
                updated = true;
            }

            if (card.SoldeMaximal <= 0)
            {
                card.SoldeMaximal = TravelSoldeMax;
                updated = true;
            }

            if (string.IsNullOrWhiteSpace(card.DevisePreferee))
            {
                card.DevisePreferee = "EUR";
                updated = true;
            }

            if (!card.DateDebutEcommerceIntl.HasValue && card.EcommerceInternationalActif)
            {
                card.DateDebutEcommerceIntl = DateOnly.FromDateTime(DateTime.UtcNow);
                card.DateFinEcommerceIntl = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6));
                updated = true;
            }
        }

        if (updated)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        var hasClassique = await db.CartesBancaires.AnyAsync(
            c => c.IdClient == clientId && c.Type == TypeCarte.Classique, cancellationToken);
        var hasCCash = await db.CartesBancaires.AnyAsync(
            c => c.IdClient == clientId && c.Type == TypeCarte.CCash, cancellationToken);
        var hasTravel = await db.CartesBancaires.AnyAsync(
            c => c.IdClient == clientId && c.Type == TypeCarte.Travel, cancellationToken);

        var added = false;
        if (hasClassique && !hasCCash)
        {
            db.CartesBancaires.Add(CreateCCashCard(clientId, 420.50m));
            added = true;
        }

        if ((hasClassique || hasCCash) && !hasTravel)
        {
            db.CartesBancaires.Add(CreateTravelCard(clientId, 800m, consumed: 1200m));
            added = true;
        }

        if (added)
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task EnsureSeedAsync(long clientId, CancellationToken cancellationToken)
    {
        if (await db.CartesBancaires.AnyAsync(c => c.IdClient == clientId, cancellationToken))
        {
            return;
        }

        var clientExists = await db.Clients.AnyAsync(c => c.IdClient == clientId, cancellationToken);
        if (!clientExists)
        {
            return;
        }

        var cards = new List<CarteBancaire>
        {
            new()
            {
                IdClient = clientId,
                NumeroMasque = "**** **** **** 4242",
                NumeroComplet = "4532 1200 8842 4242",
                TokenCarte = $"TKN-{clientId}-CLS-4242",
                DateExpiration = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(3)),
                Type = TypeCarte.Classique,
                Statut = StatutCarte.Active,
                PlafondPaiement = 3000,
                PlafondRetrait = 1000,
                PaiementsEnLigneActifs = true,
                Solde = 0,
                PlafondRecharge = 0,
                SoldeMaximal = 0
            },
            CreateCCashCard(clientId, 420.50m),
            CreateTravelCard(clientId, 800m, consumed: 1200m)
        };

        db.CartesBancaires.AddRange(cards);
        await db.SaveChangesAsync(cancellationToken);

        var seedTransactions = new List<TransactionCarte>
        {
            new() { IdCarte = cards[0].IdCarte, Reference = $"TXN-SEED-{clientId}-001", Montant = 89.90m, DateTransactionUtc = DateTime.UtcNow.AddDays(-5), Commercant = "Carrefour Tunis", TypeOperation = TypeOperation.Paiement, Statut = StatutTransaction.Valide },
            new() { IdCarte = cards[0].IdCarte, Reference = $"TXN-SEED-{clientId}-002", Montant = 45.00m, DateTransactionUtc = DateTime.UtcNow.AddDays(-2), Commercant = "Shell Station", TypeOperation = TypeOperation.PaiementEnLigne, Statut = StatutTransaction.Valide },
            new() { IdCarte = cards[1].IdCarte, Reference = $"TXN-SEED-{clientId}-003", Montant = 200.00m, DateTransactionUtc = DateTime.UtcNow.AddDays(-7), Commercant = "Recharge depuis Compte courant principal", TypeOperation = TypeOperation.Recharge, Statut = StatutTransaction.Valide, Devise = "TND", MontantDevise = 200m, Pays = "Tunisie" },
            new() { IdCarte = cards[1].IdCarte, Reference = $"TXN-SEED-{clientId}-004", Montant = 32.50m, DateTransactionUtc = DateTime.UtcNow.AddDays(-1), Commercant = "Uber Eats", TypeOperation = TypeOperation.PaiementEnLigne, Statut = StatutTransaction.Valide },
            new() { IdCarte = cards[2].IdCarte, Reference = $"TXN-SEED-{clientId}-005", Montant = 1200.00m, DateTransactionUtc = DateTime.UtcNow.AddDays(-30), Commercant = "Recharge allocation touristique", TypeOperation = TypeOperation.Recharge, Statut = StatutTransaction.Valide, Devise = "TND", MontantDevise = 1200m, Pays = "Tunisie" },
            new() { IdCarte = cards[2].IdCarte, Reference = $"TXN-SEED-{clientId}-006", Montant = 168.00m, DateTransactionUtc = DateTime.UtcNow.AddDays(-10), Commercant = "Galeries Lafayette", TypeOperation = TypeOperation.Paiement, Statut = StatutTransaction.Valide, Devise = "EUR", MontantDevise = 50m, Pays = "France" },
            new() { IdCarte = cards[2].IdCarte, Reference = $"TXN-SEED-{clientId}-007", Montant = 93.00m, DateTransactionUtc = DateTime.UtcNow.AddDays(-3), Commercant = "ATM Paris Charles-de-Gaulle", TypeOperation = TypeOperation.Retrait, Statut = StatutTransaction.Valide, Devise = "EUR", MontantDevise = 28m, Pays = "France" }
        };

        db.TransactionsCarte.AddRange(seedTransactions);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static CarteBancaire CreateCCashCard(long clientId, decimal solde) => new()
    {
        IdClient = clientId,
        NumeroMasque = "**** **** **** 8891",
        NumeroComplet = "5412 7700 9918 8891",
        TokenCarte = $"TKN-{clientId}-CCS-8891",
        DateExpiration = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)),
        Type = TypeCarte.CCash,
        Statut = StatutCarte.Active,
        PlafondPaiement = 1500,
        PlafondRetrait = 500,
        PaiementsEnLigneActifs = true,
        Solde = solde,
        PlafondRecharge = 2000m,
        SoldeMaximal = 5000m
    };

    private static CarteBancaire CreateTravelCard(long clientId, decimal solde, decimal consumed) => new()
    {
        IdClient = clientId,
        NumeroMasque = "**** **** **** 6630",
        NumeroComplet = "5275 4410 8820 6630",
        TokenCarte = $"TKN-{clientId}-TRV-6630",
        DateExpiration = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(3)),
        Type = TypeCarte.Travel,
        Statut = StatutCarte.Active,
        PlafondPaiement = 3000,
        PlafondRetrait = 1500,
        PaiementsEnLigneActifs = true,
        Solde = solde,
        PlafondRecharge = TravelRechargeMax,
        SoldeMaximal = TravelSoldeMax,
        AllocationAnnuelle = TravelAllocationDefault,
        AllocationConsommeeAnnee = consumed,
        AnneeAllocation = DateTime.UtcNow.Year,
        EcommerceInternationalActif = true,
        DateDebutEcommerceIntl = DateOnly.FromDateTime(DateTime.UtcNow),
        DateFinEcommerceIntl = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6)),
        AlertesMarteActives = true,
        DevisePreferee = "EUR"
    };

    private async Task<CompteBancaire?> GetPrimaryCourantAccountAsync(long clientId, CancellationToken cancellationToken)
    {
        await digiCompteService.GetAccountsAsync(clientId, "Courant", cancellationToken);

        return await db.ComptesBancaires
            .Where(c => c.IdClient == clientId && c.Type == TypeCompte.Courant && c.Statut == StatutCompte.Actif)
            .OrderBy(c => c.IdCompte)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<Client?> GetClientWithCardAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken)
    {
        var ownsCard = await db.CartesBancaires.AsNoTracking()
            .AnyAsync(c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);
        if (!ownsCard)
        {
            return null;
        }

        return await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
    }

    private async Task<string?> VerifyOtpForClientAsync(
        long clientId,
        CardOtpVerifyRequest request,
        CancellationToken cancellationToken)
    {
        var challenge = await db.OtpChallenges.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == request.ChallengeId, cancellationToken);

        if (challenge is null || challenge.IdClient != clientId)
        {
            return "Code de confirmation invalide.";
        }

        var (success, error, _) = await otpService.VerifyAsync(request.ChallengeId, request.OtpCode, cancellationToken);
        return success ? null : error ?? "Code de confirmation invalide.";
    }

    private async Task ClearExpiredTemporaryLimitsForClientAsync(long clientId, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var expired = await db.CartesBancaires
            .Where(c => c.IdClient == clientId
                && c.PlafondTemporaire != null
                && c.DateFinPlafondTemporaire != null
                && c.DateFinPlafondTemporaire < today)
            .ToListAsync(cancellationToken);

        if (expired.Count == 0)
        {
            return;
        }

        foreach (var card in expired)
        {
            card.PlafondTemporaire = null;
            card.DateFinPlafondTemporaire = null;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task ClearExpiredTemporaryLimitAsync(CarteBancaire card, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!card.PlafondTemporaire.HasValue
            || !card.DateFinPlafondTemporaire.HasValue
            || card.DateFinPlafondTemporaire.Value >= today)
        {
            return;
        }

        card.PlafondTemporaire = null;
        card.DateFinPlafondTemporaire = null;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static bool TryParseOperationType(string? value, out TypeOperation type)
    {
        type = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = value.Trim()
            .Replace(" ", "", StringComparison.Ordinal)
            .Replace("_", "", StringComparison.Ordinal)
            .Replace("-", "", StringComparison.Ordinal);

        return normalized.ToLowerInvariant() switch
        {
            "paiement" => Assign(TypeOperation.Paiement, out type),
            "retrait" => Assign(TypeOperation.Retrait, out type),
            "paiementenligne" => Assign(TypeOperation.PaiementEnLigne, out type),
            _ => Enum.TryParse(value, true, out type)
                 && type is TypeOperation.Paiement or TypeOperation.Retrait or TypeOperation.PaiementEnLigne
        };

        static bool Assign(TypeOperation parsed, out TypeOperation result)
        {
            result = parsed;
            return true;
        }
    }

    private async Task<CarteBancaire?> GetOwnedCardAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken)
    {
        return await db.CartesBancaires
            .FirstOrDefaultAsync(c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);
    }

    private static bool IsCCash(TypeCarte type) => type == TypeCarte.CCash;

    private static bool IsTravel(TypeCarte type) => type == TypeCarte.Travel;

    private static bool IsPrepaidBalance(TypeCarte type) => type is TypeCarte.CCash or TypeCarte.Travel;

    private static bool IsRechargeable(TypeCarte type) => type is TypeCarte.CCash or TypeCarte.Travel;

    private static bool IsEcommerceIntlActive(CarteBancaire card)
    {
        if (!card.EcommerceInternationalActif)
        {
            return false;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (card.DateDebutEcommerceIntl.HasValue && today < card.DateDebutEcommerceIntl.Value)
        {
            return false;
        }

        if (card.DateFinEcommerceIntl.HasValue && today > card.DateFinEcommerceIntl.Value)
        {
            return false;
        }

        return true;
    }

    private static decimal? GetExchangeRate(string devise)
    {
        return devise.ToUpperInvariant() switch
        {
            "EUR" => 3.35m,
            "USD" => 3.10m,
            "GBP" => 3.90m,
            "AED" => 0.85m,
            "TND" => 1.00m,
            _ => null
        };
    }

    private async Task TrySendMarteAlertAsync(
        Client client,
        CarteBancaire card,
        TransactionCarte transaction,
        CancellationToken cancellationToken)
    {
        if (!IsTravel(card.Type) || !card.AlertesMarteActives)
        {
            return;
        }

        await notificationService.CreateMarteAlertNotificationAsync(client, card, transaction, cancellationToken);
    }

    private static decimal GetAllocationRestante(CarteBancaire card) =>
        Math.Max(0, card.AllocationAnnuelle - card.AllocationConsommeeAnnee);

    /// <returns>true si une modification a été appliquée.</returns>
    private static bool EnsureTravelAllocationYear(CarteBancaire card)
    {
        if (!IsTravel(card.Type))
        {
            return false;
        }

        var year = DateTime.UtcNow.Year;
        if (card.AnneeAllocation == year)
        {
            return false;
        }

        card.AnneeAllocation = year;
        card.AllocationConsommeeAnnee = 0;
        if (card.AllocationAnnuelle <= 0)
        {
            card.AllocationAnnuelle = TravelAllocationDefault;
        }

        return true;
    }

    private static decimal GetEffectivePaymentLimit(CarteBancaire card)
    {
        if (card.PlafondTemporaire.HasValue
            && card.DateFinPlafondTemporaire.HasValue
            && card.DateFinPlafondTemporaire.Value >= DateOnly.FromDateTime(DateTime.UtcNow))
        {
            return card.PlafondTemporaire.Value;
        }

        return card.PlafondPaiement;
    }

    private static string DeriveNumeroComplet(string numeroMasque)
    {
        var digits = new string(numeroMasque.Where(char.IsDigit).ToArray());
        var last4 = digits.Length >= 4 ? digits[^4..] : "0000";
        return last4 switch
        {
            "4242" => "4532 1200 8842 4242",
            "8891" => "5412 7700 9918 8891",
            "6630" => "5275 4410 8820 6630",
            _ => $"4532 1200 8842 {last4}"
        };
    }

    private static CardSummaryDto ToSummaryDto(CarteBancaire card) => new(
        card.IdCarte,
        card.NumeroMasque,
        FormatType(card.Type),
        FormatStatut(card.Statut),
        card.DateExpiration.ToString("MM/yyyy"),
        card.PaiementsEnLigneActifs,
        card.Solde,
        IsCCash(card.Type),
        IsTravel(card.Type));

    private static CardDetailDto ToDetailDto(CarteBancaire card)
    {
        var devise = string.IsNullOrWhiteSpace(card.DevisePreferee) ? "EUR" : card.DevisePreferee;
        var taux = GetExchangeRate(devise) ?? 1m;
        var soldeDevise = taux <= 0 ? card.Solde : Math.Round(card.Solde / taux, 2);

        return new(
            card.IdCarte,
            card.NumeroMasque,
            FormatType(card.Type),
            FormatStatut(card.Statut),
            card.DateExpiration.ToString("MM/yyyy"),
            card.PlafondPaiement,
            card.PlafondRetrait,
            card.PlafondTemporaire,
            card.DateFinPlafondTemporaire?.ToString("dd/MM/yyyy"),
            GetEffectivePaymentLimit(card),
            card.PaiementsEnLigneActifs,
            card.Solde,
            IsCCash(card.Type),
            IsTravel(card.Type),
            card.PlafondRecharge,
            card.SoldeMaximal,
            card.AllocationAnnuelle,
            card.AllocationConsommeeAnnee,
            GetAllocationRestante(card),
            card.AnneeAllocation == 0 ? DateTime.UtcNow.Year : card.AnneeAllocation,
            card.EcommerceInternationalActif,
            card.DateDebutEcommerceIntl?.ToString("dd/MM/yyyy"),
            card.DateFinEcommerceIntl?.ToString("dd/MM/yyyy"),
            card.AlertesMarteActives,
            devise,
            soldeDevise,
            taux);
    }

    private static TransactionDto ToTransactionDto(TransactionCarte tx) => new(
        tx.IdTransaction,
        tx.Reference,
        tx.Montant,
        tx.DateTransactionUtc.ToString("o"),
        tx.Commercant,
        FormatOperation(tx.TypeOperation),
        FormatStatutTransaction(tx.Statut),
        tx.Devise,
        tx.MontantDevise,
        tx.Pays);

    private static string FormatType(TypeCarte type) => type switch
    {
        TypeCarte.Classique => "Classique",
        TypeCarte.CCash => "C-Cash",
        TypeCarte.Travel => "Travel",
        _ => type.ToString()
    };

    private static string FormatStatut(StatutCarte statut) => statut switch
    {
        StatutCarte.Active => "Active",
        StatutCarte.Inactive => "Inactive",
        StatutCarte.Bloquee => "Bloquée",
        StatutCarte.Expiree => "Expirée",
        _ => statut.ToString()
    };

    private static string FormatOperation(TypeOperation type) => type switch
    {
        TypeOperation.Paiement => "Paiement",
        TypeOperation.Retrait => "Retrait",
        TypeOperation.Recharge => "Recharge",
        TypeOperation.PaiementEnLigne => "Paiement en ligne",
        TypeOperation.Detaxe => "Détaxe",
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
