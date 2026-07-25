using System.ComponentModel.DataAnnotations;

namespace StbDigitalHub.Api.DTOs;

public record RegisterRequest(
    [Required, MaxLength(100)] string FirstName,
    [Required, MaxLength(100)] string LastName,
    [Required, EmailAddress, MaxLength(150)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password);

public record RegisterResponse(
    long Id,
    string Email,
    string Message,
    string Statut);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record LoginChallengeResponse(
    bool RequiresOtp,
    Guid ChallengeId,
    string Message,
    int ExpiresInSeconds,
    bool EmailSent,
    /// <summary>Populated only in Development when e-mail delivery failed.</summary>
    string? DevOtpCode = null);

public record VerifyOtpRequest(
    [Required] Guid ChallengeId,
    [Required, MinLength(4), MaxLength(10)] string Code);

public record ResendOtpRequest(
    [Required] Guid ChallengeId);

public record AuthUserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string Name,
    string Role,
    string Statut,
    bool EmailConfirmed);

public record AuthSessionResponse(
    string ServiceToken,
    AuthUserDto User);
