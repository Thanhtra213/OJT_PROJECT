using Deepgram;
using Deepgram.Clients.Interfaces.v1;
using Deepgram.Clients.Listen.v1.REST;
using Deepgram.Models.Listen.v1.REST;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace EasyEnglish_API.ExternalService
{
    public class AISpeakingExternal
    {
        private readonly TranscriptionModule _transcriber;
        private readonly PromptModule _prompt;
        private readonly GradingModule _grader;

        public AISpeakingExternal(IConfiguration config, ILogger<AISpeakingExternal> logger)
        {
            _transcriber = new TranscriptionModule(config, logger);
            _prompt = new PromptModule(config, logger);
            _grader = new GradingModule(config, logger);
        }

        public Task<string> TranscribeAsync(IFormFile file)
            => _transcriber.TranscribeAsync(file);

        public Task<(string title, string content)> GenerateSpeakingPromptAsync()
            => _prompt.GenerateSpeakingPromptAsync();

        public Task<(decimal overall, decimal fluency, decimal lexical, decimal grammar, decimal pronunciation, string feedback)>
            GradeSpeakingAsync(string transcript, string topic)
            => _grader.GradeSpeakingAsync(transcript, topic);

        // DEEPGRAM TRANSCRIPTION
        public class TranscriptionModule
        {
            private readonly IListenRESTClient _deepgramClient;
            private readonly ILogger _logger;

            public TranscriptionModule(IConfiguration cfg, ILogger logger)
            {
                Library.Initialize();

                var key = cfg["Deepgram:ApiKey"];
                if (string.IsNullOrWhiteSpace(key))
                    throw new Exception("Deepgram API key missing");

                _deepgramClient = ClientFactory.CreateListenRESTClient(key);
                _logger = logger;
            }

            public async Task<string> TranscribeAsync(IFormFile file)
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("Invalid audio file.");

                await using var ms = new MemoryStream();
                await file.CopyToAsync(ms);

                var res = await _deepgramClient.TranscribeFile(
                    ms.ToArray(),
                    new PreRecordedSchema
                    {
                        Model = "nova-3",
                        Language = "en",
                        SmartFormat = true,
                        Paragraphs = true
                    });

                var transcript = res.Results?
                    .Channels?.FirstOrDefault()?
                    .Alternatives?.FirstOrDefault()?
                    .Transcript ?? "";

                _logger.LogInformation("Transcript length: {len}", transcript.Length);

                return transcript;
            }

            ~TranscriptionModule()
            {
                Library.Terminate();
            }
        }

        // GEMINI PROMPT GENERATION
        public class PromptModule
        {
            private readonly HttpClient _http;
            private readonly string _apiKey;
            private readonly ILogger _logger;

            public PromptModule(IConfiguration cfg, ILogger logger)
            {
                _http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };

                _apiKey = cfg["Gemini:ApiKey"]
                    ?? throw new Exception("Gemini API key missing");

                _logger = logger;
            }

            public async Task<(string title, string content)> GenerateSpeakingPromptAsync()
            {
                var prompt = @"
Generate ONE IELTS Speaking Part 2 topic.

Return JSON ONLY:

{
  ""Title"": ""IELTS Speaking Part 2 - AI Gen"",
  ""Content"": ""<question>""
}
";

                var response = await CallGeminiAsync(prompt);

                try
                {
                    var json = ExtractJson(response);
                    var doc = JsonDocument.Parse(json);
                    var root = doc.RootElement;

                    string title =
                        root.TryGetProperty("Title", out var t)
                        ? t.GetString() ?? ""
                        : "IELTS Speaking Part 2 - AI Gen";

                    string content =
                        root.TryGetProperty("Content", out var c)
                        ? c.GetString() ?? ""
                        : "";

                    return (title, content);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Prompt parse failed: {res}", response);

                    return (
                        "IELTS Speaking Part 2 - AI Gen",
                        "Describe a memorable event in your life and explain why it was special."
                    );
                }
            }

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

                var res = await _http.PostAsync(
                    $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}",
                    new StringContent(json, Encoding.UTF8, "application/json")
                );

                var body = await res.Content.ReadAsStringAsync();

                _logger.LogInformation("Gemini prompt response: {body}", body);

                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (root.TryGetProperty("error", out var err))
                {
                    var msg = err.GetProperty("message").GetString();
                    throw new Exception($"Gemini API error: {msg}");
                }

                if (!root.TryGetProperty("candidates", out var candidates))
                    throw new Exception($"Invalid Gemini response: {body}");

                var text = candidates[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return text ?? "{}";
            }

            private static string ExtractJson(string raw)
            {
                var match = Regex.Match(raw, @"\{[\s\S]*\}");
                return match.Success ? match.Value : "{}";
            }
        }

        public class GradingModule
        {
            private readonly HttpClient _http;
            private readonly string _apiKey;
            private readonly ILogger _logger;

            public GradingModule(IConfiguration cfg, ILogger logger)
            {
                _http = new HttpClient { Timeout = TimeSpan.FromMinutes(3) };

                _apiKey = cfg["Gemini:ApiKey"]
                    ?? throw new Exception("Gemini API key missing");

                _logger = logger;
            }

            public async Task<(decimal overall, decimal fluency, decimal lexical, decimal grammar, decimal pronunciation, string feedback)> GradeSpeakingAsync(string transcript, string topic)
            {
                var prompt = $@"
You are a strict IELTS Speaking examiner with 20 years of experience.
Evaluate the transcript below based on all 4 IELTS Speaking criteria.
Respond ONLY with a single valid JSON object, no markdown, no extra text.

Format exactly:
{{
  ""score"": <overall band 0–9, can be .5>,
  ""Fluency"": <0–9>,
  ""LexicalResource"": <0–9>,
  ""Grammar"": <0–9>,
  ""Pronunciation"": <0–9>,
  ""feedback"": {{
    ""fluency"": {{
      ""comment"": ""<Was the speech smooth? Any long pauses or self-corrections?>"",
      ""issues"": [""<specific issue>""],
      ""suggestions"": [""<how to improve>""]
    }},
    ""lexical"": {{
      ""comment"": ""<Was vocabulary range wide and accurate?>"",
      ""weakPhrases"": [
        {{ ""original"": ""<weak or repeated word/phrase from transcript>"", ""suggestion"": ""<better alternative>"" }}
      ]
    }},
    ""grammar"": {{
      ""comment"": ""<Range and accuracy of grammatical structures>"",
      ""errors"": [
        {{
          ""original"": ""<incorrect phrase from transcript>"",
          ""correction"": ""<corrected version>"",
          ""explanation"": ""<why it is wrong>""
        }}
      ]
    }},
    ""pronunciation"": {{
      ""comment"": ""<Was pronunciation clear and natural?>"",
      ""issues"": [""<specific pronunciation issue if any>""],
      ""suggestions"": [""<improvement tip>""]
    }},
    ""overall"": ""<2–3 sentences summarising main strengths and the single most important thing to improve>""
  }}
}}

Topic: {topic}

Transcript:
{transcript}
";

                var response = await CallGeminiAsync(prompt);
                var json = ExtractJson(response);

                try
                {
                    var doc = JsonDocument.Parse(json);
                    var root = doc.RootElement;

                    return (
                        root.GetProperty("score").GetDecimal(),
                        root.GetProperty("Fluency").GetDecimal(),
                        root.GetProperty("LexicalResource").GetDecimal(),
                        root.GetProperty("Grammar").GetDecimal(),
                        root.GetProperty("Pronunciation").GetDecimal(),
                        root.GetProperty("feedback").ToString()
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Grading parse failed: {res}", response);
                    return (6, 6, 6, 6, 6, "AI fallback score.");
                }
            }

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

                var res = await _http.PostAsync(
                    $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}",
                    new StringContent(json, Encoding.UTF8, "application/json")
                );

                var body = await res.Content.ReadAsStringAsync();

                _logger.LogInformation("Gemini grading response: {body}", body);

                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (root.TryGetProperty("error", out var err))
                {
                    var msg = err.GetProperty("message").GetString();
                    throw new Exception($"Gemini API error: {msg}");
                }

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
                var match = Regex.Match(raw, @"\{[\s\S]*\}");
                return match.Success ? match.Value : "{}";
            }
        }
    }
}