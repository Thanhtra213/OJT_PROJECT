namespace EasyEnglish_API.DTOs.Quizs
{
    public class SubmitQuizRequest
    {
        public List<SubmitAnswerDto> Answers { get; set; } = new();
    }

    public class SubmitAnswerDto
    {
        public int QuestionID { get; set; }
        public int? OptionID { get; set; }  // cho MCQ
        public string? AnswerText { get; set; } // cho writing/speaking
    }

        public class SubmitQuizResponse
        {
            public decimal AutoScore { get; set; }
            public int TotalQuestions { get; set; }
            public int CorrectCount { get; set; }
            public int WrongCount { get; set; }
            public string Status { get; set; } = string.Empty;
            public List<QuestionResultDto> Results { get; set; } = new();
        }

        public class QuestionResultDto
        {
            public int QuestionId { get; set; }
            public string Content { get; set; } = string.Empty;
            public byte QuestionType { get; set; }
            public bool? IsCorrect { get; set; }   // null nếu essay

            // Câu trả lời của student
            public int? SubmittedOptionId { get; set; }
            public string? SubmittedAnswerText { get; set; }

            // Đáp án đúng (chỉ hiện khi sai hoặc luôn hiện tùy FE)
            public List<CorrectOptionDto> CorrectOptions { get; set; } = new(); // type 1
            public string? CorrectAnswerText { get; set; }          // type 2
        }

        public class CorrectOptionDto
        {
            public int OptionId { get; set; }
            public string Content { get; set; } = string.Empty;
        }
    
}
