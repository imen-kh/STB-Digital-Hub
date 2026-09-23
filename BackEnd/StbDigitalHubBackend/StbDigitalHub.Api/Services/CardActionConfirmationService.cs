using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

/// <summary>
/// Confirmation DigiCarte par e-mail (lien unique, à usage unique, durée limitée).
/// </summary>
public class CardActionConfirmationService(
    StbDigitalHubDbContext db,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    EmailLinkBuilder emailLinks,
    ILogger<CardActionConfirmationService> logger)
{
    private readonly AppOptions _app = appOptions.Value;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<(CardActionSubmitResponse? Response, string? Error)> CreateAndNotifyAsync(
        long clientId,
        long cardId,
        TypeActionCarte typeAction,
        object payload,
        string titre,
        string recapitulatif,
        long? transactionId = null,
        CancellationToken cancellationToken = default)
    {
        var client = await db.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        var card = await db.CartesBancaires.FirstOrDefaultAsync(
            c => c.IdCarte == cardId && c.IdClient == clientId, cancellationToken);

        if (client is null || card is null)
        {
            return (null, "Carte introuvable.");
        }

        // Invalider les demandes actives du même type pour la même carte
        var pendingSame = await db.PendingCardActions
            .Where(a => a.IdClient == clientId
                        && a.IdCarte == cardId
                        && a.TypeAction == typeAction
                        && a.Statut == StatutActionCarte.EnAttente
                        && a.DateExpirationUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var old in pendingSame)
        {
            old.Statut = StatutActionCarte.Annulee;
        }

        var minutes = Math.Max(5, _app.CardActionExpirationMinutes);
        var action = new PendingCardAction
        {
            Id = Guid.NewGuid(),
            IdClient = clientId,
            IdCarte = cardId,
            IdTransaction = transactionId,
            TypeAction = typeAction,
            Statut = StatutActionCarte.EnAttente,
            PayloadJson = JsonSerializer.Serialize(payload, JsonOptions),
            Titre = titre,
            Recapitulatif = recapitulatif,
            DateCreationUtc = DateTime.UtcNow,
            DateExpirationUtc = DateTime.UtcNow.AddMinutes(minutes)
        };

        db.PendingCardActions.Add(action);
        await db.SaveChangesAsync(cancellationToken);

        var confirmUrl = emailLinks.CardDecisionUrl(action.Id, cardId);
        var subject = $"STB Digital Hub — Confirmation : {titre}";
        var buttonBlock = $"""
            <p>Ouvrez le lien ci-dessous, puis choisissez <strong>Confirmer</strong> ou <strong>Annuler</strong>. Après le traitement, vous revenez sur DigiCarte.</p>
            <p style="margin:24px 0;">
              <a href="{confirmUrl}"
                 style="background:#003d7a;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                Confirmer ou annuler
              </a>
            </p>
            <p>Lien : <a href="{confirmUrl}">{confirmUrl}</a></p>
            """;
        var body = $"""
            <p>Bonjour {client.Prenom},</p>
            <p>Une opération sensible est <strong>en attente de confirmation</strong> sur votre carte {card.NumeroMasque}.</p>
            <p><strong>{titre}</strong></p>
            <p>{recapitulatif}</p>
            {buttonBlock}
            <p>Ce lien est valable {minutes} minutes et ne peut être utilisé qu'une seule fois.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
            <p>— STB Digital Hub</p>
            """;

        var sent = await emailSender.SendAsync(client.Email, subject, body, cancellationToken);
        logger.LogInformation(
            "Action carte {ActionId} type {Type} créée pour client {ClientId}, emailSent={Sent}",
            action.Id, typeAction, clientId, sent);

        // En DEV (SMTP souvent non configuré), on renvoie toujours le lien pour pouvoir tester.
        var message = sent
            ? "Un e-mail de confirmation vous a été envoyé."
            : "Un e-mail de confirmation n'a pas pu être envoyé. Utilisez le bouton de confirmation ci-dessous.";

        return (new CardActionSubmitResponse(
            action.Id,
            message,
            minutes * 60,
            "En attente de confirmation",
            sent,
            confirmUrl), null);
    }

    public async Task<PendingCardAction?> GetActiveAsync(Guid token, CancellationToken cancellationToken = default)
    {
        return await db.PendingCardActions
            .Include(a => a.Client)
            .Include(a => a.Carte)
            .FirstOrDefaultAsync(a => a.Id == token, cancellationToken);
    }

    public T? DeserializePayload<T>(PendingCardAction action) =>
        JsonSerializer.Deserialize<T>(action.PayloadJson, JsonOptions);

    public async Task MarkConfirmedAsync(PendingCardAction action, string resultMessage, CancellationToken cancellationToken = default)
    {
        action.Statut = StatutActionCarte.Confirmee;
        action.DateConfirmationUtc = DateTime.UtcNow;
        action.MessageResultat = resultMessage;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkExpiredOrInvalidAsync(PendingCardAction action, string message, CancellationToken cancellationToken = default)
    {
        if (action.Statut == StatutActionCarte.EnAttente)
        {
            action.Statut = action.DateExpirationUtc <= DateTime.UtcNow
                ? StatutActionCarte.Expiree
                : StatutActionCarte.Annulee;
        }

        action.MessageResultat = message;
        await db.SaveChangesAsync(cancellationToken);
    }

    public static string BuildDecisionHtml(
        string title,
        string summary,
        string confirmAction,
        string cancelAction,
        string returnUrl)
    {
        var safeTitle = WebUtility.HtmlEncode(title);
        var safeSummary = WebUtility.HtmlEncode(summary);
        var safeReturn = WebUtility.HtmlEncode(returnUrl);
        var confirmWithReturn = string.IsNullOrWhiteSpace(returnUrl)
            ? confirmAction
            : $"{confirmAction}?return={Uri.EscapeDataString(returnUrl)}";
        var cancelWithReturn = string.IsNullOrWhiteSpace(returnUrl)
            ? cancelAction
            : $"{cancelAction}?return={Uri.EscapeDataString(returnUrl)}";
        var safeConfirm = WebUtility.HtmlEncode(confirmWithReturn);
        var safeCancel = WebUtility.HtmlEncode(cancelWithReturn);
        return $$"""
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1"/>
              <title>Confirmer ou annuler — STB Digital Hub</title>
              <style>
                body { font-family: Segoe UI, Arial, sans-serif; background:#f4f6f9; margin:0; padding:32px; color:#1a1a1a; }
                .card { max-width:560px; margin:40px auto; background:#fff; border-radius:12px; padding:28px; box-shadow:0 8px 24px rgba(0,0,0,.08); }
                h1 { font-size:22px; margin:0 0 8px; }
                p { line-height:1.5; color:#444; }
                .recap { background:#f0f4fa; border-radius:8px; padding:14px; margin:16px 0; }
                .actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:20px; }
                button { border:0; border-radius:6px; padding:12px 18px; font-weight:700; cursor:pointer; }
                .confirm { background:#003d7a; color:#fff; }
                .cancel { background:#fff; color:#a61b1b; border:1px solid #a61b1b; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>{{safeTitle}}</h1>
                <p>Choisissez de confirmer ou d'annuler cette opération. Vous serez ensuite renvoyé vers DigiCarte.</p>
                <div class="recap">{{safeSummary}}</div>
                <div class="actions">
                  <form method="post" action="{{safeConfirm}}">
                    <input type="hidden" name="returnUrl" value="{{safeReturn}}"/>
                    <button class="confirm" type="submit">Confirmer l'opération</button>
                  </form>
                  <form method="post" action="{{safeCancel}}">
                    <input type="hidden" name="returnUrl" value="{{safeReturn}}"/>
                    <button class="cancel" type="submit">Annuler l'opération</button>
                  </form>
                </div>
              </div>
            </body>
            </html>
            """;
    }

    public static string BuildResultHtml(bool success, string title, string message, string? extraHtml, string frontendUrl)
    {
        var color = success ? "#0d6e3f" : "#a61b1b";
        var badge = success ? "Opération confirmée" : "Échec";
        var extraBlock = string.IsNullOrWhiteSpace(extraHtml)
            ? ""
            : $"<div class=\"extra\">{WebUtility.HtmlEncode(extraHtml)}</div>";
        var hasFront = EmailLinkBuilder.IsPublicUrl(frontendUrl);
        var safeFront = hasFront ? WebUtility.HtmlEncode(frontendUrl) : "";
        var autoRedirect = hasFront && string.IsNullOrWhiteSpace(extraHtml);
        var redirectMeta = autoRedirect
            ? $"<meta http-equiv=\"refresh\" content=\"0;url={safeFront}\"/>"
            : "";
        var redirectScript = autoRedirect
            ? $"<script>window.location.replace({System.Text.Json.JsonSerializer.Serialize(frontendUrl)});</script>"
            : "";
        var linkOrHint = hasFront
            ? $"<a class=\"btn\" href=\"{safeFront}\">Retour à DigiCarte</a>"
            : "<p>Vous pouvez fermer cet onglet et revenir à l’application.</p>";
        return $$"""
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1"/>
              {{redirectMeta}}
              <title>{{WebUtility.HtmlEncode(title)}} — STB Digital Hub</title>
              <style>
                body { font-family: Segoe UI, Arial, sans-serif; background:#f4f6f9; margin:0; padding:32px; color:#1a1a1a; }
                .card { max-width:560px; margin:40px auto; background:#fff; border-radius:12px; padding:28px; box-shadow:0 8px 24px rgba(0,0,0,.08); }
                .badge { display:inline-block; background:{{color}}; color:#fff; padding:6px 12px; border-radius:999px; font-size:13px; }
                h1 { font-size:22px; margin:16px 0 8px; }
                p { line-height:1.5; color:#444; }
                .extra { background:#f0f4fa; border-radius:8px; padding:14px; margin-top:16px; font-family:Consolas,monospace; letter-spacing:.08em; }
                a.btn { display:inline-block; margin-top:20px; background:#003d7a; color:#fff; text-decoration:none; padding:10px 16px; border-radius:6px; }
              </style>
            </head>
            <body>
              {{redirectScript}}
              <div class="card">
                <span class="badge">{{badge}}</span>
                <h1>{{WebUtility.HtmlEncode(title)}}</h1>
                <p>{{WebUtility.HtmlEncode(message)}}</p>
                {{extraBlock}}
                {{linkOrHint}}
              </div>
            </body>
            </html>
            """;
    }
}
