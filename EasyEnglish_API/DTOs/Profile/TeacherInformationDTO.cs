namespace EasyEnglish_API.DTOs.Profile
{
    public class TeacherUpdateInfoRequest
    {
        public string? Description { get; set; }
        public List<string>? CertUrls { get; set; } // nhận danh sách URL sau khi upload
    }

    public class TeacherInfoResponse
    {
        public int TeacherID { get; set; }
        public string FullName { get; set; } = string.Empty;
        public DateTime? JoinAt { get; set; }
        public string? Description { get; set; }
        public List<string> Certs { get; set; } = new();
    }
}
