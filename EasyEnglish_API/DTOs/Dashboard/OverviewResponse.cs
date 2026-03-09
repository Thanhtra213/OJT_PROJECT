using System.Transactions;

namespace EasyEnglish_API.DTOs.Dashboard
{
    public class OverviewResponse
    {
        public int TotalUsers { get; set; }
        public int ActiveMembers { get; set; }
        public double MembershipRate { get; set; } 
        public decimal CurrentMonthRevenue { get; set; }
        public int ActiveCourses { get; set; }
    }
}
