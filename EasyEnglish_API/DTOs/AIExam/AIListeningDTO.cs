namespace EasyEnglish_API.DTOs.AIExam
{
    public class GenerateListeningResponse
    {
        public int PromptId { get; set; }
        public string Title { get; set; } = "";
        public string Script { get; set; } = "";
        public string AudioUrl { get; set; } = "";
        public List<ListeningQuestionDto> Questions { get; set; } = new();
    }

    public class ListeningQuestionDto
    {
        public int QuestionId { get; set; }
        public int Type { get; set; }
        public string Content { get; set; } = "";
        public List<ListeningOptionDto>? Options { get; set; }
    }

    public class ListeningOptionDto
    {
        public string Content { get; set; } = "";
    }

    public class AIListeningSubmitRequest
    {
        public int PromptId { get; set; }
        public List<ListeningAnswerDto> Answers { get; set; } = new();
    }

    public class ListeningAnswerDto
    {
        public int QuestionId { get; set; }
        public string Answer { get; set; } = "";
    }

    public class AIListeningResultResponse
    {
        public int Score { get; set; }
        public int Total { get; set; }
        public string Script { get; set; } = "";
        public List<ListeningQuestionResultDto> Results { get; set; } = new();
    }

    public class ListeningQuestionResultDto
    {
        public int QuestionId { get; set; }
        public string Content { get; set; } = "";
        public string UserAnswer { get; set; } = "";
        public string CorrectAnswer { get; set; } = "";
        public bool IsCorrect { get; set; }
    }
}