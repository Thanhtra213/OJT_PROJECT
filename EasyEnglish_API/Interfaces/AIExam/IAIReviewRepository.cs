using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.AIExam
{
    public interface IAIReviewRepository
    {
        Task<AnswerAIReview> CreateAsync(AnswerAIReview review);
        Task<AnswerAIReview?> GetBySubmissionAsync(long submissionId);
        Task<List<AnswerAIReview>> GetPendingForTeacherAsync();
        Task<AnswerAIReview> GetByIdAsync(long id);
        Task<object?> GetStudentReviewAsync(int userId, long submissionId);
    }
}
