using SmartStock.Infrastructure.Data;
using SmartStock.Domain.Entities;

namespace SmartStock.Tests;

public static class SalesTestData
{
    public static async Task<int> CreateTestUserAsync(
        SmartStockDbContext db)
    {
        var role = new Role
        {
            RoleName = $"TestStaff_{Guid.NewGuid():N}"
        };

        db.Roles.Add(role);
        await db.SaveChangesAsync();

        var user = new User
        {
            RoleId = role.RoleId,
            FullName = "Integration Test Staff",
            Email = $"staff_{Guid.NewGuid():N}@test.local",
            PasswordHash = "TEST_ONLY_NOT_FOR_LOGIN",
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return user.UserId;
    }


    public static async Task<int> CreateTestProductAsync(
    SmartStockDbContext db)
    {
        var category = new Category
        {
            CategoryName = $"TestCategory_{Guid.NewGuid():N}"
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var product = new Product
        {
            CategoryId = category.CategoryId,
            SupplierId = null,
            Sku = $"TEST-{Guid.NewGuid():N}",
            ProductName = "Integration Test Product",
            SellingPrice = 20m,
            CostPrice = 10m,
            StockOnHand = 10m,
            ReorderLevel = 2m,
            CreatedAt = DateTime.Now
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        return product.ProductId;
    }
}