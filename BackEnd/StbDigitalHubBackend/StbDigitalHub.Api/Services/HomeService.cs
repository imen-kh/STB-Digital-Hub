using Microsoft.EntityFrameworkCore;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class HomeService(
    StbDigitalHubDbContext db,
    DigiCompteService digiCompteService,
    DigiCarteService digiCarteService,
    DigiCreditService digiCreditService,
    DigiEpargneService digiEpargneService)
{
    public async Task<HomeDashboardDto> GetDashboardAsync(long clientId, CancellationToken cancellationToken = default)
    {
        await digiCompteService.GetAccountsAsync(clientId, cancellationToken: cancellationToken);
        await digiCarteService.GetCardsAsync(clientId, null, cancellationToken);
        var credit = await digiCreditService.GetOverviewAsync(clientId, cancellationToken);
        var epargne = await digiEpargneService.GetDashboardAsync(clientId, cancellationToken);

        var accounts = await db.ComptesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId && c.Statut == StatutCompte.Actif)
            .ToListAsync(cancellationToken);

        var soldeCourant = accounts.Where(c => c.Type == TypeCompte.Courant).Sum(c => c.Solde);
        var soldeEpargne = accounts.Where(c => c.Type == TypeCompte.Epargne).Sum(c => c.Solde);

        var cards = await db.CartesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId)
            .ToListAsync(cancellationToken);
        var soldePrepaye = cards
            .Where(c => c.Type is TypeCarte.CCash or TypeCarte.Travel)
            .Sum(c => c.Solde);
        var cartesActives = cards.Count(c => c.Statut == StatutCarte.Active);
        var cartesBloquees = cards.Count(c => c.Statut == StatutCarte.Bloquee);

        var cardIds = cards.Select(c => c.IdCarte).ToList();
        var pendingCard = cardIds.Count == 0
            ? 0
            : await db.TransactionsCarte.CountAsync(
                t => cardIds.Contains(t.IdCarte) && t.Statut == StatutTransaction.EnAttente,
                cancellationToken);

        var retraitsEnAttente = await db.DemandesRetrait.CountAsync(
            d => d.IdCompteEpargne == epargne.IdCompteEpargne && d.Statut == StatutRetrait.EnAttente,
            cancellationToken);

        var patrimoineNet = soldeCourant + soldeEpargne + soldePrepaye - credit.SoldeRestantTotal;
        var slices = new List<HomeSliceDto>
        {
            new("Comptes courants", Math.Max(0, soldeCourant)),
            new("Épargne", Math.Max(0, soldeEpargne)),
            new("Cartes prépayées", Math.Max(0, soldePrepaye))
        };

        var alertes = BuildAlerts(
            pendingCard,
            credit.DemandesEnAttente,
            retraitsEnAttente,
            cartesBloquees,
            credit.ProchaineEcheance,
            credit.MontantProchaineEcheance,
            epargne.ArrondiActif);

        var activite = await BuildActivityAsync(clientId, cardIds, cancellationToken);

        return new HomeDashboardDto(
            soldeCourant,
            soldeEpargne,
            soldePrepaye,
            credit.SoldeRestantTotal,
            patrimoineNet,
            credit.CapitalAccordeTotal,
            credit.CapitalRembourse,
            epargne.ObjectifEpargne,
            epargne.ProgressionObjectifPct,
            epargne.ArrondiActif,
            credit.CreditsActifs,
            credit.DemandesEnAttente,
            credit.ProchaineEcheance,
            credit.MontantProchaineEcheance,
            cartesActives,
            pendingCard,
            retraitsEnAttente,
            alertes,
            slices,
            activite);
    }

    private static IReadOnlyList<HomeAlertDto> BuildAlerts(
        int pendingCard,
        int demandesCredit,
        int retraits,
        int cartesBloquees,
        string? prochaineEcheance,
        decimal? montantEcheance,
        bool arrondiActif)
    {
        var list = new List<HomeAlertDto>();
        if (pendingCard > 0)
        {
            list.Add(new HomeAlertDto(
                "warning",
                "Transactions carte en attente",
                $"{pendingCard} opération(s) à confirmer ou refuser.",
                "/digi-carte",
                "ti-alert-triangle"));
        }

        if (cartesBloquees > 0)
        {
            list.Add(new HomeAlertDto(
                "danger",
                "Carte bloquée",
                $"{cartesBloquees} carte(s) sont bloquées. Débloquez-les depuis DigiCarte si besoin.",
                "/digi-carte",
                "ti-lock"));
        }

        if (demandesCredit > 0)
        {
            list.Add(new HomeAlertDto(
                "info",
                "Demande de crédit",
                $"{demandesCredit} demande(s) en cours d'instruction.",
                "/digi-credit?tab=demandes",
                "ti-file-text"));
        }

        if (retraits > 0)
        {
            list.Add(new HomeAlertDto(
                "warning",
                "Retrait épargne",
                $"{retraits} demande(s) de retrait à suivre.",
                "/digi-epargne?tab=retraits",
                "ti-arrow-bar-up"));
        }

        if (!string.IsNullOrWhiteSpace(prochaineEcheance) && montantEcheance is > 0)
        {
            list.Add(new HomeAlertDto(
                "accent",
                "Prochaine échéance",
                $"{montantEcheance.Value:N2} DT le {prochaineEcheance}.",
                "/digi-credit?tab=credits",
                "ti-calendar-event"));
        }

        if (!arrondiActif)
        {
            list.Add(new HomeAlertDto(
                "success",
                "Arrondi automatique",
                "Activez l'arrondi des achats pour épargner à chaque paiement carte.",
                "/digi-epargne?tab=regles",
                "ti-pig-money"));
        }

        return list;
    }

    private async Task<IReadOnlyList<HomePointDto>> BuildActivityAsync(
        long clientId,
        List<long> cardIds,
        CancellationToken cancellationToken)
    {
        var from = DateTime.UtcNow.Date.AddDays(-13);
        var cardSpend = cardIds.Count == 0
            ? []
            : await db.TransactionsCarte.AsNoTracking()
                .Where(t => cardIds.Contains(t.IdCarte)
                            && t.Statut == StatutTransaction.Valide
                            && t.TypeOperation != TypeOperation.Recharge
                            && t.TypeOperation != TypeOperation.Detaxe
                            && t.DateTransactionUtc >= from)
                .Select(t => new { t.DateTransactionUtc, t.Montant })
                .ToListAsync(cancellationToken);

        var epargneId = await db.ComptesEpargne.AsNoTracking()
            .Where(c => c.IdClient == clientId)
            .Select(c => (long?)c.IdCompteEpargne)
            .FirstOrDefaultAsync(cancellationToken);

        var versements = epargneId is null
            ? []
            : await db.MouvementsEpargne.AsNoTracking()
                .Where(m => m.IdCompteEpargne == epargneId
                            && m.Type == TypeMouvementEpargne.Versement
                            && m.DateMouvementUtc >= from)
                .Select(m => new { m.DateMouvementUtc, m.Montant })
                .ToListAsync(cancellationToken);

        var points = new List<HomePointDto>(14);
        for (var i = 0; i < 14; i++)
        {
            var day = from.AddDays(i);
            var next = day.AddDays(1);
            var depenses = cardSpend
                .Where(t => t.DateTransactionUtc >= day && t.DateTransactionUtc < next)
                .Sum(t => t.Montant);
            var versed = versements
                .Where(m => m.DateMouvementUtc >= day && m.DateMouvementUtc < next)
                .Sum(m => m.Montant);
            points.Add(new HomePointDto(day.ToString("dd/MM"), depenses, versed));
        }

        return points;
    }
}
