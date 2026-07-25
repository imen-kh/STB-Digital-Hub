using Microsoft.EntityFrameworkCore;
using StbDigitalHub.Api.Entities;

namespace StbDigitalHub.Api.Data;

public class StbDigitalHubDbContext : DbContext
{
    public StbDigitalHubDbContext(
        DbContextOptions<StbDigitalHubDbContext> options) : base(options)
    {
    }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasIndex(c => c.Email).IsUnique();
            entity.Property(c => c.Statut).HasConversion<int>();
        });

        modelBuilder.Entity<OtpChallenge>(entity =>
        {
            entity.HasIndex(o => new { o.IdClient, o.CreatedAtUtc });
            entity.HasOne(o => o.Client)
                .WithMany(c => c.OtpChallenges)
                .HasForeignKey(o => o.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
