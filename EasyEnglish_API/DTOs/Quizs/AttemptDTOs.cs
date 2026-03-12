namespace EasyEnglish_API.DTOs.Quizs
{
    public class AttemptHistoryDto
    {
        public int AttemptId { get; set; }
        public int QuizId { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string? Status { get; set; }
        public decimal? AutoScore { get; set; }
    }

    public class AttemptDto
    {
        public int AttemptId { get; set; }
        public int QuizId { get; set; }
        public string? QuizTitle { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public decimal? AutoScore { get; set; }
        public string? Status { get; set; }
        public int StudentID { get; set; }
    }
}
