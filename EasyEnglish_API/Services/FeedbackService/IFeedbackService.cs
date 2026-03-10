using EasyEnglish_API.DTOs.Feedback;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.FeedbackService
{
    public interface IFeedbackService
    {
        //-----Teacher-----
        Task<IEnumerable<FeedbackViewDto>> GetTeacherFeedbacksAsync(int teacherId);
        //-----Public------
        Task<(double average, int total)> GetCourseRatingAsync(int courseId);
        Task<List<FeedbackViewDto>> GetCourseFeedbacksAsync(int courseId);
        //_----User-----
        Task<Feedback> CreateFeedbackAsync(int userId, FeedbackCreateRequest req);
        //-----Admin----
        Task<List<FeedbackViewDto>> GetAllFeedbacksAsync();
        Task<bool> ToggleVisibilityAsync(int feedbackId);
        Task<bool> DeleteFeedbackAsync(int feedbackId);
    }
}
