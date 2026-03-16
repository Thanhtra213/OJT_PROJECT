namespace EasyEnglish_API.DTOs.Score
{
    public class TeacherReviewRespone
    {
        public long TeacherReviewId { get; set; }
        public decimal ScoreOverall { get; set; }
        public decimal ScoreTask { get; set; }
        public decimal ScoreCoherence { get; set; }
        public decimal ScoreLexical { get; set; }
        public decimal ScoreGrammar { get; set; }
        public decimal ScorePronunciation { get; set; }
        public decimal ScoreFluency { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
