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
                    WatchedAt = DateTime.UtcNow,
                    IsCompleted = req.IsCompleted
                };
                await _repo.AddAsync(progress);
            }
            else
            {
                progress.WatchDurationSec = req.WatchDurationSec;
                progress.LastPositionSec = req.LastPositionSec;
                progress.WatchedAt = DateTime.UtcNow;
                if (req.IsCompleted)
                    progress.IsCompleted = true;
                await _repo.UpdateAsync(progress);
            }
            await _repo.SaveAsync();
        }

        public async Task<UserVideoProgress?> GetProgressAsync(int userId, int videoId)
        {
            return await _repo.GetAsync(userId, videoId);
        }
    }
}
