using Microsoft.EntityFrameworkCore;
using SmartStock.Infrastructure.Data;

namespace SmartStock.Tests;

public static class SalesTestCleanup
{
    public static async Task CleanupAsync(
        SmartStockDbContext db,
        int userId,
        int productId)
    {
        var connection = db.Database.GetDbConnection();

        await db.Database.OpenConnectionAsync();

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT current_database()";

            var databaseName =
                (string?)await command.ExecuteScalarAsync();

            if (databaseName != "smartstock_test_db")
            {
                throw new InvalidOperationException(
                    "Cleanup is only allowed in smartstock_test_db.");
            }
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }

        await using var transaction =
            await db.Database.BeginTransactionAsync();

        var user = await db.Users
            .AsNoTracking()
            .SingleAsync(u => u.UserId == userId);

        var product = await db.Products
            .AsNoTracking()
            .SingleAsync(p => p.ProductId == productId);

        var saleIds = db.Sales
            .Where(s => s.UserId == userId)
            .Select(s => s.SaleId);

        await db.StockMovements
            .Where(m => m.ProductId == productId ||
                        (m.SaleId.HasValue &&
                         saleIds.Contains(m.SaleId.Value)))
            .ExecuteDeleteAsync();

        await db.SaleItems
            .Where(i => saleIds.Contains(i.SaleId))
            .ExecuteDeleteAsync();

        await db.Sales
            .Where(s => s.UserId == userId)
            .ExecuteDeleteAsync();

        await db.Products
            .Where(p => p.ProductId == productId)
            .ExecuteDeleteAsync();

        await db.Users
            .Where(u => u.UserId == userId)
            .ExecuteDeleteAsync();

        await db.Categories
            .Where(c => c.CategoryId == product.CategoryId)
            .ExecuteDeleteAsync();

        await db.Roles
            .Where(r => r.RoleId == user.RoleId)
            .ExecuteDeleteAsync();

        await transaction.CommitAsync();
    }
}