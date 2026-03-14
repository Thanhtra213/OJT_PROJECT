using EasyEnglish_API.DTOs.Score;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Score
{
    public interface IScoreService
    {
        // 2️⃣ Lấy điểm bài kiểm tra hệ thống (quiz global)
        Task<List<ScoreViewRequest>> GetSystemExamScoresAsync();

        // 3️⃣ Lấy điểm của 1 user (course + system exam)
        Task<(List<ScoreViewRequest> CourseScores, List<ScoreViewRequest> SystemScores)> GetUserScoresAsync(int userId);

        // 4️⃣ Lấy điểm theo khóa học
        Task<List<ScoreViewRequest>> GetScoresByCourseAsync(int courseId);

        // 5️⃣ Lấy toàn bộ điểm system exam (group by quiz)
        Task<List<IGrouping<int, ScoreViewRequest>>> GetAllSystemExamScoresAsync();
    }
}
