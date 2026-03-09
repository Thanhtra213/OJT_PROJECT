using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Score
{
    public interface IScoreRepository
    {
        Task<List<Attempt>> GetScoresByTeacherAsync(int teacherId);

        // 2️⃣ Lấy điểm bài kiểm tra hệ thống (quiz global)
        Task<List<Attempt>> GetSystemExamScoresAsync();

        // 3️⃣ Lấy điểm của 1 user (course + system exam)
        Task<(List<Attempt> CourseScores, List<Attempt> SystemScores)> GetUserScoresAsync(int userId);

        // 4️⃣ Lấy điểm theo khóa học
        Task<List<Attempt>> GetScoresByCourseAsync(int courseId);

        // 5️⃣ Lấy toàn bộ điểm system exam (group by quiz)
        Task<List<IGrouping<int?, Attempt>>> GetAllSystemExamScoresAsync();
    }
}
