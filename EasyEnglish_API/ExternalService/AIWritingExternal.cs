using EasyEnglish_API.Services.AIExam;
using System.Text;
using System.Text.Json;

namespace EasyEnglish_API.ExternalService
{
    public class AIWritingExternal
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly ILogger<AIWritingExternal> _logger;

        public AIWritingExternal(IConfiguration config, ILogger<AIWritingExternal> logger)
        {
            _http = new HttpClient();
            _apiKey = config["Gemini:ApiKey"] ?? throw new Exception("Missing Gemini API key");
            _logger = logger;
        }


        // 1. Sinh đề Writing Task 2

        public async Task<(string title, string content)> GenerateWritingPromptAsync()
        {
            var prompt = @"
                        You are an IELTS Writing Task 2 question generator.
                        Generate ONE IELTS Writing Task 2 topic, formatted strictly as JSON string:
                        {""Title"":""Writing Task 2 - AI Gen"",""Content"":""<the question here>""}
                        The question must be realistic, academic, 1–2 sentences only, in English.
                    ";

            var jsonResponse = await CallGeminiAsync(prompt);
            try
            {
                var doc = JsonDocument.Parse(jsonResponse);
                var title = doc.RootElement.GetProperty("Title").GetString() ?? "Writing Task 2 - AI Gen";
                var content = doc.RootElement.GetProperty("Content").GetString() ?? "";
                return (title, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI JSON parse error: {Response}", jsonResponse);
                return ("Writing Task 2 - AI Gen", "Describe a major change in modern education and its effects.");
            }
        }

        // 2. Chấm điểm Writing bài làm
        public async Task<(decimal overall, decimal task, decimal coherence, decimal lexical, decimal grammar, string feedback)>
            GradeWritingAsync(string essay)
        {
            var gradingPrompt = $@"
        You are an IELTS Writing examiner. 
        Evaluate the following essay and respond **only** with a single valid JSON string (no extra text, no commentary).
        Format must be exactly like this:
        {{
          ""score"": <overall 0–9>,
          ""TaskResponse"": <0–9>,
          ""Coherence"": <0–9>,
          ""LexicalResource"": <0–9>,
          ""Grammar"": <0–9>,
          ""feedback"": ""<2–3 sentences feedback>""
        }}
        Essay: {essay}
        ";

            var jsonResponse = await CallGeminiAsync(gradingPrompt);
            var pureJson = ExtractJsonString(jsonResponse);
            try
            {
                var doc = JsonDocument.Parse(pureJson);
                decimal overall = doc.RootElement.GetProperty("score").GetDecimal();
                decimal task = doc.RootElement.GetProperty("TaskResponse").GetDecimal();
                decimal coherence = doc.RootElement.GetProperty("Coherence").GetDecimal();
                decimal lexical = doc.RootElement.GetProperty("LexicalResource").GetDecimal();
                decimal grammar = doc.RootElement.GetProperty("Grammar").GetDecimal();
                string feedback = doc.RootElement.GetProperty("feedback").GetString() ?? "";
                return (overall, task, coherence, lexical, grammar, feedback);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI grading JSON parse error: {Response}", jsonResponse);
                return (6.0m, 6.5m, 6.0m, 6.5m, 6.0m, "Default fallback: parsing failed.");
            }
        }

        // 🔹 Helper: gọi Gemini API
        private async Task<string> CallGeminiAsync(string prompt)
        {
            var payload = new
            {
                contents = new[]
                {
            new
            {
                parts = new[]
                {
                    new { text = prompt }
                }
            }
        }
            };

            var json = JsonSerializer.Serialize(payload);

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var url =
                $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}";

            var res = await _http.PostAsync(url, content);

            var body = await res.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(body);

            var root = doc.RootElement;

            // check lỗi API
            if (root.TryGetProperty("error", out var err))
            {
                var msg = err.GetProperty("message").GetString();
                throw new Exception($"Gemini API error: {msg}");
            }

            var text = root
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text ?? "{}";
        }

        private static string ExtractJsonString(string raw)
        {
            var match = System.Text.RegularExpressions.Regex.Match(
                raw,
                @"\{[\s\S]*\}",
                System.Text.RegularExpressions.RegexOptions.Multiline
            );
            return match.Success ? match.Value : "{}";
        }

    }
}
