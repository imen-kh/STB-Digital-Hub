using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class TransactionCompte
{
    [Key]
    public long IdTransaction { get; set; }

    public long IdCompte { get; set; }

    [Required, MaxLength(40)]
    public string Reference { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Montant { get; set; }

    public DateTime DateTransactionUtc { get; set; } = DateTime.UtcNow;

    [Required, MaxLength(160)]
    public string Libelle { get; set; } = string.Empty;

    public TypeMouvementCompte TypeMouvement { get; set; }

    public StatutTransaction Statut { get; set; } = StatutTransaction.Valide;

    public CompteBancaire Compte { get; set; } = null!;
}
