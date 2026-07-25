namespace StbDigitalHub.Api.Options;

public class OtpOptions
{
    public const string SectionName = "Otp";

    public int Length { get; set; } = 6;
    public int ExpirationMinutes { get; set; } = 5;
    public int MaxTentatives { get; set; } = 5;
}
