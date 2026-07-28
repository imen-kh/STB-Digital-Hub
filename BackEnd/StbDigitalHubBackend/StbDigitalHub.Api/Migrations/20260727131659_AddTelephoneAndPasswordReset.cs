using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StbDigitalHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTelephoneAndPasswordReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('Clients', 'Telephone') IS NULL
                BEGIN
                    ALTER TABLE [Clients] ADD [Telephone] nvarchar(30) NOT NULL CONSTRAINT DF_Clients_Telephone DEFAULT N'';
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[PasswordResetTokens]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [PasswordResetTokens] (
                        [Id] uniqueidentifier NOT NULL,
                        [IdClient] bigint NOT NULL,
                        [TokenHash] nvarchar(128) NOT NULL,
                        [CreatedAtUtc] datetime2 NOT NULL,
                        [ExpiresAtUtc] datetime2 NOT NULL,
                        [UsedAtUtc] datetime2 NULL,
                        CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_PasswordResetTokens_Clients_IdClient] FOREIGN KEY ([IdClient]) REFERENCES [Clients] ([IdClient]) ON DELETE CASCADE
                    );
                    CREATE INDEX [IX_PasswordResetTokens_IdClient] ON [PasswordResetTokens] ([IdClient]);
                    CREATE UNIQUE INDEX [IX_PasswordResetTokens_TokenHash] ON [PasswordResetTokens] ([TokenHash]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[PasswordResetTokens]', N'U') IS NOT NULL
                    DROP TABLE [PasswordResetTokens];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('Clients', 'Telephone') IS NOT NULL
                    ALTER TABLE [Clients] DROP COLUMN [Telephone];
                """);
        }
    }
}
