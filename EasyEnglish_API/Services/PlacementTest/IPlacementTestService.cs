using EasyEnglish_API.DTOs.Quizs;

namespace EasyEnglish_API.Services.PlacementTest
{
    public interface IPlacementTestService
    {
        Task<PlacementRecommendationDto> GetRecommendationAsync(int userId, int attemptId);
        Task<List<PlacementTestDto>> GetPlacementTestsAsync();
        Task<MarkPlacementTestRequest> UpdatePlacementTest(int quizId, bool isPlacementTest, int? targetLevel);
    }
}
