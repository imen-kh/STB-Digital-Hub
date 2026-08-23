using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class DigiCreditService(
    StbDigitalHubDbContext db,
    IEmailSender emailSender,
    NotificationService notificationService,
    IOptions<AppOptions> appOptions)
{
    private readonly AppOptions _app = appOptions.Value;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    static DigiCreditService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<SimulationCreditDto> SimulateAsync(
        long clientId,
        SimulateCreditRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);

        if (!TryParseType(request.TypeCredit, out var type))
        {
            throw new InvalidOperationException("Type de crédit invalide.");
        }

        if (request.Montant < 500 || request.Montant > 500_000)
        {
            throw new InvalidOperationException("Le montant doit être entre 500 et 500 000 DT.");
        }

        if (request.DureeMois is < 6 or > 360)
        {
            throw new InvalidOperationException("La durée doit être entre 6 et 360 mois.");
        }

        if (request.RevenuMensuel <= 0)
        {
            throw new InvalidOperationException("Le revenu mensuel doit être supérieur à zéro.");
        }

        var calc = Calculate(type, request.Montant, request.DureeMois, request.RevenuMensuel);
        var sim = new SimulationCredit
        {
            IdClient = clientId,
            TypeCredit = type,
            Montant = Math.Round(request.Montant, 2),
            DureeMois = request.DureeMois,
            RevenuMensuel = Math.Round(request.RevenuMensuel, 2),
            TauxAnnuel = calc.TauxAnnuel,
            MensualiteEstimee = calc.Mensualite,
            CoutTotalEstime = calc.CoutTotal,
            TauxEndettement = calc.TauxEndettement,
            NiveauEligibilite = calc.Eligibilite,
            DateSimulationUtc = DateTime.UtcNow
        };

        db.SimulationsCredit.Add(sim);
        await db.SaveChangesAsync(cancellationToken);
        return ToSimulationDto(sim);
    }

    public async Task<IReadOnlyList<SimulationCreditDto>> GetSimulationsAsync(
        long clientId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);
        var list = await db.SimulationsCredit.AsNoTracking()
            .Where(s => s.IdClient == clientId)
            .OrderByDescending(s => s.DateSimulationUtc)
            .Take(20)
            .ToListAsync(cancellationToken);
        return list.Select(ToSimulationDto).ToList();
    }

    public async Task<(CreditActionSubmitResponse? Response, string? Error)> SubmitDemandeAsync(
        long clientId,
        SubmitDemandeRequest request,
        CancellationToken cancellationToken = default)
    {
        var sim = await db.SimulationsCredit
            .FirstOrDefaultAsync(s => s.IdSimulation == request.SimulationId && s.IdClient == clientId, cancellationToken);
        if (sim is null)
        {
            return (null, "Simulation introuvable.");
        }

        if (sim.NiveauEligibilite.Equals("Rouge", StringComparison.OrdinalIgnoreCase))
        {
            return (null, "Éligibilité insuffisante pour soumettre cette demande.");
        }

        var client = await db.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        var pendingSame = await db.PendingCreditActions
            .Where(a => a.IdClient == clientId
                        && a.TypeAction == TypeActionCredit.SubmitDemande
                        && a.Statut == StatutActionCredit.EnAttente
                        && a.DateExpirationUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);
        foreach (var old in pendingSame)
        {
            old.Statut = StatutActionCredit.Annulee;
        }

        var minutes = Math.Max(5, _app.CardActionExpirationMinutes);
        var action = new PendingCreditAction
        {
            Id = Guid.NewGuid(),
            IdClient = clientId,
            IdSimulation = sim.IdSimulation,
            TypeAction = TypeActionCredit.SubmitDemande,
            Statut = StatutActionCredit.EnAttente,
            PayloadJson = JsonSerializer.Serialize(new SubmitDemandePayload(sim.IdSimulation), JsonOptions),
            Titre = "Soumission demande de crédit",
            Recapitulatif =
                $"{FormatType(sim.TypeCredit)} — {sim.Montant:N2} DT sur {sim.DureeMois} mois " +
                $"(mensualité {sim.MensualiteEstimee:N2} DT).",
            DateCreationUtc = DateTime.UtcNow,
            DateExpirationUtc = DateTime.UtcNow.AddMinutes(minutes)
        };
        db.PendingCreditActions.Add(action);
        await db.SaveChangesAsync(cancellationToken);

        var confirmUrl = $"{_app.FrontendBaseUrl.TrimEnd('/')}/digi-credit?confirm={action.Id:D}";
        var subject = "STB Digital Hub — Confirmation demande de crédit";
        var body = $"""
            <p>Bonjour {client.Prenom},</p>
            <p>Une demande de crédit est <strong>en attente de confirmation</strong>.</p>
            <p>{action.Recapitulatif}</p>
            <p style="margin:24px 0;">
              <a href="{confirmUrl}"
                 style="background:#003d7a;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
                Confirmer l'opération
              </a>
            </p>
            <p>Ce lien est valable {minutes} minutes et ne peut être utilisé qu'une seule fois.</p>
            <p>— STB Digital Hub</p>
            """;

        var sent = await emailSender.SendAsync(client.Email, subject, body, cancellationToken);
        var message = sent
            ? "Un e-mail de confirmation vous a été envoyé."
            : "Un e-mail de confirmation n'a pas pu être envoyé. Utilisez le bouton de confirmation ci-dessous.";

        return (new CreditActionSubmitResponse(
            action.Id,
            message,
            minutes * 60,
            "En attente de confirmation",
            sent,
            confirmUrl), null);
    }

    public async Task<CreditActionConfirmResult> ConfirmEmailActionAsync(
        Guid token,
        CancellationToken cancellationToken = default)
    {
        var action = await db.PendingCreditActions
            .FirstOrDefaultAsync(a => a.Id == token, cancellationToken);
        if (action is null)
        {
            return new CreditActionConfirmResult(false, "Cette demande de confirmation est introuvable.");
        }

        if (action.Statut == StatutActionCredit.Confirmee)
        {
            return new CreditActionConfirmResult(true, action.MessageResultat ?? "Cette opération a déjà été confirmée.", action.IdDemande);
        }

        if (action.DateExpirationUtc <= DateTime.UtcNow)
        {
            action.Statut = StatutActionCredit.Expiree;
            action.MessageResultat = "Lien expiré.";
            await db.SaveChangesAsync(cancellationToken);
            return new CreditActionConfirmResult(false, "Le délai de confirmation est dépassé.");
        }

        if (action.Statut != StatutActionCredit.EnAttente)
        {
            return new CreditActionConfirmResult(false, "Cette demande n'est plus en attente de confirmation.");
        }

        if (action.TypeAction != TypeActionCredit.SubmitDemande)
        {
            action.Statut = StatutActionCredit.Annulee;
            await db.SaveChangesAsync(cancellationToken);
            return new CreditActionConfirmResult(false, "Type d'opération non supporté.");
        }

        var payload = JsonSerializer.Deserialize<SubmitDemandePayload>(action.PayloadJson, JsonOptions);
        var simId = payload?.SimulationId ?? action.IdSimulation;
        if (simId is null or 0)
        {
            action.Statut = StatutActionCredit.Annulee;
            await db.SaveChangesAsync(cancellationToken);
            return new CreditActionConfirmResult(false, "Simulation manquante.");
        }

        var sim = await db.SimulationsCredit
            .FirstOrDefaultAsync(s => s.IdSimulation == simId && s.IdClient == action.IdClient, cancellationToken);
        if (sim is null)
        {
            action.Statut = StatutActionCredit.Annulee;
            await db.SaveChangesAsync(cancellationToken);
            return new CreditActionConfirmResult(false, "Simulation introuvable.");
        }

        var demande = new DemandeCredit
        {
            IdClient = action.IdClient,
            IdSimulation = sim.IdSimulation,
            TypeCredit = sim.TypeCredit,
            MontantDemande = sim.Montant,
            DureeMois = sim.DureeMois,
            RevenuMensuel = sim.RevenuMensuel,
            MensualiteEstimee = sim.MensualiteEstimee,
            CoutTotalEstime = sim.CoutTotalEstime,
            DateDemandeUtc = DateTime.UtcNow,
            Statut = StatutDemandeCredit.EnAttente
        };
        db.DemandesCredit.Add(demande);
        await db.SaveChangesAsync(cancellationToken);

        // Décision démo automatique selon éligibilité
        if (sim.NiveauEligibilite.Equals("Vert", StringComparison.OrdinalIgnoreCase))
        {
            await AcceptDemandeInternalAsync(demande, cancellationToken);
        }
        else if (sim.NiveauEligibilite.Equals("Rouge", StringComparison.OrdinalIgnoreCase))
        {
            demande.Statut = StatutDemandeCredit.Refusee;
            demande.MotifDecision = "Taux d'endettement trop élevé (simulation).";
            demande.DateDecisionUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            await notificationService.CreateInfoNotificationAsync(
                action.IdClient,
                "Demande de crédit refusée",
                $"Votre demande {FormatType(demande.TypeCredit)} de {demande.MontantDemande:N2} DT a été refusée.",
                cancellationToken);
        }
        else
        {
            await notificationService.CreateInfoNotificationAsync(
                action.IdClient,
                "Demande de crédit enregistrée",
                $"Votre demande {FormatType(demande.TypeCredit)} de {demande.MontantDemande:N2} DT est en attente d'examen.",
                cancellationToken);
        }

        action.Statut = StatutActionCredit.Confirmee;
        action.DateConfirmationUtc = DateTime.UtcNow;
        action.IdDemande = demande.IdDemande;
        action.MessageResultat = $"Demande #{demande.IdDemande} enregistrée ({FormatStatutDemande(demande.Statut)}).";
        await db.SaveChangesAsync(cancellationToken);

        return new CreditActionConfirmResult(
            true,
            action.MessageResultat,
            demande.IdDemande,
            demande.Credit?.IdCredit);
    }

    public async Task<IReadOnlyList<DemandeCreditDto>> GetDemandesAsync(
        long clientId,
        string? statut,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);
        var query = db.DemandesCredit.AsNoTracking()
            .Include(d => d.Credit)
            .Where(d => d.IdClient == clientId);

        if (!string.IsNullOrWhiteSpace(statut) && Enum.TryParse<StatutDemandeCredit>(statut, true, out var parsed))
        {
            query = query.Where(d => d.Statut == parsed);
        }

        var list = await query.OrderByDescending(d => d.DateDemandeUtc).ToListAsync(cancellationToken);
        return list.Select(ToDemandeDto).ToList();
    }

    public async Task<IReadOnlyList<CreditSummaryDto>> GetCreditsAsync(
        long clientId,
        string? statut,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);
        var query = db.Credits.AsNoTracking()
            .Include(c => c.Echeances)
            .Where(c => c.IdClient == clientId);

        if (!string.IsNullOrWhiteSpace(statut) && Enum.TryParse<StatutCredit>(statut, true, out var parsed))
        {
            query = query.Where(c => c.Statut == parsed);
        }

        var list = await query.OrderByDescending(c => c.DateDebutUtc).ToListAsync(cancellationToken);
        return list.Select(ToSummaryDto).ToList();
    }

    public async Task<CreditDetailDto?> GetCreditAsync(
        long clientId,
        long creditId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);
        var credit = await db.Credits.AsNoTracking()
            .Include(c => c.Echeances)
            .FirstOrDefaultAsync(c => c.IdCredit == creditId && c.IdClient == clientId, cancellationToken);
        return credit is null ? null : ToDetailDto(credit);
    }

    public async Task<(byte[]? Pdf, string? Error)> GenerateAmortizationPdfAsync(
        long clientId,
        long creditId,
        CancellationToken cancellationToken = default)
    {
        var credit = await db.Credits.AsNoTracking()
            .Include(c => c.Echeances)
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.IdCredit == creditId && c.IdClient == clientId, cancellationToken);

        if (credit is null)
        {
            return (null, "Crédit introuvable.");
        }

        var echeances = credit.Echeances.OrderBy(e => e.Numero).ToList();
        var client = credit.Client;
        var totalCapital = echeances.Sum(e => e.Capital);
        var totalInteret = echeances.Sum(e => e.Interet);
        var totalPaye = echeances.Where(e => e.Payee).Sum(e => e.MontantTotal);
        var payees = echeances.Count(e => e.Payee);
        var navy = PdfNavy;
        var sky = PdfSky;
        var soft = PdfSoftBg;
        var border = PdfBorder;

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Grey.Darken3));

                page.Header().Element(c => ComposePdfHeader(
                    c,
                    "Tableau d'amortissement",
                    "DigiCrédit · échéancier détaillé",
                    navy,
                    sky));

                page.Content().PaddingTop(14).Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Background(soft).Border(1).BorderColor(border).Padding(12).Column(info =>
                    {
                        info.Item().Text($"{client.Prenom} {client.Nom}")
                            .SemiBold().FontSize(12).FontColor(navy);
                        info.Item().PaddingTop(2).Text($"Référence {credit.Reference}  ·  {FormatType(credit.TypeCredit)}  ·  {FormatStatutCredit(credit.Statut)}")
                            .FontSize(9).FontColor(Colors.Grey.Darken2);
                        info.Item().PaddingTop(8).Row(row =>
                        {
                            PdfStatCell(row.RelativeItem(), "Montant accordé", $"{credit.MontantAccorde:N2} DT", navy);
                            PdfStatCell(row.RelativeItem(), "Durée", $"{credit.DureeMois} mois", navy);
                            PdfStatCell(row.RelativeItem(), "Taux annuel", $"{credit.TauxInteret:N2} %", navy);
                            PdfStatCell(row.RelativeItem(), "Mensualité", $"{credit.Mensualite:N2} DT", navy);
                        });
                        info.Item().PaddingTop(6).Row(row =>
                        {
                            PdfStatCell(row.RelativeItem(), "Solde restant", $"{credit.SoldeRestantDu:N2} DT", sky);
                            PdfStatCell(row.RelativeItem(), "Échéances payées", $"{payees} / {echeances.Count}", navy);
                            PdfStatCell(row.RelativeItem(), "Total déjà payé", $"{totalPaye:N2} DT", navy);
                            PdfStatCell(row.RelativeItem(), "Intérêts totaux", $"{totalInteret:N2} DT", navy);
                        });
                    });

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.ConstantColumn(28);
                            c.RelativeColumn(1.4f);
                            c.RelativeColumn(1.3f);
                            c.RelativeColumn(1.3f);
                            c.RelativeColumn(1.3f);
                            c.RelativeColumn(1.3f);
                            c.ConstantColumn(52);
                        });

                        table.Header(h =>
                        {
                            PdfTableHeader(h.Cell(), "#", navy);
                            PdfTableHeader(h.Cell(), "Date", navy);
                            PdfTableHeader(h.Cell(), "Capital", navy, true);
                            PdfTableHeader(h.Cell(), "Intérêt", navy, true);
                            PdfTableHeader(h.Cell(), "Total", navy, true);
                            PdfTableHeader(h.Cell(), "Reste dû", navy, true);
                            PdfTableHeader(h.Cell(), "Statut", navy, true);
                        });

                        var i = 0;
                        foreach (var e in echeances)
                        {
                            var bg = e.Payee
                                ? Color.FromHex("#E8F6EE")
                                : (i % 2 == 0 ? Colors.White : soft);
                            PdfTableCell(table.Cell(), e.Numero.ToString(), bg);
                            PdfTableCell(table.Cell(), e.DateEcheance.ToString("dd/MM/yyyy"), bg);
                            PdfTableCell(table.Cell(), $"{e.Capital:N2}", bg, true);
                            PdfTableCell(table.Cell(), $"{e.Interet:N2}", bg, true);
                            PdfTableCell(table.Cell(), $"{e.MontantTotal:N2}", bg, true, bold: true);
                            PdfTableCell(table.Cell(), $"{e.SoldeRestantDu:N2}", bg, true);
                            PdfTableCell(table.Cell(), e.Payee ? "Payée" : "À venir", bg, true,
                                color: e.Payee ? Color.FromHex("#1B7A3D") : Colors.Grey.Darken1);
                            i++;
                        }

                        var footerBg = Color.FromHex("#E8EEF6");
                        PdfTableCell(table.Cell(), "", footerBg, bold: true);
                        PdfTableCell(table.Cell(), "TOTAL", footerBg, bold: true);
                        PdfTableCell(table.Cell(), $"{totalCapital:N2}", footerBg, true, bold: true);
                        PdfTableCell(table.Cell(), $"{totalInteret:N2}", footerBg, true, bold: true);
                        PdfTableCell(table.Cell(), $"{totalCapital + totalInteret:N2}", footerBg, true, bold: true);
                        PdfTableCell(table.Cell(), "", footerBg);
                        PdfTableCell(table.Cell(), "", footerBg);
                    });

                    col.Item().PaddingTop(4).Text("Document pédagogique de démonstration — non contractuel.")
                        .Italic().FontSize(8).FontColor(Colors.Grey.Darken1);
                });

                page.Footer().Element(c => ComposePdfFooter(c, navy));
            });
        }).GeneratePdf();

        return (pdf, null);
    }

    public async Task<(byte[]? Pdf, string? Error)> GenerateSimulationPdfAsync(
        long clientId,
        long simulationId,
        CancellationToken cancellationToken = default)
    {
        var sim = await db.SimulationsCredit.AsNoTracking()
            .Include(s => s.Client)
            .FirstOrDefaultAsync(s => s.IdSimulation == simulationId && s.IdClient == clientId, cancellationToken);
        if (sim is null)
        {
            return (null, "Simulation introuvable.");
        }

        var navy = PdfNavy;
        var sky = PdfSky;
        var soft = PdfSoftBg;
        var border = PdfBorder;
        var eligColor = sim.NiveauEligibilite.Equals("Vert", StringComparison.OrdinalIgnoreCase)
            ? Color.FromHex("#1B7A3D")
            : sim.NiveauEligibilite.Equals("Rouge", StringComparison.OrdinalIgnoreCase)
                ? Color.FromHex("#B42318")
                : Color.FromHex("#B86A00");
        var eligBg = sim.NiveauEligibilite.Equals("Vert", StringComparison.OrdinalIgnoreCase)
            ? Color.FromHex("#E6F6EC")
            : sim.NiveauEligibilite.Equals("Rouge", StringComparison.OrdinalIgnoreCase)
                ? Color.FromHex("#FDEAEA")
                : Color.FromHex("#FFF4E5");
        var coutInterets = Math.Max(0, sim.CoutTotalEstime - sim.Montant);

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                page.Header().Element(c => ComposePdfHeader(
                    c,
                    "Attestation de simulation",
                    "DigiCrédit · estimation pédagogique",
                    navy,
                    sky));

                page.Content().PaddingTop(18).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            left.Item().Text("Bénéficiaire").FontSize(8).FontColor(Colors.Grey.Darken1);
                            left.Item().Text($"{sim.Client.Prenom} {sim.Client.Nom}")
                                .SemiBold().FontSize(13).FontColor(navy);
                            left.Item().PaddingTop(2).Text($"Simulation n° {sim.IdSimulation}")
                                .FontSize(9).FontColor(Colors.Grey.Darken1);
                        });
                        row.ConstantItem(140).AlignRight().AlignMiddle()
                            .Background(eligBg)
                            .Border(1).BorderColor(eligColor)
                            .PaddingVertical(8).PaddingHorizontal(12)
                            .Column(badge =>
                            {
                                badge.Item().AlignCenter().Text("ÉLIGIBILITÉ")
                                    .FontSize(7).FontColor(eligColor);
                                badge.Item().AlignCenter().Text(sim.NiveauEligibilite.ToUpperInvariant())
                                    .Bold().FontSize(14).FontColor(eligColor);
                                badge.Item().AlignCenter().Text($"{sim.TauxEndettement:N1} % endettement")
                                    .FontSize(8).FontColor(eligColor);
                            });
                    });

                    col.Item().Text("Paramètres de la simulation")
                        .SemiBold().FontSize(11).FontColor(navy);
                    col.Item().Background(soft).Border(1).BorderColor(border).Padding(12).Row(row =>
                    {
                        PdfStatCell(row.RelativeItem(), "Type de crédit", FormatType(sim.TypeCredit), navy);
                        PdfStatCell(row.RelativeItem(), "Montant demandé", $"{sim.Montant:N2} DT", navy);
                        PdfStatCell(row.RelativeItem(), "Durée", $"{sim.DureeMois} mois", navy);
                        PdfStatCell(row.RelativeItem(), "Revenu mensuel", $"{sim.RevenuMensuel:N2} DT", navy);
                    });

                    col.Item().Text("Résultats estimés")
                        .SemiBold().FontSize(11).FontColor(navy);
                    col.Item().Row(row =>
                    {
                        row.Spacing(8);
                        PdfHighlightCard(row.RelativeItem(), "Mensualité estimée", $"{sim.MensualiteEstimee:N2} DT", navy, sky);
                        PdfHighlightCard(row.RelativeItem(), "Coût total estimé", $"{sim.CoutTotalEstime:N2} DT", navy, sky);
                        PdfHighlightCard(row.RelativeItem(), "Intérêts estimés", $"{coutInterets:N2} DT", navy, sky);
                        PdfHighlightCard(row.RelativeItem(), "Taux annuel", $"{sim.TauxAnnuel:N2} %", navy, sky);
                    });

                    col.Item().PaddingTop(4).Background(Colors.White)
                        .Border(1).BorderColor(border)
                        .Padding(12)
                        .Column(note =>
                        {
                            note.Item().Text("Mentions importantes").SemiBold().FontSize(10).FontColor(navy);
                            note.Item().PaddingTop(4).Text(
                                    "Cette attestation est un document pédagogique généré par STB Digital Hub. " +
                                    "Les montants, taux et niveaux d'éligibilité sont indicatifs et ne constituent " +
                                    "ni une offre de crédit, ni un engagement contractuel de la STB.")
                                .FontSize(9).LineHeight(1.35f);
                            note.Item().PaddingTop(6).Text(
                                    $"Date de simulation : {sim.DateSimulationUtc:dd/MM/yyyy HH:mm} UTC")
                                .FontSize(8).FontColor(Colors.Grey.Darken1);
                        });

                    col.Item().PaddingTop(20).Row(sig =>
                    {
                        sig.RelativeItem().Column(s =>
                        {
                            s.Item().Text("Le client").FontSize(8).FontColor(Colors.Grey.Darken1);
                            s.Item().PaddingTop(28).LineHorizontal(1).LineColor(border);
                            s.Item().PaddingTop(4).Text($"{sim.Client.Prenom} {sim.Client.Nom}").FontSize(9);
                        });
                        sig.ConstantItem(40);
                        sig.RelativeItem().Column(s =>
                        {
                            s.Item().Text("STB Digital Hub").FontSize(8).FontColor(Colors.Grey.Darken1);
                            s.Item().PaddingTop(28).LineHorizontal(1).LineColor(border);
                            s.Item().PaddingTop(4).Text("Simulation DigiCrédit").FontSize(9);
                        });
                    });
                });

                page.Footer().Element(c => ComposePdfFooter(c, navy));
            });
        }).GeneratePdf();

        return (pdf, null);
    }

    public async Task<CreditOverviewDto> GetOverviewAsync(long clientId, CancellationToken cancellationToken = default)
    {
        await EnsureSeedAsync(clientId, cancellationToken);
        var credits = await db.Credits.AsNoTracking()
            .Include(c => c.Echeances)
            .Where(c => c.IdClient == clientId && c.Statut == StatutCredit.Actif)
            .ToListAsync(cancellationToken);
        var pending = await db.DemandesCredit.AsNoTracking()
            .CountAsync(d => d.IdClient == clientId && d.Statut == StatutDemandeCredit.EnAttente, cancellationToken);

        var next = credits
            .SelectMany(c => c.Echeances.Where(e => !e.Payee).Select(e => new { e.DateEcheance, e.MontantTotal }))
            .OrderBy(x => x.DateEcheance)
            .FirstOrDefault();

        var paid = credits.SelectMany(c => c.Echeances.Where(e => e.Payee)).ToList();
        return new CreditOverviewDto(
            credits.Count,
            pending,
            credits.Sum(c => c.SoldeRestantDu),
            next?.DateEcheance.ToString("dd/MM/yyyy"),
            next?.MontantTotal,
            credits.Sum(c => c.MontantAccorde),
            paid.Sum(e => e.Capital),
            paid.Sum(e => e.Interet));
    }

    public IReadOnlyList<CompareScenarioDto> CompareScenarios(SimulateCreditRequest request)
    {
        if (!TryParseType(request.TypeCredit, out var type))
        {
            throw new InvalidOperationException("Type de crédit invalide.");
        }

        if (request.Montant <= 0 || request.RevenuMensuel <= 0)
        {
            throw new InvalidOperationException("Montant et revenu doivent être positifs.");
        }

        var durations = new[] { 12, 24, 36, 48, 60 }
            .Where(d => d >= 6 && d <= 360)
            .Distinct()
            .Take(5)
            .ToArray();

        if (request.DureeMois is >= 6 and <= 360 && !durations.Contains(request.DureeMois))
        {
            durations = durations.Append(request.DureeMois).OrderBy(d => d).ToArray();
        }

        return durations.Select(d =>
        {
            var calc = Calculate(type, request.Montant, d, request.RevenuMensuel);
            return new CompareScenarioDto(d, calc.Mensualite, calc.CoutTotal, calc.TauxEndettement, calc.Eligibilite, calc.TauxAnnuel);
        }).ToList();
    }

    public async Task<(EarlyRepaymentDto? Result, string? Error)> SimulateEarlyRepaymentAsync(
        long clientId,
        long creditId,
        decimal montant,
        CancellationToken cancellationToken = default)
    {
        var credit = await db.Credits.AsNoTracking()
            .Include(c => c.Echeances)
            .FirstOrDefaultAsync(c => c.IdCredit == creditId && c.IdClient == clientId, cancellationToken);
        if (credit is null)
        {
            return (null, "Crédit introuvable.");
        }

        if (credit.Statut != StatutCredit.Actif)
        {
            return (null, "Seuls les crédits actifs permettent un remboursement anticipé simulé.");
        }

        montant = Math.Round(montant, 2);
        if (montant <= 0)
        {
            return (null, "Le montant doit être supérieur à zéro.");
        }

        if (montant > credit.SoldeRestantDu)
        {
            return (null, $"Le montant dépasse le solde restant ({credit.SoldeRestantDu:N2} DT).");
        }

        var remaining = credit.Echeances.Where(e => !e.Payee).OrderBy(e => e.Numero).ToList();
        var interetsRestants = remaining.Sum(e => e.Interet);
        var ratio = credit.SoldeRestantDu <= 0 ? 0 : montant / credit.SoldeRestantDu;
        var economie = Math.Round(interetsRestants * ratio, 2);
        var nouveauSolde = Math.Round(credit.SoldeRestantDu - montant, 2);
        var apres = nouveauSolde <= 0
            ? 0
            : (int)Math.Ceiling((double)(nouveauSolde / Math.Max(0.01m, credit.Mensualite)));

        return (new EarlyRepaymentDto(
            credit.SoldeRestantDu,
            montant,
            economie,
            nouveauSolde,
            remaining.Count,
            apres), null);
    }

    public async Task<(PayInstallmentResponse? Response, string? Error)> PayNextInstallmentAsync(
        long clientId,
        long creditId,
        CancellationToken cancellationToken = default)
    {
        var credit = await db.Credits
            .Include(c => c.Echeances)
            .FirstOrDefaultAsync(c => c.IdCredit == creditId && c.IdClient == clientId, cancellationToken);
        if (credit is null)
        {
            return (null, "Crédit introuvable.");
        }

        if (credit.Statut != StatutCredit.Actif)
        {
            return (null, "Crédit non actif.");
        }

        var next = credit.Echeances.Where(e => !e.Payee).OrderBy(e => e.Numero).FirstOrDefault();
        if (next is null)
        {
            credit.Statut = StatutCredit.Solde;
            credit.SoldeRestantDu = 0;
            await db.SaveChangesAsync(cancellationToken);
            return (null, "Aucune échéance restante.");
        }

        var compte = await db.ComptesBancaires
            .Where(c => c.IdClient == clientId && c.Type == TypeCompte.Courant && c.Statut == StatutCompte.Actif)
            .OrderBy(c => c.IdCompte)
            .FirstOrDefaultAsync(cancellationToken);
        if (compte is null)
        {
            return (null, "Aucun compte courant actif pour débiter l'échéance.");
        }

        if (compte.Solde < next.MontantTotal)
        {
            return (null, $"Solde insuffisant sur {compte.Libelle} ({compte.Solde:N2} DT).");
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            compte.Solde -= next.MontantTotal;
            next.Payee = true;
            next.DatePaiementUtc = DateTime.UtcNow;
            credit.SoldeRestantDu = credit.Echeances.Where(e => !e.Payee).Sum(e => e.Capital);
            if (credit.Echeances.All(e => e.Payee))
            {
                credit.Statut = StatutCredit.Solde;
                credit.SoldeRestantDu = 0;
            }

            db.TransactionsCompte.Add(new TransactionCompte
            {
                IdCompte = compte.IdCompte,
                Reference = $"ECH-{credit.Reference}-{next.Numero}",
                Montant = next.MontantTotal,
                DateTransactionUtc = DateTime.UtcNow,
                Libelle = $"Échéance #{next.Numero} crédit {credit.Reference}",
                TypeMouvement = TypeMouvementCompte.Debit,
                Statut = StatutTransaction.Valide
            });

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }

        await notificationService.CreateInfoNotificationAsync(
            clientId,
            "Échéance payée",
            $"Échéance #{next.Numero} de {next.MontantTotal:N2} DT débitée sur votre compte courant.",
            cancellationToken);

        var detail = await GetCreditAsync(clientId, creditId, cancellationToken);
        return (new PayInstallmentResponse("Échéance payée avec succès.", detail!), null);
    }

    private async Task AcceptDemandeInternalAsync(DemandeCredit demande, CancellationToken cancellationToken)
    {
        demande.Statut = StatutDemandeCredit.Acceptee;
        demande.MotifDecision = "Acceptée automatiquement (éligibilité verte — démo).";
        demande.DateDecisionUtc = DateTime.UtcNow;

        var credit = BuildCreditFromDemande(demande);
        db.Credits.Add(credit);
        await db.SaveChangesAsync(cancellationToken);

        demande.Credit = credit;
        await notificationService.CreateInfoNotificationAsync(
            demande.IdClient,
            "Demande de crédit acceptée",
            $"Votre crédit {credit.Reference} ({FormatType(credit.TypeCredit)}) est actif. Mensualité {credit.Mensualite:N2} DT.",
            cancellationToken);
    }

    private Credit BuildCreditFromDemande(DemandeCredit demande)
    {
        var calc = Calculate(demande.TypeCredit, demande.MontantDemande, demande.DureeMois, demande.RevenuMensuel);
        var start = DateTime.UtcNow.Date;
        var credit = new Credit
        {
            IdClient = demande.IdClient,
            IdDemande = demande.IdDemande,
            Reference = $"CRD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            TypeCredit = demande.TypeCredit,
            MontantAccorde = demande.MontantDemande,
            DureeMois = demande.DureeMois,
            TauxInteret = calc.TauxAnnuel,
            Mensualite = calc.Mensualite,
            SoldeRestantDu = demande.MontantDemande,
            Statut = StatutCredit.Actif,
            DateDebutUtc = start,
            DateFinPrevueUtc = start.AddMonths(demande.DureeMois)
        };
        credit.Echeances = BuildSchedule(credit.MontantAccorde, credit.TauxInteret, credit.DureeMois, credit.Mensualite, DateOnly.FromDateTime(start));
        credit.SoldeRestantDu = credit.Echeances.Where(e => !e.Payee).Sum(e => e.Capital);
        return credit;
    }

    private static List<Echeance> BuildSchedule(
        decimal principal,
        decimal tauxAnnuel,
        int dureeMois,
        decimal mensualite,
        DateOnly startMonth)
    {
        var list = new List<Echeance>();
        var reste = principal;
        var r = tauxAnnuel / 100m / 12m;

        for (var i = 1; i <= dureeMois; i++)
        {
            var interet = Math.Round(reste * r, 2);
            var capital = Math.Round(mensualite - interet, 2);
            if (i == dureeMois || capital > reste)
            {
                capital = reste;
            }

            reste = Math.Max(0, Math.Round(reste - capital, 2));
            list.Add(new Echeance
            {
                Numero = i,
                DateEcheance = startMonth.AddMonths(i),
                Capital = capital,
                Interet = interet,
                MontantTotal = Math.Round(capital + interet, 2),
                SoldeRestantDu = reste,
                Payee = false
            });
        }

        return list;
    }

    private readonly record struct CalcResult(
        decimal TauxAnnuel,
        decimal Mensualite,
        decimal CoutTotal,
        decimal TauxEndettement,
        string Eligibilite);

    private static CalcResult Calculate(TypeCredit type, decimal montant, int dureeMois, decimal revenu)
    {
        var taux = GetAnnualRate(type);
        var r = (double)(taux / 100m / 12m);
        var p = (double)montant;
        var n = dureeMois;
        double mensualite;
        if (r <= 0)
        {
            mensualite = p / n;
        }
        else
        {
            var factor = Math.Pow(1 + r, n);
            mensualite = p * (r * factor) / (factor - 1);
        }

        var m = Math.Round((decimal)mensualite, 2);
        var cout = Math.Round(m * dureeMois, 2);
        var endettement = revenu <= 0 ? 100m : Math.Round(m / revenu * 100m, 1);
        var elig = endettement switch
        {
            <= 33m => "Vert",
            <= 45m => "Orange",
            _ => "Rouge"
        };
        return new CalcResult(taux, m, cout, endettement, elig);
    }

    private static decimal GetAnnualRate(TypeCredit type) => type switch
    {
        TypeCredit.Etudiant => 5.0m,
        TypeCredit.Automobile => 7.0m,
        TypeCredit.Immobilier => 6.0m,
        _ => 8.0m
    };

    private static bool TryParseType(string? value, out TypeCredit type)
    {
        type = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var n = value.Trim().Replace(" ", "", StringComparison.Ordinal).ToLowerInvariant();
        return n switch
        {
            "personnel" => Assign(TypeCredit.Personnel, out type),
            "immobilier" => Assign(TypeCredit.Immobilier, out type),
            "automobile" or "auto" => Assign(TypeCredit.Automobile, out type),
            "etudiant" or "étudiant" => Assign(TypeCredit.Etudiant, out type),
            _ => Enum.TryParse(value, true, out type)
        };

        static bool Assign(TypeCredit t, out TypeCredit result)
        {
            result = t;
            return true;
        }
    }

    private async Task EnsureSeedAsync(long clientId, CancellationToken cancellationToken)
    {
        var hasCredit = await db.Credits.AnyAsync(c => c.IdClient == clientId, cancellationToken);
        if (hasCredit)
        {
            return;
        }

        var start = DateTime.UtcNow.Date.AddMonths(-3);
        var credit = new Credit
        {
            IdClient = clientId,
            Reference = $"CRD-DEMO-{clientId}-001",
            TypeCredit = TypeCredit.Personnel,
            MontantAccorde = 12_000m,
            DureeMois = 24,
            TauxInteret = 8.0m,
            Mensualite = 0,
            SoldeRestantDu = 0,
            Statut = StatutCredit.Actif,
            DateDebutUtc = start,
            DateFinPrevueUtc = start.AddMonths(24)
        };
        var calc = Calculate(TypeCredit.Personnel, credit.MontantAccorde, credit.DureeMois, 2500m);
        credit.Mensualite = calc.Mensualite;
        credit.Echeances = BuildSchedule(
            credit.MontantAccorde,
            credit.TauxInteret,
            credit.DureeMois,
            credit.Mensualite,
            DateOnly.FromDateTime(start));

        // Marquer les 3 premières échéances comme payées
        foreach (var e in credit.Echeances.Where(x => x.Numero <= 3))
        {
            e.Payee = true;
            e.DatePaiementUtc = start.AddMonths(e.Numero).AddDays(2);
        }

        credit.SoldeRestantDu = credit.Echeances.Where(e => !e.Payee).Sum(e => e.Capital);

        var demandePending = new DemandeCredit
        {
            IdClient = clientId,
            TypeCredit = TypeCredit.Automobile,
            MontantDemande = 25_000m,
            DureeMois = 48,
            RevenuMensuel = 2800m,
            MensualiteEstimee = Calculate(TypeCredit.Automobile, 25_000m, 48, 2800m).Mensualite,
            CoutTotalEstime = Calculate(TypeCredit.Automobile, 25_000m, 48, 2800m).CoutTotal,
            DateDemandeUtc = DateTime.UtcNow.AddDays(-2),
            Statut = StatutDemandeCredit.EnAttente
        };

        db.Credits.Add(credit);
        db.DemandesCredit.Add(demandePending);
        await db.SaveChangesAsync(cancellationToken);

        await notificationService.CreateInfoNotificationAsync(
            clientId,
            "DigiCrédit — données de démonstration",
            "Un crédit personnel actif et une demande automobile en attente ont été préparés pour vos tests.",
            cancellationToken);
    }

    private static SimulationCreditDto ToSimulationDto(SimulationCredit s) => new(
        s.IdSimulation,
        FormatType(s.TypeCredit),
        s.Montant,
        s.DureeMois,
        s.RevenuMensuel,
        s.TauxAnnuel,
        s.MensualiteEstimee,
        s.CoutTotalEstime,
        s.TauxEndettement,
        s.NiveauEligibilite,
        s.DateSimulationUtc.ToString("o"));

    private static DemandeCreditDto ToDemandeDto(DemandeCredit d) => new(
        d.IdDemande,
        FormatType(d.TypeCredit),
        d.MontantDemande,
        d.DureeMois,
        d.RevenuMensuel,
        d.MensualiteEstimee,
        d.CoutTotalEstime,
        FormatStatutDemande(d.Statut),
        d.DateDemandeUtc.ToString("o"),
        d.MotifDecision,
        d.Credit?.IdCredit);

    private static CreditSummaryDto ToSummaryDto(Credit c)
    {
        var next = c.Echeances.Where(e => !e.Payee).OrderBy(e => e.Numero).FirstOrDefault();
        return new(
            c.IdCredit,
            c.Reference,
            FormatType(c.TypeCredit),
            c.MontantAccorde,
            c.DureeMois,
            c.TauxInteret,
            c.Mensualite,
            c.SoldeRestantDu,
            FormatStatutCredit(c.Statut),
            c.DateDebutUtc.ToString("o"),
            next?.DateEcheance.ToString("dd/MM/yyyy"),
            next?.MontantTotal);
    }

    private static CreditDetailDto ToDetailDto(Credit c)
    {
        var next = c.Echeances.Where(e => !e.Payee).OrderBy(e => e.Numero).FirstOrDefault();
        return new(
            c.IdCredit,
            c.Reference,
            FormatType(c.TypeCredit),
            c.MontantAccorde,
            c.DureeMois,
            c.TauxInteret,
            c.Mensualite,
            c.SoldeRestantDu,
            FormatStatutCredit(c.Statut),
            c.DateDebutUtc.ToString("o"),
            c.DateFinPrevueUtc?.ToString("o"),
            next?.DateEcheance.ToString("dd/MM/yyyy"),
            next?.MontantTotal,
            c.Echeances.OrderBy(e => e.Numero).Select(e => new EcheanceDto(
                e.IdEcheance,
                e.Numero,
                e.DateEcheance.ToString("dd/MM/yyyy"),
                e.Capital,
                e.Interet,
                e.MontantTotal,
                e.SoldeRestantDu,
                e.Payee)).ToList());
    }

    private static readonly Color PdfNavy = Color.FromHex("#003D7A");
    private static readonly Color PdfSky = Color.FromHex("#1565C0");
    private static readonly Color PdfSoftBg = Color.FromHex("#F5F8FC");
    private static readonly Color PdfBorder = Color.FromHex("#D7E2EF");

    private static void ComposePdfHeader(IContainer container, string title, string subtitle, Color navy, Color sky)
    {
        container.Column(col =>
        {
            col.Item().Background(navy).PaddingVertical(12).PaddingHorizontal(14).Row(row =>
            {
                row.RelativeItem().Column(brand =>
                {
                    brand.Item().Text("STB BANK").Bold().FontSize(16).FontColor(Colors.White);
                    brand.Item().Text("STB Digital Hub").FontSize(8).FontColor(Color.FromHex("#A8C5E8"));
                });
                row.ConstantItem(160).AlignRight().AlignMiddle().Column(right =>
                {
                    right.Item().AlignRight().Text("DIGICRÉDIT").FontSize(8).FontColor(Color.FromHex("#A8C5E8"));
                    right.Item().AlignRight().Text(title).SemiBold().FontSize(11).FontColor(Colors.White);
                });
            });
            col.Item().Background(sky).PaddingVertical(5).PaddingHorizontal(14)
                .Text(subtitle).FontSize(8).FontColor(Colors.White);
        });
    }

    private static void ComposePdfFooter(IContainer container, Color navy)
    {
        container.PaddingTop(8).BorderTop(1).BorderColor(PdfBorder).PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text($"Émis le {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC")
                .FontSize(8).FontColor(Colors.Grey.Darken1);
            row.RelativeItem().AlignCenter().Text("STB Digital Hub — DigiCrédit")
                .FontSize(8).FontColor(navy);
            row.RelativeItem().AlignRight().Text(text =>
            {
                text.Span("Page ").FontSize(8).FontColor(Colors.Grey.Darken1);
                text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Darken1);
                text.Span(" / ").FontSize(8).FontColor(Colors.Grey.Darken1);
                text.TotalPages().FontSize(8).FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private static void PdfStatCell(IContainer container, string label, string value, Color color)
    {
        container.PaddingRight(6).Column(col =>
        {
            col.Item().Text(label).FontSize(7).FontColor(Colors.Grey.Darken1);
            col.Item().Text(value).SemiBold().FontSize(10).FontColor(color);
        });
    }

    private static void PdfHighlightCard(IContainer container, string label, string value, Color navy, Color sky)
    {
        container.Border(1).BorderColor(PdfBorder).Background(Colors.White).Padding(10).Column(col =>
        {
            col.Item().Text(label).FontSize(7).FontColor(Colors.Grey.Darken1);
            col.Item().PaddingTop(2).Text(value).Bold().FontSize(12).FontColor(navy);
            col.Item().PaddingTop(4).LineHorizontal(2).LineColor(sky);
        });
    }

    private static void PdfTableHeader(IContainer cell, string text, Color bg, bool right = false)
    {
        var box = cell.Background(bg).PaddingVertical(6).PaddingHorizontal(4);
        var aligned = right ? box.AlignRight() : box.AlignLeft();
        aligned.Text(text).Bold().FontSize(8).FontColor(Colors.White);
    }

    private static void PdfTableCell(
        IContainer cell,
        string text,
        Color bg,
        bool right = false,
        bool bold = false,
        Color? color = null)
    {
        var box = cell.Background(bg).BorderBottom(0.5f).BorderColor(PdfBorder)
            .PaddingVertical(4).PaddingHorizontal(4);
        var aligned = right ? box.AlignRight() : box.AlignLeft();
        var style = aligned.Text(text).FontSize(8).FontColor(color ?? Colors.Grey.Darken3);
        if (bold)
        {
            style.SemiBold();
        }
    }

    private static string FormatType(TypeCredit t) => t switch
    {
        TypeCredit.Personnel => "Personnel",
        TypeCredit.Immobilier => "Immobilier",
        TypeCredit.Automobile => "Automobile",
        TypeCredit.Etudiant => "Étudiant",
        _ => t.ToString()
    };

    private static string FormatStatutDemande(StatutDemandeCredit s) => s switch
    {
        StatutDemandeCredit.EnAttente => "En attente",
        StatutDemandeCredit.Acceptee => "Acceptée",
        StatutDemandeCredit.Refusee => "Refusée",
        StatutDemandeCredit.Annulee => "Annulée",
        _ => s.ToString()
    };

    private static string FormatStatutCredit(StatutCredit s) => s switch
    {
        StatutCredit.Actif => "Actif",
        StatutCredit.Solde => "Soldé",
        StatutCredit.Suspendu => "Suspendu",
        _ => s.ToString()
    };
}
