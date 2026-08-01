using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class TransactionCarte
{
    [Key]
    public long IdTransaction { get; set; }

    public long IdCarte { get; set; }

    [Required, MaxLength(40)]
    public string Reference { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Montant { get; set; }

    public DateTime DateTransactionUtc { get; set; } = DateTime.UtcNow;

    [Required, MaxLength(120)]
    public string Commercant { get; set; } = string.Empty;

    public TypeOperation TypeOperation { get; set; }

    public StatutTransaction Statut { get; set; } = StatutTransaction.Valide;

    /// <summary>Devise de l'opération (ex. EUR, USD). Null = TND.</summary>
    [MaxLength(3)]
    public string? Devise { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MontantDevise { get; set; }

    [MaxLength(80)]
    public string? Pays { get; set; }

    public CarteBancaire Carte { get; set; } = null!;
}
