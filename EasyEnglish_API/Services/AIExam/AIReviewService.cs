using EasyEnglish_API.Interfaces.AIExam;

namespace EasyEnglish_API.Services.AIExam
{
    public class AIReviewService : IAIReviewService
    {
        private readonly IAIReviewRepository _repo;

        public AIReviewService(IAIReviewRepository repo)
        {
            _repo = repo;
        }

        public async Task<object?> GetStudentReview(int userId, long submissionId)
        {
            var data = await _repo.GetStudentReviewAsync(userId, submissionId);

            if (data == null)
                throw new Exception("Submission not found");

            return data;
        }
    }
}
