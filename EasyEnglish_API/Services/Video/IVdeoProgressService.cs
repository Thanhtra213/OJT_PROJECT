using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Models;
using EasyEnglish_API.Repositories.Progress;

namespace EasyEnglish_API.Services.Video
{
    public interface IVideoProgressService
    {
        Task UpdateProgressAsync(int userId, VideoProgressRequest req);
        Task<UserVideoProgress?> GetProgressAsync(int userId, int videoId);
    }
}
