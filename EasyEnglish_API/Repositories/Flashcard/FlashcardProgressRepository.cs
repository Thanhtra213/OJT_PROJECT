using EasyEnglish_API.Data;
using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Flashcard
{
    public class FlashcardProgressRepository :IFlashcardProgressRepository
    {
        private readonly EasyEnglishDbContext _db;

        public FlashcardProgressRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        // ===== Progress =====
        public async Task<FlashcardProgress?> GetProgressAsync(int userId, int itemId)
        {
            return await _db.FlashcardProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ItemId == itemId);
        }

        public async Task<List<FlashcardProgressDto>> GetProgressBySetAsync(int userId, int setId)
        {
            return await _db.FlashcardProgresses
                .Where(p => p.UserId == userId && p.Item.SetId == setId)
                .Select(p => new FlashcardProgressDto
                {
                    ItemId = p.ItemId,
                    IsMastered = p.IsMastered,
                    ReviewCount = p.ReviewCount,
                    NextReviewAt = p.NextReviewAt
                })
                .ToListAsync();
        }
        public async Task<FlashcardProgress?> GetProgressByItemAsync(int userId, int itemId)
        {
            return await _db.FlashcardProgresses
                .FirstOrDefaultAsync(f => f.UserId == userId && f.ItemId == itemId);
        }


        public async Task<List<FlashcardProgress>> GetDueForReviewAsync(int userId)
        {
            var now = DateTime.UtcNow;
            return await _db.FlashcardProgresses
                .Where(p => p.UserId == userId &&
                            p.NextReviewAt != null &&
                            p.NextReviewAt <= now)
                .ToListAsync();
        }

        public async Task UpsertProgressAsync(FlashcardProgress progress)
        {
            var existing = await _db.FlashcardProgresses
                .FindAsync(progress.UserId, progress.ItemId);

            if (existing == null)
            {
                _db.FlashcardProgresses.Add(progress);
            }
            else
            {
                _db.Entry(existing).CurrentValues.SetValues(progress);
            }

            await _db.SaveChangesAsync();
        }

        public async Task MarkMasteredAsync(int userId, int itemId)
        {
            var progress = await _db.FlashcardProgresses
                .FindAsync(userId, itemId);

            if (progress == null) return;

            progress.IsMastered = true;
            progress.NextReviewAt = null;
            await _db.SaveChangesAsync();
        }

        // ===== History =====
        public async Task LogHistoryAsync(int userId, int itemId, byte actionType)
        {
            _db.FlashcardHistories.Add(new FlashcardHistory
            {
                UserId = userId,
                ItemId = itemId,
                ActionType = actionType,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }

        public async Task<List<FlashcardHistoryDto>> GetHistoryAsync(int userId, int? setId)
        {
            var query = _db.FlashcardHistories
                .Where(h => h.UserId == userId);

            if (setId.HasValue)
                query = query.Where(h => h.Item.SetId == setId);

            return await query
                .Select(h => new FlashcardHistoryDto
                {
                    ItemId = h.ItemId,
                    ActionType = h.ActionType,
                    CreatedAt = h.CreatedAt
                })
                .ToListAsync();
        }
    }
}
