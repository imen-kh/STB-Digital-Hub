namespace StbDigitalHub.Api.Options;

public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@stbdigitalhub.tn";
    public string FromName { get; set; } = "STB Digital Hub";
    public bool EnableSsl { get; set; } = true;
}
