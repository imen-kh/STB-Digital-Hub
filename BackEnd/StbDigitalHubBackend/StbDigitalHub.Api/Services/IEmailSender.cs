namespace StbDigitalHub.Api.Services;

public interface IEmailSender
{
    /// <returns>True when the message was accepted by the SMTP server.</returns>
    Task<bool> SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
