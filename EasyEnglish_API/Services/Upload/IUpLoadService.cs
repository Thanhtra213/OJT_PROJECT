using EasyEnglish_API.DTOs.Upload;

namespace EasyEnglish_API.Services.Upload
{
    public interface IUpLoadService
    {
        Task<string> UploadAssetAsync(FileUploadRequest req);
    }
}
