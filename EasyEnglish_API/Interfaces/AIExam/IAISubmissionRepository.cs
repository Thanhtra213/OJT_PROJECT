using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.AIExam
{
    public interface IAISubmissionRepository
    {
        Task<AISubmission> CreateAsync(AISubmission submission);
        Task<AISubmission?> GetByIdAsync(long submissionId);
        Task<List<AISubmission>> GetByUserAsync(int userId);
    }
}
