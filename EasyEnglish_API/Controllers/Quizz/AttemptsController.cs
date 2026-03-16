using System.Security.Claims;
using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Quizz
{
    [ApiController]
    [Route("api/attempts")]
    [Authorize]
    public class AttemptsController : ControllerBase
    {
        private readonly IQuizService _service;

        public AttemptsController(IQuizService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAttempts()
        {
            var role = User.FindFirstValue(ClaimTypes.Role);
            var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var attempts = await _service.GetAttemptsAsync(role, uid);

            if (attempts.Count == 0)
                return Ok(new { message = "No attempts found" });

            return Ok(attempts);
        }
    }
}
