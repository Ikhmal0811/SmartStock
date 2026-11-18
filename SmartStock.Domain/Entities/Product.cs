using System;
using System.Collections.Generic;
using System.Text;

namespace SmartStock.Domain.Entities
{
    public class Product
    {
        public int ProductId { get; set; }
        public int CategoryId { get; set; }
        public int? SupplierId { get; set; }

        public string Sku { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;

        public decimal SellingPrice { get; set; }
        public decimal CostPrice { get; set; }
        public decimal StockOnHand { get; set; }
        public decimal ReorderLevel { get; set; } = 10;

        public bool IsArchived { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
