using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SmartStock.Domain.Entities;
using SmartStock.Infrastructure.Data;
using Xunit;

namespace SmartStock.Tests;

[Collection("Sales Integration Tests")]
public class DashboardTopProductsTests
{
    private static HttpClient CreateClient(
        CustomWebApplicationFactory factory,
        int userId)
    {
        var client = factory.CreateClient();
        var token = TestJwtTokenGenerator.GenerateToken(userId, "Staff");

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        return client;
    }

    [Fact]
    public async Task GetTopProducts_WithoutToken_ReturnsUnauthorized()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/sales/top-products?start=2026-11-14&end=2026-11-20");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTopProducts_InvalidRange_ReturnsBadRequest()
    {
        using var factory = new CustomWebApplicationFactory();
        using var client = CreateClient(factory, 1);

        var response = await client.GetAsync(
            "/api/sales/top-products?start=2026-11-20&end=2026-11-14");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetTopProducts_AggregatesOnlySalesInsideRange()
    {
        using var factory = new CustomWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        await TestDatabaseInitializer.InitializeAsync(db);

        var userId = await SalesTestData.CreateTestUserAsync(db);
        var productId = await SalesTestData.CreateTestProductAsync(db);

        try
        {
            var today = DateTime.Now.Date;

            var inRangeOne = new Sale
            {
                UserId = userId,
                SoldAt = today.AddHours(10),
                TotalAmount = 30m,
                Status = "COMPLETED"
            };
            var inRangeTwo = new Sale
            {
                UserId = userId,
                SoldAt = today.AddHours(15),
                TotalAmount = 40m,
                Status = "COMPLETED"
            };
            var outOfRange = new Sale
            {
                UserId = userId,
                SoldAt = today.AddDays(-8).AddHours(10),
                TotalAmount = 1000m,
                Status = "COMPLETED"
            };

            db.Sales.AddRange(inRangeOne, inRangeTwo, outOfRange);
            await db.SaveChangesAsync();

            db.SaleItems.AddRange(
                new SaleItem
                {
                    SaleId = inRangeOne.SaleId,
                    ProductId = productId,
                    Quantity = 3m,
                    UnitPrice = 10m,
                    UnitCost = 5m
                },
                new SaleItem
                {
                    SaleId = inRangeTwo.SaleId,
                    ProductId = productId,
                    Quantity = 4m,
                    UnitPrice = 10m,
                    UnitCost = 5m
                },
                new SaleItem
                {
                    SaleId = outOfRange.SaleId,
                    ProductId = productId,
                    Quantity = 100m,
                    UnitPrice = 10m,
                    UnitCost = 5m
                });
            await db.SaveChangesAsync();

            using var client = CreateClient(factory, userId);
            var start = today.AddDays(-6).ToString("yyyy-MM-dd");
            var end = today.ToString("yyyy-MM-dd");

            var response = await client.GetAsync(
                $"/api/sales/top-products?start={start}&end={end}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var payload = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

            var result = payload.RootElement
                .EnumerateArray()
                .Where(item => item.GetProperty("productId").GetInt32() == productId)
                .ToList();

            Assert.Single(result);
            Assert.Equal(7m, result[0].GetProperty("quantity").GetDecimal());
        }
        finally
        {
            await SalesTestCleanup.CleanupAsync(db, userId, productId);
        }
    }

    [Fact]
    public async Task GetTopProducts_InclusiveStartExclusiveEndAtMidnight()
    {
        using var factory = new CustomWebApplicationFactory();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider
            .GetRequiredService<SmartStockDbContext>();

        await TestDatabaseInitializer.InitializeAsync(db);

        var userId = await SalesTestData.CreateTestUserAsync(db);
        var productId = await SalesTestData.CreateTestProductAsync(db);

        try
        {
            var sales = new[]
            {
                new Sale
                {
                    UserId = userId,
                    SoldAt = new DateTime(2026, 11, 14, 0, 0, 0),
                    TotalAmount = 10m,
                    Status = "COMPLETED"
                },
                new Sale
                {
                    UserId = userId,
                    SoldAt = new DateTime(2026, 11, 20, 23, 59, 59),
                    TotalAmount = 20m,
                    Status = "COMPLETED"
                },
                new Sale
                {
                    UserId = userId,
                    SoldAt = new DateTime(2026, 11, 13, 23, 59, 59),
                    TotalAmount = 1000m,
                    Status = "COMPLETED"
                },
                new Sale
                {
                    UserId = userId,
                    SoldAt = new DateTime(2026, 11, 21, 0, 0, 0),
                    TotalAmount = 1000m,
                    Status = "COMPLETED"
                }
            };

            db.Sales.AddRange(sales);
            await db.SaveChangesAsync();

            db.SaleItems.AddRange(sales.Select((sale, index) => new SaleItem
            {
                SaleId = sale.SaleId,
                ProductId = productId,
                Quantity = index < 2 ? 1m : 100m,
                UnitPrice = 10m,
                UnitCost = 5m
            }));
            await db.SaveChangesAsync();

            using var client = CreateClient(factory, userId);

            var response = await client.GetAsync(
                "/api/sales/top-products?start=2026-11-14&end=2026-11-20");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var payload = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());

            var result = payload.RootElement
                .EnumerateArray()
                .Where(item => item.GetProperty("productId").GetInt32() == productId)
                .ToList();

            Assert.Single(result);
            Assert.Equal(2m, result[0].GetProperty("quantity").GetDecimal());
        }
        finally
        {
            await SalesTestCleanup.CleanupAsync(db, userId, productId);
        }
    }
}
