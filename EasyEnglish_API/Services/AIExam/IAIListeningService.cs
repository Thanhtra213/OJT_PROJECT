using EasyEnglish_API.DTOs.AIExam;

namespace EasyEnglish_API.Services.AIExam
{
    public interface IAIListeningService
    {
        Task<GenerateListeningResponse> GenerateAsync(int userId);
        Task<AIListeningResultResponse> SubmitAsync(int userId, AIListeningSubmitRequest req);
    }
}
