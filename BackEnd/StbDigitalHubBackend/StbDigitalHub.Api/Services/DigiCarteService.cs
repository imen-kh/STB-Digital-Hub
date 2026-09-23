using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class DigiCarteService(
    StbDigitalHubDbContext db,
    CardActionConfirmationService cardActions,
    IOptions<AppOptions> appOptions,
    NotificationService notificationService,
    DigiCompteService digiCompteService,
    DigiEpargneService digiEpargneService)
{
    private readonly AppOptions _app = appOptions.Value;

    private static readonly string[] Commercants =
    [
        "Carrefour Tunis", "Shell Station", "Amazon", "Monoprix", "Ooredoo",
        "Tunisie Telecom", "Zara", "Decathlon", "Pharmacie Centrale", "Uber Eats"
    ];

    private static readonly string[] DetaxeOperators =
    [
        "Global Blue", "Planet", "Premier Tax Free"
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

        var result = new List<CardSummaryDto>(cards.Count);
        foreach (var card in cards)
        {
            var solde = await ResolveDisplayedBalanceAsync(clientId, card, cancellationToken);
            result.Add(ToSummaryDto(card, solde));
        }

        return result;
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
        var soldeAffiche = await ResolveDisplayedBalanceAsync(clientId, card, cancellationToken);
        return ToDetailDto(card, soldeAffiche);
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
        return (await ToDetailDtoAsync(clientId, card, cancellationToken), null);
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
        return (await ToDetailDtoAsync(clientId, card, cancellationToken), null);
    }

    public async Task<(CardActionResponse? Response, string? Error)> SetOnlinePaymentsAsync(
        long clientId,
        long cardId,
        bool actif,
        CancellationToken cancellationToken = default)
    {
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

        var message = actif
            ? "Les paiements en ligne ont été activés."
            : "Les paiements en ligne ont été désactivés. Aucune transaction en ligne ne sera acceptée.";

        return (new CardActionResponse(message, await ToDetailDtoAsync(clientId, card, cancellationToken)), null);
    }

    public async Task<(CardActionSubmitResponse? Response, string? Error)> RevealNumberAsync(
        long clientId,
        long cardId,
        CancellationToken cancellationToken = default)
    {
        var card = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        return await cardActions.CreateAndNotifyAsync(
            clientId,
            cardId,
            TypeActionCarte.RevealNumber,
            new { },
            "Affichage du numéro de carte",
            $"Demande d'affichage du numéro complet de la carte {card.NumeroMasque}.",
            cancellationToken: cancellationToken);
    }

    public async Task<(CardActionResponse? Response, string? Error)> UpdateLimitsAsync(
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

        card.PlafondPaiement = request.PlafondPaiement;
        card.PlafondRetrait = request.PlafondRetrait;
        await db.SaveChangesAsync(cancellationToken);

        return (new CardActionResponse(
            "Les plafonds ont été mis à jour.",
            await ToDetailDtoAsync(clientId, card, cancellationToken)), null);
    }

    public async Task<(CardActionResponse? Response, string? Error)> SetTemporaryLimitAsync(
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

        card.PlafondTemporaire = request.PlafondTemporaire;
        card.DateFinPlafondTemporaire = request.DateFin;
        await db.SaveChangesAsync(cancellationToken);

        return (new CardActionResponse(
            "Le plafond temporaire a été appliqué.",
            await ToDetailDtoAsync(clientId, card, cancellationToken)), null);
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

        return transactions.Select(t => ToTransactionDto(t)).ToList();
    }

    public async Task<CardAnalyticsDto> GetAnalyticsAsync(
        long clientId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);
        var cards = await db.CartesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId)
            .Select(c => c.IdCarte)
            .ToListAsync(cancellationToken);

        if (cards.Count == 0)
        {
            return new CardAnalyticsDto(0, 0, 0, [], [], []);
        }

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var from = DateTime.UtcNow.Date.AddDays(-13);
        var txs = await db.TransactionsCarte.AsNoTracking()
            .Where(t => cards.Contains(t.IdCarte))
            .ToListAsync(cancellationToken);

        var pending = txs.Count(t => t.Statut == StatutTransaction.EnAttente);
        var spend = txs.Where(t =>
                t.Statut == StatutTransaction.Valide
                && t.TypeOperation is TypeOperation.Paiement or TypeOperation.PaiementEnLigne or TypeOperation.Retrait)
            .ToList();
        var monthSpend = spend.Where(t => t.DateTransactionUtc >= monthStart).ToList();

        var byMerchant = monthSpend
            .GroupBy(t => string.IsNullOrWhiteSpace(t.Commercant) ? "Autre" : t.Commercant)
            .Select(g => new NamedAmountDto(g.Key, g.Sum(x => x.Montant)))
            .OrderByDescending(x => x.Montant)
            .Take(6)
            .ToList();

        var byType = monthSpend
            .GroupBy(t => FormatOperation(t.TypeOperation))
            .Select(g => new NamedAmountDto(g.Key, g.Sum(x => x.Montant)))
            .OrderByDescending(x => x.Montant)
            .ToList();

        var activity = new List<CardDayPointDto>(14);
        for (var i = 0; i < 14; i++)
        {
            var day = from.AddDays(i);
            var next = day.AddDays(1);
            var total = spend
                .Where(t => t.DateTransactionUtc >= day && t.DateTransactionUtc < next)
                .Sum(t => t.Montant);
            activity.Add(new CardDayPointDto(day.ToString("dd/MM"), total));
        }

        return new CardAnalyticsDto(
            monthSpend.Sum(t => t.Montant),
            monthSpend.Count,
            pending,
            byMerchant,
            byType,
            activity);
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
            return (null, "Type de paiement invalide. Choisissez Paiement, Retrait, PaiementEnLigne ou Detaxe.");
        }

        if (type == TypeOperation.Detaxe)
        {
            return await PersistDetaxeCreditAsync(clientId, card, request, cancellationToken);
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

        var arrondi = await TryApplyRoundUpAsync(
            clientId, montant, type, transaction.Commercant, cancellationToken);

        return (ToTransactionDto(transaction, arrondi), null);
    }

    public async Task<(CardActionSubmitResponse? Response, string? Error)> SubmitConfirmUnusualTransactionAsync(
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

        var card = pending.Carte ?? await GetOwnedCardAsync(clientId, cardId, cancellationToken);
        if (card is null)
        {
            return (null, "Carte introuvable.");
        }

        return await cardActions.CreateAndNotifyAsync(
            clientId,
            cardId,
            TypeActionCarte.ConfirmUnusualTransaction,
            new UnusualTxPayload(transactionId),
            "Confirmation transaction inhabituelle",
            $"Valider la transaction {pending.Reference} de {pending.Montant:N2} DT chez {pending.Commercant} (carte {card.NumeroMasque}).",
            transactionId,
            cancellationToken);
    }

    private async Task<(PendingTransactionActionResponse? Response, string? Error)> ExecuteConfirmUnusualAsync(
        long clientId,
        long cardId,
        long transactionId,
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

        var arrondi = await TryApplyRoundUpAsync(
            clientId,
            transaction.Montant,
            transaction.TypeOperation,
            transaction.Commercant,
            cancellationToken);

        return (new PendingTransactionActionResponse(
            arrondi > 0
                ? $"Transaction validée et débitée. Arrondi : {arrondi:N2} DT versés sur l'épargne."
                : "Transaction validée et débitée.",
            ToTransactionDto(transaction, arrondi),
            await ToDetailDtoAsync(clientId, card, cancellationToken)), null);
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
            await ToDetailDtoAsync(clientId, card, cancellationToken)), null);
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

    public async Task<(CardActionSubmitResponse? Response, string? Error)> SubmitRechargeAsync(
        long clientId,
        long cardId,
        RechargeRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Montant <= 0)
        {
            return (null, "Le montant doit être supérieur à zéro.");
        }

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

        var montant = Math.Round(request.Montant, 2);
        if (card.PlafondRecharge > 0 && montant > card.PlafondRecharge)
        {
            return (null, $"Le montant dépasse le plafond de recharge ({card.PlafondRecharge:N2} DT).");
        }

        if (IsTravel(card.Type))
        {
            var restante = GetAllocationRestante(card);
            if (montant > restante)
            {
                return (null,
                    $"Le montant dépasse le reste d'allocation touristique ({restante:N2} DT / {card.AllocationAnnuelle:N2} DT en {card.AnneeAllocation}).");
            }
        }

        if (card.SoldeMaximal > 0 && card.Solde + montant > card.SoldeMaximal)
        {
            return (null,
                $"Le solde maximal de la carte ({card.SoldeMaximal:N2} DT) serait dépassé. Solde actuel : {card.Solde:N2} DT.");
        }

        await digiCompteService.GetAccountsAsync(clientId, "Courant", cancellationToken);

        var compte = await db.ComptesBancaires
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.IdCompte == request.CompteSourceId
                    && c.IdClient == clientId
                    && c.Type == TypeCompte.Courant,
                cancellationToken);

        if (compte is null)
        {
            return (null, "Compte courant source introuvable.");
        }

        if (compte.Statut != StatutCompte.Actif)
        {
            return (null, "Le compte source doit être actif.");
        }

        if (montant > compte.Solde)
        {
            return (null, $"Solde insuffisant sur le compte {compte.Libelle} ({compte.Solde:N2} DT).");
        }

        var cardLabel = IsTravel(card.Type) ? "Travel" : "C-Cash";
        return await cardActions.CreateAndNotifyAsync(
            clientId,
            cardId,
            TypeActionCarte.Recharge,
            new RechargePayload(request.CompteSourceId, montant),
            $"Recharge {cardLabel}",
            $"Recharge de {montant:N2} DT depuis {compte.Libelle} vers la carte {card.NumeroMasque}.",
            cancellationToken: cancellationToken);
    }

    private async Task<(TransactionDto? Transaction, CardDetailDto? Card, string? Error)> ExecuteRechargeAsync(
        long clientId,
        long cardId,
        RechargePayload payload,
        CancellationToken cancellationToken = default)
    {
        var montant = Math.Round(payload.Montant, 2);
        if (montant <= 0)
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
                c => c.IdCompte == payload.CompteSourceId
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
        var strategy = db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var dbTx = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // Recharger les entités dans l'unité retriable (Azure SQL + EnableRetryOnFailure).
                var cardLocked = await GetOwnedCardAsync(clientId, cardId, cancellationToken);
                var compteLocked = await db.ComptesBancaires
                    .FirstOrDefaultAsync(
                        c => c.IdCompte == payload.CompteSourceId
                            && c.IdClient == clientId
                            && c.Type == TypeCompte.Courant,
                        cancellationToken);

                if (cardLocked is null)
                {
                    await dbTx.RollbackAsync(cancellationToken);
                    return ((TransactionDto?)null, (CardDetailDto?)null, "Carte introuvable.");
                }

                if (compteLocked is null)
                {
                    await dbTx.RollbackAsync(cancellationToken);
                    return ((TransactionDto?)null, (CardDetailDto?)null, "Compte courant source introuvable.");
                }

                if (montant > compteLocked.Solde)
                {
                    await dbTx.RollbackAsync(cancellationToken);
                    return ((TransactionDto?)null, (CardDetailDto?)null,
                        $"Solde insuffisant sur le compte {compteLocked.Libelle} ({compteLocked.Solde:N2} DT).");
                }

                if (cardLocked.SoldeMaximal > 0 && cardLocked.Solde + montant > cardLocked.SoldeMaximal)
                {
                    await dbTx.RollbackAsync(cancellationToken);
                    return ((TransactionDto?)null, (CardDetailDto?)null,
                        $"Le solde maximal de la carte ({cardLocked.SoldeMaximal:N2} DT) serait dépassé. Solde actuel : {cardLocked.Solde:N2} DT.");
                }

                compteLocked.Solde -= montant;
                cardLocked.Solde += montant;
                if (IsTravel(cardLocked.Type))
                {
                    EnsureTravelAllocationYear(cardLocked);
                    cardLocked.AllocationConsommeeAnnee += montant;
                }

                var stamp = DateTime.UtcNow;
                var refBase = $"RCH-{stamp:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

                var cardTx = new TransactionCarte
                {
                    IdCarte = cardLocked.IdCarte,
                    Reference = $"{refBase}-CARD",
                    Montant = montant,
                    DateTransactionUtc = stamp,
                    Commercant = $"Recharge depuis {compteLocked.Libelle}",
                    TypeOperation = TypeOperation.Recharge,
                    Statut = StatutTransaction.Valide,
                    Devise = "TND",
                    MontantDevise = montant,
                    Pays = "Tunisie"
                };

                var accountTx = new TransactionCompte
                {
                    IdCompte = compteLocked.IdCompte,
                    Reference = $"{refBase}-CPT",
                    Montant = montant,
                    DateTransactionUtc = stamp,
                    Libelle = $"Recharge {cardLabel} {cardLocked.NumeroMasque}",
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
                    await notificationService.CreateTransactionNotificationsAsync(client, cardLocked, cardTx, cancellationToken);
                    await TrySendMarteAlertAsync(client, cardLocked, cardTx, cancellationToken);
                }

                return (ToTransactionDto(cardTx), await ToDetailDtoAsync(clientId, cardLocked, cancellationToken), (string?)null);
            }
            catch
            {
                await dbTx.RollbackAsync(cancellationToken);
                throw;
            }
        });
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

    public async Task<(CardActionSubmitResponse? Response, string? Error)> SubmitEcommerceIntlAsync(
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

        if (request.Actif
            && request.DateDebut.HasValue
            && request.DateFin.HasValue
            && request.DateFin < request.DateDebut)
        {
            return (null, "La date de fin doit être postérieure à la date de début.");
        }

        var recap = request.Actif
            ? $"Activation e-commerce international"
              + (request.DateDebut.HasValue || request.DateFin.HasValue
                  ? $" du {request.DateDebut?.ToString("dd/MM/yyyy") ?? "…"} au {request.DateFin?.ToString("dd/MM/yyyy") ?? "…"}"
                  : "")
              + $" (carte {card.NumeroMasque})."
            : $"Désactivation e-commerce international (carte {card.NumeroMasque}).";

        return await cardActions.CreateAndNotifyAsync(
            clientId,
            cardId,
            TypeActionCarte.EcommerceIntl,
            new EcommercePayload(request.Actif, request.DateDebut, request.DateFin),
            "E-commerce international",
            recap,
            cancellationToken: cancellationToken);
    }

    private async Task<(CardDetailDto? Card, string? Error)> ExecuteEcommerceIntlAsync(
        long clientId,
        long cardId,
        EcommercePayload payload,
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

        if (payload.Actif)
        {
            if (payload.DateDebut.HasValue && payload.DateFin.HasValue && payload.DateFin < payload.DateDebut)
            {
                return (null, "La date de fin doit être postérieure à la date de début.");
            }

            card.EcommerceInternationalActif = true;
            card.DateDebutEcommerceIntl = payload.DateDebut ?? DateOnly.FromDateTime(DateTime.UtcNow);
            card.DateFinEcommerceIntl = payload.DateFin ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3));
        }
        else
        {
            card.EcommerceInternationalActif = false;
            card.DateDebutEcommerceIntl = null;
            card.DateFinEcommerceIntl = null;
        }

        await db.SaveChangesAsync(cancellationToken);
        return (await ToDetailDtoAsync(clientId, card, cancellationToken), null);
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
        return (await ToDetailDtoAsync(clientId, card, cancellationToken), null);
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
        return (await ToDetailDtoAsync(clientId, card, cancellationToken), null);
    }

    public async Task<CardActionConfirmResult> ConfirmEmailActionAsync(Guid token, CancellationToken cancellationToken = default)
    {
        var action = await cardActions.GetActiveAsync(token, cancellationToken);
        if (action is null)
        {
            return new CardActionConfirmResult(false, 0, "Cette demande de confirmation est introuvable.");
        }

        var cardId = action.IdCarte;

        if (action.Statut == StatutActionCarte.Confirmee)
        {
            string? numero = null;
            if (action.TypeAction == TypeActionCarte.RevealNumber)
            {
                var card = await GetOwnedCardAsync(action.IdClient, action.IdCarte, cancellationToken);
                if (card is not null)
                {
                    if (string.IsNullOrWhiteSpace(card.NumeroComplet))
                    {
                        card.NumeroComplet = DeriveNumeroComplet(card.NumeroMasque);
                    }

                    numero = card.NumeroComplet;
                }
            }

            return new CardActionConfirmResult(
                true,
                cardId,
                action.MessageResultat ?? "Cette opération a déjà été confirmée.",
                numero);
        }

        if (action.DateExpirationUtc <= DateTime.UtcNow)
        {
            await cardActions.MarkExpiredOrInvalidAsync(action, "Lien expiré.", cancellationToken);
            return new CardActionConfirmResult(
                false,
                cardId,
                "Le délai de confirmation est dépassé. Veuillez renouveler la demande depuis DigiCarte.");
        }

        if (action.Statut != StatutActionCarte.EnAttente)
        {
            return new CardActionConfirmResult(
                false,
                cardId,
                action.MessageResultat ?? "Cette demande n'est plus en attente de confirmation.");
        }

        string? numeroComplet = null;
        string resultMessage;

        try
        {
            switch (action.TypeAction)
            {
                case TypeActionCarte.RevealNumber:
                {
                    var card = await GetOwnedCardAsync(action.IdClient, action.IdCarte, cancellationToken);
                    if (card is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Carte introuvable.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Carte introuvable.");
                    }

                    if (string.IsNullOrWhiteSpace(card.NumeroComplet))
                    {
                        card.NumeroComplet = DeriveNumeroComplet(card.NumeroMasque);
                    }

                    numeroComplet = card.NumeroComplet;
                    resultMessage = "Numéro de carte affiché. Ne le communiquez à personne.";
                    break;
                }
                case TypeActionCarte.UpdateLimits:
                {
                    var payload = cardActions.DeserializePayload<LimitsPayload>(action);
                    if (payload is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Payload invalide.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Données de la demande invalides.");
                    }

                    var card = await GetOwnedCardAsync(action.IdClient, action.IdCarte, cancellationToken);
                    if (card is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Carte introuvable.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Carte introuvable.");
                    }

                    card.PlafondPaiement = payload.PlafondPaiement;
                    card.PlafondRetrait = payload.PlafondRetrait;
                    await db.SaveChangesAsync(cancellationToken);
                    resultMessage = "Les plafonds ont été mis à jour.";
                    break;
                }
                case TypeActionCarte.TemporaryLimit:
                {
                    var payload = cardActions.DeserializePayload<TemporaryLimitPayload>(action);
                    if (payload is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Payload invalide.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Données de la demande invalides.");
                    }

                    var card = await GetOwnedCardAsync(action.IdClient, action.IdCarte, cancellationToken);
                    if (card is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Carte introuvable.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Carte introuvable.");
                    }

                    card.PlafondTemporaire = payload.PlafondTemporaire;
                    card.DateFinPlafondTemporaire = payload.DateFin;
                    await db.SaveChangesAsync(cancellationToken);
                    resultMessage = "Le plafond temporaire a été appliqué.";
                    break;
                }
                case TypeActionCarte.OnlinePayments:
                {
                    var payload = cardActions.DeserializePayload<OnlinePaymentsPayload>(action);
                    if (payload is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Payload invalide.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Données de la demande invalides.");
                    }

                    var card = await GetOwnedCardAsync(action.IdClient, action.IdCarte, cancellationToken);
                    if (card is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Carte introuvable.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Carte introuvable.");
                    }

                    card.PaiementsEnLigneActifs = payload.Actif;
                    await db.SaveChangesAsync(cancellationToken);
                    resultMessage = payload.Actif
                        ? "Les paiements en ligne ont été activés."
                        : "Les paiements en ligne ont été désactivés.";
                    break;
                }
                case TypeActionCarte.EcommerceIntl:
                {
                    var payload = cardActions.DeserializePayload<EcommercePayload>(action);
                    if (payload is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Payload invalide.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Données de la demande invalides.");
                    }

                    var (_, error) = await ExecuteEcommerceIntlAsync(
                        action.IdClient, action.IdCarte, payload, cancellationToken);
                    if (error is not null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, error, cancellationToken);
                        return new CardActionConfirmResult(false, cardId, error);
                    }

                    resultMessage = "Les paramètres e-commerce international ont été mis à jour.";
                    break;
                }
                case TypeActionCarte.Recharge:
                {
                    var payload = cardActions.DeserializePayload<RechargePayload>(action);
                    if (payload is null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Payload invalide.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Données de la demande invalides.");
                    }

                    var (_, _, error) = await ExecuteRechargeAsync(
                        action.IdClient, action.IdCarte, payload, cancellationToken);
                    if (error is not null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, error, cancellationToken);
                        return new CardActionConfirmResult(false, cardId, error);
                    }

                    resultMessage = "La recharge a été confirmée.";
                    break;
                }
                case TypeActionCarte.ConfirmUnusualTransaction:
                {
                    var payload = cardActions.DeserializePayload<UnusualTxPayload>(action);
                    var txId = payload?.TransactionId ?? action.IdTransaction;
                    if (txId is null or 0)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, "Transaction introuvable.", cancellationToken);
                        return new CardActionConfirmResult(false, cardId, "Identifiant de transaction manquant.");
                    }

                    var (_, error) = await ExecuteConfirmUnusualAsync(
                        action.IdClient, action.IdCarte, txId.Value, cancellationToken);
                    if (error is not null)
                    {
                        await cardActions.MarkExpiredOrInvalidAsync(action, error, cancellationToken);
                        return new CardActionConfirmResult(false, cardId, error);
                    }

                    resultMessage = "La transaction inhabituelle a été validée.";
                    break;
                }
                default:
                    await cardActions.MarkExpiredOrInvalidAsync(action, "Type d'action inconnu.", cancellationToken);
                    return new CardActionConfirmResult(false, cardId, "Type d'opération non supporté.");
            }
        }
        catch (Exception)
        {
            const string failMessage = "Une erreur est survenue lors de la confirmation. Réessayez depuis DigiCarte.";
            await cardActions.MarkExpiredOrInvalidAsync(action, failMessage, cancellationToken);
            return new CardActionConfirmResult(false, cardId, failMessage);
        }

        await cardActions.MarkConfirmedAsync(action, resultMessage, cancellationToken);
        return new CardActionConfirmResult(true, cardId, resultMessage, numeroComplet);
    }

    public async Task<EmailPageState> OpenEmailPageAsync(Guid token, CancellationToken cancellationToken = default)
    {
        var action = await cardActions.GetActiveAsync(token, cancellationToken);
        if (action is null)
        {
            return EmailPageState.Done(new CardActionConfirmResult(false, 0, "Cette demande de confirmation est introuvable."));
        }

        if (action.Statut == StatutActionCarte.EnAttente && action.DateExpirationUtc <= DateTime.UtcNow)
        {
            await cardActions.MarkExpiredOrInvalidAsync(action, "Lien expiré.", cancellationToken);
            return EmailPageState.Done(new CardActionConfirmResult(
                false,
                action.IdCarte,
                "Le délai de confirmation est dépassé. Veuillez renouveler la demande depuis DigiCarte."));
        }

        if (action.Statut == StatutActionCarte.EnAttente)
        {
            return EmailPageState.Form(action.Titre, action.Recapitulatif, action.IdCarte);
        }

        var confirmed = action.Statut == StatutActionCarte.Confirmee;
        var message = action.MessageResultat
            ?? (confirmed
                ? "Cette opération a déjà été confirmée."
                : "Cette demande n'est plus en attente de confirmation.");
        return EmailPageState.Done(new CardActionConfirmResult(confirmed, action.IdCarte, message));
    }

    public async Task<CardActionConfirmResult> CancelEmailActionAsync(Guid token, CancellationToken cancellationToken = default)
    {
        var action = await cardActions.GetActiveAsync(token, cancellationToken);
        if (action is null)
        {
            return new CardActionConfirmResult(false, 0, "Cette demande de confirmation est introuvable.");
        }

        var cardId = action.IdCarte;
        if (action.Statut == StatutActionCarte.Confirmee)
        {
            return new CardActionConfirmResult(true, cardId, action.MessageResultat ?? "Cette opération a déjà été confirmée.");
        }

        if (action.Statut == StatutActionCarte.EnAttente && action.DateExpirationUtc <= DateTime.UtcNow)
        {
            await cardActions.MarkExpiredOrInvalidAsync(action, "Lien expiré.", cancellationToken);
            return new CardActionConfirmResult(
                false,
                cardId,
                "Le délai de confirmation est dépassé. Veuillez renouveler la demande depuis DigiCarte.");
        }

        if (action.Statut != StatutActionCarte.EnAttente)
        {
            return new CardActionConfirmResult(
                false,
                cardId,
                action.MessageResultat ?? "Cette demande a déjà été annulée.");
        }

        const string message = "Vous avez annulé cette opération. Aucune modification n'a été appliquée.";
        await cardActions.MarkExpiredOrInvalidAsync(action, message, cancellationToken);
        return new CardActionConfirmResult(false, cardId, message);
    }

    private async Task<(TransactionDto? Transaction, string? Error)> PersistDetaxeCreditAsync(
        long clientId,
        CarteBancaire card,
        FakeTransactionRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsTravel(card.Type))
        {
            return (null, "La détaxe est réservée à la carte STB Travel.");
        }

        if (card.Statut is not StatutCarte.Active)
        {
            return (null, "La carte doit être active.");
        }

        var montant = Math.Round(request.Montant, 2);
        if (card.SoldeMaximal > 0 && card.Solde + montant > card.SoldeMaximal)
        {
            return (null,
                $"Le solde maximal ({card.SoldeMaximal:N2} DT) serait dépassé. Solde actuel : {card.Solde:N2} DT.");
        }

        // Crédit uniquement — pas de débit, pas d'impact allocation
        card.Solde += montant;
        var pays = string.IsNullOrWhiteSpace(request.Pays) ? "France" : request.Pays.Trim();
        var operatorName = DetaxeOperators[Random.Shared.Next(DetaxeOperators.Length)];
        var reference = $"DTX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        var tx = new TransactionCarte
        {
            IdCarte = card.IdCarte,
            Reference = reference,
            Montant = montant,
            DateTransactionUtc = DateTime.UtcNow,
            Commercant = operatorName,
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

        return (ToTransactionDto(tx), null);
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
            "detaxe" or "remboursementdedetaxe" or "remboursementdetaxe" => Assign(TypeOperation.Detaxe, out type),
            _ => Enum.TryParse(value, true, out type)
                 && type is TypeOperation.Paiement or TypeOperation.Retrait or TypeOperation.PaiementEnLigne or TypeOperation.Detaxe
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

    private async Task<decimal> ResolveDisplayedBalanceAsync(
        long clientId,
        CarteBancaire card,
        CancellationToken cancellationToken)
    {
        if (IsPrepaidBalance(card.Type))
        {
            return card.Solde;
        }

        var compte = await GetPrimaryCourantAccountAsync(clientId, cancellationToken);
        return compte?.Solde ?? card.Solde;
    }

    private async Task<CardDetailDto> ToDetailDtoAsync(
        long clientId,
        CarteBancaire card,
        CancellationToken cancellationToken)
    {
        var solde = await ResolveDisplayedBalanceAsync(clientId, card, cancellationToken);
        return ToDetailDto(card, solde);
    }

    private static CardSummaryDto ToSummaryDto(CarteBancaire card, decimal solde) => new(
        card.IdCarte,
        card.NumeroMasque,
        FormatType(card.Type),
        FormatStatut(card.Statut),
        card.DateExpiration.ToString("MM/yyyy"),
        card.PaiementsEnLigneActifs,
        solde,
        IsCCash(card.Type),
        IsTravel(card.Type));

    private static CardDetailDto ToDetailDto(CarteBancaire card, decimal solde)
    {
        var devise = string.IsNullOrWhiteSpace(card.DevisePreferee) ? "EUR" : card.DevisePreferee;
        var taux = GetExchangeRate(devise) ?? 1m;
        var soldeDevise = taux <= 0 ? solde : Math.Round(solde / taux, 2);

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
            solde,
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

    private async Task<decimal> TryApplyRoundUpAsync(
        long clientId,
        decimal montant,
        TypeOperation type,
        string? commercant,
        CancellationToken cancellationToken)
    {
        if (type is not (TypeOperation.Paiement or TypeOperation.PaiementEnLigne))
        {
            return 0;
        }

        try
        {
            return await digiEpargneService.ApplyRoundUpForPurchaseAsync(
                clientId, montant, commercant, cancellationToken);
        }
        catch
        {
            return 0;
        }
    }

    private static TransactionDto ToTransactionDto(TransactionCarte tx, decimal arrondiEpargne = 0) => new(
        tx.IdTransaction,
        tx.Reference,
        tx.Montant,
        tx.DateTransactionUtc.ToString("o"),
        tx.Commercant,
        FormatOperation(tx.TypeOperation),
        FormatStatutTransaction(tx.Statut),
        tx.Devise,
        tx.MontantDevise,
        tx.Pays,
        arrondiEpargne);

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
        TypeOperation.Detaxe => "Remboursement de détaxe",
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
