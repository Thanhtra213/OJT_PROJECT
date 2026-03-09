using EasyEnglish_API.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/dashboard")]
    [Authorize(Roles = "ADMIN")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var overview = await _dashboardService.GetOverview();
            return Ok(overview);
        }

        // Biểu đồ doanh thu 12 tháng gần nhất
        [HttpGet("revenue-trend")]
        public async Task<IActionResult> GetRevenueTrend()
        {
            try
            {
                var trend = await _dashboardService.GetMonthlyRevenueTrendAsync();
                return Ok(trend);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Top 5 khóa học
        [HttpGet("top-courses")]
        public async Task<IActionResult> GetTopCourses()
        {
            var top = await _dashboardService.GetTopCoursesAsync();
            return Ok(top);
        }

        // Tỷ lệ role
        [HttpGet("role-distribution")]
        public async Task<IActionResult> GetRoleDistribution()
        {
            var data = await _dashboardService.GetUserRoleDistributionAsync();
            return Ok(data);
        }
    }
}
