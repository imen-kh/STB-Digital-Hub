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
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<CarteBancaire> CartesBancaires => Set<CarteBancaire>();
    public DbSet<TransactionCarte> TransactionsCarte => Set<TransactionCarte>();
    public DbSet<CompteBancaire> ComptesBancaires => Set<CompteBancaire>();
    public DbSet<TransactionCompte> TransactionsCompte => Set<TransactionCompte>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Client>(entity =>
        {
            entity.HasIndex(c => c.Email).IsUnique();
            entity.Property(c => c.Statut).HasConversion<int>();
            entity.Property(c => c.Telephone).HasMaxLength(30);
        });

        modelBuilder.Entity<OtpChallenge>(entity =>
        {
            entity.HasIndex(o => new { o.IdClient, o.CreatedAtUtc });
            entity.HasOne(o => o.Client)
                .WithMany(c => c.OtpChallenges)
                .HasForeignKey(o => o.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasOne(t => t.Client)
                .WithMany(c => c.PasswordResetTokens)
                .HasForeignKey(t => t.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CarteBancaire>(entity =>
        {
            entity.HasIndex(c => new { c.IdClient, c.TokenCarte }).IsUnique();
            entity.Property(c => c.Type).HasConversion<int>();
            entity.Property(c => c.Statut).HasConversion<int>();
            entity.HasOne(c => c.Client)
                .WithMany(cl => cl.Cartes)
                .HasForeignKey(c => c.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TransactionCarte>(entity =>
        {
            entity.HasIndex(t => t.Reference).IsUnique();
            entity.Property(t => t.TypeOperation).HasConversion<int>();
            entity.Property(t => t.Statut).HasConversion<int>();
            entity.HasOne(t => t.Carte)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.IdCarte)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompteBancaire>(entity =>
        {
            entity.HasIndex(c => new { c.IdClient, c.NumeroCompte }).IsUnique();
            entity.Property(c => c.Type).HasConversion<int>();
            entity.Property(c => c.Statut).HasConversion<int>();
            entity.HasOne(c => c.Client)
                .WithMany(cl => cl.Comptes)
                .HasForeignKey(c => c.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TransactionCompte>(entity =>
        {
            entity.HasIndex(t => t.Reference).IsUnique();
            entity.Property(t => t.TypeMouvement).HasConversion<int>();
            entity.Property(t => t.Statut).HasConversion<int>();
            entity.HasOne(t => t.Compte)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.IdCompte)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(n => new { n.IdClient, n.DateCreationUtc });
            entity.Property(n => n.Type).HasConversion<int>();
            entity.HasOne(n => n.Client)
                .WithMany(c => c.Notifications)
                .HasForeignKey(n => n.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
