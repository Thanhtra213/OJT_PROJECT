using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Profile;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Profile
{
    public class ProfileRepository : IProfileRepository
    {
        private readonly EasyEnglishDbContext _db;
        public ProfileRepository(EasyEnglishDbContext db) 
        {
            _db = db;
        }

        public async Task<Account?> GetAccountAsync(int accountId)
        {
            return await _db.Accounts.FirstOrDefaultAsync(x => x.AccountId == accountId);
        }

        public async Task<UserDetail?> GetUserDetailAsync(int accountId)
        {
            return await _db.UserDetails.FirstOrDefaultAsync(x => x.AccountId == accountId);
        }

        public async Task SavechangeAsync()
        {
            await _db.SaveChangesAsync();
        }
    }
}
