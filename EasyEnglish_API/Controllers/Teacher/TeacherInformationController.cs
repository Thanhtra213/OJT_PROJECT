using EasyEnglish_API.DTOs.Profile;
using EasyEnglish_API.Services.Profile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Teacher
{
    [ApiController]
    [Route("api/teacher/info")]
    public class TeacherInformationController : ControllerBase
    {
        private readonly ITeacherInforService _teacherInfoService;

        public TeacherInformationController(ITeacherInforService teacherInfoService)
        {
            _teacherInfoService = teacherInfoService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("{teacherId:int}")]
        public async Task<IActionResult> GetInformation(int teacherId)
        {
            try
            {
                var result = await _teacherInfoService.GetTeacherInfoAsync(teacherId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut]
        [Authorize(Roles = "TEACHER")]
        public async Task<IActionResult> UpdateInformation([FromBody] TeacherUpdateInfoRequest req)
        {
            try
            {
                await _teacherInfoService.UpdateTeacherInfoAsync(GetUserId(), req);
                return Ok(new { message = "Teacher information updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
