namespace StbDigitalHub.Api.DTOs;

public record AccountSummaryDto(
    long Id,
    string Libelle,
    string Type,
    string Statut,
    string NumeroMasque,
    decimal Solde,
    string Devise);

public record AccountDetailDto(
    long Id,
    string Libelle,
    string Type,
    string Statut,
    string NumeroCompte,
    string RibMasque,
    string IbanMasque,
    string Rib,
    string Iban,
    decimal Solde,
    string Devise,
    string DateOuverture);

public record AccountTransactionDto(
    long Id,
    string Reference,
    decimal Montant,
    string DateTransaction,
    string Libelle,
    string TypeMouvement,
    string Statut);

public record TransferRequest(
    long DestinationAccountId,
    decimal Montant,
    string? Motif);

public record AccountDayPointDto(string Label, decimal Credits, decimal Debits);

public record AccountAnalyticsDto(
    decimal SoldeTotal,
    decimal SoldeCourant,
    decimal SoldeEpargne,
    int ComptesActifs,
    decimal EntreesMois,
    decimal SortiesMois,
    int OperationsMois,
    IReadOnlyList<NamedAmountDto> ParCompte,
    IReadOnlyList<NamedAmountDto> ParType,
    IReadOnlyList<AccountDayPointDto> Activite);
