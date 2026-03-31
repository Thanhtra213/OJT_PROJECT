using EasyEnglish_API.Services.Score;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/score-management")]
    [Authorize(Roles = "ADMIN")]
    public class ScoreController : ControllerBase
    {
        private readonly IScoreService _scoreService;

        public ScoreController(IScoreService scoreService)
        {
            _scoreService = scoreService;
        }

        [HttpGet("system-exams")]
        public async Task<IActionResult> GetSystemExamScores()
        {
            try
            {
                var result = await _scoreService.GetSystemExamScoresAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 3️⃣ Xem điểm user (phân loại)
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetUserScores(int userId)
        {
            try
            {
                var result = await _scoreService.GetUserScoresAsync(userId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 4️⃣ Điểm theo khóa học
        [HttpGet("by-course/{courseId:int}")]
        public async Task<IActionResult> GetScoresByCourse(int courseId)
        {
            try
            {
                var result = await _scoreService.GetScoresByCourseAsync(courseId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 5️⃣ Tất cả điểm system exam (group by quiz)
        [HttpGet("system-exams/all")]
        public async Task<IActionResult> GetAllSystemExamScores()
        {
            try
            {
                var result = await _scoreService.GetAllSystemExamScoresAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
