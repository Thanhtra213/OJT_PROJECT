using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Score
{
    public interface ITeacherScoreRepository
    {
        Task<AnswerTeacherReview> CreateTeacherReviewAsync(AnswerTeacherReview review);
        Task<List<AnswerTeacherReview>> GetAllList(long id);
        Task<AnswerAIReview> GetByIdAsync(int id);
    }
}
