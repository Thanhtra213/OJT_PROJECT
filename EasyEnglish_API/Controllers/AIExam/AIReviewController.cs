using EasyEnglish_API.Services.AIExam;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.AIExam
{
    [ApiController]
    [Route("api/user/review")]
    [Authorize(Roles = "STUDENT")]
    public class AIReviewController : ControllerBase
    {
        private readonly IAIReviewService _ai;

        public AIReviewController(IAIReviewService ai)
        {
            _ai = ai;
        }
        
        private int GetUserId()
           => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("{submissionId}")]

        public async Task<IActionResult> GetReview(long submissionId)
        {
            var result = await _ai.GetStudentReview(GetUserId(), submissionId);
            return Ok(result);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetSubmissionList()
        {
            try
            {
                var result = await _ai.GetSubmissionList(GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
