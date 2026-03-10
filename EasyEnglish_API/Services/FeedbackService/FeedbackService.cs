using EasyEnglish_API.DTOs.Feedback;
using EasyEnglish_API.Models;
using EasyEnglish_API.Interfaces;
using EasyEnglish_API.Interfaces.Feedbacks;
using EasyEnglish_API.Interfaces.Membership;

namespace EasyEnglish_API.Services.FeedbackService
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedback;
        private readonly IMembershipRepository _membership;
        private readonly ICourseRepository _course;

        public FeedbackService(IFeedbackRepository feedback, ICourseRepository course, IMembershipRepository membership)
        {
            _feedback = feedback;
            _membership = membership;
            _course = course;
        }

        //===== User =====   
        public async Task<Feedback> CreateFeedbackAsync(int userId, FeedbackCreateRequest req)
        {
            bool hasMembership = await _membership.HasActiveMembershipAsync(userId);
            if (!hasMembership)
                throw new UnauthorizedAccessException("You need an active membership to submit feedback.");

            if (!await _course.CourseExistsAsync(req.CourseID))
                throw new KeyNotFoundException("Course not found.");

            if (await _feedback.HasFeedbackAsync(req.CourseID, userId))
                throw new InvalidOperationException("You have already submitted feedback for this course.");

            if (req.Rating < 1 || req.Rating > 5)
                throw new ArgumentException("Rating must be between 1 and 5.");

            var feedback = new Feedback
            {
                UserId = userId,
                CourseId = req.CourseID,
                Rating = req.Rating,
                Comment = req.Comment,
                CreatedAt = DateTime.UtcNow,
                IsVisible = true
            };

            return await _feedback.CreateFeedbackAsync(feedback);
        }

        //===== Public =====

        public async Task<(double average, int total)> GetCourseRatingAsync(int courseId)
        {
            if (!await _course.CourseExistsAsync(courseId))
                throw new Exception("Course not found");

            return await _feedback.GetCourseRatingAsync(courseId);
        }

        public async Task<List<FeedbackViewDto>> GetCourseFeedbacksAsync(int courseId)
        {
            if (!await _course.CourseExistsAsync(courseId))
                throw new Exception("Course not found. ");
            return await _feedback.GetCourseFeedbacksAsync(courseId);
        }
        //===== Teacher Feeback =====
        public async Task<IEnumerable<FeedbackViewDto>> GetTeacherFeedbacksAsync(int teacherId)
        {
            var feedbacks = await _feedback.GetTeacherFeedbacksAsync(teacherId);

            return feedbacks.Select(f => new FeedbackViewDto
            {
                FeedbackId = f.FeedbackId,
                UserId = f.UserId,
                Username = f.User.Username,
                CourseId = f.CourseId,
                CourseName = f.Course.CourseName,
                Rating = f.Rating,
                Comment = f.Comment,
                CreatedAt = f.CreatedAt,
                IsVisible = f.IsVisible
            });
        }
        //=====Admin=====
        public async Task<List<FeedbackViewDto>> GetAllFeedbacksAsync()
        {
            var feedback = await _feedback.GetAllFeedbacksAsync();
            return feedback;
        }

        public async Task<bool> ToggleVisibilityAsync(int feedbackId)
        {
            return await _feedback.ToggleVisibilityAsync(feedbackId);
        }

        public async Task<bool> DeleteFeedbackAsync(int feedbackId)
        {
            return await _feedback.DeleteFeedbackAsync(feedbackId);
        }
    }
}
