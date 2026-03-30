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
You are an IELTS exam generator.

Teacher request: {teacherPrompt}

Generate a realistic IELTS-style quiz.

Requirements:
- Mix 3 types of questions:
  1 = Multiple Choice (MCQ)
  2 = Fill in the blank
  3 = Essay
- At least 5 questions
- Content must be natural, not generic
- Do NOT reuse template text

Output MUST be valid JSON only. Do NOT wrap it in markdown code blocks or backticks.

JSON structure:

Title: string  
Description: string  
Questions: array of objects where each object has:
- QuestionType (number: 1,2,3)
- Content (string)
- Options (array)

Rules:
- MCQ (type 1): must have 3–4 options, only ONE correct
- Fill blank (type 2): only ONE option, correct answer (can have multiple answers separated by '/')
- Essay (type 3): Options must be empty []

Example of structure (DO NOT COPY CONTENT):

{{""Title"": ""..."",
  ""Description"": ""..."",
  ""Questions"": [
    {{
      ""QuestionType"": 1,
      ""Content"": ""..."",
      ""Options"": [
        {{ ""Content"": ""..."", ""IsCorrect"": true }},
        {{ ""Content"": ""..."", ""IsCorrect"": false }}
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

            if (result != null)
            {
                result = result.Trim();
                if (result.StartsWith("```"))
                {
                    var firstNewline = result.IndexOf('\n');
                    if (firstNewline != -1)
                        result = result.Substring(firstNewline + 1);

                    var lastFence = result.LastIndexOf("```");
                    if (lastFence != -1)
                        result = result.Substring(0, lastFence);

                    result = result.Trim();
                }
            }

            return result ?? "{}";
        }
    }
}