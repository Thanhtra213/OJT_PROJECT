using EasyEnglish_API.DTOs.Score;
using EasyEnglish_API.Services.Score;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/review")]
    [Authorize(Roles = "TEACHER")]
    public class TeacherReviewController : ControllerBase
    {
        private readonly ITeacherScoreService _score;

        public TeacherReviewController(ITeacherScoreService score)
        {
            _score = score;
        }

        private int GetTeacherId()
        => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("updateScore")]
        public async Task<IActionResult> Review([FromBody] CreateTeacherReviewRequest req)
        {
            var review = _score.CreateTeacherReview(GetTeacherId(), req);
            return Ok(review);
        }

        [HttpGet]
        public async Task<IActionResult> GetListPending()
        {
            var peding = await _score.GetListPending();
            return Ok(peding);
        }
    }
}
