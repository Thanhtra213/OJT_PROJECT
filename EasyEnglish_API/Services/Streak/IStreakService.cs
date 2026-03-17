using EasyEnglish_API.DTOs.Progress;

namespace EasyEnglish_API.Services.Streak
{
    public interface IStreakService
    {
        Task<StreakResponse> GetStreakAsync(int userId);
    }
}