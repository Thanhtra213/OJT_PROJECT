using EasyEnglish_API.Services.Courses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/courses")]
    [Authorize(Roles = "ADMIN")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet()]
        public async Task<IActionResult> GetAllCourses()
        {
            var courses = await _courseService.GetAllCoursesAsync();
            return Ok(courses);
        }

        [HttpGet("detail/{courseId:int}")]
        public async Task<IActionResult> GetCourseDetail(int courseId)
        {
            var course = await _courseService.GetCourseDetailAsync(courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            return Ok(course);
        }

        [HttpDelete("delete/{courseId}")]
        public async Task<IActionResult> DeleteCourse(int courseId)
        {
            var result = await _courseService.DeleteCourseAsync(courseId);
            if (!result)
                return NotFound();
            return NoContent();
        }
    }
}
