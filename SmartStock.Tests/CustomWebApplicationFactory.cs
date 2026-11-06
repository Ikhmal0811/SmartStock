using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;
using SmartStock.Infrastructure.Data;
using Microsoft.Extensions.Configuration;

namespace SmartStock.Tests;

public class CustomWebApplicationFactory
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(
        IWebHostBuilder builder)
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__TestConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Test database connection is missing.");
        }

        var connectionBuilder =
            new NpgsqlConnectionStringBuilder(connectionString);

        if (string.IsNullOrWhiteSpace(connectionBuilder.Database) ||
    !string.Equals(
        connectionBuilder.Database.Trim(),
        "smartstock_test_db",
        StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Integration tests must use smartstock_test_db.");
        }

        if (!string.Equals(
            connectionBuilder.Database,
            "smartstock_test_db",
            StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Integration tests must use smartstock_test_db.");
        }

        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Jwt:Key"] = "SmartStockIntegrationTestSecretKey1234567890",
                    ["Jwt:Issuer"] = "SmartStock.Tests",
                    ["Jwt:Audience"] = "SmartStock.Tests"
                });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<
                DbContextOptions<SmartStockDbContext>>();

            services.AddDbContext<SmartStockDbContext>(
                options => options.UseNpgsql(connectionString));
        });
    }
}