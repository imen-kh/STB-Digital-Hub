using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public enum TypeMouvementEpargne
{
    Versement = 0,
    Retrait = 1,
    Interet = 2
}

public enum StatutRetrait
{
    EnAttente = 0,
    Validee = 1,
    Refusee = 2,
    Annulee = 3
}

public enum TypeRegleEpargne
{
    VirementPeriodique = 0,
    Arrondi = 1
}

public enum FrequenceRegle
{
    Hebdomadaire = 0,
    Mensuelle = 1
}

public enum TypeActionEpargne
{
    DemandeRetrait = 0
}

public enum StatutActionEpargne
{
    EnAttente = 0,
    Confirmee = 1,
    Expiree = 2,
    Annulee = 3
}

public class CompteEpargne
{
    [Key]
    public long IdCompteEpargne { get; set; }

    public long IdClient { get; set; }

    public long IdCompte { get; set; }

    [Column(TypeName = "decimal(8,4)")]
    public decimal TauxInteret { get; set; } = 4.50m;

    public DateTime DateCalculInteretsUtc { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ObjectifEpargne { get; set; }

    public Client Client { get; set; } = null!;

    public CompteBancaire Compte { get; set; } = null!;

    public ICollection<MouvementEpargne> Mouvements { get; set; } = [];

    public ICollection<DemandeRetrait> DemandesRetrait { get; set; } = [];

    public ICollection<RegleEpargneIntelligente> Regles { get; set; } = [];
}

public class MouvementEpargne
{
    [Key]
    public long IdMouvement { get; set; }

    public long IdCompteEpargne { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Montant { get; set; }

    public DateTime DateMouvementUtc { get; set; } = DateTime.UtcNow;

    public TypeMouvementEpargne Type { get; set; }

    [Required, MaxLength(160)]
    public string Libelle { get; set; } = string.Empty;

    public CompteEpargne CompteEpargne { get; set; } = null!;
}

public class DemandeRetrait
{
    [Key]
    public long IdDemande { get; set; }

    public long IdCompteEpargne { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Montant { get; set; }

    public DateTime DateDemandeUtc { get; set; } = DateTime.UtcNow;

    public StatutRetrait Statut { get; set; } = StatutRetrait.EnAttente;

    [MaxLength(300)]
    public string? MotifDecision { get; set; }

    public DateTime? DateDecisionUtc { get; set; }

    public CompteEpargne CompteEpargne { get; set; } = null!;
}

public class RegleEpargneIntelligente
{
    [Key]
    public long IdRegle { get; set; }

    public long IdCompteEpargne { get; set; }

    public TypeRegleEpargne TypeRegle { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Valeur { get; set; }

    public FrequenceRegle Frequence { get; set; } = FrequenceRegle.Mensuelle;

    public bool Active { get; set; } = true;

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DerniereExecutionUtc { get; set; }

    public CompteEpargne CompteEpargne { get; set; } = null!;
}

public class PendingEpargneAction
{
    public Guid Id { get; set; }

    public long IdClient { get; set; }

    public long? IdCompteEpargne { get; set; }

    public TypeActionEpargne TypeAction { get; set; }

    public StatutActionEpargne Statut { get; set; } = StatutActionEpargne.EnAttente;

    public string PayloadJson { get; set; } = "{}";

    [MaxLength(200)]
    public string Titre { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Recapitulatif { get; set; } = string.Empty;

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    public DateTime DateExpirationUtc { get; set; }

    public DateTime? DateConfirmationUtc { get; set; }

    [MaxLength(1000)]
    public string? MessageResultat { get; set; }

    public long? IdDemandeRetrait { get; set; }

    public Client Client { get; set; } = null!;
}
