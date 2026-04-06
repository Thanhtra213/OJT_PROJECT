using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using EasyEnglish_API.DTOs.AIExam;

namespace EasyEnglish_API.ExternalService
{
    public class AIListeningExternal
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly ILogger<AIListeningExternal> _logger;

        public AIListeningExternal(IConfiguration config, ILogger<AIListeningExternal> logger)
        {
            _http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };
            _apiKey = config["Gemini:ApiKey"] ?? throw new Exception("Gemini API key missing");
            _logger = logger;
        }

        public async Task<(string title, string script, List<GeneratedListeningQuestion> questions)> GenerateListeningAsync()
        {
            var seed = Random.Shared.Next(1000, 9999);
            var prompt = $@"
Generate ONE realistic IELTS Listening Section 1 exercise (a conversation between 2 people in an everyday situation).
Make it different every time (seed: {seed}).

Return JSON ONLY, no markdown, no extra text:

{{
  ""title"": ""IELTS Listening - AI Gen"",
  ""script"": ""<full conversation text, clearly showing Speaker A and Speaker B>"",
  ""questions"": [
    {{
      ""type"": 1,
      ""content"": ""<MCQ question answerable from the script>"",
      ""options"": [
        {{ ""content"": ""<option A>"", ""isCorrect"": true }},
        {{ ""content"": ""<option B>"", ""isCorrect"": false }},
        {{ ""content"": ""<option C>"", ""isCorrect"": false }}
      ],
      ""answer"": """"
    }},
    {{
      ""type"": 2,
      ""content"": ""<Fill in the blank: The caller's name is ______. >>"",
      ""options"": [],
      ""answer"": ""<correct answer from script>""
    }}
  ]
}}

Rules:
- 6 to 8 questions total, mix type 1 and type 2
- type 1 = MCQ: 3 options, exactly 1 isCorrect = true, answer field = """"
- type 2 = Fill blank: options = [], answer = correct word/phrase from script
- All questions must be directly answerable from the script
- Script must be natural conversation, 200-300 words
";

            var response = await CallGeminiAsync(prompt);
            var json = ExtractJson(response);

            try
            {
                var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var title = root.TryGetProperty("title", out var t) ? t.GetString() ?? "IELTS Listening - AI Gen" : "IELTS Listening - AI Gen";
                var script = root.TryGetProperty("script", out var s) ? s.GetString() ?? "" : "";

                var questions = new List<GeneratedListeningQuestion>();
                if (root.TryGetProperty("questions", out var qs))
                {
                    foreach (var q in qs.EnumerateArray())
                    {
                        var question = new GeneratedListeningQuestion
                        {
                            Type = q.GetProperty("type").GetInt32(),
                            Content = q.GetProperty("content").GetString() ?? "",
                            Answer = q.TryGetProperty("answer", out var ans) ? ans.GetString() ?? "" : ""
                        };

                        if (q.TryGetProperty("options", out var opts))
                        {
                            foreach (var opt in opts.EnumerateArray())
                            {
                                question.Options.Add(new GeneratedListeningOption
                                {
                                    Content = opt.GetProperty("content").GetString() ?? "",
                                    IsCorrect = opt.TryGetProperty("isCorrect", out var ic) && ic.GetBoolean()
                                });
                            }
                        }

                        questions.Add(question);
                    }
                }

                return (title, script, questions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Listening generate parse failed: {res}", response);
                return ("IELTS Listening - AI Gen", "Failed to generate script.", new List<GeneratedListeningQuestion>());
            }
        }

        private async Task<string> CallGeminiAsync(string prompt)
        {
            var payload = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                generationConfig = new { temperature = 1.0, topP = 0.95, candidateCount = 1 }
            };

            var res = await _http.PostAsync(
                $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}",
                new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            );

            var body = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("error", out var err))
                throw new Exception($"Gemini API error: {err.GetProperty("message").GetString()}");

            if (!root.TryGetProperty("candidates", out var candidates))
                throw new Exception($"Invalid Gemini response: {body}");

            return candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "{}";
        }

        private static string ExtractJson(string raw)
        {
            var match = Regex.Match(raw, @"\{[\s\S]*\}");
            return match.Success ? match.Value : "{}";
        }
    }

    public class GeneratedListeningQuestion
    {
        public int Type { get; set; }
        public string Content { get; set; } = "";
        public string Answer { get; set; } = "";
        public List<GeneratedListeningOption> Options { get; set; } = new();
    }

    public class GeneratedListeningOption
    {
        public string Content { get; set; } = "";
        public bool IsCorrect { get; set; }
    }
}