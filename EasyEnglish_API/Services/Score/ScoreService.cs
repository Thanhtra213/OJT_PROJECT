using EasyEnglish_API.DTOs.Score;
using EasyEnglish_API.Interfaces.Score;
using EasyEnglish_API.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace EasyEnglish_API.Services.Score
{
    public class ScoreService : IScoreService
    { 
        private readonly IScoreRepository _scoreRepository;

        public ScoreService(IScoreRepository scoreRepository)
        {
            _scoreRepository = scoreRepository;
        }

        public async Task<List<IGrouping<int, ScoreViewRequest>>> GetAllSystemExamScoresAsync()
        {
            var grouped = await _scoreRepository.GetAllSystemExamScoresAsync();
            if (!grouped.Any()) 
                throw new Exception ("No system exam scores found.");

            var result = grouped
                .Select(g => g.Select(a => new ScoreViewRequest
                {
                    AttemptId = a.AttemptId,
                    QuizId = a.QuizId,
                    QuizTitle = a.Quiz.Title,
                    CourseId = null,
                    CourseName = "System Exam",
                    UserId = a.UserId,
                    UserName = a.User.Username,
                    Score = (double)((a.AutoScore ?? 0) + (a.ManualScore ?? 0)),
                    AttemptDate = a.SubmittedAt ?? a.StartedAt
                }).GroupBy(x => x.QuizId).First())
                .ToList();

            return result;
        }

        public async Task<List<ScoreViewRequest>> GetScoresByCourseAsync(int courseId)
        {
            var data = await _scoreRepository.GetScoresByCourseAsync(courseId);
            if (!data.Any())
                throw new Exception("No scores found for this course.");

            var result = data.Select(a => new ScoreViewRequest
            {
                AttemptId = a.AttemptId,
                QuizId = a.QuizId,
                QuizTitle = a.Quiz.Title,
                CourseId = a.Quiz.CourseId,
                CourseName = a.Quiz.Course?.CourseName ?? "(No Course)",
                UserId = a.UserId,
                UserName = a.User.Username,
                Score = (double)((a.AutoScore ?? 0) + (a.ManualScore ?? 0)),
                AttemptDate = a.SubmittedAt ?? a.StartedAt
            }).ToList();

            return result;
        }

        public async Task<List<ScoreViewRequest>> GetSystemExamScoresAsync()
        {
            var data = await _scoreRepository.GetSystemExamScoresAsync();
            if (!data.Any()) 
                throw new Exception("No scores found for system exams.");

            var result = data.Select(a => new ScoreViewRequest
            {
                AttemptId = a.AttemptId,
                QuizId = a.QuizId,
                QuizTitle = a.Quiz.Title,
                CourseId = null,
                CourseName = "System Exam",
                UserId = a.UserId,
                UserName = a.User.Username,
                Score = (double)((a.AutoScore ?? 0) + (a.ManualScore ?? 0)),
                AttemptDate = a.SubmittedAt ?? a.StartedAt
            }).ToList();
            return result;
        }

        public async Task<(List<ScoreViewRequest> CourseScores, List<ScoreViewRequest> SystemScores)> GetUserScoresAsync(int userId)
        {
            var (courseScores, systemScores) = await _scoreRepository.GetUserScoresAsync(userId);

            var result1 = courseScores.Select(a => new ScoreViewRequest
            {
                AttemptId = a.AttemptId,
                QuizId = a.QuizId,
                QuizTitle = a.Quiz.Title,
                CourseId = a.Quiz.CourseId,
                CourseName = a.Quiz.Course?.CourseName ?? "(No Course)",
                UserId = a.UserId,
                UserName = a.User.Username,
                Score = (double)((a.AutoScore ?? 0) + (a.ManualScore ?? 0)),
                AttemptDate = a.SubmittedAt ?? a.StartedAt
            }).ToList();

            var result2 = systemScores.Select(a => new ScoreViewRequest
            {
                    AttemptId = a.AttemptId,
                    QuizId = a.QuizId,
                    QuizTitle = a.Quiz.Title,
                    CourseId = null,
                    CourseName = "System Exam",
                    UserId = a.UserId,
                    UserName = a.User.Username,
                    Score = (double)((a.AutoScore ?? 0) + (a.ManualScore ?? 0)),
                    AttemptDate = a.SubmittedAt ?? a.StartedAt
            }).ToList();
            return (result1, result2);
        }
    }
}
