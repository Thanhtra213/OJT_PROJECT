using EasyEnglish_API.DTOs.Dashboard;
using EasyEnglish_API.Interfaces.Dashboard;

namespace EasyEnglish_API.Services.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly IDashboardRepository _dashboardRepository;

        public DashboardService(IDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<List<(string Month, decimal Revenue)>> GetMonthlyRevenueTrendAsync()
        {
            return await _dashboardRepository.GetMonthlyRevenueTrendAsync();
        }

        public async Task<OverviewResponse> GetOverview()
        {
            var totalUsers = await _dashboardRepository.GetTotalUsersAsync();
            var totalMembers = await _dashboardRepository.GetActiveMembersAsync();
            var currentMonthRevenue = await _dashboardRepository.GetCurrentMonthRevenueAsync();
            var activeCourses = await _dashboardRepository.GetActiveCoursesAsync();

            double membershipRate = totalUsers > 0
                ? Math.Round((double)totalMembers / totalUsers * 100, 2)
                : 0;

            var overview = new OverviewResponse
            {
                TotalUsers = totalUsers,
                ActiveMembers = totalMembers,
                MembershipRate = membershipRate,
                CurrentMonthRevenue = currentMonthRevenue,
                ActiveCourses = activeCourses
            };

            return overview;
        }

        public async Task<List<(string CourseName, int EnrollmentCount)>> GetTopCoursesAsync()
        {
            return await _dashboardRepository.GetTopCoursesAsync();
        }

        public async Task<int> GetTotalUsersAsync()
        {
            return await _dashboardRepository.GetTotalUsersAsync();
        }

        public async Task<Dictionary<string, int>> GetUserRoleDistributionAsync()
        {
            return await _dashboardRepository.GetUserRoleDistributionAsync();
        }
    }
}
