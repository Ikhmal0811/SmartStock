using Microsoft.EntityFrameworkCore;
using Npgsql;
using SmartStock.Infrastructure.Data;

namespace SmartStock.Tests;

public static class TestDatabaseInitializer
{
    public static async Task InitializeAsync(
        SmartStockDbContext db)
    {
        var connection = db.Database.GetDbConnection();

        var builder = new NpgsqlConnectionStringBuilder(
            connection.ConnectionString);

        if (builder.Database != "smartstock_test_db")
        {
            throw new InvalidOperationException(
                "Refusing to initialize a non-test database.");
        }

        await connection.OpenAsync();

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT current_database()";

            var databaseName =
                (string?)await command.ExecuteScalarAsync();

            if (databaseName != "smartstock_test_db")
            {
                throw new InvalidOperationException(
                    "Connected database is not smartstock_test_db.");
            }
        }
        finally
        {
            await connection.CloseAsync();
        }

        await db.Database.EnsureCreatedAsync();

        // The test database uses EnsureCreated, so migrations are not applied.
        // Patch columns introduced by later migrations when an older schema exists.
        await db.Database.ExecuteSqlRawAsync(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'products'
                      AND column_name = 'IsArchived'
                ) THEN
                    ALTER TABLE products
                    ADD COLUMN "IsArchived" boolean NOT NULL DEFAULT false;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'stock_movements'
                      AND column_name = 'reason'
                ) THEN
                    ALTER TABLE stock_movements
                    ADD COLUMN reason character varying(200);
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'stock_movements'
                      AND column_name = 'Reference'
                ) THEN
                    ALTER TABLE stock_movements
                    ADD COLUMN "Reference" character varying(100);
                END IF;
            END $$;
            """);
    }
}