namespace EasyEnglish_API.DTOs.Vouchers
{
    public class VoucherResponse
    {
        public int VoucherId { get; set; }
        public string Code { get; set; } = null!;
        public decimal DiscountAmount { get; set; }
        public DateOnly ExpiresAt { get; set; }
        public bool IsActive { get; set; }
        public int? ApplicablePlanId { get; set; }
    }
}
