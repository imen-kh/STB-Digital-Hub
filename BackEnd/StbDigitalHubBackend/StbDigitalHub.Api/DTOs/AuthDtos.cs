using System.ComponentModel.DataAnnotations;

namespace StbDigitalHub.Api.DTOs;

public record RegisterRequest(
    [Required, MaxLength(100)] string FirstName,
    [Required, MaxLength(100)] string LastName,
    [Required, EmailAddress, MaxLength(150)] string Email,
    [Required, MaxLength(30)] string Telephone,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MinLength(8), MaxLength(100)] string ConfirmPassword);

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
    string? DevOtpCode = null);

public record VerifyOtpRequest(
    [Required] Guid ChallengeId,
    [Required, MinLength(4), MaxLength(10)] string Code);

public record ResendOtpRequest(
    [Required] Guid ChallengeId);

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required] string Token,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MinLength(8), MaxLength(100)] string ConfirmPassword);

public record AuthUserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string Name,
    string Role,
    string Statut,
    bool EmailConfirmed,
    string? PhotoUrl);

public record AuthSessionResponse(
    string ServiceToken,
    AuthUserDto User);

public record MessageResponse(string Message);
