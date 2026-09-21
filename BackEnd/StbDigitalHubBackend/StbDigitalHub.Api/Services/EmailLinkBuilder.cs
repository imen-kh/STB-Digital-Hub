using Microsoft.Extensions.Options;
using StbDigitalHub.Api.Options;

namespace StbDigitalHub.Api.Services;

public class EmailLinkBuilder(IOptions<AppOptions> appOptions, IHttpContextAccessor httpContextAccessor)
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

    public string FrontendHome()
    {
        var front = appOptions.Value.FrontendBaseUrl;
        return IsPublicUrl(front) ? front.TrimEnd('/') : ApiBase();
    }

    public string CardConfirm(Guid actionId) =>
        $"{ApiBase()}/api/cards/actions/confirm-email/{actionId:D}";

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

    private static bool IsLocalHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
}
