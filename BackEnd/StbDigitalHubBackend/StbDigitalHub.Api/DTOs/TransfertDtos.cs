using System.ComponentModel.DataAnnotations;

namespace StbDigitalHub.Api.DTOs;

public record TransfertOverviewDto(
    decimal SoldeCourant,
    string CompteSourceLibelle,
    string CompteSourceMasque,
    int BeneficiairesActifs,
    int VirementsMois,
    decimal VolumeMois,
    decimal PlafondJournalier,
    decimal PlafondMensuel,
    decimal ConsommeJour,
    decimal ConsommeMois,
    decimal RestantJour,
    decimal RestantMois,
    int EnAttente);

public record TauxChangeDto(string Devise, string Libelle, decimal TauxTnd, string Pays);

public record SimulationFraisDto(
    decimal Montant,
    decimal Frais,
    decimal TotalDebite,
    bool IntraStb,
    string TypeFrais,
    string DelaiEstime,
    string Banque,
    string TypeVirement,
    string Devise,
    decimal MontantDevise,
    decimal TauxChange,
    string? Pays,
    string ModeExecution,
    string DateExecutionEstimee);

public record SimulateFraisRequest(
    [Required] decimal Montant,
    string? Type,
    string? Devise,
    long? IdBeneficiaire,
    string? Rib,
    string? Iban,
    string? Banque,
    string? Pays,
    string? ModeExecution,
    string? DateProgrammee);

public record BeneficiaireDto(
    long Id,
    string Nom,
    string Prenom,
    string NomComplet,
    string Type,
    string RibMasque,
    string Rib,
    string? Iban,
    string? IbanMasque,
    string? Swift,
    string? Pays,
    string Devise,
    string Banque,
    string? Alias,
    bool Actif,
    bool Favori,
    bool IntraStb,
    string DateCreation);

public record UpsertBeneficiaireRequest(
    [Required, MaxLength(100)] string Nom,
    [Required, MaxLength(100)] string Prenom,
    [Required, MaxLength(80)] string Banque,
    string? Type,
    [MaxLength(24)] string? Rib,
    [MaxLength(34)] string? Iban,
    [MaxLength(11)] string? Swift,
    [MaxLength(80)] string? Pays,
    [MaxLength(3)] string? Devise,
    [MaxLength(80)] string? Alias,
    bool Favori = false);

public record UpdateBeneficiaireRequest(
    [Required, MaxLength(100)] string Nom,
    [Required, MaxLength(100)] string Prenom,
    [Required, MaxLength(80)] string Banque,
    [MaxLength(80)] string? Alias,
    [MaxLength(11)] string? Swift,
    [MaxLength(80)] string? Pays,
    [MaxLength(3)] string? Devise,
    bool Favori = false,
    bool Actif = true);

public record VirementDto(
    long Id,
    string Reference,
    string Type,
    decimal Montant,
    decimal MontantDevise,
    string Devise,
    decimal TauxChange,
    decimal Frais,
    decimal TotalDebite,
    string Motif,
    string Statut,
    string DateOperation,
    string? DateExecution,
    bool IntraStb,
    string DelaiEstime,
    string ModeExecution,
    string BeneficiaireNom,
    string BeneficiaireCompteMasque,
    string Banque,
    string? Pays,
    string CompteSource,
    bool RecuDisponible,
    bool OtpEnAttente);

public record VirementDetailDto(
    long Id,
    string Reference,
    string Type,
    decimal Montant,
    decimal MontantDevise,
    string Devise,
    decimal TauxChange,
    decimal Frais,
    decimal TotalDebite,
    string Motif,
    string Statut,
    string DateOperation,
    string? DateExecution,
    bool IntraStb,
    string DelaiEstime,
    string ModeExecution,
    string BeneficiaireNom,
    string BeneficiaireCompteMasque,
    string Banque,
    string? Pays,
    string CompteSource,
    bool RecuDisponible,
    bool OtpEnAttente,
    IReadOnlyList<VirementEtapeDto> Etapes);

public record VirementEtapeDto(string Titre, string Date, bool Faite, bool Courante);

public record InitierVirementRequest(
    decimal Montant,
    [Required, MaxLength(160)] string Motif,
    string? Type,
    string? Devise,
    long? IdBeneficiaire,
    UpsertBeneficiaireRequest? NouveauBeneficiaire,
    bool EnregistrerBeneficiaire = true,
    string? ModeExecution = null,
    string? DateProgrammee = null);

public record InitierVirementResponse(
    long IdVirement,
    string Reference,
    Guid ChallengeId,
    string Message,
    int ExpiresInSeconds,
    bool EmailSent,
    string? DevOtpCode,
    SimulationFraisDto Simulation,
    VirementDto Virement);

public record ConfirmerVirementRequest(
    [Required] Guid ChallengeId,
    [Required, MinLength(4), MaxLength(10)] string Code);

public record ConfirmerVirementResponse(string Message, VirementDetailDto Virement);

public record RenvoiOtpResponse(
    Guid ChallengeId,
    string Message,
    int ExpiresInSeconds,
    bool EmailSent,
    string? DevOtpCode);
