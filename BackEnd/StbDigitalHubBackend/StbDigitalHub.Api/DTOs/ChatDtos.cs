namespace StbDigitalHub.Api.DTOs;

public record ChatAskRequest(string? Message, string? PreviousIntent);

public record ChatReplyDto(
    string Reply,
    string Intent,
    string? Url,
    string? ActionLabel,
    IReadOnlyList<string> Suggestions);
