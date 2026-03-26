using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Course
{
    public interface IVideoService
    {
        Task<(VideoDto? video, int statusCode, string? message)> GetVideoAsync(int videoId, int? userId);

    }
}

