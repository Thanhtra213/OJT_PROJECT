namespace EasyEnglish_API.DTOs.SubScriptionplan
{
    public class CreateSubscriptionPlanRequest
    {
        public string? PlanCode { get; set; }
        public string? Name { get; set; }
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
        public bool? IsActive { get; set; }
    }
}
