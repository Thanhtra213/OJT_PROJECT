using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Progress
{
    public interface IVideoProgressRepository
    {
        Task<UserVideoProgress?> GetAsync(int userId, int videoId);

        Task AddAsync(UserVideoProgress progress);

        Task UpdateAsync(UserVideoProgress progress);
        Task UpsertAsync(UserVideoProgress progress);
    }
}
