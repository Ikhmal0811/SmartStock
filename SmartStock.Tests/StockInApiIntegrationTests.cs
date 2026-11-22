using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SmartStock.Infrastructure.Data;
using Xunit;

namespace SmartStock.Tests;

public class StockInApiIntegrationTests
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

    private static async Task<(decimal Stock, int MovementCount, string? Reference)>
        ReadStateAsync(CustomWebApplicationFactory factory, int productId)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        var product = await db.Products
            .AsNoTracking()
            .SingleAsync(p => p.ProductId == productId);

        var movements = await db.StockMovements
            .AsNoTracking()
            .Where(m => m.ProductId == productId)
            .ToListAsync();

        return (
            product.StockOnHand,
            movements.Count,
            movements.SingleOrDefault()?.Reference);
    }

    [Fact]
    public async Task StockIn_WithValidReference_PersistsAndReturnsItInHistory()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new
                {
                    productId,
                    quantity = 3m,
                    supplierId = (int?)null,
                    reference = "  PO-2026-001  "
                });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var (stock, count, reference) =
                await ReadStateAsync(factory, productId);

            Assert.Equal(13m, stock);
            Assert.Equal(1, count);
            Assert.Equal("PO-2026-001", reference);

            var history = await client.GetAsync(
                $"/api/stock-movements?productId={productId}");

            Assert.Equal(HttpStatusCode.OK, history.StatusCode);

            using var body = JsonDocument.Parse(
                await history.Content.ReadAsStringAsync());

            var first = body.RootElement.GetProperty("data")[0];

            Assert.Equal(
                "PO-2026-001",
                first.GetProperty("reference").GetString());
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockIn_WithoutReference_SavesNullReference()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new { productId, quantity = 2m });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var (stock, count, reference) =
                await ReadStateAsync(factory, productId);

            Assert.Equal(12m, stock);
            Assert.Equal(1, count);
            Assert.Null(reference);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockIn_ReferenceTooLong_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new
                {
                    productId,
                    quantity = 1m,
                    reference = new string('X', 101)
                });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var (stock, count, _) =
                await ReadStateAsync(factory, productId);

            Assert.Equal(10m, stock);
            Assert.Equal(0, count);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockIn_ArchivedProduct_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                var setupProduct = await db.Products
                    .SingleAsync(p => p.ProductId == productId);

                setupProduct.IsArchived = true;
                await db.SaveChangesAsync();
            }

            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new { productId, quantity = 1m });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var (stock, count, _) =
                await ReadStateAsync(factory, productId);

            Assert.Equal(10m, stock);
            Assert.Equal(0, count);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockIn_WithStaffToken_ReturnsForbidden()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Staff");

            var response = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new { productId, quantity = 1m });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

            var (stock, count, _) =
                await ReadStateAsync(factory, productId);

            Assert.Equal(10m, stock);
            Assert.Equal(0, count);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }

    [Fact]
    public async Task StockIn_InvalidSupplierOrQuantity_LeavesInventoryUnchanged()
    {
        using var factory = new CustomWebApplicationFactory();
        var (userId, productId) = await CreateTestDataAsync(factory);

        try
        {
            using var client = CreateAuthenticatedClient(
                factory, userId, "Admin");

            var invalidSupplier = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new { productId, quantity = 1m, supplierId = 999999 });

            Assert.Equal(HttpStatusCode.BadRequest, invalidSupplier.StatusCode);

            var invalidQuantity = await client.PostAsJsonAsync(
                "/api/stock-movements/stock-in",
                new { productId, quantity = 0m });

            Assert.Equal(HttpStatusCode.BadRequest, invalidQuantity.StatusCode);

            var (stock, count, _) =
                await ReadStateAsync(factory, productId);

            Assert.Equal(10m, stock);
            Assert.Equal(0, count);
        }
        finally
        {
            await CleanupAsync(factory, userId, productId);
        }
    }
}
