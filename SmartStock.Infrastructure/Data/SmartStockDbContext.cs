using Microsoft.EntityFrameworkCore;
using SmartStock.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace SmartStock.Infrastructure.Data
{
    public class SmartStockDbContext : DbContext
    {
        public SmartStockDbContext(
       DbContextOptions<SmartStockDbContext> options
   ) : base(options)
        {
        }

        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleItem> SaleItems => Set<SaleItem>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("categories");

                entity.HasKey(e => e.CategoryId);

                entity.Property(e => e.CategoryId)
                      .HasColumnName("category_id");

                entity.Property(e => e.CategoryName)
                      .HasColumnName("category_name")
                      .HasMaxLength(100)
                      .IsRequired();

                entity.HasIndex(e => e.CategoryName)
                      .IsUnique();
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");

                entity.HasKey(e => e.RoleId);

                entity.Property(e => e.RoleId)
                      .HasColumnName("role_id");

                entity.Property(e => e.RoleName)
                      .HasColumnName("role_name")
                      .HasMaxLength(50)
                      .IsRequired();

                entity.HasIndex(e => e.RoleName)
                      .IsUnique();
            });

            //mapping Supplier class to existing PostgreSQL
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("suppliers");

                entity.HasKey(e => e.SupplierId);

                entity.Property(e => e.SupplierId)
                      .HasColumnName("supplier_id");

                entity.Property(e => e.SupplierName)
                      .HasColumnName("supplier_name")
                      .HasMaxLength(150)
                      .IsRequired();

                entity.Property(e => e.Email)
                      .HasColumnName("email")
                      .HasMaxLength(150);

                entity.Property(e => e.Phone)
                      .HasColumnName("phone")
                      .HasMaxLength(30);

                entity.Property(e => e.Address)
                      .HasColumnName("address");
            });


            //ProductName maps to product_name(Postgre)
            modelBuilder.Entity<Product>(entity =>
            {
                entity.ToTable("products");

                entity.ToTable(t =>
                    t.HasCheckConstraint(
                        "CK_products_stock_on_hand_nonnegative",
                        "stock_on_hand >= 0"));

                entity.HasKey(e => e.ProductId);

                entity.Property(e => e.ProductId)
                      .HasColumnName("product_id");

                entity.Property(e => e.CategoryId)
                      .HasColumnName("category_id");

                entity.Property(e => e.SupplierId)
                      .HasColumnName("supplier_id");

                entity.Property(e => e.Sku)
                      .HasColumnName("sku")
                      .HasMaxLength(50)
                      .IsRequired();

                entity.HasIndex(e => e.Sku).IsUnique();

                entity.Property(e => e.ProductName)
                      .HasColumnName("product_name")
                      .HasMaxLength(150)
                      .IsRequired();

                entity.Property(e => e.SellingPrice)
                      .HasColumnName("selling_price")
                      .HasPrecision(12, 2);

                entity.Property(e => e.CostPrice)
                      .HasColumnName("cost_price")
                      .HasPrecision(12, 2);

                entity.Property(e => e.StockOnHand)
                      .HasColumnName("stock_on_hand")
                      .HasPrecision(12, 3);

                entity.Property(e => e.ReorderLevel)
                      .HasColumnName("reorder_level")
                      .HasPrecision(12, 3);

                entity.Property(e => e.CreatedAt)
                      .HasColumnName("created_at")
                      .HasColumnType("timestamp without time zone");

                entity.HasOne<Category>()
                      .WithMany()
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne<Supplier>()
                      .WithMany()
                      .HasForeignKey(e => e.SupplierId)
                      .OnDelete(DeleteBehavior.NoAction);
            });


            
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");

                entity.HasKey(e => e.UserId);

                entity.Property(e => e.UserId)
                      .HasColumnName("user_id");

                entity.Property(e => e.RoleId)
                      .HasColumnName("role_id");

                entity.Property(e => e.FullName)
                      .HasColumnName("full_name")
                      .HasMaxLength(100)
                      .IsRequired();

                entity.Property(e => e.Email)
                      .HasColumnName("email")
                      .HasMaxLength(150)
                      .IsRequired();

                entity.HasIndex(e => e.Email).IsUnique();

                entity.Property(e => e.PasswordHash)
                      .HasColumnName("password_hash")
                      .IsRequired();

                entity.Property(e => e.IsActive)
                      .HasColumnName("is_active")
                      .HasDefaultValue(true);

                entity.Property(e => e.CreatedAt)
                      .HasColumnName("created_at")
                      .HasColumnType("timestamp without time zone")
                      .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne<Role>()
                      .WithMany()
                      .HasForeignKey(e => e.RoleId)
                      .OnDelete(DeleteBehavior.NoAction);
            });


            modelBuilder.Entity<Sale>(entity =>
            {
                entity.ToTable("sales");

                entity.HasKey(e => e.SaleId);

                entity.Property(e => e.SaleId)
                      .HasColumnName("sale_id");

                entity.Property(e => e.UserId)
                      .HasColumnName("user_id");

                entity.Property(e => e.SoldAt)
                      .HasColumnName("sold_at")
                      .HasColumnType("timestamp without time zone")
                      .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.TotalAmount)
                      .HasColumnName("total_amount")
                      .HasPrecision(12, 2)
                      .HasDefaultValue(0m);

                entity.Property(e => e.Status)
                      .HasColumnName("status")
                      .HasMaxLength(20)
                      .HasDefaultValue("COMPLETED")
                      .IsRequired();

                entity.HasOne<User>()
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.NoAction);
            });


            modelBuilder.Entity<SaleItem>(entity =>
            {
                entity.ToTable("sale_items");

                entity.HasKey(e => e.SaleItemId);

                entity.Property(e => e.SaleItemId)
                      .HasColumnName("sale_item_id");

                entity.Property(e => e.SaleId)
                      .HasColumnName("sale_id");

                entity.Property(e => e.ProductId)
                      .HasColumnName("product_id");

                entity.Property(e => e.Quantity)
                      .HasColumnName("quantity")
                      .HasPrecision(12, 3);

                entity.Property(e => e.UnitPrice)
                      .HasColumnName("unit_price")
                      .HasPrecision(12, 2);

                entity.Property(e => e.UnitCost)
                      .HasColumnName("unit_cost")
                      .HasPrecision(12, 2);

                entity.HasOne<Sale>()
                      .WithMany()
                      .HasForeignKey(e => e.SaleId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne<Product>()
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.NoAction);
            });



            modelBuilder.Entity<StockMovement>(entity =>
            {
                entity.ToTable("stock_movements");

                entity.HasKey(e => e.MovementId);

                entity.Property(e => e.MovementId)
                      .HasColumnName("movement_id");

                entity.Property(e => e.ProductId)
                      .HasColumnName("product_id");

                entity.Property(e => e.SaleId)
                      .HasColumnName("sale_id");

                entity.Property(e => e.SupplierId)
                      .HasColumnName("supplier_id");

                entity.Property(e => e.MovementType)
                      .HasColumnName("movement_type")
                      .HasMaxLength(30)
                      .IsRequired();

                entity.Property(e => e.QuantityChange)
                      .HasColumnName("quantity_change")
                      .HasPrecision(12, 3);

                entity.Property(e => e.CreatedAt)
                  .HasColumnName("created_at")
                  .HasColumnType("timestamp with time zone")
                  .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne<Product>()
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne<Sale>()
                      .WithMany()
                      .HasForeignKey(e => e.SaleId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne<Supplier>()
                      .WithMany()
                      .HasForeignKey(e => e.SupplierId)
                      .OnDelete(DeleteBehavior.NoAction);
            });


        }


    }
}
