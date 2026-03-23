using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Progress;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Progress
{
    public class VideoProgressRepository : IVideoProgressRepository
    {
        private readonly EasyEnglishDbContext _db;

        public VideoProgressRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<UserVideoProgress?> GetAsync(int userId, int videoId)
        {
            return await _db.UserVideoProgresses
                .FirstOrDefaultAsync(x => x.UserId == userId && x.VideoId == videoId);
        }

        public async Task AddAsync(UserVideoProgress progress)
        {
            await _db.UserVideoProgresses.AddAsync(progress);
        }

        public Task UpdateAsync(UserVideoProgress progress)
        {
            _db.UserVideoProgresses.Update(progress);
            return Task.CompletedTask;
        }

        public async Task SaveAsync()
        {
            await _db.SaveChangesAsync();
        }
    }
}
