using EasyEnglish_API.DTOs.Upload;
using EasyEnglish_API.ExternalService;

namespace EasyEnglish_API.Services.Upload
{
    public class UploadService : IUpLoadService
    {
        private readonly CloudflareExternal _r2;

        public UploadService(CloudflareExternal r2)
        {
            _r2 = r2;
        }

        public async Task<string> UploadAssetAsync(FileUploadRequest req)
        {
            if (req.File == null || req.File.Length == 0)
                throw new Exception("No file uploaded.");
                
            var ext = Path.GetExtension(req.File.FileName).ToLower();
            string url;

            switch (req.Type.ToLower())
            {
                case "audio":
                    if (!new[] { ".mp3", ".wav", ".m4a" }.Contains(ext))
                        throw new Exception("Invalid audio format.");
                    url = await _r2.UploadQuizAudioAsync(
                        req.File.OpenReadStream(),
                        req.File.FileName,
                        req.File.ContentType);
                    break;

                case "image":
                    if (!new[] { ".jpg", ".jpeg", ".png", ".webp" }.Contains(ext))
                        throw new Exception("Invalid image format.");
                    url = await _r2.UploadQuizImageAsync(
                        req.File.OpenReadStream(),
                        req.File.FileName,
                        req.File.ContentType);
                    break;

                case "video":
                    if (!new[] { ".mp4", ".mov", ".avi", ".mkv" }.Contains(ext))
                        throw new Exception("Invalid video format.");
                    url = await _r2.UploadVideoAsync(
                        req.File.OpenReadStream(),
                        req.File.FileName,
                        req.File.ContentType);
                    break;

                case "certificate":
                    if (!new[] { ".jpg", ".jpeg", ".png", ".pdf" }.Contains(ext))
                        throw new Exception("Invalid certificate format.");
                    url = await _r2.UploadTeacherCertAsync(
                        req.File.OpenReadStream(),
                        req.File.FileName,
                        req.File.ContentType);
                    break;

                default:
                    throw new Exception("Invalid type.");
            }

            return url;
        }
    }
}
