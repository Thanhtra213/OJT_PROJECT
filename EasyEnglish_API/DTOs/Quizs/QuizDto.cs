namespace EasyEnglish_API.DTOs.Quizs
{
    public class QuizDto
    {
        public int QuizID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int QuizType { get; set; }  // 1=Listening, 2=Reading...
    }

    public class QuizDetailDto : QuizDto
    {
        public List<QuestionGroupDto> Groups { get; set; } = new();
    }

    public class QuestionGroupDto
    {
        public int GroupID { get; set; }
        public string? Instruction { get; set; }

        public List<AssetDto>? Assets { get; set; }
        public List<QuestionDto> Questions { get; set; } = new();
    }

    public class QuestionDto
    {
        public int QuestionID { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<OptionDto> Options { get; set; } = new();
        public byte QuestionType { get; internal set; }

        public List<AssetDto>? Assets { get; set; }
    }

    public class OptionDto
    {
        public int OptionID { get; set; }
        public string Content { get; set; } = string.Empty;

        public bool IsCorrect { get; set; }
    }

    public class AssetDto
    {
        public int AssetID { get; set; }
        public byte AssetType { get; set; } // 1=Group, 2=Question
        public string? Url { get; set; }
        public string? ContentText { get; set; }
        public string? Caption { get; set; }
        public string? MimeType { get; set; }
    }

    public class AssetUploadRequest
    {
        public IFormFile File { get; set; } = null!;

        public string Type { get; set; } = null!;
    }

    public class SubmitQuizResponse
    {
        public decimal AutoScore { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectCount { get; set; }
        public int WrongCount { get; set; }
        public int EssayCount { get; set; }  // chờ chấm tay
        public string Status { get; set; } = string.Empty;
        public List<QuestionResultDto> Results { get; set; } = new();
    }

    public class QuestionResultDto
    {
        public int QuestionId { get; set; }
        public string Content { get; set; } = string.Empty;
        public byte QuestionType { get; set; }
        public bool? IsCorrect { get; set; }   // null = essay chờ chấm

        public int? SubmittedOptionId { get; set; }
        public string? SubmittedAnswerText { get; set; }

        // Đáp án đúng — chỉ có khi sai
        public List<CorrectOptionDto> CorrectOptions { get; set; } = new();
        public string? CorrectAnswerText { get; set; }
    }

    public class CorrectOptionDto
    {
        public int OptionId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
