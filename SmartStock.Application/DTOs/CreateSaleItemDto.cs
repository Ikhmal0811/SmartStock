using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace SmartStock.Application.DTOs
{
    public class CreateSaleItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }

        [Range(typeof(decimal), "0.001", "999999999.999")]
        public decimal Quantity { get; set; }
    }
}
