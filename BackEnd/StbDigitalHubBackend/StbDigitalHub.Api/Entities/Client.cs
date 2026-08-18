using System.ComponentModel.DataAnnotations;

namespace StbDigitalHub.Api.Entities;

public class Client
{
    [Key]
    public long IdClient { get; set; }

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Prenom { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    public string Telephone { get; set; } = string.Empty;

    [Required]
    public string MotDePasseHash { get; set; } = string.Empty;

    [MaxLength(260)]
    public string? PhotoProfilUrl { get; set; }

    public ClientStatut Statut { get; set; } = ClientStatut.EnAttente;

    public bool EmailConfirme { get; set; }

    public bool Actif { get; set; } = true;

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DateDerniereConnexionUtc { get; set; }

    public ICollection<OtpChallenge> OtpChallenges { get; set; } = [];

    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];

    public ICollection<CarteBancaire> Cartes { get; set; } = [];

    public ICollection<CompteBancaire> Comptes { get; set; } = [];

    public ICollection<Notification> Notifications { get; set; } = [];

    public ICollection<SimulationCredit> SimulationsCredit { get; set; } = [];

    public ICollection<DemandeCredit> DemandesCredit { get; set; } = [];

    public ICollection<Credit> Credits { get; set; } = [];
}
