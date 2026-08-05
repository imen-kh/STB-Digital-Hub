using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStbTravelCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Devise",
                table: "TransactionsCarte",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MontantDevise",
                table: "TransactionsCarte",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pays",
                table: "TransactionsCarte",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AllocationAnnuelle",
                table: "CartesBancaires",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "AllocationConsommeeAnnee",
                table: "CartesBancaires",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "AnneeAllocation",
                table: "CartesBancaires",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Devise",
                table: "TransactionsCarte");

            migrationBuilder.DropColumn(
                name: "MontantDevise",
                table: "TransactionsCarte");

            migrationBuilder.DropColumn(
                name: "Pays",
                table: "TransactionsCarte");

            migrationBuilder.DropColumn(
                name: "AllocationAnnuelle",
                table: "CartesBancaires");

            migrationBuilder.DropColumn(
                name: "AllocationConsommeeAnnee",
                table: "CartesBancaires");

            migrationBuilder.DropColumn(
                name: "AnneeAllocation",
                table: "CartesBancaires");
        }
    }
}
