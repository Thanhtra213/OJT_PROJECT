namespace EasyEnglish_API.DTOs.SubScriptionplan
{
    public class ViewSubscriptionPlanResponse
    {
        public int PlanID { get; set; }
        public string PlanCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DurationDays { get; set; }
    }
}
