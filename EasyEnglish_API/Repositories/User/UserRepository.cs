using EasyEnglish_API.Data;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;
using EasyEnglish_API.Interfaces.User;

namespace EasyEnglish_API.Repositories.User
{
    public class UserRepository : IUserRepository
    {
        //Admin: user management
        private readonly EasyEnglishDbContext _db;

        public UserRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }
        public async Task<List<Account>> GetAllUsersAsync()
        {
            return await _db.Accounts.ToListAsync();
        }

        public async Task<List<Account>> GetAllStudentsAsync()
        {
            return await _db.Accounts
                .Where(a => a.Role == "STUDENT")
                .ToListAsync();
        }

        public async Task<List<Account>> GetAllTeachersAsync()
        {
            return await _db.Accounts
                .Where(a => a.Role == "TEACHER")
                .ToListAsync();
        }

        public async Task<Account?> LockUserAsync(int id)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null) return null;
            acc.Status = "LOCKED";
            await _db.SaveChangesAsync();
            return acc;
        }

        public async Task<Account?> UnlockUserAsync(int id)
        {
            var acc = await _db.Accounts.FindAsync(id);
            if (acc == null) return null;
            acc.Status = "ACTIVE";
            await _db.SaveChangesAsync();
            return acc;
        }

        public async Task<List<Account>> SearchUsersAsync(string? keyword, string? role, string? status)
        {
            var query = _db.Accounts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
                query = query.Where(u => u.Email.Contains(keyword) || u.Username.Contains(keyword));

            if (!string.IsNullOrWhiteSpace(role))
                query = query.Where(u => u.Role == role);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(u => u.Status == status);

            return await query.ToListAsync();
        }

        public async Task<Account?> AssignRoleAsync(int userId, string newRole)
        {
            var user = await _db.Accounts.FindAsync(userId);
            if (user == null) return null;

            user.Role = newRole;
            await _db.SaveChangesAsync();
            return user;
        }
    }
}
