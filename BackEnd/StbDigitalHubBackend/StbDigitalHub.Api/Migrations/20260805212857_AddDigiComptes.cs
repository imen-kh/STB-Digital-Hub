using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigiComptes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComptesBancaires",
                columns: table => new
                {
                    IdCompte = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    Libelle = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    NumeroCompte = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    Rib = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    Iban = table.Column<string>(type: "nvarchar(34)", maxLength: 34, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false),
                    Solde = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Devise = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    DateOuvertureUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComptesBancaires", x => x.IdCompte);
                    table.ForeignKey(
                        name: "FK_ComptesBancaires_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TransactionsCompte",
                columns: table => new
                {
                    IdTransaction = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCompte = table.Column<long>(type: "bigint", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Montant = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DateTransactionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Libelle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    TypeMouvement = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionsCompte", x => x.IdTransaction);
                    table.ForeignKey(
                        name: "FK_TransactionsCompte_ComptesBancaires_IdCompte",
                        column: x => x.IdCompte,
                        principalTable: "ComptesBancaires",
                        principalColumn: "IdCompte",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComptesBancaires_IdClient_NumeroCompte",
                table: "ComptesBancaires",
                columns: new[] { "IdClient", "NumeroCompte" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransactionsCompte_IdCompte",
                table: "TransactionsCompte",
                column: "IdCompte");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionsCompte_Reference",
                table: "TransactionsCompte",
                column: "Reference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransactionsCompte");

            migrationBuilder.DropTable(
                name: "ComptesBancaires");
        }
    }
}
