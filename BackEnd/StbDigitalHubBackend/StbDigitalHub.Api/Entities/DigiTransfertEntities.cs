using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public enum StatutVirement
{
    EnAttente = 0,
    Confirme = 1,
    Refuse = 2,
    Echoue = 3,
    Annule = 4
}

public enum TypeVirement
{
    National = 0,
    International = 1
}

public enum ModeExecution
{
    Instantane = 0,
    Standard = 1,
    Programme = 2
}

public class Beneficiaire
{
    [Key]
    public long IdBeneficiaire { get; set; }

    public long IdClient { get; set; }

    public TypeVirement Type { get; set; } = TypeVirement.National;

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    [MaxLength(24)]
    public string Rib { get; set; } = string.Empty;

    [MaxLength(34)]
    public string? Iban { get; set; }

    [MaxLength(11)]
    public string? Swift { get; set; }

    [MaxLength(80)]
    public string? Pays { get; set; }

    [MaxLength(3)]
    public string Devise { get; set; } = "TND";

    [Required, MaxLength(80)]
    public string Banque { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Alias { get; set; }

    public bool Actif { get; set; } = true;

    public bool Favori { get; set; }

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    public Client Client { get; set; } = null!;

    public ICollection<Virement> Virements { get; set; } = [];
}

public class Virement
{
    [Key]
    public long IdVirement { get; set; }

    public long IdClient { get; set; }

    public long IdCompteSource { get; set; }

    public long IdBeneficiaire { get; set; }

    public TypeVirement Type { get; set; } = TypeVirement.National;

    public ModeExecution ModeExecution { get; set; } = ModeExecution.Standard;

    [Required, MaxLength(40)]
    public string Reference { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Montant { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MontantDevise { get; set; }

    [Required, MaxLength(3)]
    public string Devise { get; set; } = "TND";

    [Column(TypeName = "decimal(18,6)")]
    public decimal TauxChange { get; set; } = 1m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Frais { get; set; }

    [Required, MaxLength(160)]
    public string Motif { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? Pays { get; set; }

    public DateTime DateOperationUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DateExecutionUtc { get; set; }

    public StatutVirement Statut { get; set; } = StatutVirement.EnAttente;

    public bool IntraStb { get; set; }

    [MaxLength(80)]
    public string DelaiEstime { get; set; } = "Instantané";

    public Guid? IdOtpChallenge { get; set; }

    public DateTime? DateConfirmationOtpUtc { get; set; }

    public Client Client { get; set; } = null!;

    public CompteBancaire CompteSource { get; set; } = null!;

    public Beneficiaire Beneficiaire { get; set; } = null!;

    public RecuVirement? Recu { get; set; }
}

public class RecuVirement
{
    [Key]
    public long IdRecu { get; set; }

    public long IdVirement { get; set; }

    [Required, MaxLength(40)]
    public string ReferenceVirement { get; set; } = string.Empty;

    public DateTime DateGenerationUtc { get; set; } = DateTime.UtcNow;

    public Virement Virement { get; set; } = null!;
}
