namespace StbDigitalHub.Api.DTOs;

public record EpargneDashboardDto(
    long IdCompteEpargne,
    long IdCompte,
    string Libelle,
    string NumeroMasque,
    decimal SoldeDisponible,
    decimal TauxInteret,
    string DateCalculInterets,
    decimal? ObjectifEpargne,
    int ProgressionObjectifPct,
    decimal Projection3Mois,
    decimal Projection12Mois,
    decimal InteretsEstimesAnnee,
    int DemandesEnAttente,
    int ReglesActives,
    string? ProchaineRegle,
    bool ArrondiActif);

public record MouvementEpargneDto(
    long Id,
    decimal Montant,
    string DateMouvement,
    string Type,
    string Libelle);

public record DemandeRetraitDto(
    long Id,
    decimal Montant,
    string DateDemande,
    string Statut,
    string? MotifDecision);

public record RegleEpargneDto(
    long Id,
    string TypeRegle,
    decimal Valeur,
    string Frequence,
    bool Active,
    string? DerniereExecution);

public record VersementRequest(decimal Montant, string? Motif);

public record RetraitRequest(decimal Montant);

public record ObjectifRequest(decimal? Montant);

public record UpsertRegleRequest(
    string TypeRegle,
    decimal Valeur,
    string Frequence,
    bool Active = true);

public record SimulateEpargneRequest(decimal VersementMensuel, int DureeMois);

public record SimulateEpargnePointDto(int Mois, decimal Solde, decimal InteretsCumules);

public record SimulateEpargneResultDto(
    decimal SoldeDepart,
    decimal TauxAnnuel,
    decimal SoldeFinal,
    decimal InteretsEstimes,
    IReadOnlyList<SimulateEpargnePointDto> Points);

public record EpargneActionSubmitResponse(
    Guid ActionId,
    string Message,
    int ExpiresInSeconds,
    string Statut,
    bool EmailSent = true,
    string? ConfirmUrl = null);

public record EpargneActionConfirmResult(
    bool Success,
    string Message,
    long? DemandeId = null);

public record RetraitPayload(decimal Montant);

public record ArrondiStatusDto(bool Active, string Exemple);

public class ToggleArrondiRequest
{
    public bool Active { get; set; }
}
