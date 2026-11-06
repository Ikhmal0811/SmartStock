using System.Net;
using Xunit;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SmartStock.Infrastructure.Data;

namespace SmartStock.Tests;

[Collection("Sales Integration Tests")]
public class SalesApiIntegrationTests
{
    [Fact]
    public async Task GetSales_WithoutToken_ReturnsUnauthorized()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/sales");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Fact]
    public async Task GetSales_WithStaffToken_ReturnsSuccess()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var token = TestJwtTokenGenerator.GenerateToken(
            userId: 1,
            role: "Staff");

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", token);

        var response = await client.GetAsync("/api/sales");

        Assert.Equal(
            System.Net.HttpStatusCode.OK,
            response.StatusCode);
    }

    [Fact]
    public async Task GetSales_WithAdminToken_ReturnsSuccess()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var token = TestJwtTokenGenerator.GenerateToken(
            userId: 1,
            role: "Admin");

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", token);

        var response = await client.GetAsync("/api/sales");

        Assert.Equal(
            System.Net.HttpStatusCode.OK,
            response.StatusCode);
    }


    [Fact]
    public async Task CreateSale_ShouldDeductStock()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        // Arrange: create test records
        int userId;
        int productId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            userId = await SalesTestData.CreateTestUserAsync(db);
            productId = await SalesTestData.CreateTestProductAsync(db);
        }
        try
        {
            // Arrange: authenticate as Staff
            var token = TestJwtTokenGenerator.GenerateToken(userId, "Staff");

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            // Act: sell 3 units
            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[]
                    {
                new { productId, quantity = 3 }
                    }
                });

            // Assert: sale was created
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);


            // Assert: stock was deducted
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                var product = await db.Products
                    .AsNoTracking()
                    .SingleAsync(p => p.ProductId == productId);

                Assert.Equal(7m, product.StockOnHand);

                var saleItem = await db.SaleItems
        .AsNoTracking()
        .SingleAsync(i => i.ProductId == productId);

                var sale = await db.Sales
                    .AsNoTracking()
                    .SingleAsync(s => s.SaleId == saleItem.SaleId);

                Assert.Equal(60m, sale.TotalAmount);

                var movement = await db.StockMovements
                    .AsNoTracking()
                    .SingleAsync(m =>
                        m.SaleId == sale.SaleId &&
                        m.ProductId == productId);

                Assert.Equal(-3m, movement.QuantityChange);
                Assert.Equal("SALE", movement.MovementType);
            }

        }
        finally
        {
            using var cleanupScope = factory.Services.CreateScope();

            var db = cleanupScope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            await SalesTestCleanup.CleanupAsync(db, userId, productId);
        }
      


        

        
    }

    [Fact]
    public async Task CreateSale_InsufficientStock_ShouldNotDeductStock()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        int userId;
        int productId;

        
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                userId = await SalesTestData.CreateTestUserAsync(db);
                productId = await SalesTestData.CreateTestProductAsync(db);
            }

            var token = TestJwtTokenGenerator.GenerateToken(userId, "Staff");

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[]
                    {
                new { productId, quantity = 15 }
                    }
                });

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        try
        {
            using (var scope = factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                var product = await db.Products
                    .AsNoTracking()
                    .SingleAsync(p => p.ProductId == productId);

                Assert.Equal(10m, product.StockOnHand);

                Assert.False(await db.SaleItems
                    .AnyAsync(i => i.ProductId == productId));
            }
        
        }
        finally
        {
            using var cleanupScope = factory.Services.CreateScope();

            var db = cleanupScope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            await SalesTestCleanup.CleanupAsync(db, userId, productId);
        }
    }


    [Fact]
    public async Task CreateSale_InvalidProduct_ShouldNotDeductStock()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        int userId;
        int productId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            userId = await SalesTestData.CreateTestUserAsync(db);
            productId = await SalesTestData.CreateTestProductAsync(db);
        }

        try
        {
            var token = TestJwtTokenGenerator.GenerateToken(
                userId, "Staff");

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsJsonAsync(
                "/api/sales",
                new
                {
                    items = new[]
                    {
                    new { productId, quantity = 3 },
                    new { productId = 999999, quantity = 1 }
                    }
                });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            using var scope = factory.Services.CreateScope();

            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            var product = await db.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(10m, product.StockOnHand);

            Assert.False(await db.SaleItems
                .AnyAsync(i => i.ProductId == productId));
        }
        finally
        {
            using var cleanupScope = factory.Services.CreateScope();

            var db = cleanupScope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            await SalesTestCleanup.CleanupAsync(
                db, userId, productId);
        }
    }


    //check failed operation leaves no sale, sale items, or stock movements in the database
    [Fact]
    public async Task CreateSale_DatabaseFailure_ShouldRollback()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        int userId;
        int productId;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            userId = await SalesTestData.CreateTestUserAsync(db);
            productId = await SalesTestData.CreateTestProductAsync(db);
        }

        try
        {

            // create temporary constraint before sales request
            using (var setupScope = factory.Services.CreateScope())
            {
                var db = setupScope.ServiceProvider
                    .GetRequiredService<SmartStockDbContext>();

                await db.Database.ExecuteSqlRawAsync(
                    """
        ALTER TABLE stock_movements
        ADD CONSTRAINT ck_test_reject_sale_movements
        CHECK (movement_type <> 'SALE') NOT VALID;
        """);
            }


            var token = TestJwtTokenGenerator.GenerateToken(
                userId, "Staff");

            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            // The test constraint will reject the SALE movement.
            HttpResponseMessage? response = null;
            Exception? requestException = null;

            try
            {
                response = await client.PostAsJsonAsync(
                    "/api/sales",
                    new
                    {
                        items = new[]
                        {
                        new { productId, quantity = 3 }
                        }
                    });
            }
            catch (Exception ex)
            {
                requestException = ex;
            }

            // The operation must fail, not return 201 Created.
            Assert.True(
                requestException != null ||
                response?.StatusCode == HttpStatusCode.InternalServerError,
                "Expected a database failure.");

            using var verificationScope =
                factory.Services.CreateScope();

            var verificationDb = verificationScope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            // The first SaveChangesAsync must be rolled back.
            Assert.False(await verificationDb.Sales
                .AnyAsync(s => s.UserId == userId));

            Assert.False(await verificationDb.SaleItems
                .AnyAsync(i => i.ProductId == productId));

            Assert.False(await verificationDb.StockMovements
                .AnyAsync(m => m.ProductId == productId));

            var product = await verificationDb.Products
                .AsNoTracking()
                .SingleAsync(p => p.ProductId == productId);

            Assert.Equal(10m, product.StockOnHand);
        }
        finally
        {
            using var cleanupScope = factory.Services.CreateScope();

            var db = cleanupScope.ServiceProvider
                .GetRequiredService<SmartStockDbContext>();

            await db.Database.ExecuteSqlRawAsync(
                """
        ALTER TABLE stock_movements
        DROP CONSTRAINT IF EXISTS ck_test_reject_sale_movements;
        """);

            await SalesTestCleanup.CleanupAsync(
                db, userId, productId);
        }
    }
}