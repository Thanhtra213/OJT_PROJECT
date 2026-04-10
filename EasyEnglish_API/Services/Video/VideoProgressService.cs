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
                    LastPositionSec = Math.Min(req.WatchDurationSec, 30),
                    TotalDurationSec = req.TotalDurationSec,
                    WatchedAt = DateTime.UtcNow,
                    IsCompleted = req.IsCompleted
                };
                await _repo.AddAsync(progress);
            }
            else
            {
                const int SKIP_BUFFER_SEC = 15;
                int currentWatch = progress.WatchDurationSec ?? 0;
                int currentLast = progress.LastPositionSec ?? 0;
                int maxAllowed = currentWatch + SKIP_BUFFER_SEC;

                if (req.LastPositionSec > maxAllowed)
                {
                    // Bị skip: không update lastPosition, không cho watchDuration vượt quá currentWatch + buffer nhỏ
                    progress.WatchDurationSec = Math.Max(currentWatch, Math.Min(req.WatchDurationSec, currentWatch + SKIP_BUFFER_SEC));
                    // lastPositionSec giữ nguyên giá trị cũ — không update
                    progress.WatchedAt = DateTime.UtcNow;
                }
                else
                {
                    progress.WatchDurationSec = Math.Max(currentWatch, req.WatchDurationSec);
                    progress.LastPositionSec = req.LastPositionSec;
                    progress.WatchedAt = DateTime.UtcNow;
                }
                if ((progress.TotalDurationSec ?? 0) == 0 && req.TotalDurationSec > 0)
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
