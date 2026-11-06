using Microsoft.Extensions.DependencyInjection;
using SmartStock.Infrastructure.Data;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace SmartStock.Tests;

public class DatabaseInitializationTests
{
    [Fact]
    public async Task ShouldCreateTestDatabaseTables()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();

        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        await TestDatabaseInitializer.InitializeAsync(db);

        Assert.True(
            await db.Database.CanConnectAsync());
    }
}