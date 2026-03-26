using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Interfaces.Flashcard;
using EasyEnglish_API.Services.Flashcard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Flashcard
{
    [ApiController]
    [Route("api/flashcard/progress")]
    [Authorize(Roles = "STUDENT")]
    public class FlashcardProgressController : ControllerBase
    {
        private readonly IFlashcarProgressService _service;

        public FlashcardProgressController(IFlashcarProgressService service)
        {
            _service = service;
        }

        private int? GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;

            return string.IsNullOrEmpty(idClaim) ? null : int.Parse(idClaim);
        }

        [HttpGet("set/{setId:int}")]
        public async Task<IActionResult> GetProgressBySet(int setId)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Login required." });

            var progress = await _service.GetProgressBySetAsync(userId.Value, setId);

            if (progress == null || !progress.Any())
                return NotFound(new { message = "No progress found for this set." });

            return Ok(progress);
        }

        [HttpPost("learn")]
        public async Task<IActionResult> Learn([FromBody] LearnFlashcardRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Login required." });

            if (request == null)
                return BadRequest(new { message = "Invalid request body." });

            await _service.LearnAsync(userId.Value, request);

            return Ok(new { message = "Learn recorded." });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int? setId)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "Login required." });

            var history = await _service.GetHistoryAsync(userId.Value, setId);

            if (history == null || !history.Any())
                return NotFound(new { message = "No study history found." });

            return Ok(history);
        }
    }
}
