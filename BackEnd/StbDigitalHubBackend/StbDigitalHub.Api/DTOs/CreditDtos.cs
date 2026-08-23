namespace StbDigitalHub.Api.DTOs;

public record SimulateCreditRequest(
    string TypeCredit,
    decimal Montant,
    int DureeMois,
    decimal RevenuMensuel);

public record SimulationCreditDto(
    long Id,
    string TypeCredit,
    decimal Montant,
    int DureeMois,
    decimal RevenuMensuel,
    decimal TauxAnnuel,
    decimal MensualiteEstimee,
    decimal CoutTotalEstime,
    decimal TauxEndettement,
    string NiveauEligibilite,
    string DateSimulation);

public record SubmitDemandeRequest(long SimulationId);

public record DemandeCreditDto(
    long Id,
    string TypeCredit,
    decimal MontantDemande,
    int DureeMois,
    decimal RevenuMensuel,
    decimal MensualiteEstimee,
    decimal CoutTotalEstime,
    string Statut,
    string DateDemande,
    string? MotifDecision,
    long? IdCredit);

public record CreditSummaryDto(
    long Id,
    string Reference,
    string TypeCredit,
    decimal MontantAccorde,
    int DureeMois,
    decimal TauxInteret,
    decimal Mensualite,
    decimal SoldeRestantDu,
    string Statut,
    string DateDebut,
    string? ProchaineEcheance,
    decimal? MontantProchaineEcheance);

public record EcheanceDto(
    long Id,
    int Numero,
    string DateEcheance,
    decimal Capital,
    decimal Interet,
    decimal MontantTotal,
    decimal SoldeRestantDu,
    bool Payee);

public record CreditDetailDto(
    long Id,
    string Reference,
    string TypeCredit,
    decimal MontantAccorde,
    int DureeMois,
    decimal TauxInteret,
    decimal Mensualite,
    decimal SoldeRestantDu,
    string Statut,
    string DateDebut,
    string? DateFinPrevue,
    string? ProchaineEcheance,
    decimal? MontantProchaineEcheance,
    IReadOnlyList<EcheanceDto> Echeances);

public record CreditActionSubmitResponse(
    Guid ActionId,
    string Message,
    int ExpiresInSeconds,
    string Statut,
    bool EmailSent = true,
    string? ConfirmUrl = null);

public record CreditActionConfirmResult(
    bool Success,
    string Message,
    long? DemandeId = null,
    long? CreditId = null);

public record SubmitDemandePayload(long SimulationId);

public record CreditOverviewDto(
    int CreditsActifs,
    int DemandesEnAttente,
    decimal SoldeRestantTotal,
    string? ProchaineEcheance,
    decimal? MontantProchaineEcheance,
    decimal CapitalAccordeTotal = 0,
    decimal CapitalRembourse = 0,
    decimal InteretsPayes = 0);

public record CompareScenarioDto(
    int DureeMois,
    decimal Mensualite,
    decimal CoutTotal,
    decimal TauxEndettement,
    string NiveauEligibilite,
    decimal TauxAnnuel);

public record EarlyRepaymentRequest(decimal Montant);

public record EarlyRepaymentDto(
    decimal SoldeActuel,
    decimal MontantRembourse,
    decimal InteretsEconomisesEstimes,
    decimal NouveauSolde,
    int EcheancesRestantesAvant,
    int EcheancesRestantesApresEstimees);

public record PayInstallmentResponse(string Message, CreditDetailDto Credit);
