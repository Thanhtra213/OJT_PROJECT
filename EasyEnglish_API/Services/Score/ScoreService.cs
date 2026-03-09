using EasyEnglish_API.Interfaces.Score;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Score
{
    public class ScoreService : IScoreService
    { 
        private readonly IScoreRepository _scoreRepository;

        public ScoreService(IScoreRepository scoreRepository)
        {
            _scoreRepository = scoreRepository;
        }

        public async Task<List<IGrouping<int?, Attempt>>> GetAllSystemExamScoresAsync()
        {
            return await _scoreRepository.GetAllSystemExamScoresAsync();
        }

        public async Task<List<Attempt>> GetScoresByCourseAsync(int courseId)
        {
            return await _scoreRepository.GetScoresByCourseAsync(courseId);
        }

        public async Task<List<Attempt>> GetScoresByTeacherAsync(int teacherId)
        {
            return await _scoreRepository.GetScoresByTeacherAsync(teacherId);
        }

        public async Task<List<Attempt>> GetSystemExamScoresAsync()
        {
            return await _scoreRepository.GetSystemExamScoresAsync();
        }

        public async Task<(List<Attempt> CourseScores, List<Attempt> SystemScores)> GetUserScoresAsync(int userId)
        {
            return await _scoreRepository.GetUserScoresAsync(userId);
        }
    }
}
