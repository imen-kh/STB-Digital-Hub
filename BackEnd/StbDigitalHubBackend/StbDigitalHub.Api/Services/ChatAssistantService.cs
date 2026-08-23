using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class ChatAssistantService(
    StbDigitalHubDbContext db,
    HomeService homeService,
    DigiCreditService digiCreditService)
{
    private static readonly string[] DefaultSuggestions =
    [
        "Quel est mon solde ?",
        "Mes dernières opérations",
        "Où en est mon épargne ?",
        "Simuler un crédit de 10 000 DT"
    ];

    public async Task<ChatReplyDto> WelcomeAsync(long clientId, CancellationToken cancellationToken = default)
    {
        var ctx = await LoadAsync(clientId, cancellationToken);
        return Reply(
            $"Bonjour {ctx.Prenom}. Posez-moi une question : solde, RIB, cartes, crédit, épargne ou dernières opérations. J’y réponds avec vos données.",
            "welcome",
            null,
            null,
            DefaultSuggestions);
    }

    public async Task<ChatReplyDto> AskAsync(
        long clientId,
        string? message,
        string? previousIntent,
        CancellationToken cancellationToken = default)
    {
        var raw = (message ?? string.Empty).Trim();
        if (raw.Length == 0)
        {
            return Reply("Posez une question, par exemple « Quel est mon solde ? » ou « Mes dernières opérations ».", "empty", null, null, DefaultSuggestions);
        }

        var text = Normalize(raw);
        var ctx = await LoadAsync(clientId, cancellationToken);
        var intent = DetectIntent(text, previousIntent);

        return intent switch
        {
            "credit-simuler" => await AnswerSimulateAsync(clientId, raw, text, ctx, cancellationToken),
            "credit" => AnswerCredit(ctx),
            "epargne-regles" => AnswerArrondi(ctx),
            "epargne" => AnswerEpargne(ctx),
            "carte" => AnswerCards(ctx),
            "operations" => AnswerOperations(ctx),
            "iban" => AnswerIban(ctx),
            "virement" => AnswerVirement(ctx),
            "profil" => AnswerProfil(),
            "alertes" => AnswerAlerts(ctx),
            "aide" => AnswerHelp(ctx),
            "welcome" => Reply($"Bonjour {ctx.Prenom}. Que voulez-vous savoir ?", "welcome", null, null, DefaultSuggestions),
            "solde" => AnswerSolde(ctx),
            _ => AnswerSnapshot(ctx, raw)
        };
    }

    private async Task<ChatContext> LoadAsync(long clientId, CancellationToken cancellationToken)
    {
        var prenom = await db.Clients.AsNoTracking()
            .Where(c => c.IdClient == clientId)
            .Select(c => c.Prenom)
            .FirstOrDefaultAsync(cancellationToken);

        var dash = await homeService.GetDashboardAsync(clientId, cancellationToken);
        var accounts = await db.ComptesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId)
            .OrderBy(c => c.Type)
            .ToListAsync(cancellationToken);
        var cards = await db.CartesBancaires.AsNoTracking()
            .Where(c => c.IdClient == clientId)
            .ToListAsync(cancellationToken);
        var credits = await db.Credits.AsNoTracking()
            .Where(c => c.IdClient == clientId && c.Statut == StatutCredit.Actif)
            .ToListAsync(cancellationToken);

        var accountIds = accounts.Select(a => a.IdCompte).ToList();
        var cardIds = cards.Select(c => c.IdCarte).ToList();

        var compteTx = accountIds.Count == 0
            ? []
            : await db.TransactionsCompte.AsNoTracking()
                .Where(t => accountIds.Contains(t.IdCompte) && t.Statut == StatutTransaction.Valide)
                .OrderByDescending(t => t.DateTransactionUtc)
                .Take(8)
                .ToListAsync(cancellationToken);

        var carteTx = cardIds.Count == 0
            ? []
            : await db.TransactionsCarte.AsNoTracking()
                .Where(t => cardIds.Contains(t.IdCarte) && t.Statut == StatutTransaction.Valide)
                .OrderByDescending(t => t.DateTransactionUtc)
                .Take(8)
                .ToListAsync(cancellationToken);

        var ops = compteTx
            .Select(t => new RecentOp(t.Libelle, t.Montant, t.DateTransactionUtc, "compte"))
            .Concat(carteTx.Select(t => new RecentOp(t.Commercant, t.Montant, t.DateTransactionUtc, "carte")))
            .OrderByDescending(o => o.Date)
            .Take(5)
            .ToList();

        return new ChatContext(
            string.IsNullOrWhiteSpace(prenom) ? "Client" : prenom.Trim(),
            dash,
            accounts,
            cards,
            credits,
            ops);
    }

    private static string DetectIntent(string text, string? previousIntent)
    {
        var scores = new Dictionary<string, int>(StringComparer.Ordinal)
        {
            ["credit-simuler"] = Score(text, 6, "simule", "simulation", "estimer un credit", "calculer un credit", "mensualite pour")
                                 + (text.Contains("credit") && ContainsAny(text, "calcul", "estimer", "combien me couterait") ? 5 : 0),
            ["credit"] = Score(text, 4, "credit", "echeance", "emprunt", "rembours", "mensualite", "taux d'endettement", "pret"),
            ["epargne-regles"] = Score(text, 6, "arrondi", "epargne intelligente", "regle d'epargne", "cagnotte auto"),
            ["epargne"] = Score(text, 4, "epargne", "livret", "objectif", "interet", "versement", "projection"),
            ["carte"] = Score(text, 4, "carte", "plafond", "ccash", "opposition", "bloqu", "paiement en ligne", "prepay"),
            ["operations"] = Score(text, 5, "operation", "historique", "mouvement", "transaction", "depense", "derniere"),
            ["iban"] = Score(text, 6, "iban", "rib", "identifiant bancaire"),
            ["virement"] = Score(text, 5, "virement", "transfer", "virer", "envoyer de l'argent", "beneficiaire"),
            ["profil"] = Score(text, 5, "profil", "mot de passe", "photo", "telephone", "email", "coordonnees"),
            ["alertes"] = Score(text, 5, "notif", "alerte", "cloche", "a confirmer"),
            ["aide"] = Score(text, 3, "aide", "help", "que peux", "quoi faire", "comment ca marche", "tes fonctions"),
            ["welcome"] = Score(text, 4, "bonjour", "salut", "hello", "bonsoir", "hey", "merci"),
            ["solde"] = Score(text, 4, "solde", "patrimoine", "compte", "combien", "argent", "disponible", "jai", "j ai")
        };

        if (text.Contains("credit"))
        {
            scores["credit"] += 2;
        }

        if (ContainsAny(text, "et l", "et le", "et la", "aussi", "plus de detail", "et mon")
            && !string.IsNullOrWhiteSpace(previousIntent)
            && previousIntent is not "inconnu" and not "empty" and not "welcome")
        {
            scores[previousIntent!] = scores.GetValueOrDefault(previousIntent!) + 8;
        }

        var best = scores.OrderByDescending(kv => kv.Value).First();
        return best.Value <= 0 ? "inconnu" : best.Key;
    }

    private async Task<ChatReplyDto> AnswerSimulateAsync(
        long clientId,
        string raw,
        string text,
        ChatContext ctx,
        CancellationToken cancellationToken)
    {
        var parsed = ExtractAmount(raw);
        var amount = parsed is >= 500 ? parsed.Value : 10_000m;
        var duree = ExtractDuration(text) ?? 36;
        var type = text.Contains("immobilier") ? "Immobilier"
            : text.Contains("auto") ? "Automobile"
            : text.Contains("etudiant") ? "Etudiant"
            : "Personnel";

        try
        {
            var sim = await digiCreditService.SimulateAsync(
                clientId,
                new SimulateCreditRequest(type, amount, duree, 3_000m),
                cancellationToken);
            return Reply(
                $"Simulation {type} de {Money(sim.Montant)} sur {sim.DureeMois} mois (revenu pris à 3 000 DT) : mensualité {Money(sim.MensualiteEstimee)}, coût total {Money(sim.CoutTotalEstime)}, taux {sim.TauxAnnuel} %, éligibilité {sim.NiveauEligibilite} (endettement {sim.TauxEndettement} %).",
                "credit-simuler",
                "/digi-credit?tab=simuler",
                "Affiner dans DigiCrédit",
                ["Mes crédits", "Comparer les durées", "Quel est mon solde ?"]);
        }
        catch (InvalidOperationException ex)
        {
            return Reply(
                $"{ex.Message} Ouvrez le simulateur pour ajuster montant, durée et revenu.",
                "credit-simuler",
                "/digi-credit?tab=simuler",
                "Ouvrir le simulateur",
                ["Mes crédits", "Mon solde"]);
        }
    }

    private static ChatReplyDto AnswerCredit(ChatContext ctx)
    {
        if (ctx.Credits.Count == 0)
        {
            return Reply(
                "Vous n’avez pas de crédit actif. Je peux estimer une mensualité : dites par exemple « Simule un crédit de 10 000 DT sur 36 mois ».",
                "credit",
                "/digi-credit?tab=simuler",
                "Simuler un crédit",
                ["Simuler un crédit de 10 000 DT", "Mon épargne", "Quel est mon solde ?"]);
        }

        var lines = ctx.Credits.Select(c =>
            $"{c.Reference} ({c.TypeCredit}) : restant {Money(c.SoldeRestantDu)}, mensualité {Money(c.Mensualite)}");
        var next = string.IsNullOrWhiteSpace(ctx.Dash.ProchaineEcheance)
            ? "Aucune échéance à venir."
            : $"Prochaine échéance le {ctx.Dash.ProchaineEcheance}"
              + (ctx.Dash.MontantProchaineEcheance is > 0 ? $" ({Money(ctx.Dash.MontantProchaineEcheance.Value)})." : ".");
        return Reply(
            string.Join(" ", lines) + " " + next,
            "credit",
            "/digi-credit?tab=credits",
            "Voir mes crédits",
            ["Simuler un crédit", "Mes dernières opérations", "Mon solde"]);
    }

    private static ChatReplyDto AnswerArrondi(ChatContext ctx)
    {
        var etat = ctx.Dash.ArrondiActif ? "activé : chaque achat carte non entier alimente le livret" : "désactivé";
        return Reply(
            $"L’arrondi des achats est {etat}.",
            "epargne-regles",
            "/digi-epargne?tab=regles",
            "Épargne intelligente",
            ["Mon épargne", "Mes cartes", "Quel est mon solde ?"]);
    }

    private static ChatReplyDto AnswerEpargne(ChatContext ctx)
    {
        var objectif = ctx.Dash.ObjectifEpargne is > 0
            ? $" Objectif {Money(ctx.Dash.ObjectifEpargne.Value)} atteint à {ctx.Dash.ProgressionObjectifPct} %."
            : " Aucun objectif n’est défini.";
        return Reply(
            $"Livret : {Money(ctx.Dash.SoldeEpargne)}.{objectif} Arrondi : {(ctx.Dash.ArrondiActif ? "actif" : "inactif")}.",
            "epargne",
            "/digi-epargne",
            "Ouvrir DigiÉpargne",
            ["Épargne intelligente", "Verser vers l'épargne", "Mes dernières opérations"]);
    }

    private static ChatReplyDto AnswerCards(ChatContext ctx)
    {
        if (ctx.Cards.Count == 0)
        {
            return Reply("Aucune carte n’est rattachée à votre espace.", "carte", "/digi-carte", "Ouvrir DigiCarte", DefaultSuggestions);
        }

        var lines = ctx.Cards.Select(c =>
            $"{c.Type} {c.NumeroMasque} : {c.Statut}, solde {Money(c.Solde)}, plafond paiement {Money(c.PlafondPaiement)}");
        var pending = ctx.Dash.TransactionsCarteEnAttente > 0
            ? $" {ctx.Dash.TransactionsCarteEnAttente} opération(s) à confirmer."
            : string.Empty;
        return Reply(
            string.Join(". ", lines) + "." + pending,
            "carte",
            "/digi-carte",
            "Gérer mes cartes",
            ["Mes dernières opérations", "Activer l'arrondi", "Mon solde"]);
    }

    private static ChatReplyDto AnswerOperations(ChatContext ctx)
    {
        if (ctx.Ops.Count == 0)
        {
            return Reply(
                "Je ne vois pas d’opération récente. Les mouvements apparaissent dans Mes comptes et DigiCarte.",
                "operations",
                "/comptes",
                "Voir Mes comptes",
                ["Quel est mon solde ?", "Mes cartes", "Mon épargne"]);
        }

        var lines = ctx.Ops.Select(o =>
            $"{o.Date.ToLocalTime():dd/MM} · {o.Label} · {Money(o.Amount)} ({o.Kind})");
        return Reply(
            "Dernières opérations : " + string.Join(" ; ", lines) + ".",
            "operations",
            "/comptes",
            "Historique des comptes",
            ["Quel est mon solde ?", "Mes cartes", "Mon épargne"]);
    }

    private static ChatReplyDto AnswerIban(ChatContext ctx)
    {
        var courant = ctx.Accounts.FirstOrDefault(a => a.Type == TypeCompte.Courant) ?? ctx.Accounts.FirstOrDefault();
        if (courant is null)
        {
            return Reply("Aucun compte n’est disponible pour afficher un RIB.", "iban", "/comptes", "Mes comptes", DefaultSuggestions);
        }

        return Reply(
            $"{courant.Libelle} : RIB {Mask(courant.Rib)}, IBAN {Mask(courant.Iban)}. Le numéro complet s’affiche dans le détail du compte.",
            "iban",
            $"/comptes/{courant.IdCompte}",
            "Ouvrir le compte",
            ["Quel est mon solde ?", "Faire un virement", "Mes cartes"]);
    }

    private static ChatReplyDto AnswerVirement(ChatContext ctx) =>
        Reply(
            $"Pour virer entre vos comptes ou verser vers l’épargne, ouvrez Mes comptes. Solde courant disponible : {Money(ctx.Dash.SoldeCourant)}.",
            "virement",
            "/comptes",
            "Ouvrir Mes comptes",
            ["Quel est mon solde ?", "Mon épargne", "Mon RIB"]);

    private static ChatReplyDto AnswerProfil() =>
        Reply(
            "Dans Mon profil vous changez photo, téléphone, e-mail et mot de passe.",
            "profil",
            "/profil",
            "Ouvrir mon profil",
            ["Quel est mon solde ?", "Mes cartes", "Aide"]);

    private static ChatReplyDto AnswerAlerts(ChatContext ctx)
    {
        if (ctx.Dash.Alertes.Count == 0)
        {
            return Reply("Aucune alerte prioritaire pour le moment.", "alertes", "/default", "Voir l'accueil", DefaultSuggestions);
        }

        var resume = string.Join(" ", ctx.Dash.Alertes.Take(3).Select(a => a.Titre + " — " + a.Message));
        return Reply(
            $"Vous avez {ctx.Dash.Alertes.Count} alerte(s). {resume}",
            "alertes",
            ctx.Dash.Alertes[0].Url,
            "Voir le détail",
            ["Quel est mon solde ?", "Mes crédits", "Mes cartes"]);
    }

    private static ChatReplyDto AnswerHelp(ChatContext ctx) =>
        Reply(
            $"Je réponds avec vos données {ctx.Prenom} : soldes, RIB, dernières opérations, cartes, crédit, épargne et alertes. Exemples : « Combien j’ai ? », « Mon IBAN », « Simule 8 000 DT sur 24 mois ».",
            "aide",
            null,
            null,
            DefaultSuggestions);

    private static ChatReplyDto AnswerSolde(ChatContext ctx)
    {
        var details = ctx.Accounts.Count == 0
            ? string.Empty
            : " " + string.Join(" ", ctx.Accounts.Select(a => $"{a.Libelle} : {Money(a.Solde)}."));
        return Reply(
            $"Patrimoine net {Money(ctx.Dash.PatrimoineNet)}.{details} Cartes prépayées {Money(ctx.Dash.SoldePrepaye)}. Crédit restant {Money(ctx.Dash.SoldeRestantCredit)}.",
            "solde",
            "/comptes",
            "Voir Mes comptes",
            ["Mes dernières opérations", "Mon épargne", "Mes crédits"]);
    }

    private static ChatReplyDto AnswerSnapshot(ChatContext ctx, string raw)
    {
        var extra = ctx.Ops.Count == 0
            ? string.Empty
            : $" Dernière opération : {ctx.Ops[0].Label} {Money(ctx.Ops[0].Amount)}.";
        return Reply(
            $"Voici votre situation : courant {Money(ctx.Dash.SoldeCourant)}, épargne {Money(ctx.Dash.SoldeEpargne)}, crédit restant {Money(ctx.Dash.SoldeRestantCredit)}.{extra} Précisez si vous parlez de solde, carte, crédit ou RIB — j’affine la réponse. (Question : « {Trim(raw, 80)} »)",
            "situation",
            "/default",
            "Voir l'accueil",
            DefaultSuggestions);
    }

    private static ChatReplyDto Reply(
        string text,
        string intent,
        string? url,
        string? action,
        IReadOnlyList<string> suggestions) =>
        new(text, intent, url, action, suggestions);

    private static int Score(string text, int weight, params string[] keys) =>
        keys.Count(k => text.Contains(k, StringComparison.Ordinal)) * weight;

    private static bool ContainsAny(string text, params string[] needles) =>
        needles.Any(n => text.Contains(n, StringComparison.Ordinal));

    private static string Normalize(string value)
    {
        var formD = value.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var compact = Regex.Replace(sb.ToString().Normalize(NormalizationForm.FormC), @"[^\p{L}\p{N}\s]", " ");
        return Regex.Replace(compact, @"\s+", " ").Trim();
    }

    private static decimal? ExtractAmount(string raw)
    {
        var match = Regex.Match(raw, @"(\d{1,3}(?:[ \u00A0]?\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)");
        if (!match.Success)
        {
            return null;
        }

        var token = match.Value.Replace(" ", "").Replace("\u00A0", "").Replace(',', '.');
        return decimal.TryParse(token, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount) && amount > 0
            ? amount
            : null;
    }

    private static int? ExtractDuration(string text)
    {
        var match = Regex.Match(text, @"(\d{1,3})\s*mois");
        return match.Success && int.TryParse(match.Groups[1].Value, out var months) ? months : null;
    }

    private static string Mask(string value)
    {
        var compact = value.Replace(" ", "");
        if (compact.Length <= 8)
        {
            return compact;
        }

        return $"{compact[..4]} **** {compact[^4..]}";
    }

    private static string Trim(string value, int max) =>
        value.Length <= max ? value : value[..max] + "…";

    private static string Money(decimal value) =>
        $"{value.ToString("N2", CultureInfo.GetCultureInfo("fr-FR"))} DT";

    private sealed record ChatContext(
        string Prenom,
        HomeDashboardDto Dash,
        List<CompteBancaire> Accounts,
        List<CarteBancaire> Cards,
        List<Credit> Credits,
        List<RecentOp> Ops);

    private sealed record RecentOp(string Label, decimal Amount, DateTime Date, string Kind);
}
