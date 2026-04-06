namespace EasyEnglish_API.DTOs.Vouchers
{
    public class ValidateVoucherResponse
    {
        public int VoucherId { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal FinalPrice { get; set; }
    }
}
