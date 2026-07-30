using System.ComponentModel.DataAnnotations;

namespace StbDigitalHub.Api.DTOs;

public record ClientProfileDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string Telephone,
    string? PhotoUrl,
    string Statut,
    bool EmailConfirmed,
    DateTime DateCreationUtc,
    DateTime? DateDerniereConnexionUtc);

public record UpdateClientProfileRequest(
    [Required, MaxLength(100)] string FirstName,
    [Required, MaxLength(100)] string LastName,
    [Required, MaxLength(30)] string Telephone);
