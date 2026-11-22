using System;
using System.ComponentModel.DataAnnotations;

namespace SmartStock.Application.DTOs
{
    public class StockInDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }

        [Range(1, int.MaxValue)]
        public int? SupplierId { get; set; }

        [Range(typeof(decimal), "0.001", "999999999.999")]
        public decimal Quantity { get; set; }

        [StringLength(100)]
        public string? Reference { get; set; }
    }
}