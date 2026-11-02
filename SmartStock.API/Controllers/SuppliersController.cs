using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Infrastructure.Data;
using SmartStock.Application.DTOs;
using SmartStock.Domain.Entities;

namespace SmartStock.API.Controllers
{
    [ApiController]
    [Route("api/suppliers")]
    public class SuppliersController : ControllerBase
    {
        private readonly SmartStockDbContext _context;

        public SuppliersController(SmartStockDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers
                .AsNoTracking()
                .ToListAsync();

            return Ok(suppliers);
        }


        [HttpPost]
        public async Task<IActionResult> CreateSupplier(
            [FromBody] CreateSupplierDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
            {
                return BadRequest("Supplier name is required.");
            }

            string supplierName = dto.SupplierName.Trim();

            if (supplierName.Length > 150)
            {
                return BadRequest("Supplier name cannot exceed 150 characters.");
            }

            if (dto.Email?.Length > 150 || dto.Phone?.Length > 30)
            {
                return BadRequest("Email or phone exceeds the allowed length.");
            }

            var supplier = new Supplier
            {
                SupplierName = supplierName,
                Email = dto.Email?.Trim(),
                Phone = dto.Phone?.Trim(),
                Address = dto.Address?.Trim()
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return StatusCode(201, supplier);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetSupplierById(int id)
        {
            var supplier = await _context.Suppliers
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found.");
            }

            return Ok(supplier);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(
            int id, [FromBody] UpdateSupplierDto dto)
        {
            // Validate supplier name
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
            {
                return BadRequest("Supplier name is required.");
            }

            string supplierName = dto.SupplierName.Trim();

            if (supplierName.Length > 150)
            {
                return BadRequest("Supplier name cannot exceed 150 characters.");
            }

            // Validate optional fields
            if (dto.Email?.Trim().Length > 150 ||
                dto.Phone?.Trim().Length > 30)
            {
                return BadRequest("Email or phone exceeds the allowed length.");
            }

            // Find existing supplier
            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found.");
            }

            // Update supplier information
            supplier.SupplierName = supplierName;
            supplier.Email = dto.Email?.Trim();
            supplier.Phone = dto.Phone?.Trim();
            supplier.Address = dto.Address?.Trim();

            await _context.SaveChangesAsync();

            return Ok(supplier);
        }



        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers
                .FirstOrDefaultAsync(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found.");
            }

            bool hasProducts = await _context.Products
                .AnyAsync(p => p.SupplierId == id);

            bool hasMovements = await _context.StockMovements
                .AnyAsync(m => m.SupplierId == id);

            if (hasProducts || hasMovements)
            {
                return Conflict(
                    "Cannot delete a supplier linked to products or stock movements.");
            }

            _context.Suppliers.Remove(supplier);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is Npgsql.PostgresException pgEx
                      && pgEx.SqlState == "23503")
            {
                return Conflict(
                    "Cannot delete a supplier referenced by other records.");
            }

            return NoContent();
        }



    }

}
