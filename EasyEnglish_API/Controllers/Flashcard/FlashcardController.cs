using System.Security.Claims;
using EasyEnglish_API.DTOs.Flashcard;
using EasyEnglish_API.Services.Flashcard;
using EasyEnglish_API.Services.Membership;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Flashcard
{
    [ApiController]
    [Route("api/flashcard")]
    public class FlashcardController : ControllerBase
    {
        private readonly IFlashcardService _flashcardService;
        private readonly IMembershipService _membershipService;

        public FlashcardController(IFlashcardService flashcardService, IMembershipService membershipService)
        {
            _flashcardService = flashcardService;
            _membershipService = membershipService;
        }

        private int? GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
            return string.IsNullOrEmpty(idClaim) ? null : int.Parse(idClaim);
        }

        // ---------------------------
        // 1️⃣ Lấy danh sách flashcard set public
        // ---------------------------
        [HttpGet("sets")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllPublicSets()
        {
            var sets = await _flashcardService.GetAllPublicSetsAsync();
    
            return Ok(sets);
        }

        // ---------------------------
        // 2️⃣ Lấy danh sách theo course
        // ---------------------------
        [HttpGet("sets/{courseId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllSetsByCourse(int courseId)
        {
            var sets = await _flashcardService.GetSetsByCourseAsync(courseId);

            return Ok(sets);
        }

        // ---------------------------
        // 3️⃣ Lấy chi tiết 1 set (check membership)
        // ---------------------------
        [HttpGet("set/{setId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSetDetail(int setId)
        {
            var set = await _flashcardService.GetSetDetailAsync(setId);
            if (set == null)
                return NotFound("Flashcard set not found");

            // Check quyền nếu có CourseId
            if (set.CourseID.HasValue)
            {
                if (!User.IsInRole("ADMIN") && !User.IsInRole("TEACHER"))
                {
                    var userId = GetUserId();
                    if (userId == null)
                        return Unauthorized(new { message = "Login required to access this flashcard set." });

                    bool hasMembership = await _membershipService.HasActiveMembershipAsync(userId.Value);
                    if (!hasMembership)
                        return StatusCode(403, new { message = "Membership required or expired." });
                }
            }
            return Ok(set);
        }
    }
}
