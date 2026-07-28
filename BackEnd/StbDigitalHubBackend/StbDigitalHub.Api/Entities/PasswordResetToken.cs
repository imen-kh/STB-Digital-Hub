using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class PasswordResetToken
{
    [Key]
    public Guid Id { get; set; }

    public long IdClient { get; set; }

    [ForeignKey(nameof(IdClient))]
    public Client Client { get; set; } = null!;

    /// <summary>SHA-256 hash of the raw token sent by e-mail.</summary>
    [Required, MaxLength(128)]
    public string TokenHash { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? UsedAtUtc { get; set; }

    public bool EstUtilise => UsedAtUtc.HasValue;

    public bool EstExpire => DateTime.UtcNow >= ExpiresAtUtc;
}
