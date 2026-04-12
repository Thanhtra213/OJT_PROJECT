using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Quizz
{
    [ApiController]
    [Route("api/user/quiz")]
    [Authorize]
    public class QuizController : ControllerBase
    {
        private readonly IQuizService _service;

        public QuizController(IQuizService service)
        {
            _service = service;
        }

        private int GetUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string GetUserRole()
    => User.FindFirstValue(ClaimTypes.Role) ?? "USER";

        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetQuizzesByCourse(int courseId)
        {
            try
            {
                return Ok(await _service.GetQuizzesByCourseAsync(GetUserId(), courseId, GetUserRole()));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{quizId:int}")]
        public async Task<IActionResult> GetQuizDetail(int quizId)
        {
            try
            {
                int userId = GetUserId();
                var quiz = await _service.GetQuizDetailAsync(userId, quizId);
                if (quiz == null)
                    return NotFound(new { message = "Quiz not found" });

                return Ok(quiz);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("system-quiz")]
        public async Task<IActionResult> GetGlobalQuiz()
        {
            try
            {
                return Ok(await _service.GetGlobalQuizzesAsync(GetUserId(), GetUserRole()));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("start/{quizId}")]
        public async Task<IActionResult> StartQuiz(int quizId)
            => Ok(await _service.StartQuizAsync(GetUserId(), quizId));

        [HttpPost("submit/{attemptId}")]
        public async Task<IActionResult> SubmitQuiz(int attemptId, SubmitQuizRequest req)
        {
            try
            {
                int userId = GetUserId();
                var score = await _service.SubmitQuizAsync(attemptId, userId, req);
                if (score == null)
                    return NotFound(new { message = "Attempt not found" });
                return Ok(score);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("attempts/history")]
        public async Task<IActionResult> GetHistory()
            => Ok(await _service.GetAttemptHistoryAsync(GetUserId()));
    }
}