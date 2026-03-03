using EasyEnglish_API.DTOs.Membership;
using EasyEnglish_API.Services.Membership;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Auth
{
    [ApiController]
    [Route("api/user/membership")]
    [Authorize(Roles = "STUDENT")]
    public class MembershipController : ControllerBase
    {
        private readonly IMembershipService _membership;

        public MembershipController(IMembershipService membership)
        {
            _membership = membership;
        }

        [HttpGet("check")]
        public async Task<ActionResult<MembershipResponseDto>> CheckMembership()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var check = await _membership.CheckMembershipAsync(userId);
            return Ok(check);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetMembershipHistory()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var history = await _membership.GetMembershipAsync(userId);
            return Ok(history);
        }
    }
}
