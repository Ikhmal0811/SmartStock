using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace SmartStock.Application.DTOs
{
    public class StockOutDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }

        [Range(typeof(decimal), "0.001", "999999999.999")]
        public decimal Quantity { get; set; }

        [Required(ErrorMessage = "A reason is required.")]
        [StringLength(200, MinimumLength = 3,
            ErrorMessage = "Reason must be between 3 and 200 characters.")]
        public string? Reason { get; set; }
    }
}
