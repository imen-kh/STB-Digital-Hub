using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class DigiTransfertService(
    StbDigitalHubDbContext db,
    OtpService otpService,
    NotificationService notificationService,
    DigiCompteService digiCompteService,
    IHostEnvironment environment)
{
    public const decimal PlafondJournalier = 5_000m;
    public const decimal PlafondMensuel = 20_000m;
    private const decimal FraisFixeInter = 1m;
    private const decimal FraisTauxInter = 0.001m;
    private const decimal FraisPlafond = 15m;
    private const decimal MontantMin = 1m;
    private const decimal MontantMax = 50_000m;
    private const decimal FraisFixeIntl = 15m;
    private const decimal FraisTauxIntl = 0.0025m;
    private const decimal FraisPlafondIntl = 80m;

    private static readonly IReadOnlyDictionary<string, decimal> TauxTnd = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
    {
        ["TND"] = 1m,
        ["EUR"] = 3.370m,
        ["USD"] = 3.120m,
        ["GBP"] = 3.980m,
        ["CHF"] = 3.510m,
        ["CAD"] = 2.280m,
        ["SAR"] = 0.832m,
        ["AED"] = 0.849m,
        ["MAD"] = 0.312m
    };

    private static readonly IReadOnlyDictionary<string, string> DeviseLibelles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["EUR"] = "Euro",
        ["USD"] = "Dollar américain",
        ["GBP"] = "Livre sterling",
        ["CHF"] = "Franc suisse",
        ["CAD"] = "Dollar canadien",
        ["SAR"] = "Riyal saoudien",
        ["AED"] = "Dirham des EAU",
        ["MAD"] = "Dirham marocain"
    };

    private static readonly Color PdfNavy = Color.FromHex("#003D7A");
    private static readonly Color PdfSky = Color.FromHex("#1565C0");
    private static readonly Color PdfSoft = Color.FromHex("#F5F8FC");
    private static readonly Color PdfBorder = Color.FromHex("#E4EBF4");

    static DigiTransfertService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<TransfertOverviewDto> GetOverviewAsync(long clientId, CancellationToken cancellationToken = default)
    {
        await EnsureReadyAsync(clientId, cancellationToken);
        await PromoteOverdueAsync(clientId, cancellationToken);

        var compte = await GetCompteCourantAsync(clientId, cancellationToken)
            ?? throw new InvalidOperationException("Aucun compte courant actif n'est disponible.");

        var now = DateTime.UtcNow;
        var startDay = now.Date;
        var startMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var virements = await db.Virements.AsNoTracking()
            .Where(v => v.IdClient == clientId && v.Statut != StatutVirement.Annule && v.Statut != StatutVirement.Refuse)
            .ToListAsync(cancellationToken);

        var consommeJour = virements
            .Where(v => v.DateConfirmationOtpUtc >= startDay)
            .Sum(v => v.Montant + v.Frais);
        var consommeMois = virements
            .Where(v => v.DateConfirmationOtpUtc >= startMonth)
            .Sum(v => v.Montant + v.Frais);
        var volumeMois = virements
            .Where(v => v.DateOperationUtc >= startMonth && v.Statut is StatutVirement.Confirme or StatutVirement.EnAttente)
            .Sum(v => v.Montant);
        var virementsMois = virements.Count(v => v.DateOperationUtc >= startMonth);
        var enAttente = virements.Count(v => v.Statut == StatutVirement.EnAttente);
        var beneficiaires = await db.Beneficiaires.CountAsync(
            b => b.IdClient == clientId && b.Actif, cancellationToken);

        return new TransfertOverviewDto(
            compte.Solde,
            compte.Libelle,
            Mask(compte.NumeroCompte),
            beneficiaires,
            virementsMois,
            volumeMois,
            PlafondJournalier,
            PlafondMensuel,
            consommeJour,
            consommeMois,
            Math.Max(0, PlafondJournalier - consommeJour),
            Math.Max(0, PlafondMensuel - consommeMois),
            enAttente);
    }

    public IReadOnlyList<TauxChangeDto> GetTauxChange() =>
        TauxTnd
            .Where(kv => !kv.Key.Equals("TND", StringComparison.OrdinalIgnoreCase))
            .Select(kv => new TauxChangeDto(
                kv.Key,
                DeviseLibelles.GetValueOrDefault(kv.Key, kv.Key),
                kv.Value,
                PaysPourDevise(kv.Key)))
            .ToList();

    public async Task<(SimulationFraisDto? Result, string? Error)> SimulateAsync(
        long clientId,
        SimulateFraisRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureReadyAsync(clientId, cancellationToken);

        var type = ParseType(request.Type);
        Beneficiaire? benef = null;
        if (request.IdBeneficiaire is > 0)
        {
            benef = await db.Beneficiaires.AsNoTracking()
                .FirstOrDefaultAsync(
                    b => b.IdBeneficiaire == request.IdBeneficiaire && b.IdClient == clientId && b.Actif,
                    cancellationToken);
            if (benef is null)
            {
                return (null, "Bénéficiaire introuvable.");
            }

            type = benef.Type;
        }

        var montant = Math.Round(request.Montant, 2);
        if (montant < MontantMin || montant > MontantMax)
        {
            return (null, $"Le montant doit être compris entre {MontantMin:N0} et {MontantMax:N0}.");
        }

        var mode = ParseMode(request.ModeExecution);
        var dateProgrammee = ParseOptionalDate(request.DateProgrammee);
        var modeError = ValidateExecutionMode(mode, dateProgrammee);
        if (modeError is not null)
        {
            return (null, modeError);
        }

        if (type == TypeVirement.International)
        {
            var devise = (benef?.Devise ?? request.Devise ?? "EUR").ToUpperInvariant();
            var banque = benef?.Banque ?? request.Banque?.Trim() ?? "Banque étrangère";
            var pays = benef?.Pays ?? request.Pays?.Trim() ?? PaysPourDevise(devise);
            var iban = benef?.Iban ?? NormalizeIban(request.Iban);
            if (benef is null && !IsValidIban(iban))
            {
                return (null, "Saisissez un IBAN (15 à 34 caractères) ou choisissez un bénéficiaire international.");
            }

            if (!TauxTnd.ContainsKey(devise) || devise == "TND")
            {
                return (null, "Devise internationale non supportée. Utilisez EUR, USD, GBP, CHF, CAD, SAR, AED ou MAD.");
            }

            return (ApplyExecutionMode(BuildSimulation(type, montant, devise, banque, pays, benef?.Rib ?? "", iban), mode, dateProgrammee), null);
        }

        var banqueNat = benef?.Banque ?? request.Banque?.Trim() ?? "";
        var rib = benef?.Rib ?? NormalizeRib(request.Rib);
        if (benef is null && !IsValidRib(rib))
        {
            return (null, "Saisissez un RIB tunisien de 20 chiffres, ou choisissez un bénéficiaire national.");
        }

        if (string.IsNullOrWhiteSpace(banqueNat))
        {
            banqueNat = GuessBanque(rib);
        }

        return (ApplyExecutionMode(BuildSimulation(type, montant, "TND", banqueNat, "Tunisie", rib, null), mode, dateProgrammee), null);
    }

    public async Task<IReadOnlyList<BeneficiaireDto>> GetBeneficiairesAsync(
        long clientId,
        bool inclusInactifs = false,
        CancellationToken cancellationToken = default)
    {
        await EnsureReadyAsync(clientId, cancellationToken);

        var query = db.Beneficiaires.AsNoTracking().Where(b => b.IdClient == clientId);
        if (!inclusInactifs)
        {
            query = query.Where(b => b.Actif);
        }

        var items = await query
            .OrderByDescending(b => b.Favori)
            .ThenBy(b => b.Nom)
            .ThenBy(b => b.Prenom)
            .ToListAsync(cancellationToken);

        return items.Select(ToBeneficiaireDto).ToList();
    }

    public async Task<(BeneficiaireDto? Dto, string? Error)> CreateBeneficiaireAsync(
        long clientId,
        UpsertBeneficiaireRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureReadyAsync(clientId, cancellationToken);

        var error = ValidateBeneficiaire(request, out var type, out var rib, out var iban, out var swift, out var pays, out var devise);
        if (error is not null)
        {
            return (null, error);
        }

        var duplicate = type == TypeVirement.International
            ? await db.Beneficiaires.AnyAsync(
                b => b.IdClient == clientId && b.Actif && b.Iban == iban, cancellationToken)
            : await db.Beneficiaires.AnyAsync(
                b => b.IdClient == clientId && b.Actif && b.Rib == rib, cancellationToken);
        if (duplicate)
        {
            return (null, type == TypeVirement.International
                ? "Cet IBAN est déjà enregistré parmi vos bénéficiaires."
                : "Ce RIB est déjà enregistré parmi vos bénéficiaires.");
        }

        var entity = new Beneficiaire
        {
            IdClient = clientId,
            Type = type,
            Nom = request.Nom.Trim(),
            Prenom = request.Prenom.Trim(),
            Rib = rib,
            Iban = iban,
            Swift = swift,
            Pays = pays,
            Devise = devise,
            Banque = request.Banque.Trim(),
            Alias = TrimOrNull(request.Alias),
            Favori = request.Favori,
            Actif = true,
            DateCreationUtc = DateTime.UtcNow
        };

        db.Beneficiaires.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return (ToBeneficiaireDto(entity), null);
    }

    public async Task<(BeneficiaireDto? Dto, string? Error)> UpdateBeneficiaireAsync(
        long clientId,
        long id,
        UpdateBeneficiaireRequest request,
        CancellationToken cancellationToken = default)
    {
        var entity = await db.Beneficiaires
            .FirstOrDefaultAsync(b => b.IdBeneficiaire == id && b.IdClient == clientId, cancellationToken);
        if (entity is null)
        {
            return (null, "Bénéficiaire introuvable.");
        }

        if (string.IsNullOrWhiteSpace(request.Nom) || string.IsNullOrWhiteSpace(request.Prenom))
        {
            return (null, "Le nom et le prénom sont obligatoires.");
        }

        if (string.IsNullOrWhiteSpace(request.Banque))
        {
            return (null, "La banque est obligatoire.");
        }

        entity.Nom = request.Nom.Trim();
        entity.Prenom = request.Prenom.Trim();
        entity.Banque = request.Banque.Trim();
        entity.Alias = TrimOrNull(request.Alias);
        entity.Swift = TrimOrNull(request.Swift) ?? entity.Swift;
        entity.Pays = TrimOrNull(request.Pays) ?? entity.Pays;
        if (!string.IsNullOrWhiteSpace(request.Devise) && entity.Type == TypeVirement.International)
        {
            entity.Devise = request.Devise.Trim().ToUpperInvariant();
        }
        entity.Favori = request.Favori;
        entity.Actif = request.Actif;
        await db.SaveChangesAsync(cancellationToken);
        return (ToBeneficiaireDto(entity), null);
    }

    public async Task<(string? Message, string? Error)> DeleteBeneficiaireAsync(
        long clientId,
        long id,
        CancellationToken cancellationToken = default)
    {
        var entity = await db.Beneficiaires
            .Include(b => b.Virements)
            .FirstOrDefaultAsync(b => b.IdBeneficiaire == id && b.IdClient == clientId, cancellationToken);
        if (entity is null)
        {
            return (null, "Bénéficiaire introuvable.");
        }

        if (entity.Virements.Count > 0)
        {
            entity.Actif = false;
            entity.Favori = false;
            await db.SaveChangesAsync(cancellationToken);
            return ("Bénéficiaire désactivé (des virements y sont liés).", null);
        }

        db.Beneficiaires.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return ("Bénéficiaire supprimé.", null);
    }

    public async Task<(BeneficiaireDto? Dto, string? Error)> ToggleFavoriAsync(
        long clientId,
        long id,
        CancellationToken cancellationToken = default)
    {
        var entity = await db.Beneficiaires
            .FirstOrDefaultAsync(b => b.IdBeneficiaire == id && b.IdClient == clientId && b.Actif, cancellationToken);
        if (entity is null)
        {
            return (null, "Bénéficiaire introuvable.");
        }

        entity.Favori = !entity.Favori;
        await db.SaveChangesAsync(cancellationToken);
        return (ToBeneficiaireDto(entity), null);
    }

    public async Task<IReadOnlyList<VirementDto>> GetVirementsAsync(
        long clientId,
        string? statut,
        string? q,
        string? from,
        string? to,
        long? idBeneficiaire,
        decimal? min,
        decimal? max,
        string? type,
        CancellationToken cancellationToken = default)
    {
        await EnsureReadyAsync(clientId, cancellationToken);
        await PromoteOverdueAsync(clientId, cancellationToken);

        var query = db.Virements.AsNoTracking()
            .Include(v => v.Beneficiaire)
            .Include(v => v.CompteSource)
            .Include(v => v.Recu)
            .Where(v => v.IdClient == clientId);

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(v => v.Type == ParseType(type));
        }

        if (!string.IsNullOrWhiteSpace(statut) && TryParseStatut(statut, out var parsed))
        {
            query = query.Where(v => v.Statut == parsed);
        }

        if (idBeneficiaire is > 0)
        {
            query = query.Where(v => v.IdBeneficiaire == idBeneficiaire);
        }

        if (min is > 0)
        {
            query = query.Where(v => v.Montant >= min);
        }

        if (max is > 0)
        {
            query = query.Where(v => v.Montant <= max);
        }

        if (TryParseDate(from, out var fromDate))
        {
            query = query.Where(v => v.DateOperationUtc >= fromDate);
        }

        if (TryParseDate(to, out var toDate))
        {
            query = query.Where(v => v.DateOperationUtc < toDate.AddDays(1));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(v =>
                v.Reference.Contains(term)
                || v.Motif.Contains(term)
                || v.Beneficiaire.Nom.Contains(term)
                || v.Beneficiaire.Prenom.Contains(term)
                || (v.Beneficiaire.Alias != null && v.Beneficiaire.Alias.Contains(term)));
        }

        var items = await query
            .OrderByDescending(v => v.DateOperationUtc)
            .Take(100)
            .ToListAsync(cancellationToken);

        return items.Select(ToVirementDto).ToList();
    }

    public async Task<VirementDetailDto?> GetVirementAsync(
        long clientId,
        long id,
        CancellationToken cancellationToken = default)
    {
        await PromoteOverdueAsync(clientId, cancellationToken);

        var entity = await db.Virements.AsNoTracking()
            .Include(v => v.Beneficiaire)
            .Include(v => v.CompteSource)
            .Include(v => v.Recu)
            .FirstOrDefaultAsync(v => v.IdVirement == id && v.IdClient == clientId, cancellationToken);

        return entity is null ? null : ToDetailDto(entity);
    }

    public async Task<(InitierVirementResponse? Response, string? Error)> InitierAsync(
        long clientId,
        InitierVirementRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureReadyAsync(clientId, cancellationToken);

        var montant = Math.Round(request.Montant, 2);
        if (montant < MontantMin || montant > MontantMax)
        {
            return (null, $"Le montant doit être compris entre {MontantMin:N0} et {MontantMax:N0} DT.");
        }

        if (string.IsNullOrWhiteSpace(request.Motif))
        {
            return (null, "Le motif du virement est obligatoire.");
        }

        var mode = ParseMode(request.ModeExecution);
        var dateProgrammee = ParseOptionalDate(request.DateProgrammee);
        var modeError = ValidateExecutionMode(mode, dateProgrammee);
        if (modeError is not null)
        {
            return (null, modeError);
        }

        var compte = await GetCompteCourantAsync(clientId, cancellationToken);
        if (compte is null)
        {
            return (null, "Aucun compte courant actif n'est disponible.");
        }

        Beneficiaire? beneficiaire;
        if (request.IdBeneficiaire is > 0)
        {
            beneficiaire = await db.Beneficiaires
                .FirstOrDefaultAsync(
                    b => b.IdBeneficiaire == request.IdBeneficiaire && b.IdClient == clientId && b.Actif,
                    cancellationToken);
            if (beneficiaire is null)
            {
                return (null, "Bénéficiaire introuvable.");
            }
        }
        else if (request.NouveauBeneficiaire is not null)
        {
            if (request.EnregistrerBeneficiaire)
            {
                var (created, err) = await CreateBeneficiaireAsync(clientId, request.NouveauBeneficiaire, cancellationToken);
                if (err is not null || created is null)
                {
                    return (null, err ?? "Impossible d'enregistrer le bénéficiaire.");
                }

                beneficiaire = await db.Beneficiaires
                    .FirstAsync(b => b.IdBeneficiaire == created.Id, cancellationToken);
            }
            else
            {
                var createError = ValidateBeneficiaire(
                    request.NouveauBeneficiaire,
                    out var typeNouveau,
                    out var rib,
                    out var iban,
                    out var swift,
                    out var pays,
                    out var devise);
                if (createError is not null)
                {
                    return (null, createError);
                }

                beneficiaire = new Beneficiaire
                {
                    IdClient = clientId,
                    Type = typeNouveau,
                    Nom = request.NouveauBeneficiaire.Nom.Trim(),
                    Prenom = request.NouveauBeneficiaire.Prenom.Trim(),
                    Rib = rib,
                    Iban = iban,
                    Swift = swift,
                    Pays = pays,
                    Devise = devise,
                    Banque = request.NouveauBeneficiaire.Banque.Trim(),
                    Alias = TrimOrNull(request.NouveauBeneficiaire.Alias),
                    Actif = false,
                    DateCreationUtc = DateTime.UtcNow
                };
                db.Beneficiaires.Add(beneficiaire);
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            return (null, "Sélectionnez un bénéficiaire ou saisissez un nouveau destinataire.");
        }

        var simulation = ApplyExecutionMode(
            BuildSimulation(
                beneficiaire.Type,
                montant,
                beneficiaire.Devise,
                beneficiaire.Banque,
                beneficiaire.Pays ?? PaysPourDevise(beneficiaire.Devise),
                beneficiaire.Rib,
                beneficiaire.Iban),
            mode,
            dateProgrammee);
        var plafondError = await CheckPlafondsAsync(clientId, simulation.TotalDebite, cancellationToken);
        if (plafondError is not null)
        {
            return (null, plafondError);
        }

        if (compte.Solde < simulation.TotalDebite)
        {
            return (null, $"Solde insuffisant ({compte.Solde:N2} DT) pour débiter {simulation.TotalDebite:N2} DT.");
        }

        var client = await db.Clients.FirstAsync(c => c.IdClient == clientId, cancellationToken);
        var (challenge, expires, code, emailSent) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — Confirmation de virement",
            "Votre code de confirmation du virement est",
            cancellationToken);

        var virement = new Virement
        {
            IdClient = clientId,
            IdCompteSource = compte.IdCompte,
            IdBeneficiaire = beneficiaire.IdBeneficiaire,
            Type = beneficiaire.Type,
            ModeExecution = mode,
            Reference = BuildReference(beneficiaire.Type),
            Montant = simulation.Montant,
            MontantDevise = simulation.MontantDevise,
            Devise = simulation.Devise,
            TauxChange = simulation.TauxChange,
            Frais = simulation.Frais,
            Motif = request.Motif.Trim(),
            Pays = simulation.Pays,
            DateOperationUtc = DateTime.UtcNow,
            DateExecutionUtc = ParseOptionalDate(simulation.DateExecutionEstimee),
            Statut = StatutVirement.EnAttente,
            IntraStb = simulation.IntraStb,
            DelaiEstime = simulation.DelaiEstime,
            IdOtpChallenge = challenge.Id
        };

        db.Virements.Add(virement);
        await db.SaveChangesAsync(cancellationToken);

        await db.Entry(virement).Reference(v => v.Beneficiaire).LoadAsync(cancellationToken);
        await db.Entry(virement).Reference(v => v.CompteSource).LoadAsync(cancellationToken);

        var message = emailSent
            ? "Un code OTP a été envoyé à votre e-mail pour confirmer le virement."
            : environment.IsDevelopment()
                ? $"E-mail non envoyé (SMTP). Code DEV temporaire : {code}"
                : "Impossible d'envoyer l'e-mail OTP. Réessayez plus tard.";

        return (new InitierVirementResponse(
            virement.IdVirement,
            virement.Reference,
            challenge.Id,
            message,
            expires,
            emailSent,
            environment.IsDevelopment() && !emailSent ? code : null,
            simulation,
            ToVirementDto(virement)), null);
    }

    public async Task<(ConfirmerVirementResponse? Response, string? Error)> ConfirmerAsync(
        long clientId,
        long id,
        ConfirmerVirementRequest request,
        CancellationToken cancellationToken = default)
    {
        var virement = await db.Virements
            .Include(v => v.Beneficiaire)
            .Include(v => v.CompteSource)
            .Include(v => v.Recu)
            .FirstOrDefaultAsync(v => v.IdVirement == id && v.IdClient == clientId, cancellationToken);

        if (virement is null)
        {
            return (null, "Virement introuvable.");
        }

        if (virement.Statut != StatutVirement.EnAttente || virement.DateConfirmationOtpUtc.HasValue)
        {
            return (null, "Ce virement ne peut plus être confirmé.");
        }

        if (virement.IdOtpChallenge != request.ChallengeId)
        {
            return (null, "Challenge OTP invalide pour ce virement.");
        }

        var (ok, otpError, _) = await otpService.VerifyAsync(request.ChallengeId, request.Code, cancellationToken);
        if (!ok)
        {
            if (otpError is not null && otpError.Contains("maximum", StringComparison.OrdinalIgnoreCase))
            {
                virement.Statut = StatutVirement.Refuse;
                await db.SaveChangesAsync(cancellationToken);
            }

            return (null, otpError ?? "Code OTP invalide.");
        }

        var compte = virement.CompteSource;
        var total = virement.Montant + virement.Frais;
        var plafondError = await CheckPlafondsAsync(clientId, total, cancellationToken);
        if (plafondError is not null)
        {
            virement.Statut = StatutVirement.Refuse;
            await db.SaveChangesAsync(cancellationToken);
            return (null, plafondError);
        }

        if (compte.Statut != StatutCompte.Actif)
        {
            virement.Statut = StatutVirement.Echoue;
            await db.SaveChangesAsync(cancellationToken);
            return (null, "Le compte source n'est plus actif.");
        }

        if (compte.Solde < total)
        {
            virement.Statut = StatutVirement.Echoue;
            await db.SaveChangesAsync(cancellationToken);
            return (null, $"Solde insuffisant ({compte.Solde:N2} DT).");
        }

        var now = DateTime.UtcNow;
        var planned = ResolveExecution(virement.ModeExecution, virement.Type, virement.IntraStb, virement.DateExecutionUtc, now);
        compte.Solde -= total;
        virement.DateConfirmationOtpUtc = now;
        virement.DateExecutionUtc = planned.Date;
        virement.DelaiEstime = planned.Delai;
        virement.Statut = planned.Date.Date <= now.Date
            ? StatutVirement.Confirme
            : StatutVirement.EnAttente;

        db.TransactionsCompte.Add(new TransactionCompte
        {
            IdCompte = compte.IdCompte,
            Reference = $"{virement.Reference}-OUT",
            Montant = total,
            DateTransactionUtc = now,
            Libelle = $"{(virement.Type == TypeVirement.International ? "Virement international" : "Virement")} vers {virement.Beneficiaire.Prenom} {virement.Beneficiaire.Nom} — {virement.Motif}",
            TypeMouvement = TypeMouvementCompte.VirementSortant,
            Statut = StatutTransaction.Valide
        });

        db.RecusVirement.Add(new RecuVirement
        {
            IdVirement = virement.IdVirement,
            ReferenceVirement = virement.Reference,
            DateGenerationUtc = now
        });

        await db.SaveChangesAsync(cancellationToken);
        await db.Entry(virement).Reference(v => v.Recu).LoadAsync(cancellationToken);

        var statutLabel = FormatStatut(virement.Statut);
        await notificationService.CreateInfoNotificationAsync(
            clientId,
            virement.Statut == StatutVirement.Confirme ? "Virement confirmé" : "Virement en cours",
            $"Virement {virement.Reference} de {virement.Montant:N2} DT vers {virement.Beneficiaire.Prenom} {virement.Beneficiaire.Nom}. {FormatMode(virement.ModeExecution)} · statut : {statutLabel}.",
            cancellationToken);

        var message = virement.ModeExecution switch
        {
            ModeExecution.Instantane => "Virement confirmé. Exécution instantanée simulée à la date d'aujourd'hui.",
            ModeExecution.Programme => $"Virement programmé pour le {virement.DateExecutionUtc:dd/MM/yyyy}. Le statut passera à Confirmé à cette date (simulé).",
            _ => virement.Type == TypeVirement.International
                ? "Virement international enregistré. Le débit TND est effectué ; l'exécution standard simulée est J+2."
                : virement.IntraStb
                    ? "Virement national standard confirmé. Le reçu est disponible."
                    : "Virement interbancaire enregistré. Le débit est effectué ; le statut passera à Confirmé à la date standard estimée (simulé)."
        };

        return (new ConfirmerVirementResponse(message, ToDetailDto(virement)), null);
    }

    public async Task<(RenvoiOtpResponse? Response, string? Error)> ResendOtpAsync(
        long clientId,
        long id,
        CancellationToken cancellationToken = default)
    {
        var virement = await db.Virements
            .FirstOrDefaultAsync(v => v.IdVirement == id && v.IdClient == clientId, cancellationToken);
        if (virement is null)
        {
            return (null, "Virement introuvable.");
        }

        if (virement.Statut != StatutVirement.EnAttente || virement.DateConfirmationOtpUtc.HasValue)
        {
            return (null, "Aucun OTP n'est en attente pour ce virement.");
        }

        var client = await db.Clients.FirstAsync(c => c.IdClient == clientId, cancellationToken);
        var (challenge, expires, code, emailSent) = await otpService.CreateAndSendAsync(
            client,
            "STB Digital Hub — Nouveau code virement",
            "Votre nouveau code de confirmation du virement est",
            cancellationToken);

        virement.IdOtpChallenge = challenge.Id;
        await db.SaveChangesAsync(cancellationToken);

        var message = emailSent
            ? "Un nouveau code OTP a été envoyé."
            : environment.IsDevelopment()
                ? $"E-mail non envoyé (SMTP). Code DEV temporaire : {code}"
                : "Impossible d'envoyer l'e-mail OTP.";

        return (new RenvoiOtpResponse(
            challenge.Id,
            message,
            expires,
            emailSent,
            environment.IsDevelopment() && !emailSent ? code : null), null);
    }

    public async Task<(string? Message, string? Error)> AnnulerAsync(
        long clientId,
        long id,
        CancellationToken cancellationToken = default)
    {
        var virement = await db.Virements
            .FirstOrDefaultAsync(v => v.IdVirement == id && v.IdClient == clientId, cancellationToken);
        if (virement is null)
        {
            return (null, "Virement introuvable.");
        }

        if (virement.Statut != StatutVirement.EnAttente || virement.DateConfirmationOtpUtc.HasValue)
        {
            return (null, "Seuls les virements en attente d'OTP peuvent être annulés.");
        }

        virement.Statut = StatutVirement.Annule;
        await db.SaveChangesAsync(cancellationToken);
        return ("Virement annulé.", null);
    }

    public async Task<(byte[]? Pdf, string? Error)> GenerateRecuPdfAsync(
        long clientId,
        long id,
        CancellationToken cancellationToken = default)
    {
        await PromoteOverdueAsync(clientId, cancellationToken);

        var virement = await db.Virements.AsNoTracking()
            .Include(v => v.Beneficiaire)
            .Include(v => v.CompteSource)
            .Include(v => v.Recu)
            .Include(v => v.Client)
            .FirstOrDefaultAsync(v => v.IdVirement == id && v.IdClient == clientId, cancellationToken);

        if (virement is null)
        {
            return (null, "Virement introuvable.");
        }

        if (virement.Recu is null)
        {
            return (null, "Le reçu est disponible après confirmation OTP.");
        }

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                page.Header().Column(col =>
                {
                    col.Item().Background(PdfNavy).PaddingVertical(12).PaddingHorizontal(14).Row(row =>
                    {
                        row.RelativeItem().Column(brand =>
                        {
                            brand.Item().Text("STB BANK").Bold().FontSize(16).FontColor(Colors.White);
                            brand.Item().Text("STB Digital Hub").FontSize(8).FontColor(Color.FromHex("#A8C5E8"));
                        });
                        row.ConstantItem(180).AlignRight().AlignMiddle().Column(right =>
                        {
                            right.Item().AlignRight().Text("DIGITRANSFERT").FontSize(8).FontColor(Color.FromHex("#A8C5E8"));
                            right.Item().AlignRight().Text("Reçu de virement").SemiBold().FontSize(11).FontColor(Colors.White);
                        });
                    });
                    col.Item().Background(PdfSky).PaddingVertical(5).PaddingHorizontal(14)
                        .Text(virement.Type == TypeVirement.International
                            ? "Virement international simulé — taux STB pédagogiques"
                            : "Virement national simulé — document pédagogique")
                        .FontSize(8).FontColor(Colors.White);
                });

                page.Content().PaddingTop(18).Column(col =>
                {
                    col.Spacing(12);
                    col.Item().Background(PdfSoft).Border(1).BorderColor(PdfBorder).Padding(14).Column(info =>
                    {
                        info.Item().Text($"Référence {virement.Reference}")
                            .SemiBold().FontSize(13).FontColor(PdfNavy);
                        info.Item().PaddingTop(2).Text($"Statut : {FormatStatut(virement.Statut)}  ·  {FormatType(virement.Type)}  ·  {FormatMode(virement.ModeExecution)}  ·  {virement.DelaiEstime}")
                            .FontSize(9).FontColor(Colors.Grey.Darken2);
                        info.Item().PaddingTop(10).Row(row =>
                        {
                            PdfStat(row.RelativeItem(), "Montant",
                                virement.Type == TypeVirement.International
                                    ? $"{virement.MontantDevise:N2} {virement.Devise}"
                                    : $"{virement.Montant:N2} DT");
                            PdfStat(row.RelativeItem(),
                                virement.Type == TypeVirement.International ? "Contre-valeur" : "Frais",
                                virement.Type == TypeVirement.International
                                    ? $"{virement.Montant:N2} DT"
                                    : $"{virement.Frais:N2} DT");
                            PdfStat(row.RelativeItem(),
                                virement.Type == TypeVirement.International ? "Taux" : "Total débité",
                                virement.Type == TypeVirement.International
                                    ? $"1 {virement.Devise} = {virement.TauxChange:N3} DT"
                                    : $"{virement.Montant + virement.Frais:N2} DT");
                            PdfStat(row.RelativeItem(),
                                virement.Type == TypeVirement.International ? "Frais + total" : "Délai",
                                virement.Type == TypeVirement.International
                                    ? $"{virement.Frais:N2} + {virement.Montant + virement.Frais:N2} DT"
                                    : virement.DelaiEstime);
                        });
                    });

                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Border(1).BorderColor(PdfBorder).Padding(12).Column(left =>
                        {
                            left.Item().Text("Émetteur").FontSize(8).FontColor(Colors.Grey.Darken1);
                            left.Item().Text($"{virement.Client.Prenom} {virement.Client.Nom}")
                                .SemiBold().FontSize(12).FontColor(PdfNavy);
                            left.Item().PaddingTop(4).Text(virement.CompteSource.Libelle).FontSize(9);
                            left.Item().Text($"RIB {MaskRib(virement.CompteSource.Rib)}").FontSize(9);
                        });
                        row.ConstantItem(16);
                        row.RelativeItem().Border(1).BorderColor(PdfBorder).Padding(12).Column(right =>
                        {
                            right.Item().Text("Bénéficiaire").FontSize(8).FontColor(Colors.Grey.Darken1);
                            right.Item().Text($"{virement.Beneficiaire.Prenom} {virement.Beneficiaire.Nom}")
                                .SemiBold().FontSize(12).FontColor(PdfNavy);
                            right.Item().PaddingTop(4).Text($"{virement.Beneficiaire.Banque}{(string.IsNullOrWhiteSpace(virement.Pays) ? "" : " · " + virement.Pays)}").FontSize(9);
                            right.Item().Text(
                                virement.Type == TypeVirement.International
                                    ? $"IBAN {MaskIban(virement.Beneficiaire.Iban)}  SWIFT {virement.Beneficiaire.Swift}"
                                    : $"RIB {MaskRib(virement.Beneficiaire.Rib)}").FontSize(9);
                        });
                    });

                    col.Item().Text($"Motif : {virement.Motif}").FontSize(10);
                    col.Item().Text($"Date d'opération : {virement.DateOperationUtc:dd/MM/yyyy HH:mm} UTC").FontSize(9);
                    if (virement.DateExecutionUtc.HasValue)
                    {
                        col.Item().Text($"Date d'exécution : {virement.DateExecutionUtc:dd/MM/yyyy HH:mm} UTC").FontSize(9);
                    }

                    col.Item().PaddingTop(8).Text(
                            "Document généré par STB Digital Hub (démonstration pédagogique). Les virements et l'OTP sont simulés.")
                        .FontSize(8).FontColor(Colors.Grey.Darken1);
                });

                page.Footer().PaddingTop(8).BorderTop(1).BorderColor(PdfBorder).PaddingTop(6).Row(row =>
                {
                    row.RelativeItem().Text($"Émis le {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC")
                        .FontSize(8).FontColor(Colors.Grey.Darken1);
                    row.RelativeItem().AlignCenter().Text("STB Digital Hub — DigiTransfert")
                        .FontSize(8).FontColor(PdfNavy);
                    row.RelativeItem().AlignRight().Text(text =>
                    {
                        text.Span("Page ").FontSize(8).FontColor(Colors.Grey.Darken1);
                        text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Darken1);
                    });
                });
            });
        }).GeneratePdf();

        return (pdf, null);
    }

    private async Task EnsureReadyAsync(long clientId, CancellationToken cancellationToken)
    {
        await NormalizeLegacyTransferDataAsync(cancellationToken);
        await digiCompteService.GetAccountsAsync(clientId, cancellationToken: cancellationToken);
        await EnsureBeneficiairesSeedAsync(clientId, cancellationToken);
        await EnsureInternationalSeedAsync(clientId, cancellationToken);
    }

    private async Task NormalizeLegacyTransferDataAsync(CancellationToken cancellationToken)
    {
        await db.Beneficiaires
            .Where(b => b.Devise == "")
            .ExecuteUpdateAsync(s => s.SetProperty(b => b.Devise, "TND"), cancellationToken);
        await db.Virements
            .Where(v => v.Devise == "")
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(v => v.Devise, "TND")
                    .SetProperty(v => v.TauxChange, 1m)
                    .SetProperty(v => v.MontantDevise, v => v.Montant),
                cancellationToken);
    }

    private async Task EnsureBeneficiairesSeedAsync(long clientId, CancellationToken cancellationToken)
    {
        var exists = await db.Beneficiaires.AnyAsync(b => b.IdClient == clientId, cancellationToken);
        if (exists)
        {
            return;
        }

        db.Beneficiaires.AddRange(
            new Beneficiaire
            {
                IdClient = clientId,
                Nom = "Ben Ali",
                Prenom = "Amira",
                Rib = DemoRib("10", "001", clientId, "42"),
                Banque = "STB",
                Pays = "Tunisie",
                Devise = "TND",
                Type = TypeVirement.National,
                Alias = "Loyer",
                Favori = true,
                Actif = true,
                DateCreationUtc = DateTime.UtcNow.AddDays(-40)
            },
            new Beneficiaire
            {
                IdClient = clientId,
                Nom = "Trabelsi",
                Prenom = "Karim",
                Rib = DemoRib("14", "025", clientId, "98"),
                Banque = "BIAT",
                Pays = "Tunisie",
                Devise = "TND",
                Type = TypeVirement.National,
                Alias = "Famille",
                Favori = true,
                Actif = true,
                DateCreationUtc = DateTime.UtcNow.AddDays(-18)
            },
            new Beneficiaire
            {
                IdClient = clientId,
                Nom = "Gharbi",
                Prenom = "Sonia",
                Rib = DemoRib("20", "012", clientId, "67"),
                Banque = "BH",
                Pays = "Tunisie",
                Devise = "TND",
                Type = TypeVirement.National,
                Alias = "Scolarité",
                Favori = false,
                Actif = true,
                DateCreationUtc = DateTime.UtcNow.AddDays(-7)
            });

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureInternationalSeedAsync(long clientId, CancellationToken cancellationToken)
    {
        var exists = await db.Beneficiaires.AnyAsync(
            b => b.IdClient == clientId && b.Type == TypeVirement.International, cancellationToken);
        if (exists)
        {
            return;
        }

        db.Beneficiaires.AddRange(
            new Beneficiaire
            {
                IdClient = clientId,
                Type = TypeVirement.International,
                Nom = "Dupont",
                Prenom = "Marie",
                Rib = "",
                Iban = "FR7630006000011234567890189",
                Swift = "BNPAFRPP",
                Banque = "BNP Paribas",
                Pays = "France",
                Devise = "EUR",
                Alias = "Famille France",
                Favori = true,
                Actif = true,
                DateCreationUtc = DateTime.UtcNow.AddDays(-12)
            },
            new Beneficiaire
            {
                IdClient = clientId,
                Type = TypeVirement.International,
                Nom = "Smith",
                Prenom = "John",
                Rib = "",
                Iban = "GB29NWBK60161331926819",
                Swift = "NWBKGB2L",
                Banque = "NatWest",
                Pays = "Royaume-Uni",
                Devise = "GBP",
                Alias = "Études UK",
                Favori = false,
                Actif = true,
                DateCreationUtc = DateTime.UtcNow.AddDays(-9)
            },
            new Beneficiaire
            {
                IdClient = clientId,
                Type = TypeVirement.International,
                Nom = "Alami",
                Prenom = "Youssef",
                Rib = "",
                Iban = "AE070331234567890123456",
                Swift = "ADCBAEAA",
                Banque = "ADCB",
                Pays = "Émirats arabes unis",
                Devise = "AED",
                Alias = "Dubaï",
                Favori = true,
                Actif = true,
                DateCreationUtc = DateTime.UtcNow.AddDays(-4)
            });

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task PromoteOverdueAsync(long clientId, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var pending = await db.Virements
            .Where(v => v.IdClient == clientId
                        && v.Statut == StatutVirement.EnAttente
                        && v.DateConfirmationOtpUtc != null
                        && v.DateExecutionUtc != null
                        && v.DateExecutionUtc <= now)
            .ToListAsync(cancellationToken);

        if (pending.Count == 0)
        {
            return;
        }

        foreach (var item in pending)
        {
            item.Statut = StatutVirement.Confirme;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<string?> CheckPlafondsAsync(long clientId, decimal total, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var startDay = now.Date;
        var startMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var confirmed = await db.Virements.AsNoTracking()
            .Where(v => v.IdClient == clientId && v.DateConfirmationOtpUtc != null)
            .Select(v => new { v.DateConfirmationOtpUtc, Total = v.Montant + v.Frais })
            .ToListAsync(cancellationToken);

        var jour = confirmed.Where(v => v.DateConfirmationOtpUtc >= startDay).Sum(v => v.Total);
        var mois = confirmed.Where(v => v.DateConfirmationOtpUtc >= startMonth).Sum(v => v.Total);

        if (jour + total > PlafondJournalier)
        {
            return $"Plafond journalier dépassé ({PlafondJournalier:N0} DT). Reste {Math.Max(0, PlafondJournalier - jour):N2} DT.";
        }

        if (mois + total > PlafondMensuel)
        {
            return $"Plafond mensuel dépassé ({PlafondMensuel:N0} DT). Reste {Math.Max(0, PlafondMensuel - mois):N2} DT.";
        }

        return null;
    }

    private async Task<CompteBancaire?> GetCompteCourantAsync(long clientId, CancellationToken cancellationToken) =>
        await db.ComptesBancaires
            .Where(c => c.IdClient == clientId && c.Type == TypeCompte.Courant && c.Statut == StatutCompte.Actif)
            .OrderByDescending(c => c.Solde)
            .FirstOrDefaultAsync(cancellationToken);

    private static SimulationFraisDto BuildSimulation(
        TypeVirement type,
        decimal montantSaisi,
        string devise,
        string banque,
        string? pays,
        string rib,
        string? iban)
    {
        if (type == TypeVirement.International)
        {
            var code = devise.ToUpperInvariant();
            var taux = TauxTnd.GetValueOrDefault(code, 0m);
            var montantTnd = Math.Round(montantSaisi * taux, 2);
            var frais = Math.Min(FraisPlafondIntl, Math.Max(FraisFixeIntl, Math.Round(FraisFixeIntl + (montantTnd * FraisTauxIntl), 2)));
            return new SimulationFraisDto(
                montantTnd,
                frais,
                montantTnd + frais,
                false,
                "SWIFT / international",
                "J+2 ouvrés (simulé)",
                banque,
                "International",
                code,
                montantSaisi,
                taux,
                pays,
                "Standard",
                DateTime.UtcNow.Date.AddDays(2).ToString("yyyy-MM-dd"));
        }

        var intra = IsIntraStb(rib, banque);
        var fraisNat = intra ? 0m : Math.Min(FraisPlafond, Math.Round(FraisFixeInter + (montantSaisi * FraisTauxInter), 2));
        return new SimulationFraisDto(
            montantSaisi,
            fraisNat,
            montantSaisi + fraisNat,
            intra,
            intra ? "Intra-STB (gratuit)" : "Interbancaire national",
            intra ? "Instantané" : "J+1 ouvré (simulé)",
            banque,
            "National",
            "TND",
            montantSaisi,
            1m,
            pays ?? "Tunisie",
            "Standard",
            (intra ? DateTime.UtcNow.Date : DateTime.UtcNow.Date.AddDays(1)).ToString("yyyy-MM-dd"));
    }

    private static string? ValidateBeneficiaire(
        UpsertBeneficiaireRequest request,
        out TypeVirement type,
        out string rib,
        out string? iban,
        out string? swift,
        out string? pays,
        out string devise)
    {
        type = ParseType(request.Type);
        rib = NormalizeRib(request.Rib);
        iban = string.IsNullOrWhiteSpace(request.Iban) ? null : NormalizeIban(request.Iban);
        swift = TrimOrNull(request.Swift)?.ToUpperInvariant();
        pays = TrimOrNull(request.Pays);
        devise = string.IsNullOrWhiteSpace(request.Devise) ? (type == TypeVirement.International ? "EUR" : "TND") : request.Devise.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(request.Nom) || string.IsNullOrWhiteSpace(request.Prenom))
        {
            return "Le nom et le prénom sont obligatoires.";
        }

        if (string.IsNullOrWhiteSpace(request.Banque))
        {
            return "La banque est obligatoire.";
        }

        if (type == TypeVirement.International)
        {
            if (!IsValidIban(iban))
            {
                return "L'IBAN international doit contenir 15 à 34 caractères alphanumériques.";
            }

            if (string.IsNullOrWhiteSpace(swift) || (swift.Length != 8 && swift.Length != 11))
            {
                return "Le code SWIFT/BIC doit contenir 8 ou 11 caractères.";
            }

            if (string.IsNullOrWhiteSpace(pays))
            {
                return "Le pays du bénéficiaire est obligatoire pour un virement international.";
            }

            if (!TauxTnd.ContainsKey(devise) || devise == "TND")
            {
                return "Choisissez une devise internationale (EUR, USD, GBP, CHF, CAD, SAR, AED, MAD).";
            }

            rib = "";
            return null;
        }

        if (!IsValidRib(rib))
        {
            return "Le RIB tunisien doit contenir 20 chiffres.";
        }

        devise = "TND";
        pays = "Tunisie";
        iban = null;
        swift = null;
        return null;
    }

    private static TypeVirement ParseType(string? value) =>
        string.Equals(value, "International", StringComparison.OrdinalIgnoreCase)
            ? TypeVirement.International
            : TypeVirement.National;

    private static string FormatType(TypeVirement type) =>
        type == TypeVirement.International ? "International" : "National";

    private static ModeExecution ParseMode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return ModeExecution.Standard;
        }

        var normalized = value.Trim();
        if (normalized.StartsWith("Inst", StringComparison.OrdinalIgnoreCase))
        {
            return ModeExecution.Instantane;
        }

        if (normalized.StartsWith("Prog", StringComparison.OrdinalIgnoreCase))
        {
            return ModeExecution.Programme;
        }

        return ModeExecution.Standard;
    }

    private static string FormatMode(ModeExecution mode) => mode switch
    {
        ModeExecution.Instantane => "Instantané",
        ModeExecution.Programme => "Programmé",
        _ => "Standard"
    };

    private static DateTime? ParseOptionalDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateOnly.TryParse(value, out var dateOnly))
        {
            return DateTime.SpecifyKind(dateOnly.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        }

        return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed)
            ? parsed.Date
            : null;
    }

    private static string? ValidateExecutionMode(ModeExecution mode, DateTime? dateProgrammee)
    {
        if (mode != ModeExecution.Programme)
        {
            return null;
        }

        if (dateProgrammee is null)
        {
            return "Choisissez une date d'exécution pour un virement programmé.";
        }

        var today = DateTime.UtcNow.Date;
        var chosen = dateProgrammee.Value.Date;
        if (chosen <= today)
        {
            return "La date programmée doit être postérieure à aujourd'hui.";
        }

        if (chosen > today.AddDays(90))
        {
            return "La date programmée ne peut pas dépasser 90 jours.";
        }

        return null;
    }

    private static (DateTime Date, string Delai) ResolveExecution(
        ModeExecution mode,
        TypeVirement type,
        bool intra,
        DateTime? dateProgrammee,
        DateTime now)
    {
        var today = now.Date;
        return mode switch
        {
            ModeExecution.Instantane => (today, "Instantané — aujourd'hui"),
            ModeExecution.Programme => (
                (dateProgrammee ?? today.AddDays(1)).Date,
                $"Programmé le {(dateProgrammee ?? today.AddDays(1)):dd/MM/yyyy}"),
            _ => type == TypeVirement.International
                ? (today.AddDays(2), "Standard — J+2 ouvrés")
                : intra
                    ? (today, "Standard — aujourd'hui")
                    : (today.AddDays(1), "Standard — J+1 ouvré")
        };
    }

    private static SimulationFraisDto ApplyExecutionMode(
        SimulationFraisDto simulation,
        ModeExecution mode,
        DateTime? dateProgrammee)
    {
        var planned = ResolveExecution(
            mode,
            ParseType(simulation.TypeVirement),
            simulation.IntraStb,
            dateProgrammee,
            DateTime.UtcNow);
        return simulation with
        {
            DelaiEstime = planned.Delai,
            ModeExecution = FormatMode(mode),
            DateExecutionEstimee = planned.Date.ToString("yyyy-MM-dd")
        };
    }

    private static bool IsValidIban(string? iban)
    {
        if (string.IsNullOrWhiteSpace(iban))
        {
            return false;
        }

        return Regex.IsMatch(iban, @"^[A-Z]{2}[0-9A-Z]{13,32}$");
    }

    private static string NormalizeIban(string? iban) =>
        Regex.Replace(iban ?? string.Empty, @"\s+", "").ToUpperInvariant();

    private static string PaysPourDevise(string devise) => devise.ToUpperInvariant() switch
    {
        "EUR" => "Zone euro",
        "USD" => "États-Unis",
        "GBP" => "Royaume-Uni",
        "CHF" => "Suisse",
        "CAD" => "Canada",
        "SAR" => "Arabie saoudite",
        "AED" => "Émirats arabes unis",
        "MAD" => "Maroc",
        _ => "Étranger"
    };

    private static bool IsValidRib(string rib) => Regex.IsMatch(rib, @"^\d{20}$");

    private static string NormalizeRib(string? rib) =>
        Regex.Replace(rib ?? string.Empty, @"\D", "");

    private static bool IsIntraStb(string rib, string banque) =>
        rib.StartsWith("10", StringComparison.Ordinal)
        || banque.Contains("STB", StringComparison.OrdinalIgnoreCase);

    private static string GuessBanque(string rib) => rib.StartsWith("10", StringComparison.Ordinal) ? "STB" : "Autre banque";

    private static string DemoRib(string banque, string agence, long clientId, string cle)
        => banque + agence + clientId.ToString().PadLeft(13, '0') + cle;

    private static string BuildReference(TypeVirement type) =>
        $"{(type == TypeVirement.International ? "SWIFT" : "VIR")}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}";

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string Mask(string value) =>
        value.Length <= 4 ? value : $"{new string('•', Math.Max(0, value.Length - 4))}{value[^4..]}";

    private static string MaskIban(string? iban)
    {
        if (string.IsNullOrWhiteSpace(iban) || iban.Length <= 8)
        {
            return iban ?? "";
        }

        return $"{iban[..4]} •••• {iban[^4..]}";
    }

    private static string MaskRib(string? rib)
    {
        if (string.IsNullOrWhiteSpace(rib) || rib.Length <= 6)
        {
            return rib ?? "";
        }

        return $"{rib[..4]} •••• {rib[^4..]}";
    }

    private static bool TryParseStatut(string value, out StatutVirement statut)
    {
        statut = StatutVirement.EnAttente;
        var normalized = value.Trim().Replace("é", "e", StringComparison.OrdinalIgnoreCase);
        return normalized.ToLowerInvariant() switch
        {
            "enattente" or "en attente" => Assign(StatutVirement.EnAttente, out statut),
            "confirme" or "confirmé" => Assign(StatutVirement.Confirme, out statut),
            "refuse" or "refusé" => Assign(StatutVirement.Refuse, out statut),
            "echoue" or "échoué" => Assign(StatutVirement.Echoue, out statut),
            "annule" or "annulé" => Assign(StatutVirement.Annule, out statut),
            _ => Enum.TryParse(value, true, out statut)
        };

        static bool Assign(StatutVirement value, out StatutVirement statut)
        {
            statut = value;
            return true;
        }
    }

    private static bool TryParseDate(string? value, out DateTime date)
    {
        date = default;
        return !string.IsNullOrWhiteSpace(value)
               && DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out date);
    }

    private static string FormatStatut(StatutVirement statut) => statut switch
    {
        StatutVirement.EnAttente => "En attente",
        StatutVirement.Confirme => "Confirmé",
        StatutVirement.Refuse => "Refusé",
        StatutVirement.Echoue => "Échoué",
        StatutVirement.Annule => "Annulé",
        _ => statut.ToString()
    };

    private static BeneficiaireDto ToBeneficiaireDto(Beneficiaire b) =>
        new(
            b.IdBeneficiaire,
            b.Nom,
            b.Prenom,
            $"{b.Prenom} {b.Nom}".Trim(),
            FormatType(b.Type),
            MaskRib(b.Rib),
            b.Rib,
            b.Iban,
            MaskIban(b.Iban),
            b.Swift,
            b.Pays,
            b.Devise,
            b.Banque,
            b.Alias,
            b.Actif,
            b.Favori,
            b.Type == TypeVirement.National && IsIntraStb(b.Rib, b.Banque),
            b.DateCreationUtc.ToString("o"));

    private static VirementDto ToVirementDto(Virement v) =>
        new(
            v.IdVirement,
            v.Reference,
            FormatType(v.Type),
            v.Montant,
            v.MontantDevise,
            v.Devise,
            v.TauxChange,
            v.Frais,
            v.Montant + v.Frais,
            v.Motif,
            FormatStatut(v.Statut),
            v.DateOperationUtc.ToString("o"),
            v.DateExecutionUtc?.ToString("o"),
            v.IntraStb,
            v.DelaiEstime,
            FormatMode(v.ModeExecution),
            $"{v.Beneficiaire.Prenom} {v.Beneficiaire.Nom}".Trim(),
            v.Type == TypeVirement.International ? MaskIban(v.Beneficiaire.Iban) : MaskRib(v.Beneficiaire.Rib),
            v.Beneficiaire.Banque,
            v.Pays ?? v.Beneficiaire.Pays,
            v.CompteSource.Libelle,
            v.Recu is not null,
            v.Statut == StatutVirement.EnAttente && !v.DateConfirmationOtpUtc.HasValue);

    private static VirementDetailDto ToDetailDto(Virement v)
    {
        var dto = ToVirementDto(v);
        var etapes = new List<VirementEtapeDto>
        {
            new("Ordre créé", v.DateOperationUtc.ToString("o"), true, false),
            new(
                "OTP validé",
                v.DateConfirmationOtpUtc?.ToString("o") ?? "",
                v.DateConfirmationOtpUtc.HasValue,
                v.Statut == StatutVirement.EnAttente && !v.DateConfirmationOtpUtc.HasValue),
            new(
                v.ModeExecution == ModeExecution.Programme
                    ? "Exécution programmée"
                    : v.ModeExecution == ModeExecution.Instantane
                        ? "Exécution instantanée"
                        : v.Type == TypeVirement.International
                            ? "Compensation SWIFT"
                            : v.IntraStb ? "Exécution intra-STB" : "Compensation interbancaire",
                v.DateExecutionUtc?.ToString("o") ?? "",
                v.Statut == StatutVirement.Confirme,
                v.Statut == StatutVirement.EnAttente && v.DateConfirmationOtpUtc.HasValue),
            new(
                FormatStatut(v.Statut),
                v.Statut is StatutVirement.Confirme or StatutVirement.Annule or StatutVirement.Refuse or StatutVirement.Echoue
                    ? (v.DateExecutionUtc ?? v.DateOperationUtc).ToString("o")
                    : "",
                v.Statut is not StatutVirement.EnAttente,
                v.Statut is not StatutVirement.EnAttente)
        };

        return new VirementDetailDto(
            dto.Id,
            dto.Reference,
            dto.Type,
            dto.Montant,
            dto.MontantDevise,
            dto.Devise,
            dto.TauxChange,
            dto.Frais,
            dto.TotalDebite,
            dto.Motif,
            dto.Statut,
            dto.DateOperation,
            dto.DateExecution,
            dto.IntraStb,
            dto.DelaiEstime,
            dto.ModeExecution,
            dto.BeneficiaireNom,
            dto.BeneficiaireCompteMasque,
            dto.Banque,
            dto.Pays,
            dto.CompteSource,
            dto.RecuDisponible,
            dto.OtpEnAttente,
            etapes);
    }

    private static void PdfStat(IContainer container, string label, string value)
    {
        container.Column(col =>
        {
            col.Item().Text(label).FontSize(8).FontColor(Colors.Grey.Darken1);
            col.Item().Text(value).SemiBold().FontSize(11).FontColor(PdfNavy);
        });
    }
}
