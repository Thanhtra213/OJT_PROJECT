using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Flashcard
{
    public interface IFlashcardProgressRepository
    {
        Task<FlashcardProgress?> GetProgressAsync(int userId, int itemId);
        Task<List<FlashcardProgressDto>> GetProgressBySetAsync(int userId, int setId);
        Task<FlashcardProgress?> GetProgressByItemAsync(int userId, int itemId);
        Task<List<FlashcardProgress>> GetDueForReviewAsync(int userId);

        Task UpsertProgressAsync(FlashcardProgress progress);
        Task MarkMasteredAsync(int userId, int itemId);
        Task LogHistoryAsync(int userId, int itemId, byte actionType);
        Task<List<FlashcardHistoryDto>> GetHistoryAsync(int userId, int? setId = null);

    }
}
