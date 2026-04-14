using Azure.Messaging;
using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Models;
using EasyEnglish_API.Services.Flashcard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/flashcard")]
    [Authorize(Roles = "ADMIN")]
    public class FlashcardController : ControllerBase
    {
        private readonly IFlashcardService _flashcardService;

        public FlashcardController(IFlashcardService flashcardService)
        {
            _flashcardService = flashcardService;
        }

        [HttpGet("sets/public")]
        public async Task<IActionResult> GetAllPublicSets()
        {
            try
            {
                var sets = await _flashcardService.GetAllPublicSetsAsync();
                return Ok(sets);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("sets/course/{courseId:int}")]
        public async Task<IActionResult> GetAllSetsByCourse(int courseId)
        {
            try
            {
                var sets = await _flashcardService.GetSetsByCourseAsync(courseId);
                return Ok(sets);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("set/{setId:int}")]
        public async Task<IActionResult> GetSetDetail(int setId)
        {
            try
            {
                var sets = await _flashcardService.GetSetDetailAsync(setId);
                return Ok(sets);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("set")]
        public async Task<IActionResult> CreateSet([FromBody] CreateFlashcardSetRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var createdSet = await _flashcardService.CreateSetAsync(req);

                return CreatedAtAction(nameof(GetSetDetail), new { setId = createdSet.SetId }, createdSet);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("item")]
        public async Task<IActionResult> AddItem([FromBody] CreateFlashcardItemRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var createdItem = await _flashcardService.CreateItemAsync(req);

                return CreatedAtAction(nameof(GetSetDetail), new { setId = createdItem.ItemId }, createdItem);
            } 
            catch (Exception ex) 
            { 
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("set/{setId:int}/import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ImportItems(int setId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".xlsx" && ext != ".csv")
                return BadRequest(new { message = "Chỉ hỗ trợ file .xlsx hoặc .csv" });

            try
            {
                var result = await _flashcardService.ImportItemsFromFileAsync(setId, file);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Import thất bại: " + ex.Message });
            }
        }

        [HttpPut("set/{setId:int}")]
        public async Task<IActionResult> UpdateSet(int setId, [FromBody] UpdateFlashcardSetRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var updatedSet = await _flashcardService.UpdateSetAsync(setId, req);
                return Ok(updatedSet);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("item/{itemId:int}")]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] CreateFlashcardItemRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var updatedItem = await _flashcardService.UpdateItemAsync(itemId, req);

                return Ok(updatedItem);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("set/{setId:int}")]
        public async Task<IActionResult> DeleteSet(int setId)
        {
            try
            {
                var result = await _flashcardService.DeleteSetAsync(setId);
                return Ok();
            } 
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("item/{itemId:int}")]
        public async Task<IActionResult> DeleteItem(int itemId)
        {
            try
            {
                var result = await _flashcardService.DeleteItemAsync(itemId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("set/{setId:int}/import")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ImportItems(int setId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".xlsx" && ext != ".csv")
                return BadRequest(new { message = "Chỉ hỗ trợ file .xlsx hoặc .csv" });

            try
            {
                var result = await _flashcardService.ImportItemsFromFileAsync(setId, file);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Import thất bại: " + ex.Message });
            }
        }
    }
}
