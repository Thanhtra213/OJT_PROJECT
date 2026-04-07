using System.ComponentModel.DataAnnotations;

namespace EasyEnglish_API.DTOs.Vouchers
{
    public class CreateVoucherRequest
    {
        public string Code { get; set; } = null!;
        public decimal DiscountAmount { get; set; }
        public DateOnly ExpiresAt { get; set; }
        public int? ApplicablePlanId { get; set; }
    }
}
