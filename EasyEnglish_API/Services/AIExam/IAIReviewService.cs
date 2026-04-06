namespace EasyEnglish_API.Services.AIExam
{
    public interface IAIReviewService
    {
        Task<object?> GetStudentReview(int userId, long submissionId);
        Task<List<object>> GetSubmissionList(int userId);
    }
}
