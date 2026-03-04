using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Membership
{
    public class MembershipRepository : IMembershipRepository
    {
        private readonly EasyEnglishDbContext _db;

        public MembershipRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        // 🔹 Lấy membership đang hoạt động
        public async Task<UserMembership?> GetActiveMembershipByUserAsync(int userId)
        {
            var now = DateTime.UtcNow;

            return await _db.UserMemberships
                .Where(m => m.UserId == userId && m.Status == "ACTIVE" && m.EndsAt > now)
                .OrderByDescending(m => m.EndsAt)
                .FirstOrDefaultAsync();
        }

        // 🔹 Lịch sử membership
        public async Task<List<UserMembership>> GetMembershipHistoryAsync(int userId)
        {
            return await _db.UserMemberships
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.StartsAt)
                .ToListAsync();
        }

        // 🔹 Tạo membership mới
        public async Task<UserMembership> CreateMembershipAsync(UserMembership membership)
        {
            membership.CreatedAt = DateTime.UtcNow;
            _db.UserMemberships.Add(membership);
            await _db.SaveChangesAsync();
            return membership;
        }

        // 🔹 Cập nhật trạng thái membership
        public async Task<bool> UpdateMembershipStatusAsync(long membershipId, string newStatus)
        {
            var membership = await _db.UserMemberships.FindAsync(membershipId);
            if (membership == null) return false;

            membership.Status = newStatus;

            if (newStatus == "CANCELED")
                membership.CanceledAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        // 🔹 Kiểm tra membership đang hoạt động
        public async Task<bool> HasActiveMembershipAsync(int userId)
        {
            var now = DateTime.UtcNow;
            return await _db.UserMemberships
                .AnyAsync(m => m.UserId == userId && m.Status == "ACTIVE" && m.EndsAt > now);
        }
    }
}
