namespace StbDigitalHub.Api.DTOs;

public record HomeSliceDto(string Label, decimal Value);

public record HomePointDto(string Label, decimal DepensesCarte, decimal VersementsEpargne);

public record HomeAlertDto(string Niveau, string Titre, string Message, string Url, string Icone);

public record HomeDashboardDto(
    decimal SoldeCourant,
    decimal SoldeEpargne,
    decimal SoldePrepaye,
    decimal SoldeRestantCredit,
    decimal PatrimoineNet,
    decimal CapitalAccorde,
    decimal CapitalRembourse,
    decimal? ObjectifEpargne,
    int ProgressionObjectifPct,
    bool ArrondiActif,
    int CreditsActifs,
    int DemandesCreditEnAttente,
    string? ProchaineEcheance,
    decimal? MontantProchaineEcheance,
    int CartesActives,
    int TransactionsCarteEnAttente,
    int RetraitsEpargneEnAttente,
    IReadOnlyList<HomeAlertDto> Alertes,
    IReadOnlyList<HomeSliceDto> Patrimoine,
    IReadOnlyList<HomePointDto> Activite);
