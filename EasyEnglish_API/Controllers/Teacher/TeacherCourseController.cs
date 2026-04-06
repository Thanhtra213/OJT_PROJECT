using EasyEnglish_API.DTOs.Course;
using EasyEnglish_API.Services.Courses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.TeacherSide
{
    [ApiController]
    [Route("api/teacher/course")]
    [Authorize(Roles = "TEACHER")]
    public class TeacherCourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public TeacherCourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetMyCourses()
        {
            try
            {
                var courses = await _courseService.GetCoursesByTeacherAsync(GetUserId());
                return Ok(new { Courses = courses });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{courseId:int}")]
        public async Task<IActionResult> GetCourseDetail(int courseId)
        {
            try
            {
                var course = await _courseService.GetTeacherCourseDetailAsync(GetUserId(), courseId);
                return Ok(course);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.CourseName))
                return BadRequest(new { message = "Course name is required" });

            try
            {
                var courseId = await _courseService.CreateCourseAsync(GetUserId(), req);
                return Ok(new { message = "Course created", courseId });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (Exception ex) { return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message }); }
        }

        [HttpPut("{courseId:int}")]
        public async Task<IActionResult> UpdateCourse(int courseId, [FromBody] UpdateCourseRequest req)
        {
            try
            {
                var ok = await _courseService.UpdateCourseAsync(GetUserId(), courseId, req);
                return ok ? Ok(new { message = "Course updated" })
                          : NotFound(new { message = "Course not found" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        [HttpDelete("{courseId:int}")]
        public async Task<IActionResult> DeleteCourse(int courseId)
        {
            try
            {
                var ok = await _courseService.DeleteCourseAsync(GetUserId(), courseId);
                return ok ? Ok(new { message = "Course deleted" })
                          : NotFound(new { message = "Course not found" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }


        [HttpPost("{courseId:int}/chapter")]
        public async Task<IActionResult> AddChapter(int courseId, [FromBody] CreateChapterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.ChapterName))
                return BadRequest(new { message = "Chapter name is required" });

            try
            {
                var chapterId = await _courseService.AddChapterAsync(GetUserId(), courseId, req);
                return Ok(new { message = "Chapter added", chapterId });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        [HttpPut("chapter/{chapterId:int}")]
        public async Task<IActionResult> UpdateChapter(int chapterId, [FromBody] UpdateChapterRequest req)
        {
            try
            {
                var ok = await _courseService.UpdateChapterAsync(GetUserId(), chapterId, req);
                return ok ? Ok(new { message = "Chapter updated" })
                          : NotFound(new { message = "Chapter not found" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        [HttpDelete("chapter/{chapterId:int}")]
        public async Task<IActionResult> DeleteChapter(int chapterId)
        {
            try
            {
                var ok = await _courseService.DeleteChapterAsync(GetUserId(), chapterId);
                return ok ? Ok(new { message = "Chapter deleted" })
                          : NotFound(new { message = "Chapter not found" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }


        [HttpPost("{chapterId:int}/video")]
        public async Task<IActionResult> AddVideo(int chapterId, [FromForm] CreateVideoRequest req)
        {
            if (req.VideoFile == null)
                return BadRequest(new { message = "Video file is required" });

            try
            {
                var videoId = await _courseService.AddVideoAsync(GetUserId(), chapterId, req);
                return Ok(new { message = "Video uploaded", videoId });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }

        [HttpDelete("video/{videoId:int}")]
        public async Task<IActionResult> DeleteVideo(int videoId)
        {
            try
            {
                var ok = await _courseService.DeleteVideoAsync(GetUserId(), videoId);
                return ok ? Ok(new { message = "Video deleted" })
                          : NotFound(new { message = "Video not found" });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException) { return Forbid(); }
        }
    }
}