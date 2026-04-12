using EasyEnglish_API.Services.FeedbackService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/feedbacks")]
    [Authorize(Roles = "TEACHER")]
    public class TeacherFeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedback;
        public TeacherFeedbackController(IFeedbackService feedback) => _feedback = feedback;

        [HttpGet]
        public async Task<IActionResult> GetMyCourseFeedbacks()
        {
            try
            {
                int teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var feedbacks = await _feedback.GetTeacherFeedbacksAsync(teacherId);
                return Ok(feedbacks);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
