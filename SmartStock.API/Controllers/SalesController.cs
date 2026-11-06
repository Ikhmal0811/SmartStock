using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Infrastructure.Data;
using SmartStock.Application.DTOs;
using SmartStock.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SmartStock.API.Controllers
{
    [ApiController]
    [Route("api/sales")]
    [Authorize(Roles = "Admin,Staff")]
    public class SalesController : ControllerBase
    {
        private readonly SmartStockDbContext _context;

        public SalesController(SmartStockDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSales()
        {
            var sales = await _context.Sales
                .AsNoTracking()
                .OrderByDescending(s => s.SoldAt)
                .ToListAsync();

            return Ok(sales);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSale(
    [FromBody] CreateSaleDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out int authenticatedUserId))
            {
                return Unauthorized("Invalid user identity.");
            }

            if (dto.Items == null || dto.Items.Count == 0)
            {
                return BadRequest("A sale must contain at least one item.");
            }

            if (dto.Items.Any(item => item.ProductId <= 0 ||
                                      item.Quantity <= 0))
            {
                return BadRequest("Invalid product ID or quantity.");
            }

            bool userExists = await _context.Users.AnyAsync(
                u => u.UserId == authenticatedUserId && u.IsActive
            );
                

            if (!userExists)
            {
                return BadRequest("Invalid or inactive employee.");
            }

            ///if the validation passed, we can proceed with the transaction
            await using var transaction =
    await _context.Database.BeginTransactionAsync();


            try
            {
                // Get unique product IDs in a consistent order
                var productIds = dto.Items
                    .Select(item => item.ProductId)
                    .Distinct()
                    .OrderBy(id => id)
                    .ToList();

                // Lock each product before reading its stock
                foreach (int productId in productIds)
                {
                    var products = await _context.Products
                        .FromSqlInterpolated(
                            $"SELECT * FROM products WHERE product_id = {productId} FOR UPDATE")
                        .ToListAsync();

                    if (products.Count == 0)
                    {
                        return NotFound($"Product {productId} not found.");
                    }
                }

                

                // if the product user request are less than the stock on hand

                var requestedQuantities = dto.Items
                    .GroupBy(item => item.ProductId)
                    .ToDictionary(
                        group => group.Key,
                        group => group.Sum(item => item.Quantity)
                    );

                foreach (var entry in requestedQuantities)
                {
                    var product = _context.Products.Local
                        .FirstOrDefault(p => p.ProductId == entry.Key);

                    if (product == null)
                    {
                        return NotFound($"Product {entry.Key} not found.");
                    }

                    if (product.StockOnHand < entry.Value)
                    {
                        return Conflict(
                            $"Insufficient stock for {product.ProductName}.");
                    }
                }


                //calculate the total payment for customer
                decimal totalAmount = 0;

                foreach (var item in dto.Items)
                {
                    var product = _context.Products.Local
                        .First(p => p.ProductId == item.ProductId);

                    decimal subtotal = product.SellingPrice * item.Quantity;

                    totalAmount += subtotal;
                }


                var sale = new Sale
                {
                    UserId = authenticatedUserId,
                    SoldAt = DateTime.Now,
                    TotalAmount = totalAmount,
                    Status = "COMPLETED"
                };

                _context.Sales.Add(sale);

                //this method executes the INSERT but not permanently committed yet
                await _context.SaveChangesAsync();


                // update the records
                foreach (var item in dto.Items)
                {
                    var product = _context.Products.Local
                        .First(p => p.ProductId == item.ProductId);

                    // Record the purchased product
                    var saleItem = new SaleItem
                    {
                        SaleId = sale.SaleId,
                        ProductId = product.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = product.SellingPrice,
                        UnitCost = product.CostPrice
                    };

                    _context.SaleItems.Add(saleItem);

                    // Deduct inventory
                    product.StockOnHand -= item.Quantity;

                    // Record why inventory decreased
                    var movement = new StockMovement
                    {
                        ProductId = product.ProductId,
                        SaleId = sale.SaleId,
                        MovementType = "SALE",
                        QuantityChange = -item.Quantity,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.StockMovements.Add(movement);
                }

                // Save sale items, stock updates, and movements
                await _context.SaveChangesAsync();





                await transaction.CommitAsync();

                return StatusCode(201, new
                {
                    sale.SaleId,
                    sale.UserId,
                    sale.TotalAmount,
                    sale.Status,
                    Message = "Sale completed successfully."
                });


            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetSaleById(int id)
        {
            var sale = await _context.Sales
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SaleId == id);

            if (sale == null)
            {
                return NotFound("Sale not found.");
            }


            var items = await (
                from item in _context.SaleItems
                join product in _context.Products
                    on item.ProductId equals product.ProductId
                where item.SaleId == id
                select new
                {
                    item.SaleItemId,
                    item.ProductId,
                    product.ProductName,
                    item.Quantity,
                    item.UnitPrice,
                    item.UnitCost,
                    Subtotal = item.UnitPrice * item.Quantity,
                    GrossProfit = (item.UnitPrice - item.UnitCost) * item.Quantity
                }
            ).AsNoTracking().ToListAsync();


            return Ok(new
            {
                sale.SaleId,
                sale.UserId,
                sale.SoldAt,
                sale.TotalAmount,
                sale.Status,
                Items = items
            });
        }

    }
}

