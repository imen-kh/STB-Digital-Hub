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

public record OtpChallengeResponse(Guid ChallengeId, string Message, int ExpiresInSeconds);

public record CardOtpVerifyRequest(Guid ChallengeId, string OtpCode);

public record RevealNumberResponse(string NumeroComplet, string Message);

public record UpdateLimitsRequest(
    decimal PlafondPaiement,
    decimal PlafondRetrait,
    Guid ChallengeId,
    string OtpCode);

public record TemporaryLimitRequest(
    decimal PlafondTemporaire,
    DateOnly DateFin,
    Guid ChallengeId,
    string OtpCode);

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
    string? Pays);

public record FakeTransactionRequest(
    decimal Montant,
    string TypeOperation,
    string? Devise = null,
    decimal? MontantDevise = null,
    string? Pays = null);

public record UpdateOnlinePaymentsRequest(bool Actif, bool Confirm);

public record RechargeRequest(
    long CompteSourceId,
    decimal Montant,
    Guid ChallengeId,
    string OtpCode);

public record ConfirmActionRequest(bool Confirm);

public record CardActionResponse(string Message, CardDetailDto Card);

public record ConfirmPendingTransactionRequest(Guid ChallengeId, string OtpCode);

public record PendingTransactionActionResponse(string Message, TransactionDto Transaction, CardDetailDto? Card);

public record UpdateEcommerceIntlRequest(
    bool Actif,
    DateOnly? DateDebut,
    DateOnly? DateFin,
    Guid ChallengeId,
    string OtpCode);

public record UpdateMarteAlertsRequest(bool Actif, bool Confirm);

public record UpdatePreferredCurrencyRequest(string Devise);

public record DetaxeCreditRequest(decimal Montant, string? PaysOrigine, string? ReferenceDetaxe);

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
