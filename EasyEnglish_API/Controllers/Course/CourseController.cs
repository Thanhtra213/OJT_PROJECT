using EasyEnglish_API.DTOs.Feedback;
using EasyEnglish_API.Services.Courses;
using EasyEnglish_API.Services.FeedbackService;
using EasyEnglish_API.Services.Membership;
using EasyEnglish_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using EasyEnglish_API.DTOs.Course;

namespace EasyEnglish_API.Controllers.Course
{
    [ApiController]
    [Route("api/user/course")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;
        private readonly IMembershipService _membershipService;
        private readonly IFeedbackService _feedbackService;

        public CourseController(
            ICourseService courseService,
            IMembershipService membershipService,
            IFeedbackService feedbackService)
        {
            _courseService = courseService;
            _membershipService = membershipService;
            _feedbackService = feedbackService;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;

            return int.Parse(idClaim);
        }

        // =========================================
        // 1️⃣ GET ALL COURSES (public)
        // =========================================
        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            var courses = await _courseService.GetAllCoursesAsync();


            return Ok(new { Courses = courses });
        }


        // =========================================
        // 2️⃣ GET COURSE DETAIL
        // =========================================
        [HttpGet("{id:int}")]
        public async Task<ActionResult<CourseRequest>> GetCourseDetail(int id)
        {
            var course = await _courseService.GetCourseDetailAsync(id);
            if (course == null)
                return NotFound(new { Message = "Course not found" });
            return Ok(course);
        }

        // 3️. GET RATING
        [HttpGet("{courseId:int}/rating")]
        public async Task<IActionResult> GetCourseAverageRating(int courseId)
        {
            var (avg, total) = await _feedbackService.GetCourseRatingAsync(courseId);

            return Ok(new
            {
                CourseID = courseId,
                AverageRating = avg,
                TotalFeedback = total
            });
        }

        // 4️ GET FEEDBACK LIST 
        [HttpGet("{courseId:int}/feedback")]
        public async Task<IActionResult> GetCourseFeedbacks(int courseId)
        {
            var feedbacks = await _feedbackService.GetCourseFeedbacksAsync(courseId);

            return Ok(new
            {
                CourseID = courseId,
                TotalFeedback = feedbacks.Count,
                Feedbacks = feedbacks
            });
        }

        // 5. USER SUBMIT FEEDBACK
        [Authorize(Roles = "STUDENT")]
        [HttpPost("feedback")]
        public async Task<IActionResult> CreateFeedback([FromBody] FeedbackCreateRequest req)
        {
            int userId = GetUserId();
            var created = await _feedbackService.CreateFeedbackAsync(GetUserId(), req);
            return Ok(new
            {
                message = "Feedback submitted successfully.",
                created.FeedbackId,
                created.Rating,
                created.Comment
            });
        }
    }
}
