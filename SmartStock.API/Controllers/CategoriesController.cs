using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Domain.Entities;
using SmartStock.Infrastructure.Data;
using SmartStock.Application.DTOs;


namespace SmartStock.API.Controllers
{

    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly SmartStockDbContext _context;

        public CategoriesController(SmartStockDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .ToListAsync();

            return Ok(categories);
        }



        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            var category = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
            {
                return NotFound("Category not found.");
            }

            return Ok(category);
        }


        [HttpPost]
        public async Task<IActionResult> CreateCategory(
            [FromBody] CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CategoryName))
            {
                return BadRequest("Category name is required.");
            }

            string categoryName = dto.CategoryName.Trim();

            if (categoryName.Length > 100)
            {
                return BadRequest("Category name cannot exceed 100 characters.");
            }

            bool exists = await _context.Categories.AnyAsync(
                c => c.CategoryName == categoryName
            );

            if (exists)
            {
                return Conflict("Category already exists.");
            }

            var category = new Category
            {
                CategoryName = categoryName
            };

            _context.Categories.Add(category);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is Npgsql.PostgresException pgEx
                      && pgEx.SqlState == "23505")
            {
                return Conflict("Category already exists.");
            }

            return StatusCode(201, category);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(
            int id, [FromBody] UpdateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CategoryName))
            {
                return BadRequest("Category name is required.");
            }

            string categoryName = dto.CategoryName.Trim();

            if (categoryName.Length > 100)
            {
                return BadRequest("Category name cannot exceed 100 characters.");
            }

            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
            {
                return NotFound("Category not found.");
            }

            bool exists = await _context.Categories.AnyAsync(
                c => c.CategoryName == categoryName
                     && c.CategoryId != id
            );

            if (exists)
            {
                return Conflict("Category name already exists.");
            }

            category.CategoryName = categoryName;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is Npgsql.PostgresException pgEx
                      && pgEx.SqlState == "23505")
            {
                return Conflict("Category name already exists.");
            }

            return Ok(category);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
            {
                return NotFound("Category not found.");
            }

            _context.Categories.Remove(category);

            await _context.SaveChangesAsync();

            return NoContent();
        }



    }
}
