using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Infrastructure.Data;
using SmartStock.Application.DTOs;
using SmartStock.Domain.Entities;
using Microsoft.AspNetCore.Authorization;


namespace SmartStock.API.Controllers
{
    [ApiController]
    [Route("api/products")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly SmartStockDbContext _context;

        public ProductsController(SmartStockDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _context.Products
                .AsNoTracking()
                .ToListAsync();

            return Ok(products);
        }


        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetProductById(int id)
        {
            var product = await _context.Products
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            return Ok(product);
        }



        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct(
            [FromBody] CreateProductDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductName) ||
                string.IsNullOrWhiteSpace(dto.Sku))
            {
                return BadRequest("Product name and SKU are required.");
            }

            if (dto.SellingPrice < 0 || dto.CostPrice < 0 ||
                dto.StockOnHand < 0 || dto.ReorderLevel < 0)
            {
                return BadRequest("Prices and quantities cannot be negative.");
            }

            bool categoryExists = await _context.Categories
    .AnyAsync(c => c.CategoryId == dto.CategoryId);

            if (!categoryExists)
            {
                return BadRequest("Invalid category ID.");
            }



            if (dto.SupplierId.HasValue)
            {
                bool supplierExists = await _context.Suppliers
                    .AnyAsync(s => s.SupplierId == dto.SupplierId.Value);

                if (!supplierExists)
                {
                    return BadRequest("Invalid supplier ID.");
                }
            }


            string sku = dto.Sku.Trim();

            bool skuExists = await _context.Products
                .AnyAsync(p => p.Sku == sku);

            if (skuExists)
            {
                return Conflict("Product SKU already exists.");
            }



            var product = new Product
            {
                CategoryId = dto.CategoryId,
                SupplierId = dto.SupplierId,
                Sku = sku,
                ProductName = dto.ProductName.Trim(),
                SellingPrice = dto.SellingPrice,
                CostPrice = dto.CostPrice,
                StockOnHand = dto.StockOnHand,
                ReorderLevel = dto.ReorderLevel
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return StatusCode(201, product);
        }



        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(
    int id, [FromBody] UpdateProductDto dto)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.ProductName) ||
                string.IsNullOrWhiteSpace(dto.Sku))
            {
                return BadRequest("Product name and SKU are required.");
            }

            if (dto.SellingPrice < 0 || dto.CostPrice < 0 ||
                dto.ReorderLevel < 0)
            {
                return BadRequest("Prices and reorder level cannot be negative.");
            }

            // Find the product
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            // Validate category
            bool categoryExists = await _context.Categories
                .AnyAsync(c => c.CategoryId == dto.CategoryId);

            if (!categoryExists)
            {
                return BadRequest("Invalid category ID.");
            }

            // Validate supplier (optional)
            if (dto.SupplierId.HasValue)
            {
                bool supplierExists = await _context.Suppliers
                    .AnyAsync(s => s.SupplierId == dto.SupplierId.Value);

                if (!supplierExists)
                {
                    return BadRequest("Invalid supplier ID.");
                }
            }

            // Check SKU uniqueness
            string sku = dto.Sku.Trim();

            bool skuExists = await _context.Products.AnyAsync(
                p => p.Sku == sku && p.ProductId != id);

            if (skuExists)
            {
                return Conflict("Product SKU already exists.");
            }

            // Update product information
            product.CategoryId = dto.CategoryId;
            product.SupplierId = dto.SupplierId;
            product.Sku = sku;
            product.ProductName = dto.ProductName.Trim();
            product.SellingPrice = dto.SellingPrice;
            product.CostPrice = dto.CostPrice;
            product.ReorderLevel = dto.ReorderLevel;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is Npgsql.PostgresException pgEx
                      && pgEx.SqlState == "23505")
            {
                return Conflict("Product SKU already exists.");
            }

            return Ok(product);
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            bool hasSales = await _context.SaleItems
                .AnyAsync(s => s.ProductId == id);

            bool hasMovements = await _context.StockMovements
                .AnyAsync(m => m.ProductId == id);

            if (hasSales || hasMovements)
            {
                return Conflict(
                    "Cannot delete a product with sales or stock movement history.");
            }

            _context.Products.Remove(product);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is Npgsql.PostgresException pgEx
                      && pgEx.SqlState == "23503")
            {
                return Conflict(
                    "Cannot delete a product referenced by other records.");
            }

            return NoContent();
        }


    }
}
