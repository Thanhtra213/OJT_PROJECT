using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.AIExam
{
    public class AIListeningService : IAIListeningService
    {
        private readonly AIListeningExternal _ai;
        private readonly MurfTTSExternal _murf;
        private readonly IMembershipRepository _membership;
        private readonly IAIPromptRepository _prompt;
        private readonly ILogger<AIListeningService> _logger;

        public AIListeningService(
            AIListeningExternal ai,
            MurfTTSExternal murf,
            IMembershipRepository membership,
            IAIPromptRepository prompt,
            ILogger<AIListeningService> logger)
        {
            _ai = ai;
            _murf = murf;
            _membership = membership;
            _prompt = prompt;
            _logger = logger;
        }

        public async Task<GenerateListeningResponse> GenerateAsync(int userId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership required.");

            var (title, script, questions) = await _ai.GenerateListeningAsync();

            var audioUrl = await _murf.GenerateAudioAsync(script);

            var contentPayload = System.Text.Json.JsonSerializer.Serialize(new
            {
                script,
                questions,
                audioUrl
            });

            var prompt = await _prompt.CreateAsync(new AIPrompt
            {
                SkillType = "LISTENING",
                Title = title,
                Content = contentPayload,
                CreatedAt = DateTime.UtcNow
            });

            var questionDtos = questions.Select((q, i) => new ListeningQuestionDto
            {
                QuestionId = i + 1,
                Type = q.Type,
                Content = q.Content,
                Options = q.Type == 1
                    ? q.Options.Select(o => new ListeningOptionDto
                    {
                        Content = o.Content
                    }).ToList()
                    : null
            }).ToList();

            return new GenerateListeningResponse
            {
                PromptId = prompt.PromptId,
                Title = title,
                AudioUrl = audioUrl,
                Questions = questionDtos
            };
        }

        public async Task<AIListeningResultResponse> SubmitAsync(int userId, AIListeningSubmitRequest req)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership required.");

            var prompt = await _prompt.GetByIdAsync(req.PromptId);
            if (prompt == null)
                throw new Exception("Invalid PromptId.");

            using var doc = System.Text.Json.JsonDocument.Parse(prompt.Content);
            var root = doc.RootElement;

            var script = root.GetProperty("script").GetString() ?? "";

            var questions = System.Text.Json.JsonSerializer.Deserialize<List<GeneratedListeningQuestion>>(
                root.GetProperty("questions").GetRawText()
            ) ?? new();

            int score = 0;
            var results = new List<ListeningQuestionResultDto>();

            for (int i = 0; i < questions.Count; i++)
            {
                var q = questions[i];
                var questionId = i + 1;

                var userAnswer = req.Answers
                    .FirstOrDefault(a => a.QuestionId == questionId)?
                    .Answer?.Trim() ?? "";

                string correctAnswer = q.Type == 1
                    ? q.Options.FirstOrDefault(o => o.IsCorrect)?.Content ?? ""
                    : q.Answer;

                bool isCorrect = string.Equals(
                    userAnswer,
                    correctAnswer,
                    StringComparison.OrdinalIgnoreCase
                );

                if (isCorrect) score++;

                results.Add(new ListeningQuestionResultDto
                {
                    QuestionId = questionId,
                    Content = q.Content,
                    UserAnswer = userAnswer,
                    CorrectAnswer = correctAnswer,
                    IsCorrect = isCorrect
                });
            }

            return new AIListeningResultResponse
            {
                Score = score,
                Total = questions.Count,
                Script = script,
                Results = results
            };
        }
    }
}