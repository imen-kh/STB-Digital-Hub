using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigiTransfert : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Beneficiaires",
                columns: table => new
                {
                    IdBeneficiaire = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Prenom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Rib = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    Banque = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Alias = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Actif = table.Column<bool>(type: "bit", nullable: false),
                    Favori = table.Column<bool>(type: "bit", nullable: false),
                    DateCreationUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Beneficiaires", x => x.IdBeneficiaire);
                    table.ForeignKey(
                        name: "FK_Beneficiaires_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Virements",
                columns: table => new
                {
                    IdVirement = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdCompteSource = table.Column<long>(type: "bigint", nullable: false),
                    IdBeneficiaire = table.Column<long>(type: "bigint", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Frais = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Motif = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    DateOperationUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DateExecutionUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    IntraStb = table.Column<bool>(type: "bit", nullable: false),
                    DelaiEstime = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    IdOtpChallenge = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DateConfirmationOtpUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Virements", x => x.IdVirement);
                    table.ForeignKey(
                        name: "FK_Virements_Beneficiaires_IdBeneficiaire",
                        column: x => x.IdBeneficiaire,
                        principalTable: "Beneficiaires",
                        principalColumn: "IdBeneficiaire");
                    table.ForeignKey(
                        name: "FK_Virements_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Virements_ComptesBancaires_IdCompteSource",
                        column: x => x.IdCompteSource,
                        principalTable: "ComptesBancaires",
                        principalColumn: "IdCompte");
                });

            migrationBuilder.CreateTable(
                name: "RecusVirement",
                columns: table => new
                {
                    IdRecu = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdVirement = table.Column<long>(type: "bigint", nullable: false),
                    ReferenceVirement = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    DateGenerationUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecusVirement", x => x.IdRecu);
                    table.ForeignKey(
                        name: "FK_RecusVirement_Virements_IdVirement",
                        column: x => x.IdVirement,
                        principalTable: "Virements",
                        principalColumn: "IdVirement",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Beneficiaires_IdClient_Rib",
                table: "Beneficiaires",
                columns: new[] { "IdClient", "Rib" });

            migrationBuilder.CreateIndex(
                name: "IX_RecusVirement_IdVirement",
                table: "RecusVirement",
                column: "IdVirement",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Virements_IdBeneficiaire",
                table: "Virements",
                column: "IdBeneficiaire");

            migrationBuilder.CreateIndex(
                name: "IX_Virements_IdClient_DateOperationUtc",
                table: "Virements",
                columns: new[] { "IdClient", "DateOperationUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Virements_IdCompteSource",
                table: "Virements",
                column: "IdCompteSource");

            migrationBuilder.CreateIndex(
                name: "IX_Virements_Reference",
                table: "Virements",
                column: "Reference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecusVirement");

            migrationBuilder.DropTable(
                name: "Virements");

            migrationBuilder.DropTable(
                name: "Beneficiaires");
        }
    }
}
