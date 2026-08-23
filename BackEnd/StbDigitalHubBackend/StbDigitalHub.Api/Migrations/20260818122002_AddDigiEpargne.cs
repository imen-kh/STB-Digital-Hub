using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigiEpargne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComptesEpargne",
                columns: table => new
                {
                    IdCompteEpargne = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdCompte = table.Column<long>(type: "bigint", nullable: false),
                    TauxInteret = table.Column<decimal>(type: "decimal(8,4)", nullable: false),
                    DateCalculInteretsUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ObjectifEpargne = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComptesEpargne", x => x.IdCompteEpargne);
                    table.ForeignKey(
                        name: "FK_ComptesEpargne_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComptesEpargne_ComptesBancaires_IdCompte",
                        column: x => x.IdCompte,
                        principalTable: "ComptesBancaires",
                        principalColumn: "IdCompte");
                });

            migrationBuilder.CreateTable(
                name: "PendingEpargneActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdCompteEpargne = table.Column<long>(type: "bigint", nullable: true),
                    TypeAction = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Titre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Recapitulatif = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DateCreationUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateExpirationUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateConfirmationUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MessageResultat = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IdDemandeRetrait = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingEpargneActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PendingEpargneActions_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DemandesRetrait",
                columns: table => new
                {
                    IdDemande = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCompteEpargne = table.Column<long>(type: "bigint", nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DateDemandeUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    MotifDecision = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DateDecisionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemandesRetrait", x => x.IdDemande);
                    table.ForeignKey(
                        name: "FK_DemandesRetrait_ComptesEpargne_IdCompteEpargne",
                        column: x => x.IdCompteEpargne,
                        principalTable: "ComptesEpargne",
                        principalColumn: "IdCompteEpargne",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MouvementsEpargne",
                columns: table => new
                {
                    IdMouvement = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCompteEpargne = table.Column<long>(type: "bigint", nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DateMouvementUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Libelle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MouvementsEpargne", x => x.IdMouvement);
                    table.ForeignKey(
                        name: "FK_MouvementsEpargne_ComptesEpargne_IdCompteEpargne",
                        column: x => x.IdCompteEpargne,
                        principalTable: "ComptesEpargne",
                        principalColumn: "IdCompteEpargne",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReglesEpargne",
                columns: table => new
                {
                    IdRegle = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCompteEpargne = table.Column<long>(type: "bigint", nullable: false),
                    TypeRegle = table.Column<int>(type: "int", nullable: false),
                    Valeur = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Frequence = table.Column<int>(type: "int", nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    DateCreationUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DerniereExecutionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReglesEpargne", x => x.IdRegle);
                    table.ForeignKey(
                        name: "FK_ReglesEpargne_ComptesEpargne_IdCompteEpargne",
                        column: x => x.IdCompteEpargne,
                        principalTable: "ComptesEpargne",
                        principalColumn: "IdCompteEpargne",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComptesEpargne_IdClient",
                table: "ComptesEpargne",
                column: "IdClient");

            migrationBuilder.CreateIndex(
                name: "IX_ComptesEpargne_IdCompte",
                table: "ComptesEpargne",
                column: "IdCompte",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DemandesRetrait_IdCompteEpargne_DateDemandeUtc",
                table: "DemandesRetrait",
                columns: new[] { "IdCompteEpargne", "DateDemandeUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MouvementsEpargne_IdCompteEpargne_DateMouvementUtc",
                table: "MouvementsEpargne",
                columns: new[] { "IdCompteEpargne", "DateMouvementUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_PendingEpargneActions_Id",
                table: "PendingEpargneActions",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PendingEpargneActions_IdClient_DateCreationUtc",
                table: "PendingEpargneActions",
                columns: new[] { "IdClient", "DateCreationUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ReglesEpargne_IdCompteEpargne",
                table: "ReglesEpargne",
                column: "IdCompteEpargne");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemandesRetrait");

            migrationBuilder.DropTable(
                name: "MouvementsEpargne");

            migrationBuilder.DropTable(
                name: "PendingEpargneActions");

            migrationBuilder.DropTable(
                name: "ReglesEpargne");

            migrationBuilder.DropTable(
                name: "ComptesEpargne");
        }
    }
}
