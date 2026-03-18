namespace EasyEnglish_API.DTOs.Upload
{
    public class FileUploadRequest
    {
        public IFormFile File { get; set; } = null!;
        public string Type { get; set; } = null!;
    }
}
