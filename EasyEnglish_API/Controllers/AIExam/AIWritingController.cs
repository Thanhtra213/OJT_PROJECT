using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.Services.AIExam;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.AIExam
{
    [ApiController]
    [Route("api/user/ai-writing")]
    [Authorize(Roles = "STUDENT")]
    public class AIWritingController : ControllerBase
    {
        private readonly IAIWritingService _service;

        public AIWritingController(IAIWritingService service)
        {
            _service = service;
        }

        private int GetUserID() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePrompt()
        {
            var gen = await _service.GeneratePrompt(GetUserID());
            return Ok(gen);
        }

        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] AIWritingSubmitRequest req)
        {
            var sub = await _service.SubmitAsync(GetUserID(), req);
            return Ok(sub);
        }
    }
}
