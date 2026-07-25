using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StbDigitalHub.Api.Entities;

public class OtpChallenge
{
    [Key]
    public Guid Id { get; set; }

    public long IdClient { get; set; }

    [ForeignKey(nameof(IdClient))]
    public Client Client { get; set; } = null!;

    /// <summary>SHA-256 hash of the OTP code. Never store the plaintext code.</summary>
    [Required, MaxLength(128)]
    public string CodeHash { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string Salt { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UsedAtUtc { get; set; }

    public int Tentatives { get; set; }

    public int MaxTentatives { get; set; } = 5;

    public bool EstUtilise => UsedAtUtc.HasValue;

    public bool EstExpire => DateTime.UtcNow >= ExpiresAtUtc;
}
