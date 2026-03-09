using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Dashboard
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly EasyEnglishDbContext _db;

        public DashboardRepository(EasyEnglishDbContext db)
        {
            _db = db;   
        }

        public async Task<int> GetActiveCoursesAsync()
        {
            return await _db.Courses.CountAsync();
        }

        public async Task<int> GetActiveMembersAsync()
        {
            var now = DateTime.UtcNow;
            return await _db.UserMemberships
                .Where(m => m.EndsAt >= now)
                .Select(m => m.UserId)
                .Distinct()
                .CountAsync();
        }

        public async Task<decimal> GetCurrentMonthRevenueAsync()
        {
            var now = DateTime.UtcNow;
            return await _db.PaymentOrders
                .Where(p => p.Status == "SUCCESS"
                         && p.CreatedAt.Month == now.Month
                         && p.CreatedAt.Year == now.Year)
                .SumAsync(p => (decimal?)p.Amount ?? 0);
        }

        public async Task<List<(string Month, decimal Revenue)>> GetMonthlyRevenueTrendAsync()
        {
            var now = DateTime.UtcNow;
            var start = now.AddMonths(-11);

            var revenue = await _db.PaymentOrders
                .Where(p => p.Status == "SUCCESS" && p.CreatedAt >= new DateTime(start.Year, start.Month, 1))
                .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Revenue = g.Sum(p => (decimal?)p.Amount) ?? 0
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            if (revenue == null)
                throw new Exception();

            return revenue
                .Select(r => ($"{r.Month:D2}/{r.Year}", r.Revenue))
                .ToList();
        }

        public async Task<List<(string CourseName, int EnrollmentCount)>> GetTopCoursesAsync()
        {
            return await _db.Courses
                .Include(c => c.Teacher)
                .OrderByDescending(c => c.CourseChapters.Count)
                .Take(5)
                .Select(c => new ValueTuple<string, int>(
                    c.CourseName,
                    c.CourseChapters.Count))
                .ToListAsync();
        }

        public async Task<int> GetTotalUsersAsync()
        {
            return await _db.Accounts.CountAsync();
        }

        public async Task<Dictionary<string, int>> GetUserRoleDistributionAsync()
        {
            var data = await _db.Accounts
                .GroupBy(a => a.Role)
                .Select(g => new { Role = g.Key, Count = g.Count() })
                .ToListAsync();

            return data.ToDictionary(x => x.Role, x => x.Count);
        }
    }
}
