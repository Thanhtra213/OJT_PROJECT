using EasyEnglish_API.Services.Streak;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Video
{
    [ApiController]
    [Route("api/student/streak")]
    [Authorize(Roles = "STUDENT")]
    public class StreakController : ControllerBase
    {
        private readonly IStreakService _streakService;

        public StreakController(IStreakService streakService)
        {
            _streakService = streakService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // GET api/student/streak
        [HttpGet]
        public async Task<IActionResult> GetStreak()
        {
            var result = await _streakService.GetStreakAsync(GetUserId());
            return Ok(result);
        }
    }
}
