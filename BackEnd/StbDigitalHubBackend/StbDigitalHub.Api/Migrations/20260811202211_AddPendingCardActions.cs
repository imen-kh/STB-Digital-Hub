using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingCardActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PendingCardActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdClient = table.Column<long>(type: "bigint", nullable: false),
                    IdCarte = table.Column<long>(type: "bigint", nullable: false),
                    IdTransaction = table.Column<long>(type: "bigint", nullable: true),
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
                    table.PrimaryKey("PK_PendingCardActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PendingCardActions_CartesBancaires_IdCarte",
                        column: x => x.IdCarte,
                        principalTable: "CartesBancaires",
                        principalColumn: "IdCarte",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PendingCardActions_Clients_IdClient",
                        column: x => x.IdClient,
                        principalTable: "Clients",
                        principalColumn: "IdClient",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PendingCardActions_Id",
                table: "PendingCardActions",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PendingCardActions_IdCarte",
                table: "PendingCardActions",
                column: "IdCarte");

            migrationBuilder.CreateIndex(
                name: "IX_PendingCardActions_IdClient_DateCreationUtc",
                table: "PendingCardActions",
                columns: new[] { "IdClient", "DateCreationUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PendingCardActions");
        }
    }
}
