namespace EasyEnglish_API.DTOs.AIExam
{
    public class AISpeakingSubmitAudioRequest
    {
        public int PromptId { get; set; }
        public IFormFile File { get; set; } = null!;
        public bool SendToTeacher { get; set; }
    }

    public class GeneratePromptResponse
    {
        public int PromptId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    public class AISpeakingResultResponse
    {
        public string Transcript { get; set; } = "";

        public decimal Score { get; set; }

        public decimal Fluency { get; set; }

        public decimal LexicalResource { get; set; }

        public decimal Grammar { get; set; }

        public decimal Pronunciation { get; set; }

        public string Feedback { get; set; } = "";
    }
}
