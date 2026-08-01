using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class CarteBancaire
{
    [Key]
    public long IdCarte { get; set; }

    public long IdClient { get; set; }

    [Required, MaxLength(24)]
    public string NumeroMasque { get; set; } = string.Empty;

    [Required, MaxLength(24)]
    public string NumeroComplet { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string TokenCarte { get; set; } = string.Empty;

    public DateOnly DateExpiration { get; set; }

    public TypeCarte Type { get; set; }

    public StatutCarte Statut { get; set; } = StatutCarte.Active;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PlafondPaiement { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PlafondRetrait { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PlafondTemporaire { get; set; }

    public DateOnly? DateFinPlafondTemporaire { get; set; }

    public bool PaiementsEnLigneActifs { get; set; } = true;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Solde { get; set; }

    /// <summary>Plafond max par opération de recharge (C-Cash).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal PlafondRecharge { get; set; }

    /// <summary>Solde maximal autorisé sur la carte (C-Cash / Travel).</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SoldeMaximal { get; set; }

    /// <summary>Plafond d'allocation touristique annuelle (Travel), ex. 6000 DT.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal AllocationAnnuelle { get; set; }

    /// <summary>Montant d'allocation déjà consommé (recharges) pour AnneeAllocation.</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal AllocationConsommeeAnnee { get; set; }

    /// <summary>Année civile de l'allocation touristique.</summary>
    public int AnneeAllocation { get; set; }

    /// <summary>Activation e-commerce international (Travel).</summary>
    public bool EcommerceInternationalActif { get; set; } = true;

    public DateOnly? DateDebutEcommerceIntl { get; set; }

    public DateOnly? DateFinEcommerceIntl { get; set; }

    /// <summary>Alertes Marte (SMS simulé) sur chaque opération Travel.</summary>
    public bool AlertesMarteActives { get; set; } = true;

    /// <summary>Devise d'affichage préférée (EUR, USD…).</summary>
    [MaxLength(3)]
    public string DevisePreferee { get; set; } = "EUR";

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    public Client Client { get; set; } = null!;

    public ICollection<TransactionCarte> Transactions { get; set; } = [];
}
