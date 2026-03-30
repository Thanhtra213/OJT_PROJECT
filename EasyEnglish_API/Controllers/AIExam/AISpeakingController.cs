using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.Services.AIExam;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.AIExam
{
    [ApiController]
    [Route("api/user/ai-speaking")]
    [Authorize(Roles = "STUDENT")]
    public class AISpeakingController : ControllerBase
    {
        private readonly IAISpeakingService _service;

        public AISpeakingController(IAISpeakingService service)
        {
            _service = service;
        }

        private int GetUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GENERATE PROMPT
        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePrompt()
        {
            try
            {
                var result = await _service.GeneratePromptAsync(GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // SUBMIT SPEAKING
        [HttpPost("submit")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(25_000_000)]
        public async Task<IActionResult> Submit([FromForm] AISpeakingSubmitAudioRequest req)
        {
            try
            {
                var result = await _service.SubmitAsync(GetUserId(), req);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}

