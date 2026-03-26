using EasyEnglish_API.DTOs.User;
using EasyEnglish_API.Services.UserService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "ADMIN")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("teachers")]
    public async Task<IActionResult> GetAllTeachers()
    {
        var users = await _userService.GetAllTeachersAsync();
        return Ok(users);
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetAllStudents()
    {
        var users = await _userService.GetAllStudentsAsync();
        return Ok(users);
    }

    [HttpPut("{id}/lock")]
    public async Task<IActionResult> LockUser(int id)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var acc = await _userService.LockUserAsync(id);
        if (acc == null)
            return NotFound("User not found!");

        return Ok(acc);
    }

    [HttpPut("{id}/unlock")]
    public async Task<IActionResult> UnlockUser(int id)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var acc = await _userService.UnlockUserAsync(id);
        if (acc == null)
            return NotFound("User not found!");

        return Ok(acc);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchUser([FromQuery] string? q, [FromQuery] string? role, [FromQuery] string? status)
    {
        var user = await _userService.SearchUsersAsync(q, role, status);
        if (user == null)
        {
            return NotFound("User not found!");
        }

        return Ok(user);
    }

    [HttpPost("assign-role")]
    public async Task<IActionResult> AssignUserRole([FromBody] AssignRoleRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var acc = await _userService.AssignRoleAsync(req);
            return Ok(new
            {
                acc = new
                {
                    acc.Username,
                    acc.Email,
                    acc.Role
                }
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
