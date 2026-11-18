using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartStock.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductArchiveStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "products",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "products");
        }
    }
}
