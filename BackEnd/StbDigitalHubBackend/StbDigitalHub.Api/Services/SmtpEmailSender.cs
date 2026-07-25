using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class SmtpEmailSender(
    IOptions<SmtpOptions> smtpOptions,
    IHostEnvironment environment,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly SmtpOptions _options = smtpOptions.Value;

    public async Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.Host))
        {
            logger.LogWarning(
                "SMTP non configuré. E-mail destiné à {To} — sujet: {Subject}. Corps (dev): {Body}",
                toEmail,
                subject,
                htmlBody);
            return false;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        var password = (_options.Password ?? string.Empty).Replace(" ", string.Empty);

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_options.Host, _options.Port, SecureSocketOptions.StartTls, cancellationToken);
            await client.AuthenticateAsync(_options.UserName, password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
            logger.LogInformation("E-mail envoyé à {To}", toEmail);
            return true;
        }
        catch (Exception ex) when (ex is AuthenticationException or SmtpCommandException or SmtpProtocolException)
        {
            logger.LogError(
                ex,
                "Échec SMTP vers {To} avec le compte {User}. Vérifiez que le mot de passe d'application a été créé pour ce même compte Gmail.",
                toEmail,
                _options.UserName);

            if (environment.IsDevelopment())
            {
                logger.LogWarning(
                    "Fallback DEV — OTP non envoyé par e-mail. Destinataire={To}. Corps={Body}",
                    toEmail,
                    htmlBody);
                return false;
            }

            throw new InvalidOperationException(
                "Impossible d'envoyer l'e-mail de vérification. Configurez un mot de passe d'application Gmail valide pour Smtp:UserName.",
                ex);
        }
    }
}
