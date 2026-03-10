using EasyEnglish_API.DTOs.AIExam;

namespace EasyEnglish_API.Services.AIExam
{
    public interface IAIQuizService
    {
        Task<AIQuizResponse> GenerateQuizAsync(AIQuizRequest request);
    }
}
