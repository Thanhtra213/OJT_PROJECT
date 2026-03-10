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

        private int GetUserId()
        {
            return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyCourses()
        {
            var teacherId = GetUserId();

            var courses = await _courseService.GetCoursesByTeacherAsync(teacherId);

            return Ok(new
            {
                Courses = courses
            });
        }

       
        [HttpGet("{courseId:int}")]
        public async Task<IActionResult> GetCourseDetail(int courseId)
        {
            var teacherId = GetUserId();

            var course = await _courseService.GetTeacherCourseDetailAsync(teacherId, courseId);

            if (course == null)
                return NotFound(new { message = "Course not found" });

            return Ok(course);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.CourseName))
                return BadRequest(new { message = "Course name is required" });

            var teacherId = GetUserId();

            var courseId = await _courseService.CreateCourseAsync(teacherId, req);

            return Ok(new
            {
                message = "Course created",
                courseId
            });
        }

        [HttpPut("{courseId:int}")]
        public async Task<IActionResult> UpdateCourse(int courseId, [FromBody] UpdateCourseRequest req)
        {
            var teacherId = GetUserId();

            var ok = await _courseService.UpdateCourseAsync(teacherId, courseId, req);

            if (!ok)
                return NotFound(new { message = "Course not found" });

            return Ok(new { message = "Course updated" });
        }

        
        [HttpDelete("{courseId:int}")]
        public async Task<IActionResult> DeleteCourse(int courseId)
        {
            var teacherId = GetUserId();

            var ok = await _courseService.DeleteCourseAsync(teacherId, courseId);

            if (!ok)
                return NotFound(new { message = "Course not found" });

            return Ok(new { message = "Course deleted" });
        }

        // ADD CHAPTER
        [HttpPost("{courseId:int}/chapter")]
        public async Task<IActionResult> AddChapter(int courseId, [FromBody] CreateChapterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.ChapterName))
                return BadRequest(new { message = "Chapter name is required" });

            var teacherId = GetUserId();

            var chapterId = await _courseService.AddChapterAsync(teacherId, courseId, req);

            return Ok(new
            {
                message = "Chapter added",
                chapterId
            });
        }

        // UPDATE CHAPTER
        [HttpPut("chapter/{chapterId:int}")]
        public async Task<IActionResult> UpdateChapter(int chapterId, [FromBody] UpdateChapterRequest req)
        {
            var teacherId = GetUserId();

            var ok = await _courseService.UpdateChapterAsync(teacherId, chapterId, req);

            if (!ok)
                return NotFound(new { message = "Chapter not found" });

            return Ok(new { message = "Chapter updated" });
        }


        // DELETE CHAPTER
        [HttpDelete("chapter/{chapterId:int}")]
        public async Task<IActionResult> DeleteChapter(int chapterId)
        {
            var teacherId = GetUserId();

            var ok = await _courseService.DeleteChapterAsync(teacherId, chapterId);

            if (!ok)
                return NotFound(new { message = "Chapter not found" });

            return Ok(new { message = "Chapter deleted" });
        }

        // ADD VIDEO (UPLOAD R2)
        [HttpPost("{chapterId:int}/video")]
        public async Task<IActionResult> AddVideo(
            int chapterId,
            [FromForm] CreateVideoRequest req)
        {
            if (req.VideoFile == null)
                return BadRequest(new { message = "Video file is required" });

            var teacherId = GetUserId();

            var videoId = await _courseService.AddVideoAsync(teacherId, chapterId, req);

            return Ok(new
            {
                message = "Video uploaded",
                videoId
            });
        }

        // DELETE VIDEO
        [HttpDelete("video/{videoId:int}")]
        public async Task<IActionResult> DeleteVideo(int videoId)
        {
            var teacherId = GetUserId();

            var ok = await _courseService.DeleteVideoAsync(teacherId, videoId);

            if (!ok)
                return NotFound(new { message = "Video not found" });

            return Ok(new { message = "Video deleted" });
        }
    }
}