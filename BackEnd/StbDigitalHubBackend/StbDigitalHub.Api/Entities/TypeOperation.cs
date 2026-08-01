namespace StbDigitalHub.Api.Entities;

public enum TypeOperation
{
    Paiement = 0,
    Retrait = 1,
    Recharge = 2,
    PaiementEnLigne = 3,
    /// <summary>Crédit détaxe perçu sur la carte Travel.</summary>
    Detaxe = 4
}
