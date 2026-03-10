using System.Text.Json;

namespace EasyEnglish_API.DTOs.AIExam
{
    public class AIQuizRequest
    {
        public string Prompt { get; set; } = string.Empty;
    }

    public class AIQuizResponse
    {
        public JsonElement? Json { get; set; }
        public string RawText { get; set; } = string.Empty;
        public string? Error { get; set; }
    }
}
