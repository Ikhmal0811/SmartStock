using System;
using System.Collections.Generic;
using System.Text;

namespace SmartStock.Domain.Entities
{
    public class Sale
    {
        public int SaleId { get; set; }
        public int UserId { get; set; }

        public DateTime SoldAt { get; set; } = DateTime.Now;
        public decimal TotalAmount { get; set; } = 0;
        public string Status { get; set; } = "COMPLETED";
    }
}
