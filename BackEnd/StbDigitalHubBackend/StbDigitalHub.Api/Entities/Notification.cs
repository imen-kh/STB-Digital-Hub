using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class Notification
{
    [Key]
    public long IdNotification { get; set; }

    public long IdClient { get; set; }

    public long? IdCarte { get; set; }

    public long? IdTransaction { get; set; }

    [Required, MaxLength(120)]
    public string Titre { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public TypeNotification Type { get; set; } = TypeNotification.Info;

    public bool Lue { get; set; }

    public DateTime DateCreationUtc { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(IdClient))]
    public Client Client { get; set; } = null!;
}
