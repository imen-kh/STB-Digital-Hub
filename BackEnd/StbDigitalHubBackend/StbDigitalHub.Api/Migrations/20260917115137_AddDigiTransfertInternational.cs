using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDigiTransfertInternational : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Devise",
                table: "Virements",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "MontantDevise",
                table: "Virements",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Pays",
                table: "Virements",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TauxChange",
                table: "Virements",
                type: "decimal(18,6)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Virements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Devise",
                table: "Beneficiaires",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Iban",
                table: "Beneficiaires",
                type: "nvarchar(34)",
                maxLength: 34,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Pays",
                table: "Beneficiaires",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Swift",
                table: "Beneficiaires",
                type: "nvarchar(11)",
                maxLength: 11,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Beneficiaires",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Devise",
                table: "Virements");

            migrationBuilder.DropColumn(
                name: "MontantDevise",
                table: "Virements");

            migrationBuilder.DropColumn(
                name: "Pays",
                table: "Virements");

            migrationBuilder.DropColumn(
                name: "TauxChange",
                table: "Virements");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Virements");

            migrationBuilder.DropColumn(
                name: "Devise",
                table: "Beneficiaires");

            migrationBuilder.DropColumn(
                name: "Iban",
                table: "Beneficiaires");

            migrationBuilder.DropColumn(
                name: "Pays",
                table: "Beneficiaires");

            migrationBuilder.DropColumn(
                name: "Swift",
                table: "Beneficiaires");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Beneficiaires");
        }
    }
}
