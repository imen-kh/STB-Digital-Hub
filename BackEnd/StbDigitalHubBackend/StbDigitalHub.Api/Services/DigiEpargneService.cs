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

public class DigiEpargneService(
    StbDigitalHubDbContext db,
    DigiCompteService digiCompteService,
    IEmailSender emailSender,
    NotificationService notificationService,
    IOptions<AppOptions> appOptions,
    EmailLinkBuilder emailLinks)
{
    private readonly AppOptions _app = appOptions.Value;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly Color PdfNavy = Color.FromHex("#0B6E4F");
    private static readonly Color PdfSoft = Color.FromHex("#F3F8F5");
    private static readonly Color PdfBorder = Color.FromHex("#D5E6DC");

    static DigiEpargneService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<EpargneDashboardDto> GetDashboardAsync(long clientId, CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        await db.Entry(epargne).Reference(e => e.Compte).LoadAsync(cancellationToken);
        await db.Entry(epargne).Collection(e => e.Regles).LoadAsync(cancellationToken);
        await db.Entry(epargne).Collection(e => e.DemandesRetrait).LoadAsync(cancellationToken);

        var solde = epargne.Compte.Solde;
        var taux = epargne.TauxInteret;
        var p3 = ProjectSolde(solde, taux, 3, 0);
        var p12 = ProjectSolde(solde, taux, 12, 0);
        var interetsAn = Math.Round(p12 - solde, 2);
        var objectif = epargne.ObjectifEpargne;
        var pct = objectif is > 0
            ? Math.Max(0, Math.Min(100, (int)Math.Round(solde / objectif.Value * 100)))
            : 0;
        var pending = epargne.DemandesRetrait.Count(d => d.Statut == StatutRetrait.EnAttente);
        var activeRules = epargne.Regles.Count(r => r.Active);
        var next = epargne.Regles.FirstOrDefault(r => r.Active && r.TypeRegle != TypeRegleEpargne.Arrondi)
            ?? epargne.Regles.FirstOrDefault(r => r.Active);
        var nextLabel = next is null
            ? null
            : next.TypeRegle == TypeRegleEpargne.Arrondi
                ? "Arrondi automatique des achats carte"
                : $"{FormatTypeRegle(next.TypeRegle)} · {next.Valeur:N2} DT / {FormatFrequence(next.Frequence)}";

        return new EpargneDashboardDto(
            epargne.IdCompteEpargne,
            epargne.IdCompte,
            epargne.Compte.Libelle,
            MaskAccount(epargne.Compte.NumeroCompte),
            solde,
            taux,
            epargne.DateCalculInteretsUtc.ToString("o"),
            objectif,
            pct,
            p3,
            p12,
            interetsAn,
            pending,
            activeRules,
            nextLabel,
            epargne.Regles.Any(r => r.TypeRegle == TypeRegleEpargne.Arrondi && r.Active));
    }

    public async Task<IReadOnlyList<MouvementEpargneDto>> GetMouvementsAsync(
        long clientId,
        string? type,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var query = db.MouvementsEpargne.AsNoTracking()
            .Where(m => m.IdCompteEpargne == epargne.IdCompteEpargne);

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<TypeMouvementEpargne>(type, true, out var parsed))
        {
            query = query.Where(m => m.Type == parsed);
        }

        var list = await query.OrderByDescending(m => m.DateMouvementUtc).Take(100).ToListAsync(cancellationToken);
        return list.Select(ToMouvementDto).ToList();
    }

    public async Task<(EpargneDashboardDto? Dashboard, string? Error)> VerserAsync(
        long clientId,
        VersementRequest request,
        CancellationToken cancellationToken = default)
    {
        var montant = Math.Round(request.Montant, 2);
        if (montant <= 0)
        {
            return (null, "Le montant doit être supérieur à zéro.");
        }

        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var courant = await GetCourantAsync(clientId, cancellationToken);
        if (courant is null)
        {
            return (null, "Aucun compte courant actif pour le versement.");
        }

        if (courant.Solde < montant)
        {
            return (null, $"Solde insuffisant sur {courant.Libelle} ({courant.Solde:N2} DT).");
        }

        var compteEpargne = await db.ComptesBancaires.FirstAsync(c => c.IdCompte == epargne.IdCompte, cancellationToken);
        var stamp = DateTime.UtcNow;
        var motif = string.IsNullOrWhiteSpace(request.Motif) ? "Versement vers épargne" : request.Motif.Trim();
        var refBase = $"EPA-{stamp:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            courant.Solde -= montant;
            compteEpargne.Solde += montant;

            db.TransactionsCompte.Add(new TransactionCompte
            {
                IdCompte = courant.IdCompte,
                Reference = $"{refBase}-OUT",
                Montant = montant,
                DateTransactionUtc = stamp,
                Libelle = motif,
                TypeMouvement = TypeMouvementCompte.VirementSortant,
                Statut = StatutTransaction.Valide
            });
            db.TransactionsCompte.Add(new TransactionCompte
            {
                IdCompte = compteEpargne.IdCompte,
                Reference = $"{refBase}-IN",
                Montant = montant,
                DateTransactionUtc = stamp,
                Libelle = motif,
                TypeMouvement = TypeMouvementCompte.VirementEntrant,
                Statut = StatutTransaction.Valide
            });
            db.MouvementsEpargne.Add(new MouvementEpargne
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = montant,
                DateMouvementUtc = stamp,
                Type = TypeMouvementEpargne.Versement,
                Libelle = motif
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
            "Versement épargne",
            $"{montant:N2} DT ont été virés vers votre compte épargne.",
            cancellationToken);

        return (await GetDashboardAsync(clientId, cancellationToken), null);
    }

    public async Task<(EpargneActionSubmitResponse? Response, string? Error)> DemanderRetraitAsync(
        long clientId,
        RetraitRequest request,
        CancellationToken cancellationToken = default)
    {
        var montant = Math.Round(request.Montant, 2);
        if (montant <= 0)
        {
            return (null, "Le montant doit être supérieur à zéro.");
        }

        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        await db.Entry(epargne).Reference(e => e.Compte).LoadAsync(cancellationToken);
        if (montant > epargne.Compte.Solde)
        {
            return (null, $"Le montant dépasse le solde épargne ({epargne.Compte.Solde:N2} DT).");
        }

        var client = await db.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        var pendingSame = await db.PendingEpargneActions
            .Where(a => a.IdClient == clientId
                        && a.TypeAction == TypeActionEpargne.DemandeRetrait
                        && a.Statut == StatutActionEpargne.EnAttente
                        && a.DateExpirationUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);
        foreach (var old in pendingSame)
        {
            old.Statut = StatutActionEpargne.Annulee;
        }

        var minutes = Math.Max(5, _app.CardActionExpirationMinutes);
        var action = new PendingEpargneAction
        {
            Id = Guid.NewGuid(),
            IdClient = clientId,
            IdCompteEpargne = epargne.IdCompteEpargne,
            TypeAction = TypeActionEpargne.DemandeRetrait,
            Statut = StatutActionEpargne.EnAttente,
            PayloadJson = JsonSerializer.Serialize(new RetraitPayload(montant), JsonOptions),
            Titre = "Demande de retrait épargne",
            Recapitulatif = $"Retrait de {montant:N2} DT depuis {epargne.Compte.Libelle}.",
            DateCreationUtc = DateTime.UtcNow,
            DateExpirationUtc = DateTime.UtcNow.AddMinutes(minutes)
        };
        db.PendingEpargneActions.Add(action);
        await db.SaveChangesAsync(cancellationToken);

        var confirmUrl = emailLinks.EpargneConfirm(action.Id);
        var subject = "STB Digital Hub — Confirmation retrait épargne";
        var body = $"""
            <p>Bonjour {client.Prenom},</p>
            <p>Une demande de retrait épargne est <strong>en attente de confirmation</strong>.</p>
            <p>{action.Recapitulatif}</p>
            <p style="margin:24px 0;">
              <a href="{confirmUrl}"
                 style="background:#0B6E4F;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">
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

        return (new EpargneActionSubmitResponse(
            action.Id,
            message,
            minutes * 60,
            "En attente de confirmation",
            sent,
            confirmUrl), null);
    }

    public async Task<EpargneActionConfirmResult> ConfirmEmailActionAsync(
        Guid token,
        CancellationToken cancellationToken = default)
    {
        var action = await db.PendingEpargneActions
            .FirstOrDefaultAsync(a => a.Id == token, cancellationToken);
        if (action is null)
        {
            return new EpargneActionConfirmResult(false, "Cette demande de confirmation est introuvable.");
        }

        if (action.Statut == StatutActionEpargne.Confirmee)
        {
            return new EpargneActionConfirmResult(true, action.MessageResultat ?? "Cette opération a déjà été confirmée.", action.IdDemandeRetrait);
        }

        if (action.DateExpirationUtc <= DateTime.UtcNow)
        {
            action.Statut = StatutActionEpargne.Expiree;
            action.MessageResultat = "Lien expiré.";
            await db.SaveChangesAsync(cancellationToken);
            return new EpargneActionConfirmResult(false, "Le délai de confirmation est dépassé.");
        }

        if (action.Statut != StatutActionEpargne.EnAttente)
        {
            return new EpargneActionConfirmResult(false, "Cette demande n'est plus en attente de confirmation.");
        }

        var payload = JsonSerializer.Deserialize<RetraitPayload>(action.PayloadJson, JsonOptions);
        var montant = payload?.Montant ?? 0;
        if (montant <= 0 || action.IdCompteEpargne is null)
        {
            action.Statut = StatutActionEpargne.Annulee;
            await db.SaveChangesAsync(cancellationToken);
            return new EpargneActionConfirmResult(false, "Demande invalide.");
        }

        var epargne = await db.ComptesEpargne
            .Include(c => c.Compte)
            .FirstOrDefaultAsync(c => c.IdCompteEpargne == action.IdCompteEpargne && c.IdClient == action.IdClient, cancellationToken);
        if (epargne is null)
        {
            action.Statut = StatutActionEpargne.Annulee;
            await db.SaveChangesAsync(cancellationToken);
            return new EpargneActionConfirmResult(false, "Compte épargne introuvable.");
        }

        if (montant > epargne.Compte.Solde)
        {
            action.Statut = StatutActionEpargne.Annulee;
            action.MessageResultat = "Solde insuffisant.";
            await db.SaveChangesAsync(cancellationToken);
            return new EpargneActionConfirmResult(false, "Solde épargne insuffisant au moment de la confirmation.");
        }

        var demande = new DemandeRetrait
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            Montant = montant,
            DateDemandeUtc = DateTime.UtcNow,
            Statut = StatutRetrait.EnAttente
        };
        db.DemandesRetrait.Add(demande);
        await db.SaveChangesAsync(cancellationToken);

        // Décision démo : petits montants validés, gros montants laissés en attente.
        if (montant <= 3000m)
        {
            await ValiderRetraitInternalAsync(epargne, demande, cancellationToken);
        }
        else
        {
            await notificationService.CreateInfoNotificationAsync(
                action.IdClient,
                "Retrait épargne en attente",
                $"Votre demande de retrait de {montant:N2} DT est en cours d'examen (simulation).",
                cancellationToken);
        }

        action.Statut = StatutActionEpargne.Confirmee;
        action.DateConfirmationUtc = DateTime.UtcNow;
        action.IdDemandeRetrait = demande.IdDemande;
        action.MessageResultat = demande.Statut == StatutRetrait.Validee
            ? "Retrait confirmé et viré vers votre compte courant."
            : "Demande de retrait enregistrée — suivi simulé en attente.";
        await db.SaveChangesAsync(cancellationToken);

        return new EpargneActionConfirmResult(true, action.MessageResultat, demande.IdDemande);
    }

    public async Task<IReadOnlyList<DemandeRetraitDto>> GetDemandesAsync(
        long clientId,
        string? statut,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var query = db.DemandesRetrait.AsNoTracking()
            .Where(d => d.IdCompteEpargne == epargne.IdCompteEpargne);

        if (!string.IsNullOrWhiteSpace(statut) && Enum.TryParse<StatutRetrait>(statut, true, out var parsed))
        {
            query = query.Where(d => d.Statut == parsed);
        }

        var list = await query.OrderByDescending(d => d.DateDemandeUtc).ToListAsync(cancellationToken);
        return list.Select(ToDemandeDto).ToList();
    }

    public async Task<(string? Message, string? Error)> AnnulerDemandeAsync(
        long clientId,
        long demandeId,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var demande = await db.DemandesRetrait
            .FirstOrDefaultAsync(d => d.IdDemande == demandeId && d.IdCompteEpargne == epargne.IdCompteEpargne, cancellationToken);
        if (demande is null)
        {
            return (null, "Demande introuvable.");
        }

        if (demande.Statut != StatutRetrait.EnAttente)
        {
            return (null, "Seules les demandes en attente peuvent être annulées.");
        }

        demande.Statut = StatutRetrait.Annulee;
        demande.MotifDecision = "Annulée par le client.";
        demande.DateDecisionUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return ("Demande annulée.", null);
    }

    public async Task<IReadOnlyList<RegleEpargneDto>> GetReglesAsync(
        long clientId,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var list = await db.ReglesEpargne.AsNoTracking()
            .Where(r => r.IdCompteEpargne == epargne.IdCompteEpargne)
            .OrderByDescending(r => r.DateCreationUtc)
            .ToListAsync(cancellationToken);
        return list.Select(ToRegleDto).ToList();
    }

    public async Task<(RegleEpargneDto? Regle, string? Error)> UpsertRegleAsync(
        long clientId,
        UpsertRegleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryParseTypeRegle(request.TypeRegle, out var type))
        {
            return (null, "Type de règle invalide.");
        }

        if (!TryParseFrequence(request.Frequence, out var freq))
        {
            return (null, "Fréquence invalide.");
        }

        if (request.Valeur <= 0)
        {
            return (null, "La valeur doit être supérieure à zéro.");
        }

        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var existing = await db.ReglesEpargne
            .FirstOrDefaultAsync(r => r.IdCompteEpargne == epargne.IdCompteEpargne && r.TypeRegle == type, cancellationToken);

        if (existing is null)
        {
            existing = new RegleEpargneIntelligente
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                TypeRegle = type,
                DateCreationUtc = DateTime.UtcNow
            };
            db.ReglesEpargne.Add(existing);
        }

        existing.Valeur = Math.Round(request.Valeur, 2);
        existing.Frequence = freq;
        existing.Active = request.Active;
        await db.SaveChangesAsync(cancellationToken);
        return (ToRegleDto(existing), null);
    }

    public async Task<(RegleEpargneDto? Regle, string? Error)> ToggleRegleAsync(
        long clientId,
        long regleId,
        bool active,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var regle = await db.ReglesEpargne
            .FirstOrDefaultAsync(r => r.IdRegle == regleId && r.IdCompteEpargne == epargne.IdCompteEpargne, cancellationToken);
        if (regle is null)
        {
            return (null, "Règle introuvable.");
        }

        regle.Active = active;
        await db.SaveChangesAsync(cancellationToken);
        return (ToRegleDto(regle), null);
    }

    public async Task<ArrondiStatusDto> GetArrondiAsync(long clientId, CancellationToken cancellationToken = default)
    {
        var rule = await GetOrCreateArrondiRuleAsync(clientId, cancellationToken);
        return new ArrondiStatusDto(rule.Active, "Achat 18,600 DT → 19 DT, versement de 0,400 DT.");
    }

    public async Task<ArrondiStatusDto> SetArrondiAsync(
        long clientId,
        bool active,
        CancellationToken cancellationToken = default)
    {
        var rule = await GetOrCreateArrondiRuleAsync(clientId, cancellationToken);
        rule.Active = active;
        await db.SaveChangesAsync(cancellationToken);

        await notificationService.CreateInfoNotificationAsync(
            clientId,
            active ? "Arrondi automatique activé" : "Arrondi automatique désactivé",
            active
                ? "Chaque achat carte validé sera arrondi au dinar supérieur ; la différence ira sur votre épargne."
                : "Les achats carte sont traités normalement, sans versement d'arrondi.",
            cancellationToken);

        return new ArrondiStatusDto(rule.Active, "Achat 18,600 DT → 19 DT, versement de 0,400 DT.");
    }

    /// <summary>
    /// Si l'arrondi est actif, verse la différence jusqu'au dinar supérieur (ex. 18,60 → 0,40 DT).
    /// N'échoue jamais l'achat carte : solde insuffisant ou règle inactive = pas de versement.
    /// </summary>
    public async Task<decimal> ApplyRoundUpForPurchaseAsync(
        long clientId,
        decimal purchaseAmount,
        string? commercant,
        CancellationToken cancellationToken = default)
    {
        var remainder = ComputeRoundUp(purchaseAmount);
        if (remainder <= 0)
        {
            return 0;
        }

        var rule = await GetOrCreateArrondiRuleAsync(clientId, cancellationToken);
        if (!rule.Active)
        {
            return 0;
        }

        var epargne = await db.ComptesEpargne
            .FirstAsync(c => c.IdCompteEpargne == rule.IdCompteEpargne, cancellationToken);
        var courant = await GetCourantAsync(clientId, cancellationToken);
        var livret = await db.ComptesBancaires
            .FirstOrDefaultAsync(c => c.IdCompte == epargne.IdCompte, cancellationToken);
        if (courant is null || livret is null || courant.IdCompte == livret.IdCompte || courant.Solde < remainder)
        {
            return 0;
        }

        var stamp = DateTime.UtcNow;
        var merchant = string.IsNullOrWhiteSpace(commercant) ? "achat carte" : commercant.Trim();
        var motif = $"Arrondi automatique — {merchant}";
        var refBase = $"ARR-{stamp:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        courant.Solde -= remainder;
        livret.Solde += remainder;

        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = courant.IdCompte,
            Reference = $"{refBase}-OUT",
            Montant = remainder,
            DateTransactionUtc = stamp,
            Libelle = motif,
            TypeMouvement = TypeMouvementCompte.VirementSortant,
            Statut = StatutTransaction.Valide
        });
        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = livret.IdCompte,
            Reference = $"{refBase}-IN",
            Montant = remainder,
            DateTransactionUtc = stamp,
            Libelle = motif,
            TypeMouvement = TypeMouvementCompte.VirementEntrant,
            Statut = StatutTransaction.Valide
        });
        db.MouvementsEpargne.Add(new MouvementEpargne
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            Montant = remainder,
            DateMouvementUtc = stamp,
            Type = TypeMouvementEpargne.Versement,
            Libelle = motif
        });
        rule.DerniereExecutionUtc = stamp;
        await db.SaveChangesAsync(cancellationToken);

        await notificationService.CreateInfoNotificationAsync(
            clientId,
            "Arrondi épargné",
            $"{remainder:N2} DT versés sur votre épargne (achat {purchaseAmount:N2} DT chez {merchant}).",
            cancellationToken);

        return remainder;
    }

    public async Task<(EpargneDashboardDto? Dashboard, string? Error)> ExecuterRegleAsync(
        long clientId,
        long regleId,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var regle = await db.ReglesEpargne
            .FirstOrDefaultAsync(r => r.IdRegle == regleId && r.IdCompteEpargne == epargne.IdCompteEpargne, cancellationToken);
        if (regle is null)
        {
            return (null, "Règle introuvable.");
        }

        if (!regle.Active)
        {
            return (null, "Activez la règle avant de l'exécuter.");
        }

        if (regle.TypeRegle == TypeRegleEpargne.Arrondi)
        {
            return (null, "L'arrondi s'applique automatiquement à chaque achat carte validé.");
        }

        var montant = Math.Round(regle.Valeur, 2);

        var (dash, error) = await VerserAsync(
            clientId,
            new VersementRequest(montant, $"Règle intelligente — {FormatTypeRegle(regle.TypeRegle)}"),
            cancellationToken);
        if (error is not null)
        {
            return (null, error);
        }

        regle.DerniereExecutionUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return (dash, null);
    }

    public async Task<(EpargneDashboardDto? Dashboard, string? Error)> SetObjectifAsync(
        long clientId,
        ObjectifRequest request,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        if (request.Montant is < 0)
        {
            return (null, "L'objectif ne peut pas être négatif.");
        }

        epargne.ObjectifEpargne = request.Montant is null or 0 ? null : Math.Round(request.Montant.Value, 2);
        await db.SaveChangesAsync(cancellationToken);
        return (await GetDashboardAsync(clientId, cancellationToken), null);
    }

    public async Task<(EpargneDashboardDto? Dashboard, string? Error)> CrediterInteretsAsync(
        long clientId,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        await db.Entry(epargne).Reference(e => e.Compte).LoadAsync(cancellationToken);
        var compte = await db.ComptesBancaires.FirstAsync(c => c.IdCompte == epargne.IdCompte, cancellationToken);
        var interet = Math.Round(compte.Solde * (epargne.TauxInteret / 100m) / 12m, 2);
        if (interet <= 0)
        {
            return (null, "Aucun intérêt à créditer pour ce solde.");
        }

        compte.Solde += interet;
        epargne.DateCalculInteretsUtc = DateTime.UtcNow;
        db.MouvementsEpargne.Add(new MouvementEpargne
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            Montant = interet,
            DateMouvementUtc = DateTime.UtcNow,
            Type = TypeMouvementEpargne.Interet,
            Libelle = $"Intérêts crédités ({epargne.TauxInteret:N2} % / an)"
        });
        await db.SaveChangesAsync(cancellationToken);

        await notificationService.CreateInfoNotificationAsync(
            clientId,
            "Intérêts crédités",
            $"{interet:N2} DT d'intérêts ont été versés sur votre épargne.",
            cancellationToken);

        return (await GetDashboardAsync(clientId, cancellationToken), null);
    }

    public async Task<SimulateEpargneResultDto> SimulateAsync(
        long clientId,
        SimulateEpargneRequest request,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        await db.Entry(epargne).Reference(e => e.Compte).LoadAsync(cancellationToken);

        if (request.VersementMensuel < 0)
        {
            throw new InvalidOperationException("Le versement mensuel ne peut pas être négatif.");
        }

        if (request.DureeMois is < 1 or > 360)
        {
            throw new InvalidOperationException("La durée doit être entre 1 et 360 mois.");
        }

        var solde = epargne.Compte.Solde;
        var tauxMensuel = epargne.TauxInteret / 100m / 12m;
        var points = new List<SimulateEpargnePointDto>();
        var interets = 0m;
        var courant = solde;

        for (var m = 1; m <= request.DureeMois; m++)
        {
            courant += Math.Round(request.VersementMensuel, 2);
            var gain = Math.Round(courant * tauxMensuel, 2);
            interets += gain;
            courant += gain;
            if (m == request.DureeMois || m % Math.Max(1, request.DureeMois / 12) == 0 || m <= 6)
            {
                points.Add(new SimulateEpargnePointDto(m, Math.Round(courant, 2), Math.Round(interets, 2)));
            }
        }

        if (points.Count == 0 || points[^1].Mois != request.DureeMois)
        {
            points.Add(new SimulateEpargnePointDto(request.DureeMois, Math.Round(courant, 2), Math.Round(interets, 2)));
        }

        return new SimulateEpargneResultDto(
            solde,
            epargne.TauxInteret,
            Math.Round(courant, 2),
            Math.Round(interets, 2),
            points);
    }

    public async Task<(byte[]? Pdf, string? Error)> GenerateMouvementsPdfAsync(
        long clientId,
        CancellationToken cancellationToken = default)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        await db.Entry(epargne).Reference(e => e.Compte).LoadAsync(cancellationToken);
        await db.Entry(epargne).Reference(e => e.Client).LoadAsync(cancellationToken);
        var mouvements = await db.MouvementsEpargne.AsNoTracking()
            .Where(m => m.IdCompteEpargne == epargne.IdCompteEpargne)
            .OrderByDescending(m => m.DateMouvementUtc)
            .Take(80)
            .ToListAsync(cancellationToken);

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(32);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));
                page.Header().Background(PdfNavy).Padding(12).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("STB BANK").Bold().FontSize(16).FontColor(Colors.White);
                        c.Item().Text("DigiÉpargne · historique des mouvements").FontSize(9).FontColor(Color.FromHex("#C5E8D6"));
                    });
                    row.ConstantItem(140).AlignRight().AlignMiddle()
                        .Text($"{epargne.Compte.Solde:N2} DT").SemiBold().FontSize(12).FontColor(Colors.White);
                });
                page.Content().PaddingTop(16).Column(col =>
                {
                    col.Item().Text($"{epargne.Client.Prenom} {epargne.Client.Nom}").SemiBold().FontSize(12);
                    col.Item().Text($"{epargne.Compte.Libelle} · {MaskAccount(epargne.Compte.NumeroCompte)} · {epargne.TauxInteret:N2} %")
                        .FontSize(9).FontColor(Colors.Grey.Darken1);
                    col.Item().PaddingTop(12).Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(1.4f);
                            c.RelativeColumn(1.2f);
                            c.RelativeColumn(2.4f);
                            c.RelativeColumn(1.2f);
                        });
                        table.Header(h =>
                        {
                            foreach (var t in new[] { "Date", "Type", "Libellé", "Montant" })
                            {
                                h.Cell().Background(PdfNavy).Padding(5).Text(t).FontColor(Colors.White).FontSize(8).Bold();
                            }
                        });
                        var i = 0;
                        foreach (var m in mouvements)
                        {
                            var bg = i++ % 2 == 0 ? Colors.White : PdfSoft;
                            table.Cell().Background(bg).Padding(5).Text(m.DateMouvementUtc.ToString("dd/MM/yyyy")).FontSize(8);
                            table.Cell().Background(bg).Padding(5).Text(FormatTypeMouvement(m.Type)).FontSize(8);
                            table.Cell().Background(bg).Padding(5).Text(m.Libelle).FontSize(8);
                            table.Cell().Background(bg).Padding(5).AlignRight()
                                .Text($"{(m.Type == TypeMouvementEpargne.Retrait ? "-" : "+")}{m.Montant:N2} DT").FontSize(8);
                        }
                    });
                    col.Item().PaddingTop(10).Text("Document pédagogique de démonstration — non contractuel.")
                        .Italic().FontSize(8).FontColor(Colors.Grey.Darken1);
                });
                page.Footer().AlignCenter().Text($"Émis le {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC — STB Digital Hub")
                    .FontSize(8);
            });
        }).GeneratePdf();

        return (pdf, null);
    }

    private async Task ValiderRetraitInternalAsync(
        CompteEpargne epargne,
        DemandeRetrait demande,
        CancellationToken cancellationToken)
    {
        var courant = await GetCourantAsync(epargne.IdClient, cancellationToken);
        if (courant is null)
        {
            demande.Statut = StatutRetrait.Refusee;
            demande.MotifDecision = "Aucun compte courant actif.";
            demande.DateDecisionUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        var compteEpargne = await db.ComptesBancaires.FirstAsync(c => c.IdCompte == epargne.IdCompte, cancellationToken);
        var montant = demande.Montant;
        var stamp = DateTime.UtcNow;
        var refBase = $"RET-{stamp:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

        compteEpargne.Solde -= montant;
        courant.Solde += montant;
        demande.Statut = StatutRetrait.Validee;
        demande.MotifDecision = "Validée automatiquement (démonstration).";
        demande.DateDecisionUtc = stamp;

        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = compteEpargne.IdCompte,
            Reference = $"{refBase}-OUT",
            Montant = montant,
            DateTransactionUtc = stamp,
            Libelle = "Retrait épargne",
            TypeMouvement = TypeMouvementCompte.VirementSortant,
            Statut = StatutTransaction.Valide
        });
        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = courant.IdCompte,
            Reference = $"{refBase}-IN",
            Montant = montant,
            DateTransactionUtc = stamp,
            Libelle = "Retrait depuis épargne",
            TypeMouvement = TypeMouvementCompte.VirementEntrant,
            Statut = StatutTransaction.Valide
        });
        db.MouvementsEpargne.Add(new MouvementEpargne
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            Montant = montant,
            DateMouvementUtc = stamp,
            Type = TypeMouvementEpargne.Retrait,
            Libelle = "Retrait vers compte courant"
        });
        await db.SaveChangesAsync(cancellationToken);

        await notificationService.CreateInfoNotificationAsync(
            epargne.IdClient,
            "Retrait épargne validé",
            $"{montant:N2} DT ont été virés vers votre compte courant.",
            cancellationToken);
    }

    private async Task<CompteEpargne> EnsureSeedAsync(long clientId, CancellationToken cancellationToken)
    {
        await digiCompteService.GetAccountsAsync(clientId, cancellationToken: cancellationToken);

        var existing = await db.ComptesEpargne
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var compte = await db.ComptesBancaires
            .FirstOrDefaultAsync(c => c.IdClient == clientId && c.Type == TypeCompte.Epargne, cancellationToken);
        if (compte is null)
        {
            throw new InvalidOperationException("Aucun compte épargne n'est associé à ce client.");
        }

        var epargne = new CompteEpargne
        {
            IdClient = clientId,
            IdCompte = compte.IdCompte,
            TauxInteret = 4.50m,
            DateCalculInteretsUtc = DateTime.UtcNow.AddDays(-12),
            ObjectifEpargne = 25000m
        };
        db.ComptesEpargne.Add(epargne);
        await db.SaveChangesAsync(cancellationToken);

        db.MouvementsEpargne.AddRange(
            new MouvementEpargne
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = 1000m,
                DateMouvementUtc = DateTime.UtcNow.AddDays(-20),
                Type = TypeMouvementEpargne.Versement,
                Libelle = "Versement épargne"
            },
            new MouvementEpargne
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = 54.20m,
                DateMouvementUtc = DateTime.UtcNow.AddDays(-12),
                Type = TypeMouvementEpargne.Interet,
                Libelle = "Intérêts crédités (mensuel)"
            },
            new MouvementEpargne
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = 200m,
                DateMouvementUtc = DateTime.UtcNow.AddDays(-7),
                Type = TypeMouvementEpargne.Retrait,
                Libelle = "Retrait vers compte courant"
            });

        db.DemandesRetrait.AddRange(
            new DemandeRetrait
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = 200m,
                DateDemandeUtc = DateTime.UtcNow.AddDays(-7),
                Statut = StatutRetrait.Validee,
                MotifDecision = "Validée (démonstration).",
                DateDecisionUtc = DateTime.UtcNow.AddDays(-7)
            },
            new DemandeRetrait
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = 5000m,
                DateDemandeUtc = DateTime.UtcNow.AddDays(-2),
                Statut = StatutRetrait.EnAttente
            },
            new DemandeRetrait
            {
                IdCompteEpargne = epargne.IdCompteEpargne,
                Montant = 8000m,
                DateDemandeUtc = DateTime.UtcNow.AddDays(-15),
                Statut = StatutRetrait.Refusee,
                MotifDecision = "Montant supérieur au plafond pédagogique.",
                DateDecisionUtc = DateTime.UtcNow.AddDays(-14)
            });

        db.ReglesEpargne.Add(new RegleEpargneIntelligente
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            TypeRegle = TypeRegleEpargne.VirementPeriodique,
            Valeur = 200m,
            Frequence = FrequenceRegle.Mensuelle,
            Active = true,
            DateCreationUtc = DateTime.UtcNow.AddMonths(-2),
            DerniereExecutionUtc = DateTime.UtcNow.AddDays(-20)
        });
        db.ReglesEpargne.Add(new RegleEpargneIntelligente
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            TypeRegle = TypeRegleEpargne.Arrondi,
            Valeur = 1m,
            Frequence = FrequenceRegle.Mensuelle,
            Active = false,
            DateCreationUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
        await notificationService.CreateInfoNotificationAsync(
            clientId,
            "DigiÉpargne — données de démonstration",
            "Votre livret, l'historique et une règle d'épargne intelligente ont été préparés pour vos tests.",
            cancellationToken);

        return epargne;
    }

    private async Task<RegleEpargneIntelligente> GetOrCreateArrondiRuleAsync(
        long clientId,
        CancellationToken cancellationToken)
    {
        var epargne = await EnsureSeedAsync(clientId, cancellationToken);
        var rule = await db.ReglesEpargne
            .FirstOrDefaultAsync(r => r.IdCompteEpargne == epargne.IdCompteEpargne && r.TypeRegle == TypeRegleEpargne.Arrondi, cancellationToken);
        if (rule is not null)
        {
            return rule;
        }

        rule = new RegleEpargneIntelligente
        {
            IdCompteEpargne = epargne.IdCompteEpargne,
            TypeRegle = TypeRegleEpargne.Arrondi,
            Valeur = 1m,
            Frequence = FrequenceRegle.Mensuelle,
            Active = false,
            DateCreationUtc = DateTime.UtcNow
        };
        db.ReglesEpargne.Add(rule);
        await db.SaveChangesAsync(cancellationToken);
        return rule;
    }

    private static decimal ComputeRoundUp(decimal amount)
    {
        amount = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        if (amount <= 0)
        {
            return 0;
        }

        var ceiling = Math.Ceiling(amount);
        return Math.Round(ceiling - amount, 2, MidpointRounding.AwayFromZero);
    }

    private Task<CompteBancaire?> GetCourantAsync(long clientId, CancellationToken cancellationToken) =>
        db.ComptesBancaires
            .Where(c => c.IdClient == clientId && c.Type == TypeCompte.Courant && c.Statut == StatutCompte.Actif)
            .OrderBy(c => c.IdCompte)
            .FirstOrDefaultAsync(cancellationToken);

    private static decimal ProjectSolde(decimal solde, decimal tauxAnnuel, int mois, decimal versementMensuel)
    {
        var courant = solde;
        var tauxMensuel = tauxAnnuel / 100m / 12m;
        for (var i = 0; i < mois; i++)
        {
            courant += versementMensuel;
            courant += Math.Round(courant * tauxMensuel, 2);
        }

        return Math.Round(courant, 2);
    }

    private static string MaskAccount(string numero)
    {
        if (string.IsNullOrEmpty(numero) || numero.Length < 4)
        {
            return "••••";
        }

        return $"•••• {numero[^4..]}";
    }

    private static MouvementEpargneDto ToMouvementDto(MouvementEpargne m) => new(
        m.IdMouvement,
        m.Montant,
        m.DateMouvementUtc.ToString("o"),
        FormatTypeMouvement(m.Type),
        m.Libelle);

    private static DemandeRetraitDto ToDemandeDto(DemandeRetrait d) => new(
        d.IdDemande,
        d.Montant,
        d.DateDemandeUtc.ToString("o"),
        FormatStatutRetrait(d.Statut),
        d.MotifDecision);

    private static RegleEpargneDto ToRegleDto(RegleEpargneIntelligente r) => new(
        r.IdRegle,
        FormatTypeRegle(r.TypeRegle),
        r.Valeur,
        FormatFrequence(r.Frequence),
        r.Active,
        r.DerniereExecutionUtc?.ToString("o"));

    private static string FormatTypeMouvement(TypeMouvementEpargne t) => t switch
    {
        TypeMouvementEpargne.Versement => "Versement",
        TypeMouvementEpargne.Retrait => "Retrait",
        TypeMouvementEpargne.Interet => "Intérêt",
        _ => t.ToString()
    };

    private static string FormatStatutRetrait(StatutRetrait s) => s switch
    {
        StatutRetrait.EnAttente => "En attente",
        StatutRetrait.Validee => "Validée",
        StatutRetrait.Refusee => "Refusée",
        StatutRetrait.Annulee => "Annulée",
        _ => s.ToString()
    };

    private static string FormatTypeRegle(TypeRegleEpargne t) => t switch
    {
        TypeRegleEpargne.VirementPeriodique => "Virement périodique",
        TypeRegleEpargne.Arrondi => "Arrondi",
        _ => t.ToString()
    };

    private static string FormatFrequence(FrequenceRegle f) => f switch
    {
        FrequenceRegle.Hebdomadaire => "Hebdomadaire",
        FrequenceRegle.Mensuelle => "Mensuelle",
        _ => f.ToString()
    };

    private static bool TryParseTypeRegle(string? value, out TypeRegleEpargne type)
    {
        type = TypeRegleEpargne.VirementPeriodique;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        if (value.Contains("arrondi", StringComparison.OrdinalIgnoreCase))
        {
            type = TypeRegleEpargne.Arrondi;
            return true;
        }

        if (value.Contains("virement", StringComparison.OrdinalIgnoreCase) || value.Contains("period", StringComparison.OrdinalIgnoreCase))
        {
            type = TypeRegleEpargne.VirementPeriodique;
            return true;
        }

        return Enum.TryParse(value, true, out type);
    }

    private static bool TryParseFrequence(string? value, out FrequenceRegle freq)
    {
        freq = FrequenceRegle.Mensuelle;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        if (value.StartsWith("hebdo", StringComparison.OrdinalIgnoreCase))
        {
            freq = FrequenceRegle.Hebdomadaire;
            return true;
        }

        if (value.StartsWith("mens", StringComparison.OrdinalIgnoreCase))
        {
            freq = FrequenceRegle.Mensuelle;
            return true;
        }

        return Enum.TryParse(value, true, out freq);
    }
}
