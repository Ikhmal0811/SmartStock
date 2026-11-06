using Microsoft.Extensions.DependencyInjection;
using SmartStock.Infrastructure.Data;
using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SmartStock.Infrastructure.Data;

namespace SmartStock.Tests;

public class ApiStartupTests
{
    [Fact]
    public void ApiShouldStartInTestingEnvironment()
    {
        using var factory = new CustomWebApplicationFactory();

        using var client = factory.CreateClient();

        Assert.NotNull(client);
    }

    [Fact]
    public async Task ApiShouldUseTestDatabase()
    {
        using var factory = new CustomWebApplicationFactory();

        using var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();

        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        var connection = db.Database.GetDbConnection();

        await connection.OpenAsync();

        try
        {
            await using var command = connection.CreateCommand();

            command.CommandText = "SELECT current_database()";

            var databaseName = await command.ExecuteScalarAsync();

            Assert.Equal("smartstock_test_db", databaseName?.ToString());
        }
        finally
        {
            await connection.CloseAsync();
        }
    }
}