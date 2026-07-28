using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class AuthService(
    StbDigitalHubDbContext db,
    IPasswordHasher<Client> passwordHasher,
    OtpService otpService,
    JwtTokenService jwtTokenService,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    IHostEnvironment environment)
{
    private readonly AppOptions _appOptions = appOptions.Value;
    private static readonly Regex TelephoneRegex = new(@"^\+?[0-9\s\-()]{8,20}$", RegexOptions.Compiled);

    public async Task<(RegisterResponse? Response, string? Error)> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return (null, "La confirmation du mot de passe ne correspond pas.");
        }

        if (!IsStrongPassword(request.Password))
        {
            return (null, "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.");
        }

        var telephone = request.Telephone.Trim();
        if (!TelephoneRegex.IsMatch(telephone))
        {
            return (null, "Le numéro de téléphone est invalide.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var exists = await db.Clients.AnyAsync(c => c.Email == email, cancellationToken);
        if (exists)
        {
            return (null, "Un compte existe déjà avec cette adresse e-mail.");
        }

        var client = new Client
        {
            Prenom = request.FirstName.Trim(),
            Nom = request.LastName.Trim(),
            Email = email,
            Telephone = telephone,
            Statut = ClientStatut.EnAttente,
            EmailConfirme = false,
            Actif = true,
            DateCreationUtc = DateTime.UtcNow
        };

        client.MotDePasseHash = passwordHasher.HashPassword(client, request.Password);
        db.Clients.Add(client);
        await db.SaveChangesAsync(cancellationToken);

        return (new RegisterResponse(
            client.IdClient,
            client.Email,
            "Compte créé avec succès. Votre compte est en attente d'activation. Connectez-vous pour recevoir un code de vérification par e-mail.",
            client.Statut.ToString()), null);
    }

    public async Task<(LoginChallengeResponse? Response, string? Error)> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Email == email, cancellationToken);

        const string invalidCredentials = "E-mail ou mot de passe incorrect.";

        if (client is null || !client.Actif || client.Statut == ClientStatut.Suspendu)
        {
            return (null, invalidCredentials);
        }

        var result = passwordHasher.VerifyHashedPassword(client, client.MotDePasseHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return (null, invalidCredentials);
        }

        var (challenge, expiresInSeconds, code, emailSent) = await otpService.CreateAndSendAsync(client, cancellationToken);
        return (BuildChallengeResponse(client, challenge.Id, expiresInSeconds, code, emailSent, isResend: false), null);
    }

    public async Task<(AuthSessionResponse? Response, string? Error)> VerifyOtpAsync(
        VerifyOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        var (success, error, challenge) = await otpService.VerifyAsync(request.ChallengeId, request.Code, cancellationToken);
        if (!success || challenge is null)
        {
            return (null, error ?? "Code OTP invalide.");
        }

        var client = challenge.Client;
        if (!client.Actif || client.Statut == ClientStatut.Suspendu)
        {
            return (null, "Ce compte n'est pas autorisé à se connecter.");
        }

        if (!client.EmailConfirme || client.Statut == ClientStatut.EnAttente)
        {
            client.EmailConfirme = true;
            client.Statut = ClientStatut.Actif;
        }

        client.DateDerniereConnexionUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var token = jwtTokenService.CreateToken(client);
        return (ToSessionResponse(client, token), null);
    }

    public async Task<(LoginChallengeResponse? Response, string? Error)> ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        var previous = await db.OtpChallenges
            .Include(o => o.Client)
            .FirstOrDefaultAsync(o => o.Id == request.ChallengeId, cancellationToken);

        if (previous is null)
        {
            return (null, "Challenge OTP introuvable.");
        }

        var client = previous.Client;
        if (!client.Actif || client.Statut == ClientStatut.Suspendu)
        {
            return (null, "Ce compte n'est pas autorisé à se connecter.");
        }

        if (!previous.EstUtilise)
        {
            previous.UsedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        var (challenge, expiresInSeconds, code, emailSent) = await otpService.CreateAndSendAsync(client, cancellationToken);
        return (BuildChallengeResponse(client, challenge.Id, expiresInSeconds, code, emailSent, isResend: true), null);
    }

    public async Task<MessageResponse> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        // Always return the same message to avoid account enumeration
        const string genericMessage =
            "Si un compte est associé à cette adresse, un lien de réinitialisation vient d'être envoyé.";

        var email = request.Email.Trim().ToLowerInvariant();
        var client = await db.Clients.FirstOrDefaultAsync(c => c.Email == email, cancellationToken);
        if (client is null || !client.Actif)
        {
            return new MessageResponse(genericMessage);
        }

        var activeTokens = await db.PasswordResetTokens
            .Where(t => t.IdClient == client.IdClient && t.UsedAtUtc == null && t.ExpiresAtUtc > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var old in activeTokens)
        {
            old.UsedAtUtc = DateTime.UtcNow;
        }

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        var entity = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            IdClient = client.IdClient,
            TokenHash = HashToken(rawToken),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(30)
        };

        db.PasswordResetTokens.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        var resetUrl = $"{_appOptions.FrontendBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        var subject = "Réinitialisation de votre mot de passe STB Digital Hub";
        var body = $"""
            <p>Bonjour {client.Prenom},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p><a href="{resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
            <p>Ce lien est valable 30 minutes et ne peut être utilisé qu'une seule fois.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
            <p>— STB Digital Hub</p>
            """;

        var sent = await emailSender.SendAsync(client.Email, subject, body, cancellationToken);
        if (!sent && environment.IsDevelopment())
        {
            // Expose link in logs via email fallback already; also include in message for local tests
            return new MessageResponse($"{genericMessage} Lien DEV : {resetUrl}");
        }

        return new MessageResponse(genericMessage);
    }

    public async Task<(MessageResponse? Response, string? Error)> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return (null, "La confirmation du mot de passe ne correspond pas.");
        }

        if (!IsStrongPassword(request.Password))
        {
            return (null, "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.");
        }

        var hash = HashToken(request.Token.Trim());
        var token = await db.PasswordResetTokens
            .Include(t => t.Client)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (token is null || token.EstUtilise || token.EstExpire)
        {
            return (null, "Le lien de réinitialisation est invalide ou a expiré.");
        }

        var client = token.Client;
        if (!client.Actif || client.Statut == ClientStatut.Suspendu)
        {
            return (null, "Ce compte n'est pas autorisé à modifier son mot de passe.");
        }

        client.MotDePasseHash = passwordHasher.HashPassword(client, request.Password);
        token.UsedAtUtc = DateTime.UtcNow;

        // Invalidate other unused reset tokens
        var others = await db.PasswordResetTokens
            .Where(t => t.IdClient == client.IdClient && t.UsedAtUtc == null && t.Id != token.Id)
            .ToListAsync(cancellationToken);
        foreach (var other in others)
        {
            other.UsedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return (new MessageResponse("Votre mot de passe a été réinitialisé. Vous pouvez vous connecter."), null);
    }

    public async Task<AuthUserDto?> GetCurrentUserAsync(long clientId, CancellationToken cancellationToken = default)
    {
        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);

        return client is null ? null : ToUserDto(client);
    }

    private LoginChallengeResponse BuildChallengeResponse(
        Client client,
        Guid challengeId,
        int expiresInSeconds,
        string code,
        bool emailSent,
        bool isResend)
    {
        string message;
        if (emailSent)
        {
            message = isResend
                ? "Un nouveau code de vérification a été envoyé à votre adresse e-mail."
                : client.EmailConfirme
                    ? "Un code de vérification a été envoyé à votre adresse e-mail."
                    : "Un code de vérification a été envoyé à votre adresse e-mail. Sa validation activera également votre compte.";
        }
        else if (environment.IsDevelopment())
        {
            message = $"E-mail non envoyé (SMTP). Code DEV temporaire : {code}";
        }
        else
        {
            message = "Impossible d'envoyer l'e-mail de vérification. Réessayez plus tard.";
        }

        var devOtp = environment.IsDevelopment() && !emailSent ? code : null;
        return new LoginChallengeResponse(true, challengeId, message, expiresInSeconds, emailSent, devOtp);
    }

    private static AuthSessionResponse ToSessionResponse(Client client, string token) =>
        new(token, ToUserDto(client));

    private static AuthUserDto ToUserDto(Client client) =>
        new(
            client.IdClient.ToString(),
            client.Email,
            client.Prenom,
            client.Nom,
            $"{client.Prenom} {client.Nom}".Trim(),
            "User",
            client.Statut.ToString(),
            client.EmailConfirme,
            client.PhotoProfilUrl);

    private static bool IsStrongPassword(string password) =>
        password.Length >= 8
        && password.Any(char.IsLetter)
        && password.Any(char.IsDigit);

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
