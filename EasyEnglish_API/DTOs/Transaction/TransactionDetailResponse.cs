namespace EasyEnglish_API.DTOs.Transaction
{
    public class TransactionDetailResponse
    {
        public int OrderID { get; set; }

        public int BuyerID { get; set; }
        public string BuyerUsername { get; set; }
        public string BuyerEmail { get; set; }

        public int PlanID { get; set; }
        public string PlanCode { get; set; }
        public string PlanName { get; set; }

        public decimal Price { get; set; }
        public int DurationDays { get; set; }

        public decimal Amount { get; set; }
        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }

        public List<WebhookEventResponse> WebhookEvents { get; set; }
    }
}
