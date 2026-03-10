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
            var sets = await _flashcardService.GetAllPublicSetsAsync();
            return Ok(sets);
        }

        [HttpGet("sets/course/{courseId:int}")]
        public async Task<IActionResult> GetAllSetsByCourse(int courseId)
        {
            var sets = await _flashcardService.GetSetsByCourseAsync(courseId);
            return Ok(sets);
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

            var createdSet = await _flashcardService.CreateSetAsync(req);

            return CreatedAtAction(nameof(GetSetDetail), new { setId = createdSet.SetId }, createdSet);
        }

        [HttpPost("item")]
        public async Task<IActionResult> AddItem([FromBody] CreateFlashcardItemRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdItem = await _flashcardService.CreateItemAsync(req);

            return CreatedAtAction(nameof(GetSetDetail), new { setId = createdItem.ItemId }, createdItem); 
        }

        [HttpPut("set/{setId:int}")]
        public async Task<IActionResult> UpdateSet(int setId, [FromBody] UpdateFlashcardSetRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updatedSet = await _flashcardService.UpdateSetAsync(setId, req);

            if (!updatedSet)
                return NotFound();

            return Ok(updatedSet);
        }

        [HttpPut("item/{itemId:int}")]
        public async Task<IActionResult> UpdateItem(int itemId, [FromBody] CreateFlashcardItemRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updatedItem = await _flashcardService.UpdateItemAsync(itemId, req);

            if (!updatedItem)
                return NotFound();

            return Ok(updatedItem);
        }

        [HttpDelete("set/{setId:int}")]
        public async Task<IActionResult> DeleteSet(int setId)
        {
            var result = await _flashcardService.DeleteSetAsync(setId);

            if (!result)
                return NotFound();
            return Ok();
        }

        [HttpDelete("item/{itemId:int}")]
        public async Task<IActionResult> DeleteItem(int itemId)
        {
            var result = await _flashcardService.DeleteItemAsync(itemId);

            if (!result)
                return NotFound();
            return Ok();
        }
    }
}
