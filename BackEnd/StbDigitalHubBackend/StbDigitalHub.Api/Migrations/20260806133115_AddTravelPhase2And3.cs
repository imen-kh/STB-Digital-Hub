using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTravelPhase2And3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AlertesMarteActives",
                table: "CartesBancaires",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateDebutEcommerceIntl",
                table: "CartesBancaires",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateFinEcommerceIntl",
                table: "CartesBancaires",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DevisePreferee",
                table: "CartesBancaires",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "EcommerceInternationalActif",
                table: "CartesBancaires",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlertesMarteActives",
                table: "CartesBancaires");

            migrationBuilder.DropColumn(
                name: "DateDebutEcommerceIntl",
                table: "CartesBancaires");

            migrationBuilder.DropColumn(
                name: "DateFinEcommerceIntl",
                table: "CartesBancaires");

            migrationBuilder.DropColumn(
                name: "DevisePreferee",
                table: "CartesBancaires");

            migrationBuilder.DropColumn(
                name: "EcommerceInternationalActif",
                table: "CartesBancaires");
        }
    }
}
