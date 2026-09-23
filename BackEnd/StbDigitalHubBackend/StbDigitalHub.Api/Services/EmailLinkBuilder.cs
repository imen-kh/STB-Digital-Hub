using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class EmailLinkBuilder(
    IOptions<AppOptions> appOptions,
    IOptions<JwtOptions> jwtOptions,
    IHttpContextAccessor httpContextAccessor)
{
    public string ApiBase()
    {
        var configured = appOptions.Value.ApiBaseUrl;
        if (IsPublicUrl(configured))
        {
            return configured.TrimEnd('/');
        }

        var request = httpContextAccessor.HttpContext?.Request;
        if (request is not null && !IsLocalHost(request.Host.Host))
        {
            var scheme = request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? request.Scheme;
            if (request.Host.Host.Contains("onrender.com", StringComparison.OrdinalIgnoreCase))
            {
                scheme = "https";
            }

            return $"{scheme}://{request.Host.Value}".TrimEnd('/');
        }

        return (configured ?? "http://localhost:5041").TrimEnd('/');
    }

    /// <summary>Public frontend only. Never the API host, so the return button cannot land on a 404.</summary>
    public string FrontendHome() => ConfiguredFrontend() ?? string.Empty;

    public string? PublicFrontendOrNull() => ConfiguredFrontend();

    public string? ConfiguredFrontend()
    {
        if (IsUsableFrontend(appOptions.Value.FrontendBaseUrl))
        {
            return appOptions.Value.FrontendBaseUrl.TrimEnd('/');
        }

        foreach (var origin in appOptions.Value.CorsOrigins)
        {
            if (IsUsableFrontend(origin))
            {
                return origin.TrimEnd('/');
            }
        }

        return ProductionFrontendFallback();
    }

    /// <summary>Frontend that called the API while creating the e-mail, when no public URL is configured.</summary>
    public string? FrontendForNewEmail() =>
        ConfiguredFrontend() ?? CaptureCallerFrontend() ?? ProductionFrontendFallback();

    public string? CardPage(long cardId)
    {
        var front = FrontendForNewEmail();
        if (front is null)
        {
            return null;
        }

        return cardId > 0 ? $"{front}/digi-carte/{cardId}" : $"{front}/digi-carte";
    }

    public string CardDecisionUrl(Guid actionId, long cardId)
    {
        var link = CardConfirm(actionId);
        var page = CardPage(cardId);
        if (page is null)
        {
            return link;
        }

        var sig = Sign(actionId, page);
        return $"{link}?return={Uri.EscapeDataString(page)}&sig={Uri.EscapeDataString(sig)}";
    }

    public bool IsValidReturn(Guid actionId, string? returnUrl, string? sig)
    {
        if (!IsSafeDigiCarteReturn(returnUrl))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(sig))
        {
            // E-mail clients sometimes drop the signature; the path is still constrained to DigiCarte.
            return true;
        }

        var expected = Sign(actionId, returnUrl!.Trim());
        var given = sig.Trim();
        if (!string.Equals(expected, given, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    public string ResolveReturnTarget(Guid actionId, long cardId, string? returnUrl, string? sig)
    {
        if (IsValidReturn(actionId, returnUrl, sig))
        {
            return returnUrl!.Trim();
        }

        if (IsSafeDigiCarteReturn(returnUrl))
        {
            return returnUrl!.Trim();
        }

        return CardPage(cardId) ?? string.Empty;
    }

    public static string WithResult(string pageUrl, bool success, string message)
    {
        var kind = success ? "confirmed" : "refused";
        var separator = pageUrl.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        return $"{pageUrl}{separator}emailResult={kind}&message={Uri.EscapeDataString(message)}";
    }

    public string CardConfirm(Guid actionId) =>
        $"{ApiBase()}/api/cards/actions/confirm-email/{actionId:D}";

    public string CardCancel(Guid actionId) =>
        $"{ApiBase()}/api/cards/actions/cancel-email/{actionId:D}";

    public string CreditConfirm(Guid actionId) =>
        $"{ApiBase()}/api/credits/actions/confirm-email/{actionId:D}";

    public string EpargneConfirm(Guid actionId) =>
        $"{ApiBase()}/api/epargne/actions/confirm-email/{actionId:D}";

    public static bool IsPublicUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        return (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && !IsLocalHost(uri.Host);
    }

    private string? ProductionFrontendFallback()
    {
        // Render API → Vercel frontend (known production pair for this project).
        if (ApiBase().Contains("onrender.com", StringComparison.OrdinalIgnoreCase))
        {
            return "https://stb-digital-hub.vercel.app";
        }

        return null;
    }

    private bool IsSafeDigiCarteReturn(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl)
            || !Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri)
            || !IsUsableFrontend($"{uri.Scheme}://{uri.Authority}"))
        {
            return false;
        }

        return uri.AbsolutePath.Equals("/digi-carte", StringComparison.OrdinalIgnoreCase)
            || uri.AbsolutePath.StartsWith("/digi-carte/", StringComparison.OrdinalIgnoreCase);
    }

    private string? CaptureCallerFrontend()
    {
        var request = httpContextAccessor.HttpContext?.Request;
        if (request is null)
        {
            return null;
        }

        var candidates = new[]
        {
            request.Headers["X-App-Origin"].FirstOrDefault(),
            request.Headers.Origin.FirstOrDefault(),
            OriginOf(request.Headers.Referer.FirstOrDefault())
        };

        foreach (var candidate in candidates)
        {
            if (IsUsableFrontend(candidate))
            {
                return candidate!.TrimEnd('/');
            }
        }

        return null;
    }

    private bool IsUsableFrontend(string? url)
    {
        if (!IsPublicUrl(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (Uri.TryCreate(ApiBase(), UriKind.Absolute, out var api)
            && uri.Host.Equals(api.Host, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var requestHost = httpContextAccessor.HttpContext?.Request.Host.Host;
        return requestHost is null
            || !uri.Host.Equals(requestHost, StringComparison.OrdinalIgnoreCase);
    }

    private string Sign(Guid actionId, string returnUrl)
    {
        var key = Encoding.UTF8.GetBytes(jwtOptions.Value.Key ?? string.Empty);
        var data = Encoding.UTF8.GetBytes($"{actionId:D}|{returnUrl}");
        return Convert.ToHexString(HMACSHA256.HashData(key, data));
    }

    private static string? OriginOf(string? referer)
    {
        if (!Uri.TryCreate(referer, UriKind.Absolute, out var uri))
        {
            return null;
        }

        return uri.GetLeftPart(UriPartial.Authority);
    }

    private static bool IsLocalHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
}
