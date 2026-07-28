namespace StbDigitalHub.Api.Options;

public class AppOptions
{
    public const string SectionName = "App";

    /// <summary>Base URL of the Angular frontend (used for password-reset links).</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:4200";
}
