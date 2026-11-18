
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Application.DTOs;
using SmartStock.Domain.Entities;
using SmartStock.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;


namespace SmartStock.API.Controllers
{
    [ApiController]
    [Route("api/stock-movements")]
    public class StockMovementsController : ControllerBase
    {
        private readonly SmartStockDbContext _context;

        public StockMovementsController(SmartStockDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("stock-in")]
        public async Task<IActionResult> StockIn([FromBody] StockInDto dto)
        {
            // Validate quantity
            if (dto.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (dto.ProductId <= 0)
            {
                return BadRequest("Product ID must be greater than zero.");
            }

            // Validate optional supplier
            if (dto.SupplierId.HasValue)
            {
                bool supplierExists = await _context.Suppliers
                    .AnyAsync(s => s.SupplierId == dto.SupplierId.Value);

                if (!supplierExists)
                    return BadRequest("Invalid supplier ID.");

                if (dto.SupplierId.Value <= 0)
                {
                    return BadRequest("Supplier ID must be greater than zero.");
                }

                
            }

            // Begin transaction
            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            // Lock product row and read latest product data
            var product = await _context.Products
                .FromSqlInterpolated(
                    $"SELECT * FROM products WHERE product_id = {dto.ProductId} FOR UPDATE")
                .FirstOrDefaultAsync();

            if (product == null)
                return NotFound("Product not found.");

            // Validate before increasing inventory
            if (product.StockOnHand > 999999999.999m - dto.Quantity)
            {
                return BadRequest(
                    "Stock quantity exceeds the maximum allowed value.");
            }

            // Increase inventory
            product.StockOnHand += dto.Quantity;

            // Record stock movement
            var movement = new StockMovement
            {
                ProductId = product.ProductId,
                SupplierId = dto.SupplierId,
                MovementType = "STOCK_IN",
                QuantityChange = dto.Quantity,
                CreatedAt = DateTime.UtcNow
            };

            _context.StockMovements.Add(movement);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                product.ProductId,
                product.ProductName,
                product.StockOnHand,
                movement.MovementId,
                movement.QuantityChange
            });
        }
        ///////////////////////////////////////////////////////////////////////////

        [Authorize(Roles = "Admin")]
        [HttpPost("stock-out")]
        public async Task<IActionResult> StockOut(
            [FromBody] StockOutDto dto)
        {
            if (dto.ProductId <= 0 || dto.Quantity <= 0)
            {
                return BadRequest("Invalid product ID or quantity.");
            }

            // Begin transaction
            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            // Lock and retrieve the product
            var product = await _context.Products
                .FromSqlInterpolated(
                    $"SELECT * FROM products WHERE product_id = {dto.ProductId} FOR UPDATE")
                .ToListAsync();

            var selectedProduct = product.FirstOrDefault();

            if (selectedProduct == null)
            {
                return NotFound("Product not found.");
            }

            // Prevent negative stock
            if (selectedProduct.StockOnHand < dto.Quantity)
            {
                return Conflict("Insufficient stock available.");
            }

            // Decrease inventory
            selectedProduct.StockOnHand -= dto.Quantity;

            // Record the stock movement
            var movement = new StockMovement
            {
                ProductId = selectedProduct.ProductId,
                MovementType = "ADJUSTMENT",
                QuantityChange = -dto.Quantity,
                CreatedAt = DateTime.UtcNow
            };

            _context.StockMovements.Add(movement);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                selectedProduct.ProductId,
                selectedProduct.ProductName,
                selectedProduct.StockOnHand,
                movement.MovementId,
                movement.QuantityChange
            });
        }
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetStockMovements(
    [FromQuery] int? productId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
        {
            if (page < 1 || pageSize < 1 || pageSize > 100)
            {
                return BadRequest(
                    "Page must be at least 1 and pageSize must be between 1 and 100.");
            }

            var query = _context.StockMovements
                .AsNoTracking()
                .AsQueryable();

            if (productId.HasValue && productId.Value <= 0)
            {
                return BadRequest("Product ID must be greater than zero.");
            }

            if (productId.HasValue)
            {
                query = query.Where(m => m.ProductId == productId.Value);
            }

            int totalRecords = await query.CountAsync();

            var movements = await query
                .OrderByDescending(m => m.CreatedAt)
                .ThenByDescending(m => m.MovementId)
                .Skip((int)Math.Min(((long)page - 1) * pageSize, int.MaxValue))
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                page,
                pageSize,
                totalRecords,
                totalPages = (int)Math.Ceiling(
                    (double)totalRecords / pageSize),
                data = movements
            });
        }

    }
}
