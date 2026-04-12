using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Interfaces.Progress;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Video
{
    public class VideoProgressService : IVideoProgressService
    {
        private readonly IVideoProgressRepository _repo;
        public VideoProgressService(IVideoProgressRepository repo)
        {
            _repo = repo;
        }

        public async Task UpdateProgressAsync(int userId, VideoProgressRequest req)
        {
            var progress = await _repo.GetAsync(userId, req.VideoId);

            if (progress == null)
            {
                progress = new UserVideoProgress
                {
                    UserId = userId,
                    VideoId = req.VideoId,
                    WatchDurationSec = req.WatchDurationSec,
                    LastPositionSec = req.LastPositionSec,
                    TotalDurationSec = req.TotalDurationSec,
                    WatchedAt = DateTime.UtcNow,
                    IsCompleted = req.IsCompleted
                };
                await _repo.UpsertAsync(progress);
            }
            else
            {
                int currentWatch = progress.WatchDurationSec ?? 0;
                int currentLast = progress.LastPositionSec ?? 0;

                progress.WatchDurationSec = Math.Max(currentWatch, req.WatchDurationSec);
                progress.LastPositionSec = Math.Max(currentLast, req.LastPositionSec ?? 0);
                progress.WatchedAt = DateTime.UtcNow;

                if (req.TotalDurationSec > 0 && req.TotalDurationSec > (progress.TotalDurationSec ?? 0))
                    progress.TotalDurationSec = req.TotalDurationSec;

                if (req.IsCompleted)
                    progress.IsCompleted = true;

                await _repo.UpdateAsync(progress);
            }
        }

        public async Task<UserVideoProgress?> GetProgressAsync(int userId, int videoId)
        {
            return await _repo.GetAsync(userId, videoId);
        }
    }
}