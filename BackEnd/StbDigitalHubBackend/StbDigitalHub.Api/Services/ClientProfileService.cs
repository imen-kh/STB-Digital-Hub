using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.DTOs;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class ClientProfileService(
    StbDigitalHubDbContext db,
    IWebHostEnvironment environment,
    IHttpContextAccessor httpContextAccessor,
    IOptions<AppOptions> appOptions)
{
    private static readonly Regex TelephoneRegex = new(@"^\+?[0-9\s\-()]{8,20}$", RegexOptions.Compiled);
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private const long MaxPhotoBytes = 2 * 1024 * 1024;

    public async Task<ClientProfileDto?> GetAsync(long clientId, CancellationToken cancellationToken = default)
    {
        var client = await db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);

        return client is null ? null : ToDto(client);
    }

    public async Task<(ClientProfileDto? Profile, string? Error)> UpdateAsync(
        long clientId,
        UpdateClientProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var telephone = request.Telephone.Trim();
        if (!TelephoneRegex.IsMatch(telephone))
        {
            return (null, "Le numéro de téléphone est invalide.");
        }

        var client = await db.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        if (!client.Actif || client.Statut == ClientStatut.Suspendu)
        {
            return (null, "Ce compte n'est pas autorisé à modifier son profil.");
        }

        client.Prenom = request.FirstName.Trim();
        client.Nom = request.LastName.Trim();
        client.Telephone = telephone;
        await db.SaveChangesAsync(cancellationToken);

        return (ToDto(client), null);
    }

    public async Task<(ClientProfileDto? Profile, string? Error)> UploadPhotoAsync(
        long clientId,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file.Length <= 0)
        {
            return (null, "Aucun fichier reçu.");
        }

        if (file.Length > MaxPhotoBytes)
        {
            return (null, "La photo ne doit pas dépasser 2 Mo.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            return (null, "Formats acceptés : JPG, JPEG, PNG, WEBP.");
        }

        var client = await db.Clients.FirstOrDefaultAsync(c => c.IdClient == clientId, cancellationToken);
        if (client is null)
        {
            return (null, "Client introuvable.");
        }

        var uploadsRoot = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(uploadsRoot);

        // Remove previous file if present
        if (!string.IsNullOrWhiteSpace(client.PhotoProfilUrl))
        {
            var previousRelative = client.PhotoProfilUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var previousPath = Path.Combine(environment.ContentRootPath, "wwwroot", previousRelative);
            if (File.Exists(previousPath))
            {
                File.Delete(previousPath);
            }
        }

        var fileName = $"{clientId}{extension.ToLowerInvariant()}";
        var absolutePath = Path.Combine(uploadsRoot, fileName);
        await using (var stream = File.Create(absolutePath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        client.PhotoProfilUrl = $"/uploads/avatars/{fileName}";
        await db.SaveChangesAsync(cancellationToken);

        return (ToDto(client), null);
    }

    private ClientProfileDto ToDto(Client client) =>
        new(
            client.IdClient.ToString(),
            client.Email,
            client.Prenom,
            client.Nom,
            client.Telephone,
            BuildAbsoluteUrl(client.PhotoProfilUrl),
            client.Statut.ToString(),
            client.EmailConfirme,
            client.DateCreationUtc,
            client.DateDerniereConnexionUtc);

    private string? BuildAbsoluteUrl(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
        {
            return null;
        }

        var publicBase = appOptions.Value.ApiBaseUrl?.Trim().TrimEnd('/');
        if (!string.IsNullOrWhiteSpace(publicBase)
            && !publicBase.Contains("localhost", StringComparison.OrdinalIgnoreCase)
            && !publicBase.Contains("127.0.0.1"))
        {
            return $"{publicBase}{relativeUrl}";
        }

        var request = httpContextAccessor.HttpContext?.Request;
        if (request is null)
        {
            return relativeUrl;
        }

        var scheme = request.Headers["X-Forwarded-Proto"].FirstOrDefault()
            ?? request.Scheme;
        if (string.Equals(scheme, "http", StringComparison.OrdinalIgnoreCase)
            && request.Host.Host.Contains("onrender.com", StringComparison.OrdinalIgnoreCase))
        {
            scheme = "https";
        }

        return $"{scheme}://{request.Host.Value}{relativeUrl}";
    }
}
