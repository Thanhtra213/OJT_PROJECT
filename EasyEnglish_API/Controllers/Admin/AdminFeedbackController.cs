using EasyEnglish_API.Services.FeedbackService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EMT_API.Controllers.AdminSide
{
    [ApiController]
    [Route("api/admin/feedbacks")]
    [Authorize(Roles = "ADMIN")]
    public class AdminFeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackRepo;
        public AdminFeedbackController(IFeedbackService feedbackRepo) => _feedbackRepo = feedbackRepo;

        [HttpGet]
        public async Task<IActionResult> GetAllFeedbacks()
        {
            var data = await _feedbackRepo.GetAllFeedbacksAsync();
            return Ok(data);

        }

        [HttpPatch("{feedbackId:int}/toggle-visibility")]
        public async Task<IActionResult> ToggleVisibility(int feedbackId)
        {
            var ok = await _feedbackRepo.ToggleVisibilityAsync(feedbackId);
            return ok
                ? Ok(new { message = "Feedback visibility updated." })
                : NotFound(new { message = "Feedback not found." });
        }

        [HttpDelete("{feedbackId:int}")]
        public async Task<IActionResult> DeleteFeedback(int feedbackId)
        {
            var ok = await _feedbackRepo.DeleteFeedbackAsync(feedbackId);
            return ok
                ? Ok(new { message = "Feedback deleted successfully." })
                : NotFound(new { message = "Feedback not found." });
        }
    }
}
