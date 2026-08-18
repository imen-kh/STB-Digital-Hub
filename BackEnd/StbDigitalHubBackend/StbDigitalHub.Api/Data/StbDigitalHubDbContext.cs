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
    public DbSet<PendingCardAction> PendingCardActions => Set<PendingCardAction>();
    public DbSet<SimulationCredit> SimulationsCredit => Set<SimulationCredit>();
    public DbSet<DemandeCredit> DemandesCredit => Set<DemandeCredit>();
    public DbSet<Credit> Credits => Set<Credit>();
    public DbSet<Echeance> Echeances => Set<Echeance>();
    public DbSet<PendingCreditAction> PendingCreditActions => Set<PendingCreditAction>();

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

        modelBuilder.Entity<PendingCardAction>(entity =>
        {
            entity.HasIndex(a => new { a.IdClient, a.DateCreationUtc });
            entity.HasIndex(a => a.Id);
            entity.Property(a => a.TypeAction).HasConversion<int>();
            entity.Property(a => a.Statut).HasConversion<int>();
            entity.Property(a => a.Titre).HasMaxLength(200);
            entity.Property(a => a.Recapitulatif).HasMaxLength(2000);
            entity.Property(a => a.PayloadJson).HasMaxLength(4000);
            entity.Property(a => a.MessageResultat).HasMaxLength(1000);
            entity.HasOne(a => a.Client)
                .WithMany()
                .HasForeignKey(a => a.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Carte)
                .WithMany()
                .HasForeignKey(a => a.IdCarte)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SimulationCredit>(entity =>
        {
            entity.HasKey(s => s.IdSimulation);
            entity.HasIndex(s => new { s.IdClient, s.DateSimulationUtc });
            entity.Property(s => s.TypeCredit).HasConversion<int>();
            entity.Property(s => s.NiveauEligibilite).HasMaxLength(20);
            entity.HasOne(s => s.Client)
                .WithMany(c => c.SimulationsCredit)
                .HasForeignKey(s => s.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DemandeCredit>(entity =>
        {
            entity.HasKey(d => d.IdDemande);
            entity.HasIndex(d => new { d.IdClient, d.DateDemandeUtc });
            entity.Property(d => d.TypeCredit).HasConversion<int>();
            entity.Property(d => d.Statut).HasConversion<int>();
            entity.Property(d => d.MotifDecision).HasMaxLength(500);
            entity.HasOne(d => d.Client)
                .WithMany(c => c.DemandesCredit)
                .HasForeignKey(d => d.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.Simulation)
                .WithMany()
                .HasForeignKey(d => d.IdSimulation)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Credit>(entity =>
        {
            entity.HasKey(c => c.IdCredit);
            entity.HasIndex(c => new { c.IdClient, c.DateDebutUtc });
            entity.HasIndex(c => c.Reference).IsUnique();
            entity.Property(c => c.TypeCredit).HasConversion<int>();
            entity.Property(c => c.Statut).HasConversion<int>();
            entity.Property(c => c.Reference).HasMaxLength(40);
            entity.HasOne(c => c.Client)
                .WithMany(cl => cl.Credits)
                .HasForeignKey(c => c.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Demande)
                .WithOne(d => d.Credit)
                .HasForeignKey<Credit>(c => c.IdDemande)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Echeance>(entity =>
        {
            entity.HasKey(e => e.IdEcheance);
            entity.HasIndex(e => new { e.IdCredit, e.Numero }).IsUnique();
            entity.HasOne(e => e.Credit)
                .WithMany(c => c.Echeances)
                .HasForeignKey(e => e.IdCredit)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PendingCreditAction>(entity =>
        {
            entity.HasIndex(a => new { a.IdClient, a.DateCreationUtc });
            entity.HasIndex(a => a.Id);
            entity.Property(a => a.TypeAction).HasConversion<int>();
            entity.Property(a => a.Statut).HasConversion<int>();
            entity.Property(a => a.Titre).HasMaxLength(200);
            entity.Property(a => a.Recapitulatif).HasMaxLength(2000);
            entity.Property(a => a.PayloadJson).HasMaxLength(4000);
            entity.Property(a => a.MessageResultat).HasMaxLength(1000);
            entity.HasOne(a => a.Client)
                .WithMany()
                .HasForeignKey(a => a.IdClient)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
