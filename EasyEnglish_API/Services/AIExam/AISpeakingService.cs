using EasyEnglish_API.Controllers.AIExam;
using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;
using System.Text.Json;

namespace EasyEnglish_API.Services.AIExam
{
    public class AISpeakingService : IAISpeakingService
    {
        private readonly AISpeakingExternal _ai;
        private readonly IMembershipRepository _membership;
        private readonly IAIPromptRepository _prompt;
        private readonly IAISubmissionRepository _submission;
        private readonly IAIReviewRepository _reviewDao;
        private readonly ILogger<AISpeakingService> _logger;

        public AISpeakingService(AISpeakingExternal ai, IMembershipRepository membership, IAIPromptRepository prompt, IAISubmissionRepository submission, IAIReviewRepository reviewDao, ILogger<AISpeakingService> logger)
        {
            _ai = ai;
            _membership = membership;
            _prompt = prompt;
            _submission = submission;
            _reviewDao = reviewDao;
            _logger = logger;
        }

        public async Task<GeneratePromptResponse> GeneratePromptAsync(int userId)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership required.");

            var (title, content) = await _ai.GenerateSpeakingPromptAsync();

            var prompt = await _prompt.CreateAsync(new AIPrompt
            {
                SkillType = "SPEAKING",
                Title = title,
                Content = content,
                CreatedAt = DateTime.UtcNow
            });

            return new GeneratePromptResponse
            {
                PromptId = prompt.PromptId,
                Title = prompt.Title,
                Content = prompt.Content
            };
        }

        public async Task<AISpeakingResultResponse> SubmitAsync(int userId, AISpeakingSubmitAudioRequest req)
        {
          

            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership required or expired.");

            if (req.File == null || req.File.Length == 0)
                throw new Exception("Invalid audio file.");

            var prompt = await _prompt.GetByIdAsync(req.PromptId);
            if (prompt == null)
                throw new Exception("Invalid PromptId.");

            _logger.LogInformation("Starting transcription...");
            var transcript = await _ai.TranscribeAsync(req.File);

            if (string.IsNullOrWhiteSpace(transcript))
                throw new Exception("Audio could not be transcribed.");

            _logger.LogInformation("Starting grading...");
            var (score, flu, lex, gra, pro, fbJson) =
    await _ai.GradeSpeakingAsync(transcript, prompt.Content);

            using var feedbackDoc = JsonDocument.Parse(fbJson);
            var fb = feedbackDoc.RootElement.Clone();

            if (req.SendToTeacher)
            {
                _logger.LogInformation("Saving submission to database...");

                var submission = await _submission.CreateAsync(new AISubmission
                {
                    PromptId = prompt.PromptId,
                    UserId = userId,
                    Transcript = transcript,
                    CreatedAt = DateTime.UtcNow
                });

                await _reviewDao.CreateAsync(new AnswerAIReview
                {
                    SubmissionId = submission.SubmissionId,
                    ModelName = "gpt-4o-mini",
                    ScoreOverall = score,
                    ScoreLexical = lex,
                    ScoreGrammar = gra,
                    ScorePronunciation = pro,
                    Feedback = fbJson,
                    IsSentToTeacher = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            return new AISpeakingResultResponse
            {
                Transcript = transcript,
                Score = score,
                Fluency = flu,
                LexicalResource = lex,
                Grammar = gra,
                Pronunciation = pro,
                Feedback = fb
            };
        }
    }
    
}
