using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SmartStock.Infrastructure.Data;
using Xunit;

namespace SmartStock.Tests;

public class SalesWorkflowIntegrationTests
{
    private static async Task<(int UserId, int ProductId)> CreatePairAsync(
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

    private static HttpClient CreateClient(
        CustomWebApplicationFactory factory,
        int userId,
        string role = "Staff")
    {
        var client = factory.CreateClient();
        var token = TestJwtTokenGenerator.GenerateToken(userId, role);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    private static async Task CleanupAsync(
        CustomWebApplicationFactory factory,
        params (int UserId, int ProductId)[] pairs)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        foreach (var (userId, productId) in pairs)
        {
            await SalesTestCleanup.CleanupAsync(db, userId, productId);
        }
    }

    [Fact]
    public async Task CreateSale_ArchivedProduct_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        var pair = await CreatePairAsync(factory);

        try
        {
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                var product = await db.Products
                    .SingleAsync(p => p.ProductId == pair.ProductId);

                product.IsArchived = true;
                await db.SaveChangesAsync();
            }

            using var client = CreateClient(factory, pair.UserId);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[] { new { productId = pair.ProductId, quantity = 1 } }
                });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            using var checkScope = factory.Services.CreateScope();
            var checkDb = checkScope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var productAfter = await checkDb.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == pair.ProductId);

            Assert.Equal(10m, productAfter.StockOnHand);
            Assert.False(await checkDb.Sales
                .AnyAsync(s => s.UserId == pair.UserId));
            Assert.False(await checkDb.StockMovements
                .AnyAsync(m => m.ProductId == pair.ProductId));
        }
        finally
        {
            await CleanupAsync(factory, pair);
        }
    }

    [Fact]
    public async Task CreateSale_MultipleProducts_KeepsHistoricalPrices()
    {
        using var factory = new CustomWebApplicationFactory();
        var first = await CreatePairAsync(factory);
        var second = await CreatePairAsync(factory);

        try
        {
            using var client = CreateClient(factory, first.UserId);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[]
                    {
                        new { productId = first.ProductId, quantity = 3 },
                        new { productId = second.ProductId, quantity = 2 }
                    }
                });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            using var body = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());
            var saleId = body.RootElement.GetProperty("saleId").GetInt32();

            Assert.Equal(100m, body.RootElement
                .GetProperty("totalAmount").GetDecimal());

            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                var items = await db.SaleItems
                    .AsNoTracking()
                    .Where(i => i.SaleId == saleId)
                    .ToListAsync();

                Assert.Equal(2, items.Count);
                Assert.All(items, i => Assert.Equal(20m, i.UnitPrice));

                var movements = await db.StockMovements
                    .AsNoTracking()
                    .Where(m => m.SaleId == saleId)
                    .ToListAsync();

                Assert.Equal(2, movements.Count);
                Assert.Contains(movements, m =>
                    m.ProductId == first.ProductId && m.QuantityChange == -3m);
                Assert.Contains(movements, m =>
                    m.ProductId == second.ProductId && m.QuantityChange == -2m);

                Assert.Equal(7m, (await db.Products.AsNoTracking()
                    .SingleAsync(p => p.ProductId == first.ProductId)).StockOnHand);
                Assert.Equal(8m, (await db.Products.AsNoTracking()
                    .SingleAsync(p => p.ProductId == second.ProductId)).StockOnHand);

                var product = await db.Products
                    .SingleAsync(p => p.ProductId == first.ProductId);
                product.SellingPrice = 99m;
                await db.SaveChangesAsync();
            }

            var detail = await client.GetAsync($"/api/sales/{saleId}");

            Assert.Equal(HttpStatusCode.OK, detail.StatusCode);

            using var detailBody = JsonDocument.Parse(
                await detail.Content.ReadAsStringAsync());

            var recorded = detailBody.RootElement
                .GetProperty("items")
                .EnumerateArray()
                .Single(i => i.GetProperty("productId").GetInt32() == first.ProductId);

            Assert.Equal(20m, recorded.GetProperty("unitPrice").GetDecimal());
        }
        finally
        {
            await CleanupAsync(factory, first, second);
        }
    }

    [Fact]
    public async Task CreateSale_DuplicateLines_AreMergedIntoOneItem()
    {
        using var factory = new CustomWebApplicationFactory();
        var pair = await CreatePairAsync(factory);

        try
        {
            using var client = CreateClient(factory, pair.UserId);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[]
                    {
                        new { productId = pair.ProductId, quantity = 2 },
                        new { productId = pair.ProductId, quantity = 3 }
                    }
                });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var item = await db.SaleItems
                .AsNoTracking()
                .SingleAsync(i => i.ProductId == pair.ProductId);

            Assert.Equal(5m, item.Quantity);

            var movement = await db.StockMovements
                .AsNoTracking()
                .SingleAsync(m => m.ProductId == pair.ProductId);

            Assert.Equal(-5m, movement.QuantityChange);

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == pair.ProductId);

            Assert.Equal(5m, product.StockOnHand);
        }
        finally
        {
            await CleanupAsync(factory, pair);
        }
    }

    [Fact]
    public async Task CreateSale_WithoutToken_ReturnsUnauthorized()
    {
        using var factory = new CustomWebApplicationFactory();
        var pair = await CreatePairAsync(factory);

        try
        {
            using var client = factory.CreateClient();

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[] { new { productId = pair.ProductId, quantity = 1 } }
                });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
        finally
        {
            await CleanupAsync(factory, pair);
        }
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateSale_InvalidQuantity_LeavesInventoryUnchanged(decimal quantity)
    {
        using var factory = new CustomWebApplicationFactory();
        var pair = await CreatePairAsync(factory);

        try
        {
            using var client = CreateClient(factory, pair.UserId);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[] { new { productId = pair.ProductId, quantity } }
                });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == pair.ProductId);

            Assert.Equal(10m, product.StockOnHand);
            Assert.False(await db.Sales
                .AnyAsync(s => s.UserId == pair.UserId));
            Assert.False(await db.StockMovements
                .AnyAsync(m => m.ProductId == pair.ProductId));
        }
        finally
        {
            await CleanupAsync(factory, pair);
        }
    }

    [Fact]
    public async Task CreateSale_NonexistentProduct_ReturnsNotFound()
    {
        using var factory = new CustomWebApplicationFactory();
        var pair = await CreatePairAsync(factory);

        try
        {
            using var client = CreateClient(factory, pair.UserId);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[] { new { productId = 999999, quantity = 1 } }
                });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            Assert.False(await db.Sales
                .AnyAsync(s => s.UserId == pair.UserId));
            Assert.False(await db.StockMovements
                .AnyAsync(m => m.ProductId == pair.ProductId));
        }
        finally
        {
            await CleanupAsync(factory, pair);
        }
    }
}
