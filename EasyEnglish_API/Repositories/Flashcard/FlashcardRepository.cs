using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Flashcard
{
    public class FlashcardRepository : IFlashcardRepository
    {
        private readonly EasyEnglishDbContext _db;

        public FlashcardRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        // ---- READ ----
        public async Task<List<FlashcardSet>> GetAllPublicSetsAsync()
        {
            return await _db.FlashcardSets
                .Where(s => s.CourseId == null)
                .Include(s => s.FlashcardItems)
                .ToListAsync();
        }

        public async Task<List<FlashcardSet>> GetSetsByCourseAsync(int courseId)
        {
            return await _db.FlashcardSets
                .Where(s => s.CourseId == courseId)
                .Include(s => s.FlashcardItems)
                .ToListAsync();
        }

        public async Task<FlashcardSet?> GetSetDetailAsync(int setId)
        {
            return await _db.FlashcardSets
                .Include(s => s.FlashcardItems)
                .FirstOrDefaultAsync(s => s.SetId == setId);
        }

        // ---- CREATE ----
        public async Task<FlashcardSet> CreateSetAsync(FlashcardSet set)
        {
            _db.FlashcardSets.Add(set);
            await _db.SaveChangesAsync();
            return set;
        }

        public async Task<FlashcardItem> CreateItemAsync(FlashcardItem item)
        {
            _db.FlashcardItems.Add(item);
            await _db.SaveChangesAsync();
            return item;
        }

        // ---- UPDATE ----
        public async Task<bool> UpdateSetAsync(FlashcardSet set)
        {
            var existing = await _db.FlashcardSets
                .FirstOrDefaultAsync(s => s.SetId == set.SetId);

            if (existing == null)
                return false;

            existing.Title = set.Title;
            existing.Description = set.Description;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateItemAsync(FlashcardItem item)
        {
            var existing = await _db.FlashcardItems
                .FirstOrDefaultAsync(i => i.ItemId == item.ItemId);

            if (existing == null)
                return false;

            existing.FrontText = item.FrontText;
            existing.BackText = item.BackText;
            existing.Example = item.Example;

            await _db.SaveChangesAsync();
            return true;
        }

        // ---- DELETE ----
        public async Task<bool> DeleteSetAsync(int setId)
        {
            var set = await _db.FlashcardSets
                .Include(s => s.FlashcardItems)
                .FirstOrDefaultAsync(s => s.SetId == setId);

            if (set == null) return false;

            if (set.FlashcardItems.Any())
                _db.FlashcardItems.RemoveRange(set.FlashcardItems);

            _db.FlashcardSets.Remove(set);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteItemAsync(int itemId)
        {
            var item = await _db.FlashcardItems.FindAsync(itemId);
            if (item == null) return false;

            _db.FlashcardItems.Remove(item);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EnsureTeacherOwnsCourseAsync(int courseId, int userId)
        {
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            return course != null && course.TeacherId == userId;
        }

        public async Task<bool> EnsureTeacherOwnsSetAsync(int setId, int userId)
        {
            var set = await GetSetDetailAsync(setId);
            if (set == null) 
                return false;

            if (set.CourseId == null) 
                return false;

            return await EnsureTeacherOwnsCourseAsync(set.CourseId.Value, userId);
        }
    }
}
