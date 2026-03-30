using EasyEnglish_API.Services.Course;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Video
{
    [ApiController]
    [Route("api/public/video")]
    public class VideoController : ControllerBase
    {
        private readonly IVideoService _video;

        public VideoController(IVideoService video)
        {
            _video = video;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;

            return int.TryParse(claim, out var id) ? id : null;
        }

        [HttpGet("{videoId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetVideo(int videoId)
        {
            var userId = GetUserId();

            var result = await _video.GetVideoAsync(videoId, userId);

            if (result.statusCode == 404)
                return NotFound(new { message = result.message });

            if (result.statusCode == 401)
                return Unauthorized(new { message = result.message });

            if (result.statusCode == 403)
                return StatusCode(403, new
                {
                    message = result.message,
                    video = result.video
                });

            return Ok(result.video);
        }
    }
}
