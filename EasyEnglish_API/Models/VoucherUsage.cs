namespace EasyEnglish_API.Models
{
    public class VoucherUsage
    {
        public int UsageId { get; set; }
        public int VoucherId { get; set; }
        public int UserId { get; set; }
        public DateTime UsedAt { get; set; } = DateTime.UtcNow;

        public virtual Voucher Voucher { get; set; } = null!;
        public virtual Account User { get; set; } = null!;
    }
}
