using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Flashcard
{
    public interface IFlashcardRepository
    {
        // ---- READ ----
        Task<List<FlashcardSet>> GetAllPublicSetsAsync();
        Task<List<FlashcardSet>> GetSetsByCourseAsync(int courseId);
        Task<FlashcardSet?> GetSetDetailAsync(int setId);

        // ---- CREATE ----
        Task<FlashcardSet> CreateSetAsync(FlashcardSet set);
        Task<FlashcardItem> CreateItemAsync(FlashcardItem item);

        // ---- UPDATE ----
        Task<bool> UpdateSetAsync(FlashcardSet set);
        Task<bool> UpdateItemAsync(FlashcardItem item);

        // ---- DELETE ----
        Task<bool> DeleteSetAsync(int setId);
        Task<bool> DeleteItemAsync(int itemId);

        Task<bool> EnsureTeacherOwnsCourseAsync(int courseId, int userId);
        Task<bool> EnsureTeacherOwnsSetAsync(int setId, int userId);

        Task<int> BulkCreateItemsAsync(List<FlashcardItem> items);
    }
}
