using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartStock.Tests;

public static class TestJwtTokenGenerator
{
    public static string GenerateToken(
        int userId,
        string role)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                "SmartStockIntegrationTestSecretKey1234567890"));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: "SmartStock.Tests",
            audience: "SmartStock.Tests",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}