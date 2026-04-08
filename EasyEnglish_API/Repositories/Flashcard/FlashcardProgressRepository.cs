using EasyEnglish_API.Data;
using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Flashcard
{
    public class FlashcardProgressRepository : IFlashcardProgressRepository
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
                .Where(x => x.UserId == userId && x.Item.SetId == setId)
                .Select(x => new FlashcardProgressDto
                {
                    ItemId = x.ItemId,
                    IsMastered = x.IsMastered,
                    IsSaved = x.IsSaved,
                    ReviewCount = x.ReviewCount,
                    FirstLearnedAt = x.FirstLearnedAt,
                    LastReviewedAt = x.LastReviewedAt,
                    NextReviewAt = x.NextReviewAt
                })
                .ToListAsync();
        }
        public async Task<FlashcardProgress?> GetProgressByItemAsync(int userId, int itemId)
        {
            return await _db.FlashcardProgresses
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ItemId == itemId);
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
                .FirstOrDefaultAsync(x => x.UserId == progress.UserId && x.ItemId == progress.ItemId);

            if (existing != null)
            {
                existing.IsMastered = progress.IsMastered;
                existing.ReviewCount = progress.ReviewCount;
                existing.NextReviewAt = progress.NextReviewAt;
                existing.LastReviewedAt = progress.LastReviewedAt;
                if (existing.FirstLearnedAt == null)
                    existing.FirstLearnedAt = progress.FirstLearnedAt;
            }
            else
            {
                _db.FlashcardProgresses.Add(new FlashcardProgress
                {
                    UserId = progress.UserId,
                    ItemId = progress.ItemId,
                    IsMastered = progress.IsMastered,
                    IsSaved = false,        
                    ReviewCount = progress.ReviewCount,
                    NextReviewAt = progress.NextReviewAt,
                    FirstLearnedAt = progress.FirstLearnedAt ?? DateTime.UtcNow,
                    LastReviewedAt = progress.LastReviewedAt ?? DateTime.UtcNow
                });
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
                .Where(x => x.UserId == userId);

            if (setId.HasValue)
                query = query.Where(x => x.Item.SetId == setId.Value);

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new FlashcardHistoryDto
                {
                    ItemId = x.ItemId,
                    FrontText = x.Item.FrontText ?? "",
                    ActionType = x.ActionType,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();
        }
    }
}