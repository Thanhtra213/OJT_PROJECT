namespace EasyEnglish_API.DTOs.Quizs
{
    public class PlacementTestDto
    {
        public int QuizID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? TargetLevel { get; set; }
    }

    public class PlacementRecommendationDto
    {
        public int Level { get; set; }
        public string LevelName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public List<RecommendedCourseDto> RecommendedCourses { get; set; } = new();
    }

    public class RecommendedCourseDto
    {
        public int CourseID { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public byte CourseLevel { get; set; }
        public DateTime CreateAt { get; set; }
    }

    public class MarkPlacementTestRequest
    {
        public bool IsPlacementTest { get; set; }
        public int? TargetLevel { get; set; }
    }
}