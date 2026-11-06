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
    }
}