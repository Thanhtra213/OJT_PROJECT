using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using EasyEnglish_API.Services.PlacementTest;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlacementTestController : ControllerBase
    {
        private readonly IPlacementTestService _service;

        public PlacementTestController(IPlacementTestService service)
        {
            _service = service;
        }

        // GET: api/placementtest
        [HttpGet]
        public async Task<IActionResult> GetPlacementTests()
        {
            try
            {
                var tests = await _service.GetPlacementTestsAsync();
                return Ok(tests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/placementtest/recommend/{attemptId}
        [HttpGet("recommend/{attemptId}")]
        [Authorize]
        public async Task<IActionResult> GetRecommendation(int attemptId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var recommendation = await _service.GetRecommendationAsync(userId, attemptId);
                return Ok(recommendation);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/placementtest/admin/mark/{quizId}
        [HttpPost("admin/mark/{quizId}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> MarkAsPlacementTest(
            int quizId,
            [FromBody] MarkPlacementTestRequest req)
        {
            try
            {
                var success = await _service.UpdatePlacementTest(quizId, req.IsPlacementTest,
                    req.TargetLevel);

                if (success is null) return NotFound(new { message = "Quiz not found" });
                return Ok(new { message = "Updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}