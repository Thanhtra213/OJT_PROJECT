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
            await _db.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserVideoProgress progress)
        {
            _db.UserVideoProgresses.Update(progress);
            await _db.SaveChangesAsync();
        }

        public async Task UpsertAsync(UserVideoProgress progress)
        {
            var existing = await _db.UserVideoProgresses
                .FirstOrDefaultAsync(x => x.UserId == progress.UserId && x.VideoId == progress.VideoId);

            if (existing == null)
            {
                await _db.UserVideoProgresses.AddAsync(progress);
            }
            else
            {
                existing.WatchDurationSec = Math.Max(existing.WatchDurationSec ?? 0, progress.WatchDurationSec ?? 0);
                existing.LastPositionSec = Math.Max(existing.LastPositionSec ?? 0, progress.LastPositionSec ?? 0);
                existing.WatchedAt = DateTime.UtcNow;

                if ((progress.TotalDurationSec ?? 0) > (existing.TotalDurationSec ?? 0))
                    existing.TotalDurationSec = progress.TotalDurationSec;

                if (progress.IsCompleted)
                    existing.IsCompleted = true;

                _db.UserVideoProgresses.Update(existing);
            }

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("PRIMARY KEY") == true)
            {
                // Race condition vẫn xảy ra → detach và update
                _db.ChangeTracker.Clear();
                var retry = await _db.UserVideoProgresses
                    .FirstOrDefaultAsync(x => x.UserId == progress.UserId && x.VideoId == progress.VideoId);
                if (retry != null)
                {
                    retry.WatchDurationSec = Math.Max(retry.WatchDurationSec ?? 0, progress.WatchDurationSec ?? 0);
                    retry.LastPositionSec = Math.Max(retry.LastPositionSec ?? 0, progress.LastPositionSec ?? 0);
                    retry.WatchedAt = DateTime.UtcNow;
                    _db.UserVideoProgresses.Update(retry);
                    await _db.SaveChangesAsync();
                }
            }
        }
    }
}
