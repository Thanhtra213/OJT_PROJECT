namespace EasyEnglish_API.DTOs.Transaction
{
    public class TransactionListResponse
    {
        public int OrderID { get; set; }

        public int BuyerID { get; set; }
        public string BuyerUsername { get; set; }
        public string BuyerEmail { get; set; }

        public int PlanID { get; set; }
        public string PlanName { get; set; }

        public decimal Amount { get; set; }
        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
