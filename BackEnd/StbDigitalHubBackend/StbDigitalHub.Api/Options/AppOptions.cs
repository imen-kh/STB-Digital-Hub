namespace StbDigitalHub.Api.Options;

public class AppOptions
{
    public const string SectionName = "App";

    /// <summary>Base URL of the Angular frontend (used for password-reset and return links).</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:4200";

    /// <summary>Base URL of the API (used for email confirmation links).</summary>
    public string ApiBaseUrl { get; set; } = "http://localhost:5041";

    /// <summary>Validity of DigiCarte email confirmation links, in minutes.</summary>
    public int CardActionExpirationMinutes { get; set; } = 15;
}
