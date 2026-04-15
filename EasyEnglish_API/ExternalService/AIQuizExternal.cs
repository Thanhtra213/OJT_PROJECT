using ClosedXML.Excel;
using Deepgram.Models.Agent.v2.WebSocket;
using DocumentFormat.OpenXml.Presentation;
using EasyEnglish_API.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.ComponentModel;
using System.Net.Http;
using System.Text;
using System.Text.Json;

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
            var prompt = $$"""
You are an English exam generator.
Teacher request: {{teacherPrompt}}

CRITICAL RULES - FOLLOW EXACTLY:
- If teacher asks for MCQ/multiple choice → ALL questions MUST be QuestionType 1
- If teacher asks for fill in the blank → ALL questions MUST be QuestionType 2  
- If teacher asks for sentence rewriting/transformation → ALL questions MUST be QuestionType 3
- NEVER mix types unless teacher explicitly asks for mixed questions

Question types:
1 = Multiple Choice (MCQ)
2 = Fill in the blank
3 = Sentence Transformation

For QuestionType 1 (MCQ):
- Options array MUST have 3 or 4 items
- Exactly ONE option has IsCorrect: true
- Example:
[
  {"Content":"Paris","IsCorrect":true},
  {"Content":"London","IsCorrect":false},
  {"Content":"Berlin","IsCorrect":false}
]

For QuestionType 2:
- Content must contain ______
- Options has exactly 1 correct answer
- Example:
[
  {"Content":"is playing","IsCorrect":true}
]

For QuestionType 3:
- Content has original sentence + cue
- Options has exactly 1 full rewritten sentence
- Example:
[
  {"Content":"It is said that she sings well.","IsCorrect":true}
]

STRICT VALIDATION:
- NEVER return empty Options
- ALWAYS include at least 1 option

Output MUST be valid JSON only.

{
  "Title": "...",
  "Description": "...",
  "Questions": [
    {
      "QuestionType": 1,
      "Content": "...",
      "Options": [
        {"Content":"...","IsCorrect":true},
        {"Content":"...","IsCorrect":false}
      ]
    }
  ]
}
""";
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
                $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={_apiKey}",
                content
            );

            var raw = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Gemini raw response: {Raw}", raw);

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Gemini API error {response.StatusCode}: {raw}");

            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;

            if (root.TryGetProperty("promptFeedback", out var feedback))
            {
                var blockReason = feedback.TryGetProperty("blockReason", out var br)
                    ? br.GetString() : "unknown";
                throw new Exception($"Gemini blocked the request. Reason: {blockReason}");
            }

            if (!root.TryGetProperty("candidates", out var candidates)
                || candidates.GetArrayLength() == 0)
            {
                throw new Exception($"Gemini returned no candidates. Response: {raw}");
            }

            var firstCandidate = candidates[0];
            if (firstCandidate.TryGetProperty("finishReason", out var finishReason))
            {
                var reason = finishReason.GetString();
                if (reason == "SAFETY" || reason == "RECITATION" || reason == "OTHER")
                    throw new Exception($"Gemini stopped generating. Reason: {reason}");
            }

            var result = firstCandidate
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