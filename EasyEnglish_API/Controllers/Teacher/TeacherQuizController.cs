using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.TeacherSide
{
    [ApiController]
    [Route("api/teacher/quiz")]
    [Authorize(Roles = "TEACHER")]
    public class TeacherQuizController : ControllerBase
    {
        private readonly IQuizService _service;

        public TeacherQuizController(IQuizService service)
        {
            _service = service;
        }

        private int GetUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // ================= QUIZ =================

        [HttpGet("course/{courseId:int}")]
        public async Task<IActionResult> GetCourseQuiz(int courseId)
        {
            try
            {
                var quizzes = await _service.GetTeacherQuizzesByCourseAsync(GetUserId(), courseId);
                return Ok(quizzes);
            }
            catch (Exception ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateQuiz([FromBody] TeacherCreateQuizRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { message = "Title is required" });

            try
            {
                var quizId = await _service.CreateQuizAsync(
                    GetUserId(),
                    req.CourseID,
                    req.Title,
                    req.Description,
                    req.QuizType
                );

                return Ok(new
                {
                    message = "Quiz created successfully",
                    quizId
                });
            }
            catch (Exception ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{quizId:int}")]
        public async Task<IActionResult> UpdateQuiz(int quizId, TeacherUpdateQuizRequest req)
        {
            try
            {
                var ok = await _service.UpdateQuizAsync(
                    GetUserId(),
                    quizId,
                    req.Title,
                    req.Description,
                    req.QuizType,
                    req.IsActive
                );

                if (!ok)
                    return NotFound(new { message = "Quiz not found" });

                return Ok(new { message = "Quiz updated successfully" });
            }
            catch (Exception ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{quizId:int}")]
        public async Task<IActionResult> DeleteQuiz(int quizId)
        {
            try
            {
                var ok = await _service.DeleteQuizAsync(GetUserId(), quizId);

                if (!ok)
                    return NotFound(new { message = "Quiz not found" });

                return Ok(new { message = "Quiz deleted successfully" });
            }
            catch (Exception ex)
            {
                return Forbid(ex.Message);
            }
        }

        // ================= GROUP =================

        [HttpPost("{quizId:int}/group")]
        public async Task<IActionResult> CreateGroup(int quizId, CreateGroupRequest req)
        {
            try
            {
                var id = await _service.CreateGroupAsync(GetUserId(), quizId, req);

                return Ok(new
                {
                    message = "Group created",
                    groupId = id
                });
            }
            catch (Exception ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("group/{groupId:int}")]
        public async Task<IActionResult> UpdateGroup(int groupId, UpdateGroupRequest req)
        {
            var ok = await _service.UpdateGroupAsync(GetUserId(), groupId, req);

            if (!ok)
                return NotFound(new { message = "Group not found" });

            return Ok(new { message = "Group updated" });
        }

        [HttpDelete("group/{groupId:int}")]
        public async Task<IActionResult> DeleteGroup(int groupId)
        {
            var ok = await _service.DeleteGroupAsync(GetUserId(), groupId);

            if (!ok)
                return NotFound(new { message = "Group not found" });

            return Ok(new { message = "Group deleted" });
        }

        // ================= QUESTION =================

        [HttpPost("group/{groupId:int}/question")]
        public async Task<IActionResult> CreateQuestion(int groupId, CreateQuestionRequest req)
        {
            var id = await _service.CreateQuestionAsync(GetUserId(), groupId, req);

            return Ok(new
            {
                message = "Question created",
                questionId = id
            });
        }

        [HttpPut("question/{questionId:int}")]
        public async Task<IActionResult> UpdateQuestion(int questionId, UpdateQuestionRequest req)
        {
            var ok = await _service.UpdateQuestionAsync(GetUserId(), questionId, req);

            if (!ok)
                return NotFound(new { message = "Question not found" });

            return Ok(new { message = "Question updated" });
        }

        [HttpDelete("question/{questionId:int}")]
        public async Task<IActionResult> DeleteQuestion(int questionId)
        {
            var ok = await _service.DeleteQuestionAsync(GetUserId(), questionId);

            if (!ok)
                return NotFound(new { message = "Question not found" });

            return Ok(new { message = "Question deleted" });
        }

        // ================= OPTION =================

        [HttpPost("question/{questionId:int}/option")]
        public async Task<IActionResult> CreateOption(int questionId, CreateOptionRequest req)
        {
            var id = await _service.CreateOptionAsync(GetUserId(), questionId, req);

            return Ok(new
            {
                message = "Option created",
                optionId = id
            });
        }

        [HttpPut("option/{optionId:int}")]
        public async Task<IActionResult> UpdateOption(int optionId, UpdateOptionRequest req)
        {
            var ok = await _service.UpdateOptionAsync(GetUserId(), optionId, req);

            if (!ok)
                return NotFound(new { message = "Option not found" });

            return Ok(new { message = "Option updated" });
        }

        [HttpDelete("option/{optionId:int}")]
        public async Task<IActionResult> DeleteOption(int optionId)
        {
            var ok = await _service.DeleteOptionAsync(GetUserId(), optionId);

            if (!ok)
                return NotFound(new { message = "Option not found" });

            return Ok(new { message = "Option deleted" });
        }

        // ================= ASSET =================

        [HttpPost("group/{groupId:int}/asset")]
        public async Task<IActionResult> CreateAssetForGroup(int groupId, CreateAssetRequest req)
        {
            var id = await _service.CreateAssetForGroupAsync(GetUserId(), groupId, req);

            return Ok(new
            {
                message = "Asset created",
                assetId = id
            });
        }

        [HttpPost("question/{questionId:int}/asset")]
        public async Task<IActionResult> CreateAssetForQuestion(int questionId, CreateAssetRequest req)
        {
            var id = await _service.CreateAssetForQuestionAsync(GetUserId(), questionId, req);

            return Ok(new
            {
                message = "Asset created",
                assetId = id
            });
        }

        [HttpDelete("asset/{assetId:int}")]
        public async Task<IActionResult> DeleteAsset(int assetId)
        {
            var ok = await _service.DeleteAssetAsync(GetUserId(), assetId);

            if (!ok)
                return NotFound(new { message = "Asset not found" });

            return Ok(new { message = "Asset deleted" });
        }
    }
}