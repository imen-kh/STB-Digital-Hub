using Microsoft.EntityFrameworkCore;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class NotificationService(
    StbDigitalHubDbContext db,
    IEmailSender emailSender,
    ILogger<NotificationService> logger)
{
    public async Task<NotificationsResponse> GetForClientAsync(
        long clientId,
        int take = 30,
        CancellationToken cancellationToken = default)
    {
        var items = await db.Notifications.AsNoTracking()
            .Where(n => n.IdClient == clientId)
            .OrderByDescending(n => n.DateCreationUtc)
            .Take(take)
            .ToListAsync(cancellationToken);

        var unread = await db.Notifications.AsNoTracking()
            .CountAsync(n => n.IdClient == clientId && !n.Lue, cancellationToken);

        return new NotificationsResponse(
            unread,
            items.Select(ToDto).ToList());
    }

    public async Task MarkAsReadAsync(long clientId, long notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.IdNotification == notificationId && n.IdClient == clientId, cancellationToken);

        if (notification is null || notification.Lue)
        {
            return;
        }

        notification.Lue = true;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(long clientId, CancellationToken cancellationToken = default)
    {
        var unread = await db.Notifications
            .Where(n => n.IdClient == clientId && !n.Lue)
            .ToListAsync(cancellationToken);

        if (unread.Count == 0)
        {
            return;
        }

        foreach (var item in unread)
        {
            item.Lue = true;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CreateRejectedTransactionNotificationAsync(
        Client client,
        CarteBancaire card,
        TransactionCarte transaction,
        string titre,
        string message,
        CancellationToken cancellationToken = default)
    {
        db.Notifications.Add(new Notification
        {
            IdClient = client.IdClient,
            IdCarte = card.IdCarte,
            IdTransaction = transaction.IdTransaction,
            Titre = titre,
            Message = $"{message} Réf. {transaction.Reference}.",
            Type = TypeNotification.Alerte,
            DateCreationUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CreateMarteAlertNotificationAsync(
        Client client,
        CarteBancaire card,
        TransactionCarte transaction,
        CancellationToken cancellationToken = default)
    {
        var phone = string.IsNullOrWhiteSpace(client.Telephone) ? "votre mobile" : client.Telephone;
        var lieu = string.IsNullOrWhiteSpace(transaction.Pays) ? "" : $" ({transaction.Pays})";
        var devisePart = transaction.MontantDevise.HasValue && !string.IsNullOrWhiteSpace(transaction.Devise) && transaction.Devise != "TND"
            ? $" / {transaction.MontantDevise:N2} {transaction.Devise}"
            : "";

        db.Notifications.Add(new Notification
        {
            IdClient = client.IdClient,
            IdCarte = card.IdCarte,
            IdTransaction = transaction.IdTransaction,
            Titre = "Alerte Marte (SMS simulé)",
            Message =
                $"SMS vers {phone} : {FormatOperation(transaction.TypeOperation)} de {transaction.Montant:N2} DT{devisePart} " +
                $"sur carte {card.NumeroMasque}{lieu}. Réf. {transaction.Reference}.",
            Type = TypeNotification.Info,
            DateCreationUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CreateTransactionNotificationsAsync(
        Client client,
        CarteBancaire card,
        TransactionCarte transaction,
        CancellationToken cancellationToken = default)
    {
        db.Notifications.Add(new Notification
        {
            IdClient = client.IdClient,
            IdCarte = card.IdCarte,
            IdTransaction = transaction.IdTransaction,
            Titre = "Nouvelle transaction",
            Message =
                $"{FormatOperation(transaction.TypeOperation)} de {transaction.Montant:N2} DT chez {transaction.Commercant} " +
                $"(carte {card.NumeroMasque}). Réf. {transaction.Reference}.",
            Type = TypeNotification.Info,
            DateCreationUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CreatePendingConfirmationNotificationAsync(
        Client client,
        CarteBancaire card,
        TransactionCarte transaction,
        string anomalyReason,
        CancellationToken cancellationToken = default)
    {
        var message =
            $"{anomalyReason} " +
            $"{FormatOperation(transaction.TypeOperation)} de {transaction.Montant:N2} DT chez {transaction.Commercant} " +
            $"(carte {card.NumeroMasque}). Réf. {transaction.Reference}. " +
            "Validez ou refusez cette transaction depuis DigiCarte avant qu'elle ne soit débitée.";

        db.Notifications.Add(new Notification
        {
            IdClient = client.IdClient,
            IdCarte = card.IdCarte,
            IdTransaction = transaction.IdTransaction,
            Titre = "Alerte sécurité — confirmation requise",
            Message = message,
            Type = TypeNotification.Alerte,
            DateCreationUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);

        try
        {
            await emailSender.SendAsync(
                client.Email,
                "STB Digital Hub — Transaction inhabituelle à confirmer",
                $"""
                <p>Bonjour {client.Prenom},</p>
                <p><strong>Alerte :</strong> une transaction inhabituelle a été détectée sur votre carte {card.NumeroMasque}.</p>
                <p>{anomalyReason}</p>
                <p>
                  Montant : <strong>{transaction.Montant:N2} DT</strong> —
                  {FormatOperation(transaction.TypeOperation)} chez {transaction.Commercant}.
                  Réf. {transaction.Reference}.
                </p>
                <p>Connectez-vous à DigiCarte pour <strong>valider</strong> ou <strong>refuser</strong> cette opération. Aucun débit n'a encore été effectué.</p>
                <p>— STB Digital Hub</p>
                """,
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Échec d'envoi de l'e-mail d'alerte pour le client {ClientId}", client.IdClient);
        }
    }

    /// <summary>
    /// Détecte une transaction inhabituelle à partir de l'historique (avant règlement).
    /// </summary>
    public async Task<string?> DetectAnomalyAsync(
        long cardId,
        decimal montant,
        TypeOperation typeOperation,
        DateTime dateTransactionUtc,
        CarteBancaire card,
        long? excludeTransactionId = null,
        CancellationToken cancellationToken = default)
    {
        var reasons = new List<string>();

        var historyQuery = db.TransactionsCarte.AsNoTracking()
            .Where(t => t.IdCarte == cardId && t.Statut == StatutTransaction.Valide);

        if (excludeTransactionId.HasValue)
        {
            historyQuery = historyQuery.Where(t => t.IdTransaction != excludeTransactionId.Value);
        }

        var history = await historyQuery
            .OrderByDescending(t => t.DateTransactionUtc)
            .Take(10)
            .ToListAsync(cancellationToken);

        var plafond = typeOperation == TypeOperation.Retrait
            ? card.PlafondRetrait
            : GetEffectivePaymentLimit(card);

        if (plafond > 0 && montant >= plafond * 0.5m)
        {
            reasons.Add($"montant élevé par rapport au plafond ({montant:N2} DT / plafond {plafond:N2} DT)");
        }

        if (history.Count >= 2)
        {
            var avg = history.Average(t => t.Montant);
            if (avg > 0 && montant >= avg * 1.8m)
            {
                reasons.Add($"montant très supérieur à votre moyenne habituelle ({avg:N2} DT)");
            }

            var last = history[0];
            var minutes = (dateTransactionUtc - last.DateTransactionUtc).TotalMinutes;
            if (minutes >= 0 && minutes <= 5 && montant + last.Montant > avg * 1.5m)
            {
                reasons.Add("plusieurs opérations rapprochées en très peu de temps");
            }
        }

        // Montant nettement au-dessus du max récent (même sans moyenne longue)
        if (history.Count >= 1)
        {
            var maxRecent = history.Max(t => t.Montant);
            if (maxRecent > 0 && montant >= maxRecent * 2m && montant >= 100m)
            {
                reasons.Add($"montant inhabituel par rapport à vos opérations récentes (max {maxRecent:N2} DT)");
            }
        }

        if (history.Count > 0 && history.All(t => t.TypeOperation != typeOperation))
        {
            reasons.Add($"nouveau type d'opération jamais utilisé sur cette carte ({FormatOperation(typeOperation)})");
        }

        if (typeOperation == TypeOperation.PaiementEnLigne
            && history.Count >= 2
            && history.Take(5).All(t => t.TypeOperation != TypeOperation.PaiementEnLigne))
        {
            reasons.Add("paiement en ligne inhabituel par rapport à vos dernières opérations");
        }

        if (reasons.Count == 0)
        {
            return null;
        }

        return "Transaction suspecte détectée : "
               + string.Join(" ; ", reasons)
               + ". Votre carte a peut-être été utilisée sans votre accord.";
    }

    public async Task CreateInfoNotificationAsync(
        long clientId,
        string titre,
        string message,
        CancellationToken cancellationToken = default)
    {
        db.Notifications.Add(new Notification
        {
            IdClient = clientId,
            Titre = titre.Length > 120 ? titre[..120] : titre,
            Message = message.Length > 500 ? message[..500] : message,
            Type = TypeNotification.Info,
            DateCreationUtc = DateTime.UtcNow
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    private static decimal GetEffectivePaymentLimit(CarteBancaire card)
    {
        if (card.PlafondTemporaire.HasValue
            && card.DateFinPlafondTemporaire.HasValue
            && card.DateFinPlafondTemporaire.Value >= DateOnly.FromDateTime(DateTime.UtcNow))
        {
            return card.PlafondTemporaire.Value;
        }

        return card.PlafondPaiement;
    }

    private static string FormatOperation(TypeOperation type) => type switch
    {
        TypeOperation.Paiement => "Paiement",
        TypeOperation.Retrait => "Retrait",
        TypeOperation.Recharge => "Recharge",
        TypeOperation.PaiementEnLigne => "Paiement en ligne",
        TypeOperation.Detaxe => "Remboursement de détaxe",
        _ => type.ToString()
    };

    private static NotificationDto ToDto(Notification n) => new(
        n.IdNotification,
        n.Titre,
        n.Message,
        n.Type == TypeNotification.Alerte ? "Alerte" : "Info",
        n.Lue,
        n.DateCreationUtc.ToString("o"),
        n.IdCarte,
        n.IdTransaction);
}
