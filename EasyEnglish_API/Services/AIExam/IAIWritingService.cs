using EasyEnglish_API.DTOs.AIExam;

namespace EasyEnglish_API.Services.AIExam
{
    public interface IAIWritingService
    {
        Task<AIWritingPromptResponse> GeneratePrompt(int userID);
        Task<AIWritingFeedbackResponse> SubmitAsync(int userdID, AIWritingSubmitRequest req);
    }
}
