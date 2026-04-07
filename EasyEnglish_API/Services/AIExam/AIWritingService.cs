using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Interfaces.Membership;
using EasyEnglish_API.Models;
using Microsoft.Identity.Client;

namespace EasyEnglish_API.Services.AIExam
{
    public class AIWritingService :IAIWritingService
    {
        private readonly IMembershipRepository _membership;
        private readonly IAIPromptRepository _prompt;
        private readonly AIWritingExternal _ai;
        private readonly IAISubmissionRepository _submission;
        private readonly IAIReviewRepository _reviewDao;

        public AIWritingService(IMembershipRepository membership, AIWritingExternal ai, IAIPromptRepository prompt, IAISubmissionRepository submission, IAIReviewRepository reviewDao)
        {
            _membership = membership;
            _prompt = prompt;
            _submission = submission;
            _reviewDao = reviewDao;
            _ai = ai;
        }

        public async Task<AIWritingPromptResponse> GeneratePrompt(int userID)
        {
            if (!await _membership.HasActiveMembershipAsync(userID))
                throw new UnauthorizedAccessException("Membership required");

            var (title, content) = await _ai.GenerateWritingPromptAsync();
            if (string.IsNullOrWhiteSpace(content))
                throw new Exception("AI failed to generate writing prompt.");

            var prompt = await _prompt.CreateAsync(new AIPrompt
            {
                SkillType = "WRITING",
                Title = title,
                Content = content,
                CreatedAt = DateTime.UtcNow
            });

            return new AIWritingPromptResponse
            {
                PromptId = prompt.PromptId,
                Title = prompt.Title,
                Content = prompt.Content
            };
        }

        public async Task<AIWritingFeedbackResponse> SubmitAsync(int userId, AIWritingSubmitRequest req)
        {
            if (!await _membership.HasActiveMembershipAsync(userId))
                throw new Exception("Membership Required");

            if (req == null || string.IsNullOrEmpty(req.AnswerText))
                throw new Exception("AnswerText cannot be empty");

            req.AnswerText = req.AnswerText
                .Replace("\r\n", "\n").Replace("\r", "\n").Trim();

            var wordCount = req.AnswerText.Split(
                new[] { ' ', '\n', '\r', '\t' },
                StringSplitOptions.RemoveEmptyEntries).Length;
            if (wordCount < 150)
                throw new Exception("Essay must be at least 150 words.");

            var (overall, task, coherence, lexical, grammar, feedback) =
                await _ai.GradeWritingAsync(req.AnswerText);

            if (req.SendToTeacher)
            {
                var prompt = await _prompt.GetByIdAsync(req.PromptId);
                if (prompt == null)
                    throw new Exception("Invalid PromptId.");

                var submission = await _submission.CreateAsync(new AISubmission
                {
                    PromptId = req.PromptId,
                    UserId = userId,
                    Transcript = req.AnswerText, 
                    CreatedAt = DateTime.UtcNow
                });

                await _reviewDao.CreateAsync(new AnswerAIReview
                {
                    SubmissionId = submission.SubmissionId,
                    ModelName = "gemini-2.5-flash-lite",
                    ScoreOverall = overall,
                    ScoreLexical = lexical,
                    ScoreGrammar = grammar,
                    Feedback = feedback,
                    IsSentToTeacher = req.SendToTeacher,
                    CreatedAt = DateTime.UtcNow
                });
            }

            return new AIWritingFeedbackResponse
            {
                Score = overall,
                TaskResponse = task,
                Coherence = coherence,
                LexicalResource = lexical,
                Grammar = grammar,
                Feedback = feedback,
                AttemptId = 0
            };
        }
    }
}
