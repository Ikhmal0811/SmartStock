using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartStock.Application.DTOs;
using SmartStock.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace SmartStock.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly SmartStockDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(SmartStockDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }


        //login method that takes in a LoginDto and returns a JWT token if the user is authenticated
        [AllowAnonymous]
        [HttpPost("login")]
        //[Authorize(Roles = "Admin")]
        public async Task<IActionResult> Login(
            [FromBody] LoginDto dto)
        {

            var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Email == dto.Email);


            if (user == null || !user.IsActive)
            {
                return Unauthorized("Invalid email or password.");
            }

            bool passwordValid = BCrypt.Net.BCrypt.Verify(
                dto.Password, user.PasswordHash);

            if (!passwordValid)
            {
                return Unauthorized("Invalid email or password.");
            }


            var role = await _context.Roles
    .FirstOrDefaultAsync(r => r.RoleId == user.RoleId);

            if (role == null)
            {
                return Unauthorized("Invalid user role.");
            }

            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT key is missing.");

            var jwtIssuer = _configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException("JWT issuer is missing.");

            var jwtAudience = _configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException("JWT audience is missing.");

            var claims = new[]
            {
                 new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                 new Claim(ClaimTypes.Email, user.Email),
                 new Claim(ClaimTypes.Role, role.RoleName)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            string tokenString = new JwtSecurityTokenHandler()
                .WriteToken(token);

            return Ok(new
            {
                message = "Login successful.",
                token = tokenString
            });

        }
    }
}
