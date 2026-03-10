using System.Text.Json;

namespace EasyEnglish_API.DTOs.AIExam
{
    public class AIWritingPromptResponse
    {
        public int PromptId { get; set; }
        public string Title { get; set; } = "Writing Task 2 - AI Gen";
        public string Content { get; set; } = string.Empty;
    }

    public class AIWritingSubmitRequest
    {
        public int PromptId { get; set; }
        public string AnswerText { get; set; } = string.Empty;
        public bool SendToTeacher { get; set; }
    }


    public class AIWritingFeedbackResponse
    {
        public decimal Score { get; set; }
        public decimal TaskResponse { get; set; }
        public decimal Coherence { get; set; }
        public decimal LexicalResource { get; set; }
        public decimal Grammar { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public int AttemptId { get; set; }
    }

}
