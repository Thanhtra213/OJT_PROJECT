using EasyEnglish_API.DTOs.AIExam;
using EasyEnglish_API.ExternalService;
using EasyEnglish_API.Interfaces.Membership;
using Microsoft.Identity.Client;

namespace EasyEnglish_API.Services.AIExam
{
    public class AIWritingService :IAIWritingService
    {
        private readonly IMembershipRepository _membership;
        private readonly AIWritingExternal _ai;

        public AIWritingService(IMembershipRepository membership, AIWritingExternal ai)
        {
            _membership = membership;
            _ai = ai;
        }

        public async Task<AIWritingPromptResponse> GeneratePrompt(int userID)
        {
            if (!await _membership.HasActiveMembershipAsync(userID))
                throw new UnauthorizedAccessException("Mémhip required");

            var (title, content) = await _ai.GenerateWritingPromptAsync();

            if (string.IsNullOrWhiteSpace(content))
                throw new Exception("AI failed to generate writing prompt.");

            return new AIWritingPromptResponse
            {
                PromptId = 0,
                Title = title,
                Content = content
            };
        }

        public async Task<AIWritingFeedbackResponse> SubmitAsync(int userdID, AIWritingSubmitRequest req)
        {
            if (!await _membership.HasActiveMembershipAsync(userdID))
                throw new Exception("Membership Required");

            if (req == null || string.IsNullOrEmpty(req.AnswerText))
                throw new Exception("AnswerTexxt cannot be empty");

            // normalize newline
            req.AnswerText = req.AnswerText
                .Replace("\r\n", "\n")
                .Replace("\r", "\n")
                .Trim();

            var wordCount = req.AnswerText.Split(new[] { ' ', '\n', '\r', '\t' },
                StringSplitOptions.RemoveEmptyEntries).Length;

            if (wordCount < 150)
                throw new Exception("Essay must be at least 150 words.");

            var (overall, task, coherence, lexical, grammar, feedback) =
                await _ai.GradeWritingAsync(req.AnswerText);
            return new AIWritingFeedbackResponse
            {
                Score = overall,
                TaskResponse = task,
                Coherence = coherence,
                LexicalResource = lexical,
                Grammar = grammar,
                Feedback = feedback
            };
        }
    }
}
