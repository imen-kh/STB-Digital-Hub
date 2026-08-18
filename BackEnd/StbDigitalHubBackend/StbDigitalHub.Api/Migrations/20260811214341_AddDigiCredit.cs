using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigiCredit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[dbo].[Echeances]', N'U') IS NOT NULL DROP TABLE [dbo].[Echeances];
                IF OBJECT_ID(N'[dbo].[Credits]', N'U') IS NOT NULL DROP TABLE [dbo].[Credits];
                IF OBJECT_ID(N'[dbo].[DemandesCredit]', N'U') IS NOT NULL DROP TABLE [dbo].[DemandesCredit];
                IF OBJECT_ID(N'[dbo].[PendingCreditActions]', N'U') IS NOT NULL DROP TABLE [dbo].[PendingCreditActions];
                IF OBJECT_ID(N'[dbo].[SimulationsCredit]', N'U') IS NOT NULL DROP TABLE [dbo].[SimulationsCredit];
                """);

            migrationBuilder.CreateTable(
                name: "PendingCreditActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdDemande = table.Column<long>(type: "bigint", nullable: true),
                    IdSimulation = table.Column<long>(type: "bigint", nullable: true),
                    TypeAction = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Titre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Recapitulatif = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DateCreationUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateExpirationUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateConfirmationUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MessageResultat = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingCreditActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PendingCreditActions_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SimulationsCredit",
                columns: table => new
                {
                    IdSimulation = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    TypeCredit = table.Column<int>(type: "int", nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DureeMois = table.Column<int>(type: "int", nullable: false),
                    RevenuMensuel = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TauxAnnuel = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MensualiteEstimee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CoutTotalEstime = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TauxEndettement = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NiveauEligibilite = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DateSimulationUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulationsCredit", x => x.IdSimulation);
                    table.ForeignKey(
                        name: "FK_SimulationsCredit_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DemandesCredit",
                columns: table => new
                {
                    IdDemande = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdSimulation = table.Column<long>(type: "bigint", nullable: true),
                    TypeCredit = table.Column<int>(type: "int", nullable: false),
                    MontantDemande = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DureeMois = table.Column<int>(type: "int", nullable: false),
                    RevenuMensuel = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MensualiteEstimee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CoutTotalEstime = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DateDemandeUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    MotifDecision = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DateDecisionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandesCredit", x => x.IdDemande);
                    table.ForeignKey(
                        name: "FK_DemandesCredit_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DemandesCredit_SimulationsCredit_IdSimulation",
                        column: x => x.IdSimulation,
                        principalTable: "SimulationsCredit",
                        principalColumn: "IdSimulation");
                });

            migrationBuilder.CreateTable(
                name: "Credits",
                columns: table => new
                {
                    IdCredit = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdDemande = table.Column<long>(type: "bigint", nullable: true),
                    Reference = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    TypeCredit = table.Column<int>(type: "int", nullable: false),
                    MontantAccorde = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DureeMois = table.Column<int>(type: "int", nullable: false),
                    TauxInteret = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Mensualite = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoldeRestantDu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    DateDebutUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateFinPrevueUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Credits", x => x.IdCredit);
                    table.ForeignKey(
                        name: "FK_Credits_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Credits_DemandesCredit_IdDemande",
                        column: x => x.IdDemande,
                        principalTable: "DemandesCredit",
                        principalColumn: "IdDemande");
                });

            migrationBuilder.CreateTable(
                name: "Echeances",
                columns: table => new
                {
                    IdEcheance = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCredit = table.Column<long>(type: "bigint", nullable: false),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    DateEcheance = table.Column<DateOnly>(type: "date", nullable: false),
                    Capital = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Interet = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontantTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoldeRestantDu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Payee = table.Column<bool>(type: "bit", nullable: false),
                    DatePaiementUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Echeances", x => x.IdEcheance);
                    table.ForeignKey(
                        name: "FK_Echeances_Credits_IdCredit",
                        column: x => x.IdCredit,
                        principalTable: "Credits",
                        principalColumn: "IdCredit",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Credits_IdClient_DateDebutUtc",
                table: "Credits",
                columns: new[] { "IdClient", "DateDebutUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Credits_IdDemande",
                table: "Credits",
                column: "IdDemande",
                unique: true,
                filter: "[IdDemande] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Credits_Reference",
                table: "Credits",
                column: "Reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DemandesCredit_IdClient_DateDemandeUtc",
                table: "DemandesCredit",
                columns: new[] { "IdClient", "DateDemandeUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_DemandesCredit_IdSimulation",
                table: "DemandesCredit",
                column: "IdSimulation");

            migrationBuilder.CreateIndex(
                name: "IX_Echeances_IdCredit_Numero",
                table: "Echeances",
                columns: new[] { "IdCredit", "Numero" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PendingCreditActions_Id",
                table: "PendingCreditActions",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PendingCreditActions_IdClient_DateCreationUtc",
                table: "PendingCreditActions",
                columns: new[] { "IdClient", "DateCreationUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_SimulationsCredit_IdClient_DateSimulationUtc",
                table: "SimulationsCredit",
                columns: new[] { "IdClient", "DateSimulationUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Echeances");

            migrationBuilder.DropTable(
                name: "PendingCreditActions");

            migrationBuilder.DropTable(
                name: "Credits");

            migrationBuilder.DropTable(
                name: "DemandesCredit");

            migrationBuilder.DropTable(
                name: "SimulationsCredit");
        }
    }
}
