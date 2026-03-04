using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Authentication;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Authentication
{
    public class AuthRepository : IAuthRepository
    {
        private readonly EasyEnglishDbContext _db;

        public AuthRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<Account?> GetByEmailOrUsernameAsync(string emailOrUsername)
        {
            return await _db.Accounts
                .FirstOrDefaultAsync(a => a.Email == emailOrUsername || a.Username == emailOrUsername);
        }

        public async Task<Account?> GetByEmailAsync(string email)
        {
            return await _db.Accounts.FirstOrDefaultAsync(a => a.Email == email);
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _db.Accounts.AnyAsync(a => a.Email == email);
        }

        public async Task<bool> IsUsernameExistsAsync(string username)
        {
            return await _db.Accounts.AnyAsync(a => a.Username == username);
        }

        public async Task<Account> CreateAccountAsync(Account acc)
        {
            _db.Accounts.Add(acc);
            await _db.SaveChangesAsync();
            return acc;
        }

        public async Task<UserDetail> CreateUserDetailAsync(int accountId)
        {
            var detail = new UserDetail { AccountId = accountId };
            _db.UserDetails.Add(detail);
            await _db.SaveChangesAsync();
            return detail;
        }

        public async Task<Teacher> CreateTeacherAsync(int accountId, string? desc = null, string? cert = null)
        {
            var teacher = new Teacher
            {
                TeacherId = accountId,
                Description = desc,
                CertJson = cert,
                JoinAt = DateTime.UtcNow
            };
            _db.Teachers.Add(teacher);
            await _db.SaveChangesAsync();
            return teacher;
        }

        public async Task UpdateAccountAsync(Account acc)
        {
            _db.Accounts.Update(acc);
            await _db.SaveChangesAsync();
        }

        public async Task<Account?> GetByIdAsync(int id)
        {
            return await _db.Accounts.FindAsync(id);
        }
    }
}
