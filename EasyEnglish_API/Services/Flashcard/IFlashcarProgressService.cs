using EasyEnglish_API.DTOs.Progress;

namespace EasyEnglish_API.Services.Flashcard
{
    public interface IFlashcarProgressService
    {
        Task<List<FlashcardProgressDto>> GetProgressBySetAsync(int userId, int setId);

        Task LearnAsync(int userId, LearnFlashcardRequest request);

        Task<List<FlashcardHistoryDto>> GetHistoryAsync(int userId, int? setId);
    }
}
