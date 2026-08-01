using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigiCarte : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CartesBancaires",
                columns: table => new
                {
                    IdCarte = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    NumeroMasque = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    TokenCarte = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DateExpiration = table.Column<DateOnly>(type: "date", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    PlafondPaiement = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlafondRetrait = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlafondTemporaire = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DateFinPlafondTemporaire = table.Column<DateOnly>(type: "date", nullable: true),
                    PaiementsEnLigneActifs = table.Column<bool>(type: "bit", nullable: false),
                    Solde = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DateCreationUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartesBancaires", x => x.IdCarte);
                    table.ForeignKey(
                        name: "FK_CartesBancaires_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TransactionsCarte",
                columns: table => new
                {
                    IdTransaction = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCarte = table.Column<long>(type: "bigint", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DateTransactionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Commercant = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    TypeOperation = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionsCarte", x => x.IdTransaction);
                    table.ForeignKey(
                        name: "FK_TransactionsCarte_CartesBancaires_IdCarte",
                        column: x => x.IdCarte,
                        principalTable: "CartesBancaires",
                        principalColumn: "IdCarte",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CartesBancaires_IdClient_TokenCarte",
                table: "CartesBancaires",
                columns: new[] { "IdClient", "TokenCarte" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransactionsCarte_IdCarte",
                table: "TransactionsCarte",
                column: "IdCarte");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionsCarte_Reference",
                table: "TransactionsCarte",
                column: "Reference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransactionsCarte");

            migrationBuilder.DropTable(
                name: "CartesBancaires");
        }
    }
}
