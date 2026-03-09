using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Score;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Score
{
    public class ScoreRepository : IScoreRepository
    {
        private readonly EasyEnglishDbContext _db;

        public ScoreRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        // ================================
        // 1️⃣ Điểm theo giáo viên
        // ================================
        public async Task<List<Attempt>> GetScoresByTeacherAsync(int teacherId)
        {
            return await _db.Attempts
                .Include(a => a.Quiz)
                    .ThenInclude(q => q.Course)
                .Include(a => a.User)
                .Where(a => a.Quiz.Course != null && a.Quiz.Course.TeacherId == teacherId)
                .OrderByDescending(a => a.SubmittedAt ?? a.StartedAt)
                .ToListAsync();
        }

        // ================================
        // 2️⃣ Điểm System Exam (quiz global)
        // ================================
        public async Task<List<Attempt>> GetSystemExamScoresAsync()
        {
            return await _db.Attempts
                .Include(a => a.Quiz)
                .Include(a => a.User)
                .Where(a => a.Quiz.CourseId == null)
                .OrderByDescending(a => a.SubmittedAt ?? a.StartedAt)
                .ToListAsync();
        }

        // ================================
        // 3️⃣ Điểm của 1 user (phân loại)
        // ================================
        public async Task<(List<Attempt>, List<Attempt>)> GetUserScoresAsync(int userId)
        {
            var courseScores = await _db.Attempts
                .Include(a => a.Quiz).ThenInclude(q => q.Course)
                .Include(a => a.User)
                .Where(a => a.UserId == userId && a.Quiz.CourseId != null)
                .ToListAsync();

            var systemScores = await _db.Attempts
                .Include(a => a.Quiz)
                .Include(a => a.User)
                .Where(a => a.UserId == userId && a.Quiz.CourseId == null)
                .ToListAsync();

            return (courseScores, systemScores);
        }

        // ================================
        // 4️⃣ Điểm theo khóa học
        // ================================
        public async Task<List<Attempt>> GetScoresByCourseAsync(int courseId)
        {
            return await _db.Attempts
                .Include(a => a.Quiz)
                    .ThenInclude(q => q.Course)
                .Include(a => a.User)
                .Where(a => a.Quiz.CourseId == courseId)
                .OrderByDescending(a => a.SubmittedAt ?? a.StartedAt)
                .ToListAsync();
        }

        // ================================
        // 5️⃣ Toàn bộ system exam (group by quiz)
        // ================================
        public async Task<List<IGrouping<int?, Attempt>>> GetAllSystemExamScoresAsync()
        {
            var data = await _db.Attempts
                .Include(a => a.Quiz)
                .Include(a => a.User)
                .Where(a => a.Quiz.CourseId == null)
                .ToListAsync();

            // ✅ Ép kiểu a.QuizID -> (int?)
            return data.GroupBy(a => (int?)a.QuizId).ToList();
        }
    }
}
