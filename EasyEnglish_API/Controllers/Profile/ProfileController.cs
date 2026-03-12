using EasyEnglish_API.DTOs.Profile;
using EasyEnglish_API.Services.Profile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Profile
{
    [ApiController]
    [Route("api/user/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profile;
        public ProfileController(IProfileService profile) 
        { 
            _profile = profile;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("detail")]
        public async Task<ActionResult> GetDetail()
        {
            var userId = GetUserId();
            var result = await _profile.GetDetailAsync(userId);
            return Ok(result);
        }

        [HttpGet("avatar")]
        public async Task<ActionResult> GetAvatar()
        {
            var userId = GetUserId();
            var avatarUrl = await _profile.GetAvatarAsync(userId);
            return Ok(new { avatarUrl });
        }

        [HttpPut("detail")]
        public async Task<ActionResult> UpdateDetail([FromBody] UpdateUserDetailRequest req)
        {
            var userId = GetUserId();
            await _profile.UpdateDetailAsync(userId, req);
            return Ok(new { message = "Update profile successfully" });
        }

        [HttpPut("avatar")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult> ChangeAvatar([FromForm] AvatarUploadRequest req)
        {
            var userId = GetUserId();
            var avatarUrl = await _profile.ChangeAvatarAsync(userId, req.File);
            return Ok(new { message = "Avatar updated", avatarUrl });
        }

        [HttpPut("password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            var userId = GetUserId();
            await _profile.ChangePasswordAsync(userId, req);
            return Ok(new { message = "Password changed successfully." });
        }

    }
}
