using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.Services.AIExam;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.AIExam
{
    [ApiController]
    [Route("api/user/ai-listening")]
    [Authorize(Roles = "STUDENT")]
    public class AIListeningController : ControllerBase
    {
        private readonly IAIListeningService _service;

        public AIListeningController(IAIListeningService service)
        {
            _service = service;
        }

        private int GetUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("generate")]
        public async Task<IActionResult> Generate()
        {
            try
            {
                var result = await _service.GenerateAsync(GetUserId());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] AIListeningSubmitRequest req)
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