using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Interfaces.Vocabulary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Vocabulary
{
    [ApiController]
    [Route("api/user/vocabulary")]
    [Authorize(Roles = "STUDENT")]
    public class VocabularyController : ControllerBase
    {
        private readonly IVocabularyService _service;

        public VocabularyController(IVocabularyService service)
        {
            _service = service;
        }

        private int GetUserId()
            => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("save")]
        public async Task<IActionResult> Save([FromBody] SaveWordRequest req)
        {
            if (req.ItemId <= 0)
                return BadRequest("ItemId không hợp lệ.");

            await _service.SaveWordAsync(GetUserId(), req.ItemId);
            return Ok(new { message = "Đã lưu từ thành công." });
        }

        [HttpDelete("{itemId}")]
        public async Task<IActionResult> Unsave(int itemId)
        {
            await _service.UnsaveWordAsync(GetUserId(), itemId);
            return Ok(new { message = "Đã bỏ lưu từ." });
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetMyList()
        {
            var result = await _service.GetSavedWordsAsync(GetUserId());
            return Ok(result);
        }
    }
}