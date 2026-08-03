using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class CompteBancaire
{
    [Key]
    public long IdCompte { get; set; }

    public long IdClient { get; set; }

    [Required, MaxLength(80)]
    public string Libelle { get; set; } = string.Empty;

    [Required, MaxLength(24)]
    public string NumeroCompte { get; set; } = string.Empty;

    [Required, MaxLength(24)]
    public string Rib { get; set; } = string.Empty;

    [Required, MaxLength(34)]
    public string Iban { get; set; } = string.Empty;

    public TypeCompte Type { get; set; }

    public StatutCompte Statut { get; set; } = StatutCompte.Actif;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Solde { get; set; }

    [Required, MaxLength(3)]
    public string Devise { get; set; } = "TND";

    public DateTime DateOuvertureUtc { get; set; } = DateTime.UtcNow;

    public Client Client { get; set; } = null!;

    public ICollection<TransactionCompte> Transactions { get; set; } = [];
}
