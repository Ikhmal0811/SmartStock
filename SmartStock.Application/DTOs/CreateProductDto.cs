using System;
using System.Collections.Generic;
using System.Text;

namespace SmartStock.Application.DTOs
{
    public class CreateProductDto
    {
        public int CategoryId { get; set; }
        public int? SupplierId { get; set; }

        public string Sku { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;

        public decimal SellingPrice { get; set; }
        public decimal CostPrice { get; set; }
        public decimal StockOnHand { get; set; }
        public decimal ReorderLevel { get; set; } = 10;
        public bool ConfirmDuplicate { get; set; } = false;
    }
}
