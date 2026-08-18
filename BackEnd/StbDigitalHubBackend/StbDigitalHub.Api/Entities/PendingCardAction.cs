namespace StbDigitalHub.Api.Entities;

public enum TypeActionCarte
{
    RevealNumber = 0,
    UpdateLimits = 1,
    TemporaryLimit = 2,
    OnlinePayments = 3,
    EcommerceIntl = 4,
    Recharge = 5,
    ConfirmUnusualTransaction = 6
}

public enum StatutActionCarte
{
    EnAttente = 0,
    Confirmee = 1,
    Expiree = 2,
    Annulee = 3
}

public class PendingCardAction
{
    public Guid Id { get; set; }

    public long IdClient { get; set; }

    public long IdCarte { get; set; }

    public long? IdTransaction { get; set; }

    public TypeActionCarte TypeAction { get; set; }

    public StatutActionCarte Statut { get; set; } = StatutActionCarte.EnAttente;

    /// <summary>Payload JSON de la demande (montants, flags, etc.).</summary>
    public string PayloadJson { get; set; } = "{}";

    public string Titre { get; set; } = string.Empty;

    public string Recapitulatif { get; set; } = string.Empty;

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    public DateTime DateExpirationUtc { get; set; }

    public DateTime? DateConfirmationUtc { get; set; }

    public string? MessageResultat { get; set; }

    public Client Client { get; set; } = null!;

    public CarteBancaire Carte { get; set; } = null!;
}
