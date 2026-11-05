using System;
using System.Collections.Generic;
using System.Text;

namespace SmartStock.Domain.Entities
{
    public class StockMovement
    {
        public int MovementId { get; set; }
        public int ProductId { get; set; }

        public int? SaleId { get; set; }
        public int? SupplierId { get; set; }

        public string MovementType { get; set; } = string.Empty;
        public decimal QuantityChange { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
