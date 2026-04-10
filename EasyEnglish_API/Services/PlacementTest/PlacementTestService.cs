using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Interfaces.Quizs;
using EasyEnglish_API.Services.PlacementTest;

namespace EasyEnglish_API.Services
{
    public class PlacementTestService : IPlacementTestService
    {
        private readonly IQuizRepository _quizRepo;
        private readonly ICourseRepository _courseRepo;

        public PlacementTestService(IQuizRepository quizRepo, ICourseRepository courseRepo)
        {
            _quizRepo = quizRepo;
            _courseRepo = courseRepo;
        }

        public async Task<List<PlacementTestDto>> GetPlacementTestsAsync()
        {
            var tests = await _quizRepo.GetPlacementTestsAsync();
            return tests.Select(t => new PlacementTestDto
            {
                QuizID = t.QuizId,
                Title = t.Title,
                Description = t.Description,
                TargetLevel = t.TargetLevel
            }).ToList();
        }

        public async Task<MarkPlacementTestRequest> UpdatePlacementTest(int quizId, bool isPlacementTest, int? targetLevel)
        {
            if (quizId <= 0)
                throw new ArgumentException("Invalid quizId");

            if (isPlacementTest && targetLevel == null)
                throw new ArgumentException("TargetLevel is required when IsPlacementTest = true");

            if (!isPlacementTest)
                targetLevel = null;

            var result = await _quizRepo.UpdatePlacementTestFlagAsync(quizId, isPlacementTest, targetLevel);

            if (!result)
                throw new KeyNotFoundException("Quiz not found");

            return new MarkPlacementTestRequest
            {
                IsPlacementTest = isPlacementTest,
                TargetLevel = targetLevel
            };
        }
        public async Task<PlacementRecommendationDto> GetRecommendationAsync(int userId, int attemptId)
        {
            var attempt = await _quizRepo.GetAttemptAsync(attemptId, userId)
                ?? throw new Exception("Attempt not found");

            if (attempt.Status == "IN_PROGRESS")
                throw new Exception("Please submit the quiz first");

            decimal score = attempt.AutoScore ?? 0;
            byte level = CalculateLevel(score);
            string levelName = GetLevelName(level);

            var courses = await _courseRepo.GetCoursesByLevelAsync(level, 6);
            var recommendedCourses = courses.Select(c => new RecommendedCourseDto
            {
                CourseID = c.CourseId,
                CourseName = c.CourseName,
                Description = c.Description,
                CourseLevel = c.CourseLevel,
                CreateAt = c.CreateAt
            }).ToList();

            return new PlacementRecommendationDto
            {
                Level = level,
                LevelName = levelName,
                Score = score,
                RecommendedCourses = recommendedCourses
            };
        }

        // ===== CHỈ CÓ 4 CẤP ĐỘ =====
        private static byte CalculateLevel(decimal score)
        {
            return score switch
            {
                >= 80 => 4, // Advanced
                >= 60 => 3, // Intermediate
                >= 40 => 2, // Elementary
                _ => 1      // Beginner
            };
        }

        private static string GetLevelName(byte level)
        {
            return level switch
            {
                4 => "Advanced",
                3 => "Intermediate",
                2 => "Elementary",
                1 => "Beginner",
                _ => "Unknown"
            };
        }
    }
}