using EasyEnglish_API.DTOs.Score;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Score
{
    public interface ITeacherScoreService
    {
        Task<object> CreateTeacherReview(int teacherId, CreateTeacherReviewRequest requ);
        Task<List<object>> GetListPending();
        Task<object> GetDetail(int aiReviewId);
    }
}
