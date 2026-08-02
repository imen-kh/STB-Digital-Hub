namespace StbDigitalHub.Api.DTOs;

public record NotificationDto(
    long Id,
    string Titre,
    string Message,
    string Type,
    bool Lue,
    string DateCreation,
    long? IdCarte,
    long? IdTransaction);

public record NotificationsResponse(
    int NonLues,
    IReadOnlyList<NotificationDto> Items);
