using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class OtpService(
    StbDigitalHubDbContext db,
    IEmailSender emailSender,
    IOptions<OtpOptions> otpOptions,
    ILogger<OtpService> logger)
{
    private readonly OtpOptions _options = otpOptions.Value;

    public async Task<(OtpChallenge Challenge, int ExpiresInSeconds, string Code, bool EmailSent)> CreateAndSendAsync(
        Client client,
        CancellationToken cancellationToken = default)
        => await CreateAndSendAsync(client, "Code de vérification STB Digital Hub", "Votre code de vérification est", cancellationToken);

    public async Task<(OtpChallenge Challenge, int ExpiresInSeconds, string Code, bool EmailSent)> CreateAndSendAsync(
        Client client,
        string subject,
        string introLine,
        CancellationToken cancellationToken = default)
    {
        var activeChallenges = await db.OtpChallenges
            .Where(o => o.IdClient == client.IdClient && o.UsedAtUtc == null && o.ExpiresAtUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var old in activeChallenges)
        {
            old.UsedAtUtc = DateTime.UtcNow;
        }

        var code = GenerateNumericCode(_options.Length);
        var salt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        var hash = HashCode(code, salt);

        var challenge = new OtpChallenge
        {
            Id = Guid.NewGuid(),
            IdClient = client.IdClient,
            CodeHash = hash,
            Salt = salt,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(_options.ExpirationMinutes),
            Tentatives = 0,
            MaxTentatives = _options.MaxTentatives
        };

        db.OtpChallenges.Add(challenge);
        await db.SaveChangesAsync(cancellationToken);

        var expiresInSeconds = _options.ExpirationMinutes * 60;
        var body = $"""
            <p>Bonjour {client.Prenom},</p>
            <p>{introLine}&nbsp;: <strong style="font-size:1.4em;letter-spacing:0.15em">{code}</strong></p>
            <p>Ce code est valable {_options.ExpirationMinutes} minutes et ne peut être utilisé qu'une seule fois.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
            <p>— STB Digital Hub</p>
            """;

        var emailSent = await emailSender.SendAsync(client.Email, subject, body, cancellationToken);
        logger.LogInformation(
            "OTP créé pour le client {ClientId}, challenge {ChallengeId}, emailSent={EmailSent}, expire à {ExpiresAt}",
            client.IdClient,
            challenge.Id,
            emailSent,
            challenge.ExpiresAtUtc);

        return (challenge, expiresInSeconds, code, emailSent);
    }

    public async Task<(bool Success, string? Error, OtpChallenge? Challenge)> VerifyAsync(
        Guid challengeId,
        string code,
        CancellationToken cancellationToken = default)
    {
        var challenge = await db.OtpChallenges
            .Include(o => o.Client)
            .FirstOrDefaultAsync(o => o.Id == challengeId, cancellationToken);

        if (challenge is null)
        {
            return (false, "Challenge OTP introuvable.", null);
        }

        if (challenge.EstUtilise)
        {
            return (false, "Ce code a déjà été utilisé.", null);
        }

        if (challenge.EstExpire)
        {
            return (false, "Ce code a expiré. Veuillez en demander un nouveau.", null);
        }

        if (challenge.Tentatives >= challenge.MaxTentatives)
        {
            challenge.UsedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return (false, "Nombre maximum de tentatives atteint. Veuillez vous reconnecter.", null);
        }

        var expected = HashCode(code.Trim(), challenge.Salt);
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expected),
                Encoding.UTF8.GetBytes(challenge.CodeHash)))
        {
            challenge.Tentatives++;
            if (challenge.Tentatives >= challenge.MaxTentatives)
            {
                challenge.UsedAtUtc = DateTime.UtcNow;
            }

            await db.SaveChangesAsync(cancellationToken);
            var remaining = Math.Max(0, challenge.MaxTentatives - challenge.Tentatives);
            return (false, $"Code incorrect. Tentatives restantes : {remaining}.", null);
        }

        challenge.UsedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return (true, null, challenge);
    }

    private static string GenerateNumericCode(int length)
    {
        var max = (int)Math.Pow(10, length);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString($"D{length}");
    }

    private static string HashCode(string code, string salt)
    {
        var bytes = Encoding.UTF8.GetBytes(salt + code);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}
