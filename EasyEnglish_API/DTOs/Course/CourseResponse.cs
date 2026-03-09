namespace EasyEnglish_API.DTOs.Course
{
    public class CourseResponse
    {
        public int CourseID { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string? CourseDescription { get; set; }
        public int TeacherID { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public DateTime CreateAt { get; set; }
        public DateTime? UpdateAt { get; set; }
    }
}
