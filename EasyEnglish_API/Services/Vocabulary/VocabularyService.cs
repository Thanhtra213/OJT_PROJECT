using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Interfaces.Vocabulary;

namespace EasyEnglish_API.Services.Vocabulary
{
    public class VocabularyService : IVocabularyService
    {
        private readonly IVocabularyRepository _repo;

        public VocabularyService(IVocabularyRepository repo)
        {
            _repo = repo;
        }

        public async Task SaveWordAsync(int userId, int itemId)
        {
            await _repo.SaveWordAsync(userId, itemId);
        }

        public async Task UnsaveWordAsync(int userId, int itemId)
        {
            await _repo.UnsaveWordAsync(userId, itemId);
        }

        public async Task<List<SavedWordDto>> GetSavedWordsAsync(int userId)
        {
            return await _repo.GetSavedWordsAsync(userId);
        }
    }
}
