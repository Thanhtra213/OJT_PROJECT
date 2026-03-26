using System.Security.Claims;
using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Services.Courses;
using EasyEnglish_API.Services.Flashcard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/flashcard")]
    [Authorize(Roles = "TEACHER")]
    public class TeacherFlashcardController : ControllerBase
    {
        private readonly IFlashcardService _flashcardService;
        private readonly ICourseService _courseService;

        public TeacherFlashcardController(IFlashcardService flashcardService, ICourseService courseService)
        {
            _flashcardService = flashcardService;
            _courseService = courseService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);


        [HttpGet("sets/course/{courseId:int}")]
        public async Task<IActionResult> GetAllSetsByCourse(int courseId)
        {
            if (!await _flashcardService.EnsureTeacherOwnsCourse(courseId, GetUserId()))
                return Forbid();

            var sets = await _flashcardService.GetSetsByCourseAsync(courseId);

            return Ok(sets);
        }

        [HttpGet("set/{setId:int}")]
        public async Task<IActionResult> GetSetDetail(int setId)
        {
            if (!await _flashcardService.EnsureTeacherOwnsSet(setId, GetUserId()))
                return Forbid();
            try
            {
                var set = await _flashcardService.GetSetDetailAsync(setId);
                if (set == null)
                    return NotFound(new { message = "Flashcard set not found" });

                return Ok(set);
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

            if (req.CourseID.HasValue && !await _flashcardService.EnsureTeacherOwnsCourse(req.CourseID.Value, GetUserId()))
                return Forbid();

            var createdSet = await _flashcardService.CreateSetAsync(req);

            return CreatedAtAction(nameof(GetSetDetail), new { setId = createdSet.SetId }, createdSet);
        }

        [HttpPost("item")]
        public async Task<IActionResult> AddItem([FromBody] CreateFlashcardItemRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _flashcardService.EnsureTeacherOwnsSet(req.SetID, GetUserId()))
                return Forbid();

            var createdItem = await _flashcardService.CreateItemAsync(req);

            return createdItem == null ? Ok("Add item succesfully!") : NotFound();
        }

        [HttpPut("set/{setId:int}")]
        public async Task<IActionResult> UpdateSet(int setId, [FromBody] UpdateFlashcardSetRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _flashcardService.EnsureTeacherOwnsSet(setId, GetUserId()))
                return Forbid();

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

            if (!await _flashcardService.EnsureTeacherOwnsSet(req.SetID, GetUserId()))
                return Forbid();

            var updatedItem = await _flashcardService.UpdateItemAsync(itemId, req);
            if (!updatedItem)
                return NotFound();
            return updatedItem ? Ok(new { message = "Updated" }) : NotFound();
        }

        [HttpDelete("set/{setId:int}")]
        public async Task<IActionResult> DeleteSet(int setId)
        {
            if (!await _flashcardService.EnsureTeacherOwnsSet(setId, GetUserId()))
                return Forbid();

            var result = await _flashcardService.DeleteSetAsync(setId);
            if (!result) 
                return NotFound();
            return result ? Ok(new { message = "Deleted" }) : NotFound();
        }

        [HttpDelete("item/{itemId:int}")]
        public async Task<IActionResult> DeleteItem(int setId, int itemId)
        {
            if (!await _flashcardService.EnsureTeacherOwnsSet(setId, GetUserId()))
                return Forbid();

            var ok = await _flashcardService.DeleteItemAsync(itemId);
            return ok ? Ok(new { message = "Deleted" }) : NotFound();
        }
    }
}
