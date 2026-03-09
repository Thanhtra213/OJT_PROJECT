using EasyEnglish_API.DTOs.Dashboard;

namespace EasyEnglish_API.Services.Dashboard
{
    public interface IDashboardService
    {
        // Doanh thu 12 tháng gần nhất (biểu đồ)
        Task<List<(string Month, decimal Revenue)>> GetMonthlyRevenueTrendAsync();

        // Top 5 khóa học có nhiều người học nhất
        Task<List<(string CourseName, int EnrollmentCount)>> GetTopCoursesAsync();

        // Tỷ lệ user theo role (Admin/Teacher/Student)
        Task<Dictionary<string, int>> GetUserRoleDistributionAsync();

        // Get overview
        Task<OverviewResponse> GetOverview();
    }
}
