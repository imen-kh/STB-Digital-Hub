namespace StbDigitalHub.Api.DTOs;

public record CardSummaryDto(
    long Id,
    string NumeroMasque,
    string Type,
    string Statut,
    string DateExpiration,
    bool PaiementsEnLigneActifs,
    decimal Solde,
    bool EstCCash,
    bool EstTravel);

public record CardDetailDto(
    long Id,
    string NumeroMasque,
    string Type,
    string Statut,
    string DateExpiration,
    decimal PlafondPaiement,
    decimal PlafondRetrait,
    decimal? PlafondTemporaire,
    string? DateFinPlafondTemporaire,
    decimal PlafondEffectifPaiement,
    bool PaiementsEnLigneActifs,
    decimal Solde,
    bool EstCCash,
    bool EstTravel,
    decimal PlafondRecharge,
    decimal SoldeMaximal,
    decimal AllocationAnnuelle,
    decimal AllocationConsommeeAnnee,
    decimal AllocationRestante,
    int AnneeAllocation,
    bool EcommerceInternationalActif,
    string? DateDebutEcommerceIntl,
    string? DateFinEcommerceIntl,
    bool AlertesMarteActives,
    string DevisePreferee,
    decimal SoldeEnDevisePreferee,
    decimal TauxDevisePreferee);

public record CardActionSubmitResponse(
    Guid ActionId,
    string Message,
    int ExpiresInSeconds,
    string Statut,
    bool EmailSent = true,
    string? ConfirmUrl = null);

public record CardActionConfirmResult(
    bool Success,
    long CardId,
    string Message,
    string? NumeroComplet = null);

public sealed record EmailPageState(
    bool ShowForm,
    CardActionConfirmResult Result,
    string Titre,
    string Recapitulatif)
{
    public static EmailPageState Form(string titre, string recapitulatif) =>
        new(true, new CardActionConfirmResult(false, 0, string.Empty), titre, recapitulatif);

    public static EmailPageState Done(CardActionConfirmResult result) =>
        new(false, result, string.Empty, string.Empty);
}

public record RevealNumberResponse(string NumeroComplet, string Message);

public record UpdateLimitsRequest(decimal PlafondPaiement, decimal PlafondRetrait);

public record TemporaryLimitRequest(decimal PlafondTemporaire, DateOnly DateFin);

public record TransactionDto(
    long Id,
    string Reference,
    decimal Montant,
    string DateTransaction,
    string Commercant,
    string TypeOperation,
    string Statut,
    string? Devise,
    decimal? MontantDevise,
    string? Pays,
    decimal ArrondiEpargne = 0);

public record FakeTransactionRequest(
    decimal Montant,
    string TypeOperation,
    string? Devise = null,
    decimal? MontantDevise = null,
    string? Pays = null);

public record UpdateOnlinePaymentsRequest(bool Actif);

public record RechargeRequest(long CompteSourceId, decimal Montant);

public record ConfirmActionRequest(bool Confirm);

public record CardActionResponse(string Message, CardDetailDto Card);

public record PendingTransactionActionResponse(string Message, TransactionDto Transaction, CardDetailDto? Card);

public record UpdateEcommerceIntlRequest(bool Actif, DateOnly? DateDebut, DateOnly? DateFin);

public record UpdateMarteAlertsRequest(bool Actif, bool Confirm);

public record UpdatePreferredCurrencyRequest(string Devise);

public record TravelAssistanceInfoDto(
    string Titre,
    string Couverture,
    string Beneficiaires,
    string ContactInternational,
    string ContactUsa,
    string ContactOpposition,
    IReadOnlyList<string> Couvertures);

public record TravelAdvantageDto(
    string Titre,
    string Description,
    string? Url,
    string Categorie);

public record TravelAtmDto(
    string Nom,
    string Adresse,
    string Ville,
    string Pays,
    string Reseau,
    double? Latitude,
    double? Longitude);

public record ExchangeRateDto(string Devise, string Libelle, decimal TauxVersDt, string Source);

// Payloads sérialisés dans PendingCardAction
public record LimitsPayload(decimal PlafondPaiement, decimal PlafondRetrait);
public record TemporaryLimitPayload(decimal PlafondTemporaire, DateOnly DateFin);
public record OnlinePaymentsPayload(bool Actif);
public record EcommercePayload(bool Actif, DateOnly? DateDebut, DateOnly? DateFin);
public record RechargePayload(long CompteSourceId, decimal Montant);
public record UnusualTxPayload(long TransactionId);

public record NamedAmountDto(string Label, decimal Montant);

public record CardDayPointDto(string Label, decimal Montant);

public record CardAnalyticsDto(
    decimal DepensesMois,
    int OperationsMois,
    int EnAttente,
    IReadOnlyList<NamedAmountDto> ParCommercant,
    IReadOnlyList<NamedAmountDto> ParType,
    IReadOnlyList<CardDayPointDto> Activite);
