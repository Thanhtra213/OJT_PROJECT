using EasyEnglish_API.DTOs.Upload;
using EasyEnglish_API.Services.Upload;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Common
{
    [ApiController]
    [Route("api/upload")]
    [Authorize(Roles = "TEACHER,ADMIN")]
    public class UploadController : ControllerBase
    {
        private readonly IUpLoadService _upLoadService;

        public UploadController(IUpLoadService upLoadService)
        {
            _upLoadService = upLoadService;
        }

        [HttpPost("asset")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(1_000_000_000)] // 1GB
        public async Task<IActionResult> UploadAsset([FromForm] FileUploadRequest req)
        {
            try
            {
                var url = await _upLoadService.UploadAssetAsync(req);

                return Ok(new
                {
                    message = "File uploaded successfully",
                    type = req.Type,
                    url
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
