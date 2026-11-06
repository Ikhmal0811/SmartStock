using System;
using System.Collections.Generic;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace SmartStock.Application.DTOs
{
    public class CreateSaleDto
    {       
        [Required]
        [MinLength(1)]
        public List<CreateSaleItemDto> Items { get; set; } = new();
    }
}
