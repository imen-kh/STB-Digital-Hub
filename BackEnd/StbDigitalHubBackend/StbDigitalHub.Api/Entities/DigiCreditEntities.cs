using System.ComponentModel.DataAnnotations;

namespace StbDigitalHub.Api.Entities;

public enum TypeCredit
{
    Personnel = 0,
    Immobilier = 1,
    Automobile = 2,
    Etudiant = 3
}

public enum StatutDemandeCredit
{
    EnAttente = 0,
    Acceptee = 1,
    Refusee = 2,
    Annulee = 3
}

public enum StatutCredit
{
    Actif = 0,
    Solde = 1,
    Suspendu = 2
}

public enum TypeActionCredit
{
    SubmitDemande = 0,
    CancelDemande = 1
}

public enum StatutActionCredit
{
    EnAttente = 0,
    Confirmee = 1,
    Expiree = 2,
    Annulee = 3
}

public class SimulationCredit
{
    public long IdSimulation { get; set; }

    public long IdClient { get; set; }

    public TypeCredit TypeCredit { get; set; }

    public decimal Montant { get; set; }

    public int DureeMois { get; set; }

    public decimal RevenuMensuel { get; set; }

    public decimal TauxAnnuel { get; set; }

    public decimal MensualiteEstimee { get; set; }

    public decimal CoutTotalEstime { get; set; }

    public decimal TauxEndettement { get; set; }

    public string NiveauEligibilite { get; set; } = "Orange";

    public DateTime DateSimulationUtc { get; set; } = DateTime.UtcNow;

    public Client Client { get; set; } = null!;
}

public class DemandeCredit
{
    public long IdDemande { get; set; }

    public long IdClient { get; set; }

    public long? IdSimulation { get; set; }

    public TypeCredit TypeCredit { get; set; }

    public decimal MontantDemande { get; set; }

    public int DureeMois { get; set; }

    public decimal RevenuMensuel { get; set; }

    public decimal MensualiteEstimee { get; set; }

    public decimal CoutTotalEstime { get; set; }

    public DateTime DateDemandeUtc { get; set; } = DateTime.UtcNow;

    public StatutDemandeCredit Statut { get; set; } = StatutDemandeCredit.EnAttente;

    public string? MotifDecision { get; set; }

    public DateTime? DateDecisionUtc { get; set; }

    public Client Client { get; set; } = null!;

    public SimulationCredit? Simulation { get; set; }

    public Credit? Credit { get; set; }
}

public class Credit
{
    public long IdCredit { get; set; }

    public long IdClient { get; set; }

    public long? IdDemande { get; set; }

    [Required, MaxLength(40)]
    public string Reference { get; set; } = string.Empty;

    public TypeCredit TypeCredit { get; set; }

    public decimal MontantAccorde { get; set; }

    public int DureeMois { get; set; }

    public decimal TauxInteret { get; set; }

    public decimal Mensualite { get; set; }

    public decimal SoldeRestantDu { get; set; }

    public StatutCredit Statut { get; set; } = StatutCredit.Actif;

    public DateTime DateDebutUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DateFinPrevueUtc { get; set; }

    public Client Client { get; set; } = null!;

    public DemandeCredit? Demande { get; set; }

    public ICollection<Echeance> Echeances { get; set; } = [];
}

public class Echeance
{
    public long IdEcheance { get; set; }

    public long IdCredit { get; set; }

    public int Numero { get; set; }

    public DateOnly DateEcheance { get; set; }

    public decimal Capital { get; set; }

    public decimal Interet { get; set; }

    public decimal MontantTotal { get; set; }

    public decimal SoldeRestantDu { get; set; }

    public bool Payee { get; set; }

    public DateTime? DatePaiementUtc { get; set; }

    public Credit Credit { get; set; } = null!;
}

public class PendingCreditAction
{
    public Guid Id { get; set; }

    public long IdClient { get; set; }

    public long? IdDemande { get; set; }

    public long? IdSimulation { get; set; }

    public TypeActionCredit TypeAction { get; set; }

    public StatutActionCredit Statut { get; set; } = StatutActionCredit.EnAttente;

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

    public Client Client { get; set; } = null!;
}
