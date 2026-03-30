using EasyEnglish_API.DTOs.Quizs;
using EasyEnglish_API.Interfaces.Quizs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.AdminSide
{
    [ApiController]
    [Route("api/admin/quiz")]
    [Authorize(Roles = "ADMIN")]
    public class QuizAdminController : ControllerBase
    {
        private readonly IQuizService _service;

        public QuizAdminController(IQuizService service)
        {
            _service = service;
        }

        // =====================================================
        // GLOBAL QUIZ CRUD
        // =====================================================

        [HttpGet]
        public async Task<IActionResult> GetAllGlobalQuizzes()
        {
            var quizzes = await _service.GetAllGlobalQuizzesAsync();
            return Ok(quizzes);
        }

        [HttpGet("{quizId:int}")]
        public async Task<IActionResult> GetQuizDetail(int quizId)
        {
            var quiz = await _service.GetGlobalQuizDetailAsync(quizId);

            if (quiz == null)
                return NotFound(new { message = "Quiz not found" });

            return Ok(quiz);
        }

        [HttpPost]
        public async Task<IActionResult> CreateGlobalQuiz([FromBody] TeacherCreateQuizRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { message = "Title is required" });

            var quizId = await _service.CreateGlobalQuizAsync(
                req.Title,
                req.Description,
                req.QuizType
            );

            return Ok(new
            {
                message = "Global quiz created",
                quizId
            });
        }

        [HttpPut("{quizId:int}")]
        public async Task<IActionResult> UpdateGlobalQuiz(int quizId, [FromBody] UpdateQuizRequest req)
        {
            var ok = await _service.UpdateGlobalQuizAsync(quizId, req);

            if (!ok)
                return NotFound(new { message = "Quiz not found" });

            return Ok(new { message = "Global quiz updated" });
        }

        [HttpDelete("{quizId:int}")]
        public async Task<IActionResult> DeleteGlobalQuiz(int quizId)
        {
            var ok = await _service.DeleteGlobalQuizAsync(quizId);

            if (!ok)
                return NotFound(new { message = "Quiz not found" });

            return Ok(new { message = "Global quiz deleted" });
        }

        // =====================================================
        // GROUP CRUD
        // =====================================================

        [HttpPost("{quizId:int}/group")]
        public async Task<IActionResult> CreateGroup(int quizId, [FromBody] CreateGroupRequest req)
        {
            var id = await _service.CreateGroupAsync(quizId, req);

            return Ok(new
            {
                message = "Group created",
                groupId = id
            });
        }

        [HttpPut("group/{groupId:int}")]
        public async Task<IActionResult> UpdateGroup(int groupId, [FromBody] UpdateGroupRequest req)
        {
            var ok = await _service.UpdateGroupAsync(groupId, req);

            if (!ok)
                return NotFound(new { message = "Group not found" });

            return Ok(new { message = "Group updated" });
        }

        [HttpDelete("group/{groupId:int}")]
        public async Task<IActionResult> DeleteGroup(int groupId)
        {
            var ok = await _service.DeleteGroupAsync(groupId);

            if (!ok)
                return NotFound(new { message = "Group not found" });

            return Ok(new { message = "Group deleted" });
        }
                         
        // =====================================================
        // QUESTION CRUD
        // =====================================================

        [HttpPost("group/{groupId:int}/question")]
        public async Task<IActionResult> CreateQuestion(int groupId, [FromBody] CreateQuestionRequest req)
        {
            var id = await _service.CreateQuestionAsync(groupId, req);

            return Ok(new
            {
                message = "Question created",
                questionId = id
            });
        }

        [HttpPut("question/{questionId:int}")]
        public async Task<IActionResult> UpdateQuestion(int questionId, [FromBody] UpdateQuestionRequest req)
        {
            var ok = await _service.UpdateQuestionAsync(questionId, req);

            if (!ok)
                return NotFound(new { message = "Question not found" });

            return Ok(new { message = "Question updated" });
        }

        [HttpDelete("question/{questionId:int}")]
        public async Task<IActionResult> DeleteQuestion(int questionId)
        {
            var ok = await _service.DeleteQuestionAsync(questionId);

            if (!ok)
                return NotFound(new { message = "Question not found" });

            return Ok(new { message = "Question deleted" });
        }

        // =====================================================
        // OPTION CRUD
        // =====================================================

        [HttpPost("question/{questionId:int}/option")]
        public async Task<IActionResult> CreateOption(int questionId, [FromBody] CreateOptionRequest req)
        {
            var id = await _service.CreateOptionAsync(questionId, req);

            return Ok(new
            {
                message = "Option created",
                optionId = id
            });
        }

        [HttpPut("option/{optionId:int}")]
        public async Task<IActionResult> UpdateOption(int optionId, [FromBody] UpdateOptionRequest req)
        {
            var ok = await _service.UpdateOptionAsync(optionId, req);

            if (!ok)
                return NotFound(new { message = "Option not found" });

            return Ok(new { message = "Option updated" });
        }

        [HttpDelete("option/{optionId:int}")]
        public async Task<IActionResult> DeleteOption(int optionId)
        {
            var ok = await _service.DeleteOptionAsync(optionId);

            if (!ok)
                return NotFound(new { message = "Option not found" });

            return Ok(new { message = "Option deleted" });
        }

        // =====================================================
        // ASSET CRUD
        // =====================================================

        [HttpPost("group/{groupId:int}/asset")]
        public async Task<IActionResult> CreateAssetForGroup(int groupId, [FromBody] CreateAssetRequest req)
        {
            var id = await _service.CreateAssetForGroupAsync(groupId, req);

            return Ok(new
            {
                message = "Asset created",
                assetId = id
            });
        }

        [HttpPost("question/{questionId:int}/asset")]
        public async Task<IActionResult> CreateAssetForQuestion(int questionId, [FromBody] CreateAssetRequest req)
        {
            var id = await _service.CreateAssetForQuestionAsync(questionId, req);

            return Ok(new
            {
                message = "Asset created",
                assetId = id
            });
        }

        [HttpDelete("asset/{assetId:int}")]
        public async Task<IActionResult> DeleteAsset(int assetId)
        {
            var ok = await _service.DeleteAssetAsync(assetId);

            if (!ok)
                return NotFound(new { message = "Asset not found" });

            return Ok(new { message = "Asset deleted" });
        }
    }
}