using EasyEnglish_API.DTOs.AIExam;

namespace EasyEnglish_API.Services.AIExam
{
    public interface IAISpeakingService
    {
        Task<GeneratePromptResponse> GeneratePromptAsync(int userId);
        Task<AISpeakingResultResponse> SubmitAsync(int userId, AISpeakingSubmitAudioRequest request);
    }
}
