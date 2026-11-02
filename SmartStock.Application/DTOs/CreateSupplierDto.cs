using System;
using System.Collections.Generic;
using System.Text;

namespace SmartStock.Application.DTOs
{
    public class CreateSupplierDto
    {
        public string SupplierName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }
}
