using EasyEnglish_API.Models;
using EasyEnglish_API.DTOs.Feedback;

namespace EasyEnglish_API.Interfaces.Feedbacks
{
    public interface IFeedbackRepository
    {
        // ----- USER -----
        Task<bool> HasFeedbackAsync(int courseId, int userId);
        Task<Feedback> CreateFeedbackAsync(Feedback feedback);

        // ----- PUBLIC -----
        Task<(double average, int total)> GetCourseRatingAsync(int courseId);
        Task<List<FeedbackViewDto>> GetCourseFeedbacksAsync(int courseId);

        // ----- TEACHER -----
        Task<List<Feedback>> GetTeacherFeedbacksAsync(int teacherId);

        // ----- ADMIN -----
        Task<List<FeedbackViewDto>> GetAllFeedbacksAsync();
        Task<bool> ToggleVisibilityAsync(int feedbackId);
        Task<bool> DeleteFeedbackAsync(int feedbackId);
    }
}
