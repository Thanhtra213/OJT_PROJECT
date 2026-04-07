namespace EasyEnglish_API.Models
{
    public class Voucher
    {
        public int VoucherId { get; set; }
        public string Code { get; set; } = null!;          
        public decimal DiscountAmount { get; set; }          
        public DateOnly ExpiresAt { get; set; }              
        public bool IsActive { get; set; } = true;
        public int? ApplicablePlanId { get; set; }           // null = áp dụng tất cả gói
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual SubscriptionPlan? ApplicablePlan { get; set; }
        public virtual ICollection<VoucherUsage> Usages { get; set; } = new List<VoucherUsage>();
        public virtual ICollection<PaymentOrder> PaymentOrders { get; set; } = new List<PaymentOrder>();
    }
}
