using EasyEnglish_API.DTOs.Progress;
using EasyEnglish_API.Services.Video;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers.Video
{
    [ApiController]
    [Route("api/user/video")]
    [Authorize]
    public class VideoProgressController : ControllerBase
    {
        private readonly IVideoProgressService _service;

        public VideoProgressController(IVideoProgressService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

    
        [HttpPost("progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] VideoProgressRequest req)
        {
            if (req == null)
                return BadRequest(new { message = "Invalid request" });

            var userId = GetUserId();

            await _service.UpdateProgressAsync(userId, req);

            return Ok(new { message = "Progress updated" });
        }

        [HttpGet("progress/{videoId:int}")]
        public async Task<IActionResult> GetProgress(int videoId)
        {
            var userId = GetUserId();

            var progress = await _service.GetProgressAsync(userId, videoId);

            if (progress == null)
                return Ok(new
                {
                    videoId = videoId,
                    watchDurationSec = 0,
                    lastPositionSec = (int?)null,
                    isCompleted = false,
                    watchedAt = (DateTime?)null
                });

            return Ok(new
            {
                videoId = progress.VideoId,
                watchDurationSec = progress.WatchDurationSec,
                lastPositionSec = progress.LastPositionSec,
                totalDurationSec = progress.TotalDurationSec,
                isCompleted = progress.IsCompleted,
                watchedAt = progress.WatchedAt
            });
        }
    }
}