using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SmartStock.Domain.Entities;
using SmartStock.Infrastructure.Data;
using Xunit;

namespace SmartStock.Tests;

public class StockOutApiIntegrationTests
{
    private static async Task<(int UserId, int ProductId)> CreateTestDataAsync(
        CustomWebApplicationFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        await TestDatabaseInitializer.InitializeAsync(db);

        var userId = await SalesTestData.CreateTestUserAsync(db);
        var productId = await SalesTestData.CreateTestProductAsync(db);

        return (userId, productId);
    }

    private static HttpClient CreateAuthenticatedClient(
        CustomWebApplicationFactory factory,
        int userId,
        string role)
    {
        var client = factory.CreateClient();
        var token = TestJwtTokenGenerator.GenerateToken(userId, role);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    private static async Task CleanupAsync(
        CustomWebApplicationFactory factory,
        int userId,
        int productId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        await SalesTestCleanup.CleanupAsync(db, userId, productId);
    }

    [Fact]
    public async Task StockOut_WithAdminToken_DeductsStockAndPersistsReason()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new
                {
                    productId,
                    quantity = 3m,
                    reason = "Damaged during storage"
                });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var body = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

            Assert.Equal(
                "Damaged during storage",
                body.RootElement.GetProperty("reason").GetString());

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(7m, product.StockOnHand);

            var movement = await db.StockMovements
                .AsNoTracking()
                .SingleAsync(m =>
                    m.ProductId == productId &&
                    m.MovementType == "ADJUSTMENT");

            Assert.Equal(-3m, movement.QuantityChange);
            Assert.Equal("Damaged during storage", movement.Reason);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockOut_WithStaffToken_ReturnsForbidden()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Staff");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new
                {
                    productId,
                    quantity = 1m,
                    reason = "Staff attempt"
                });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(10m, product.StockOnHand);
            Assert.False(await db.StockMovements
                .AnyAsync(m => m.ProductId == productId));
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockOut_MissingReason_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new { productId, quantity = 1m, reason = "" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(10m, product.StockOnHand);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockOut_ZeroQuantity_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new
                {
                    productId,
                    quantity = 0m,
                    reason = "Valid reason"
                });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockOut_InsufficientStock_ReturnsConflict()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new
                {
                    productId,
                    quantity = 15m,
                    reason = "Valid reason"
                });

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(10m, product.StockOnHand);
            Assert.False(await db.StockMovements
                .AnyAsync(m => m.ProductId == productId));
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockOut_InvalidProduct_ReturnsNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new
                {
                    productId = 999999,
                    quantity = 1m,
                    reason = "Valid reason"
                });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockOut_ArchivedProduct_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using (var setupScope = factory.Services.CreateScope())
            {
                var setupDb = setupScope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                var setupProduct = await setupDb.Products
                    .SingleAsync(p => p.ProductId == productId);

                setupProduct.IsArchived = true;
                await setupDb.SaveChangesAsync();
            }

            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-out",
                new
                {
                    productId,
                    quantity = 1m,
                    reason = "Valid reason"
                });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(10m, product.StockOnHand);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task GetStockMovements_WithFilters_ReturnsMatchingRecords()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                db.StockMovements.AddRange(
                    new StockMovement
                    {
                        ProductId = productId,
                        MovementType = "STOCK_IN",
                        QuantityChange = 5m,
                        CreatedAt = DateTime.UtcNow
                    },
                    new StockMovement
                    {
                        ProductId = productId,
                        MovementType = "ADJUSTMENT",
                        QuantityChange = -1m,
                        Reason = "Filtered reason",
                        CreatedAt = DateTime.UtcNow
                    });

                await db.SaveChangesAsync();
            }

            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.GetAsync(
                $"/api/stock-movements?productId={productId}" +
                "&movementType=ADJUSTMENT" +
                "&fromDate=2020-01-01T00:00:00Z" +
                "&page=1&pageSize=10");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var body = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

            Assert.Equal(
                1,
                body.RootElement.GetProperty("totalRecords").GetInt32());

            var first = body.RootElement
                .GetProperty("data")[0];

            Assert.Equal(
                "ADJUSTMENT",
                first.GetProperty("movementType").GetString());

            Assert.Equal(
                "Filtered reason",
                first.GetProperty("reason").GetString());
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task GetStockMovements_WithoutToken_ReturnsUnauthorized()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/stock-movements");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
