using System.Net.Http.Json;

namespace StbDigitalHub.Api.Services;

public sealed class BrevoEmailSender(
    HttpClient client,
    IConfiguration configuration,
    ILogger<BrevoEmailSender> logger) : IEmailSender
{
    public async Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["Brevo:ApiKey"];
        var fromEmail = configuration["Brevo:FromEmail"];
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
        {
            logger.LogError("Brevo:ApiKey et Brevo:FromEmail doivent être configurés.");
            return false;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
        request.Headers.Add("api-key", apiKey.Trim());
        request.Content = JsonContent.Create(new
        {
            sender = new { email = fromEmail, name = configuration["Brevo:FromName"] ?? "STB Digital Hub" },
            to = new[] { new { email = toEmail } },
            subject,
            htmlContent = htmlBody
        });

        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                // Do not log message bodies, OTPs or provider credentials.
                logger.LogWarning("Brevo a refusé l'envoi : HTTP {StatusCode}.", (int)response.StatusCode);
                return false;
            }
            logger.LogInformation("E-mail accepté par Brevo.");
            return true;
        }
        catch (HttpRequestException)
        {
            logger.LogError("Impossible de joindre l'API Brevo.");
            return false;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Délai d'attente dépassé pour l'API Brevo.");
            return false;
        }
    }
}
