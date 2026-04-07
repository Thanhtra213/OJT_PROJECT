using EasyEnglish_API.DTOs.Flashcard;

namespace EasyEnglish_API.Interfaces.Vocabulary
{
    public interface IVocabularyRepository
    {
        Task SaveWordAsync(int userId, int itemId);
        Task UnsaveWordAsync(int userId, int itemId);
        Task<List<SavedWordDto>> GetSavedWordsAsync(int userId);
        Task<bool> IsSavedAsync(int userId, int itemId);
    }
}
