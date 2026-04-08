using EasyEnglish_API.Data;
using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Interfaces.Vocabulary;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Vocabulary
{
    public class VocabularyRepository : IVocabularyRepository
    {
        private readonly EasyEnglishDbContext _db;

        public VocabularyRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task SaveWordAsync(int userId, int itemId)
        {
            var existing = await _db.FlashcardProgresses
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ItemId == itemId);

            if (existing != null)
            {
                await _db.FlashcardProgresses
                    .Where(x => x.UserId == userId && x.ItemId == itemId)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsSaved, true));
            }
            else
            {
                _db.FlashcardProgresses.Add(new FlashcardProgress
                {
                    UserId = userId,
                    ItemId = itemId,
                    IsSaved = true,
                    IsMastered = false,
                    ReviewCount = 0,
                    EaseFactor = 2.5m,       
                    IntervalDays = 1,
                    FirstLearnedAt = DateTime.UtcNow,
                    LastReviewedAt = DateTime.UtcNow,
                    NextReviewAt = DateTime.UtcNow.AddDays(1)
                });
                await _db.SaveChangesAsync();
            }
        }

        public async Task UnsaveWordAsync(int userId, int itemId)
        {
            await _db.FlashcardProgresses
                .Where(x => x.UserId == userId && x.ItemId == itemId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsSaved, false));
        }

        public async Task<List<SavedWordDto>> GetSavedWordsAsync(int userId)
        {
            return await _db.FlashcardProgresses
                .Where(x => x.UserId == userId && x.IsSaved)
                .Select(x => new SavedWordDto
                {
                    ItemId = x.ItemId,
                    FrontText = x.Item.FrontText ?? "",
                    BackText = x.Item.BackText ?? "",
                    Example = x.Item.Example ?? "",
                    IsMastered = x.IsMastered,
                    ReviewCount = x.ReviewCount,
                    LastReviewedAt = x.LastReviewedAt
                })
                .OrderByDescending(x => x.LastReviewedAt)
                .ToListAsync();
        }

        public async Task<bool> IsSavedAsync(int userId, int itemId)
        {
            return await _db.FlashcardProgresses
                .AnyAsync(x => x.UserId == userId && x.ItemId == itemId && x.IsSaved);
        }
    }
}