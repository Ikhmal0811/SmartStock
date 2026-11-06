using Npgsql;
using Xunit;

namespace SmartStock.Tests;

public class DatabaseConnectionTests
{
    [Fact]
    public async Task ShouldConnectToTestDatabase()
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__TestConnection");

        Assert.False(string.IsNullOrWhiteSpace(connectionString));

        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("smartstock_test_db", builder.Database?.Trim());

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        await using var command =
            new NpgsqlCommand("SELECT current_database()", connection);

        var databaseName = (string?)await command.ExecuteScalarAsync();

        Assert.Equal("smartstock_test_db", databaseName);
    }
}