namespace StbDigitalHub.Api.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "StbDigitalHub";
    public string Audience { get; set; } = "StbDigitalHubClients";
    public int ExpirationMinutes { get; set; } = 60;
}
