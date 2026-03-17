using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Streak;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Streak
{
    public class StreakRepository : IStreakRepository
    {
        private readonly EasyEnglishDbContext _db;

        public StreakRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<List<DateOnly>> GetActivityDatesAsync(int userId)
        {
            // Ngày xem video
            var videoDates = await _db.UserVideoProgresses
                .Where(v => v.UserId == userId)
                .Select(v => DateOnly.FromDateTime(v.WatchedAt))
                .ToListAsync();

            // Ngày học flashcard (ưu tiên LastReviewedAt, fallback FirstLearnedAt)
            var flashcardDates = await _db.FlashcardProgresses
                .Where(f => f.UserId == userId)
                .Select(f => f.LastReviewedAt != null
                    ? DateOnly.FromDateTime(f.LastReviewedAt.Value)
                    : DateOnly.FromDateTime(f.FirstLearnedAt!.Value))
                .ToListAsync();

            // Merge, lấy ngày duy nhất, sắp xếp giảm dần
            return videoDates
                .Concat(flashcardDates)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();
        }
    }
}