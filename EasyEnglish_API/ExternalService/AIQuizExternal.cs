using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EasyEnglish_API.ExternalService
{
    public class AIQuizExternal
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly ILogger<AIQuizExternal> _logger;

        public AIQuizExternal(IConfiguration config, ILogger<AIQuizExternal> logger)
        {
            _http = new HttpClient();
            _apiKey = config["Gemini:ApiKey"] ?? throw new Exception("Missing Gemini API key");
            _logger = logger;
        }

        public async Task<string> GenerateQuizAsync(string teacherPrompt)
        {
            var prompt = $@"
Generate an IELTS quiz.

Teacher request: {teacherPrompt}

Return ONLY JSON in this schema:
Return ONLY valid JSON.
Do not use markdown.
Do not wrap JSON in ```json```.

{{
  ""Title"": ""string"",
  ""Description"": ""string"",
  ""Questions"": [
    {{
      ""QuestionType"": number,
      ""Content"": ""string"",
      ""Options"": [
        {{
          ""Content"": ""string"",
          ""IsCorrect"": true
        }}
      ]
    }}
  ]
}}
";

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

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _http.PostAsync(
                $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}",
                content
            );

            var raw = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(raw);

            var result = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return result ?? "{}";
        }
    }
}