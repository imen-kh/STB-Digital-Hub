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
