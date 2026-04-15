using System.Text;
using System.Text.Json;

namespace EasyEnglish_API.ExternalService
{
    public class AIWritingExternal
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly ILogger<AIWritingExternal> _logger;

        private static readonly string[] Topics =
        [
            "technology and society", "environment and climate change",
            "education systems", "health and medicine", "globalisation",
            "urbanisation and city life", "work and employment",
            "family and social relationships", "crime and punishment",
            "media and advertising", "arts and culture", "sports and leisure",
            "government and politics", "science and research",
            "immigration and multiculturalism", "food and diet",
            "transport and infrastructure", "poverty and inequality",
            "tourism and travel", "artificial intelligence"
        ];

        private static readonly string[] Angles =
        [
            "advantages and disadvantages",
            "causes and solutions",
            "agree or disagree",
            "to what extent do you agree",
            "discuss both views and give your opinion",
            "problems and solutions",
            "causes and effects"
        ];

        private static readonly Random _rng = new();

        private static readonly string FallbackFeedback = JsonSerializer.Serialize(new
        {
            taskResponse = new
            {
                comment = "Could not evaluate.",
                issues = Array.Empty<string>(),
                suggestions = Array.Empty<string>()
            },
            coherence = new
            {
                comment = "Could not evaluate.",
                issues = Array.Empty<string>(),
                suggestions = Array.Empty<string>()
            },
            lexical = new
            {
                comment = "Could not evaluate.",
                weakPhrases = Array.Empty<object>()
            },
            grammar = new
            {
                comment = "Could not evaluate.",
                errors = Array.Empty<object>()
            },
            overall = "Scoring failed. Please try again."
        });

        public AIWritingExternal(IConfiguration config, ILogger<AIWritingExternal> logger)
        {
            _http = new HttpClient();
            _apiKey = config["Gemini:ApiKey"] ?? throw new Exception("Missing Gemini API key");
            _logger = logger;
        }

