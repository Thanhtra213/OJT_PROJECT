using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.Services.AIExam;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.AIExam
{
    [ApiController]
    [Route("api/teacher/ai-quiz")]
    [Authorize(Roles = "TEACHER,ADMIN")]
    public class AIQuizController : ControllerBase
    {
        private readonly IAIQuizService _ai;

        public AIQuizController(IAIQuizService ai)
        {
            _ai = ai;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("generate")]
        public async Task<ActionResult<AIQuizResponse>> GenerateQuiz([FromBody] AIQuizRequest req)
        {
            try
            {
                var result = await _ai.GenerateQuizAsync(req);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
