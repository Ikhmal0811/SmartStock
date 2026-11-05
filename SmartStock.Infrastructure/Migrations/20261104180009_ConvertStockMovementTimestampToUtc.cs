using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartStock.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConvertStockMovementTimestampToUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE stock_movements
                ALTER COLUMN created_at
                TYPE timestamp with time zone
                USING created_at AT TIME ZONE 'Asia/Kuala_Lumpur';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE stock_movements
                ALTER COLUMN created_at
                TYPE timestamp without time zone
                USING created_at AT TIME ZONE 'Asia/Kuala_Lumpur';
            ");
        }
    }
}