        public async Task<(string title, string content)> GenerateWritingPromptAsync()
        {
            var topic = Topics[_rng.Next(Topics.Length)];
            var angle = Angles[_rng.Next(Angles.Length)];
            var seed = _rng.Next(1000, 9999);

            var prompt = $@"
You are an IELTS Writing Task 2 question generator.
Generate ONE unique IELTS Writing Task 2 question about the topic: ""{topic}"".
The question style should be: ""{angle}"".
Make it different every time (seed: {seed}).

IMPORTANT: Respond ONLY with a single valid JSON object. No markdown, no code blocks, no extra text.

{{""Title"":""Writing Task 2 - {topic}"",""Content"":""<the full question here>""}}

Rules:
- The question must be realistic and academic
- 2-3 sentences maximum
- Written in English
- Do NOT repeat common examples like social media or online shopping
";

            var jsonResponse = await CallGeminiAsync(prompt);
            var pureJson = ExtractJson(jsonResponse);

            try
            {
                var doc = JsonDocument.Parse(pureJson);
                var title = doc.RootElement.GetProperty("Title").GetString() ?? $"Writing Task 2 - {topic}";
                var content = doc.RootElement.GetProperty("Content").GetString() ?? "";
                return (title, content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI JSON parse error: {Response}", jsonResponse);
                return ($"Writing Task 2 - {topic}", $"Discuss the {angle} of {topic} in modern society.");
            }
        }

        public async Task<(decimal overall, decimal task, decimal coherence, decimal lexical, decimal grammar, string feedback)>
            GradeWritingAsync(string essay)
        {
            var gradingPrompt = $@"
You are a strict IELTS Writing Task 2 examiner with 20 years of experience.
Evaluate the essay below across all 4 IELTS criteria.

IMPORTANT: You MUST use EXACTLY the field names shown below.
Do NOT rename any field. Do NOT add markdown. Return ONLY raw JSON, nothing else.

{{
  ""score"": <overall band 0-9, can be .5>,
  ""TaskResponse"": <0-9>,
  ""Coherence"": <0-9>,
  ""LexicalResource"": <0-9>,
  ""Grammar"": <0-9>,
  ""feedback"": {{
    ""taskResponse"": {{
      ""comment"": ""<Did they answer all parts? Is the position clear and consistent?>"",
      ""issues"": [""<specific issue 1>"", ""<specific issue 2>""],
      ""suggestions"": [""<rewrite suggestion or advice 1>"", ""<rewrite suggestion or advice 2>""]
    }},
    ""coherence"": {{
      ""comment"": ""<Is the essay logically structured? Are linking devices used well?>"",
      ""issues"": [""<specific issue>""],
      ""suggestions"": [""<suggestion>""]
    }},
    ""lexical"": {{
      ""comment"": ""<Is vocabulary range wide and accurate?>"",
      ""weakPhrases"": [
        {{ ""original"": ""<weak phrase from essay>"", ""suggestion"": ""<better alternative>"" }},
        {{ ""original"": ""<weak phrase>"", ""suggestion"": ""<better alternative>"" }}
      ]
    }},
    ""grammar"": {{
      ""comment"": ""<Range and accuracy of grammar structures>"",
      ""errors"": [
        {{ ""original"": ""<incorrect sentence or phrase from essay>"", ""correction"": ""<corrected version>"", ""explanation"": ""<why it's wrong>"" }},
        {{ ""original"": ""<incorrect>"", ""correction"": ""<corrected>"", ""explanation"": ""<explanation>"" }}
      ]
    }},
    ""overall"": ""<2-3 sentences summarising the essay's main strengths and the single most important thing to improve>""
  }}
}}

Essay:
{essay}
";

            var jsonResponse = await CallGeminiAsync(gradingPrompt);
            var pureJson = ExtractJson(jsonResponse);

            try
            {
                var doc = JsonDocument.Parse(pureJson);
                var root = doc.RootElement;

                decimal overall = root.GetProperty("score").GetDecimal();
                decimal task = root.GetProperty("TaskResponse").GetDecimal();
                decimal coherence = root.GetProperty("Coherence").GetDecimal();
                decimal lexical = root.GetProperty("LexicalResource").GetDecimal();
                decimal grammar = root.GetProperty("Grammar").GetDecimal();

                // Tìm feedback linh hoạt dù Gemini đặt tên field khác nhau
                string feedbackJson = "";
                foreach (var field in new[] { "feedback", "Feedback", "evaluation", "result" })
                {
                    if (root.TryGetProperty(field, out var fb))
                    {
                        feedbackJson = fb.GetRawText();
                        break;
                    }
                }

                if (string.IsNullOrEmpty(feedbackJson))
                {
                    _logger.LogWarning("feedback field not found in Gemini response: {json}", pureJson);
                    feedbackJson = FallbackFeedback;
                }

                return (overall, task, coherence, lexical, grammar, feedbackJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI grading JSON parse error: {Response}", jsonResponse);
                return (6.0m, 6.5m, 6.0m, 6.5m, 6.0m, FallbackFeedback);
            }
        }

        private async Task<string> CallGeminiAsync(string prompt)
        {
            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    temperature = 1.2,
                    topP = 0.95,
                    candidateCount = 1
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var url = $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var res = await _http.PostAsync(url, content);
            var body = await res.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("error", out var err))
                throw new Exception($"Gemini API error: {err.GetProperty("message").GetString()}");

            if (!root.TryGetProperty("candidates", out var candidates))
                throw new Exception($"Invalid Gemini response: {body}");

            return candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "{}";
        }

        private static string ExtractJson(string raw)
        {
            int start = raw.IndexOf('{');
            int end = raw.LastIndexOf('}');
            if (start >= 0 && end > start)
                return raw.Substring(start, end - start + 1);
            return "{}";
        }
    }
}