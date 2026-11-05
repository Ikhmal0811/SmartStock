using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartStock.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNonNegativeStockConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_products_stock_on_hand_nonnegative",
                table: "products",
                sql: "stock_on_hand >= 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_products_stock_on_hand_nonnegative",
                table: "products");
        }
    }
}
