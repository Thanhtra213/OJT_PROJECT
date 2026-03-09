namespace EasyEnglish_API.DTOs.Course
{
    public class CourseRequest
    {
        public int CourseID { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CourseLevel { get; set; }

        public int TeacherID { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public List<ChapterDto> Chapters { get; set; } = new();
    }

    public class ChapterDto
    {
        public int ChapterID { get; set; }
        public string ChapterName { get; set; } = string.Empty;
        public List<VideoDto> Videos { get; set; } = new();
    }

    public class VideoDto
    {
        public int VideoID { get; set; }
        public string VideoName { get; set; } = string.Empty;
        public string VideoURL { get; set; } = string.Empty;
        public bool IsPreview { get; set; }

        // Dữ liệu runtime thêm vào (không map từ DB)
        public bool CanWatch { get; set; } = false;
        public bool RequiresMembership { get; set; } = false;
    }
}
