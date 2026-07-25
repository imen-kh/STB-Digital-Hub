using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Services;

public class AuthService(
    StbDigitalHubDbContext db,
    IPasswordHasher<Client> passwordHasher,
    OtpService otpService,
    JwtTokenService jwtTokenService,
    IHostEnvironment environment)
{
    public async Task<(RegisterResponse? Response, string? Error)> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
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
            message = $"E-mail non envoyé (SMTP Gmail refusé). Code DEV temporaire : {code}";
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
            client.EmailConfirme);
}
