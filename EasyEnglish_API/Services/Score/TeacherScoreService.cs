using EasyEnglish_API.DTOs.Score;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Interfaces.Score;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Score
{
    public class TeacherScoreService : ITeacherScoreService
    {
        private readonly ITeacherScoreRepository _score;
        private readonly IAIReviewRepository _ai;

        public TeacherScoreService(ITeacherScoreRepository score,IAIReviewRepository ai)
        {
            _score = score;
            _ai = ai;
        }
        public async Task<object> CreateTeacherReview(int teacherId, CreateTeacherReviewRequest req)
        {
            var getId = await _ai.GetByIdAsync(req.AIReviewId);
            if (getId == null)
                throw new Exception("Not found or null");
            var result = await _score.CreateTeacherReviewAsync(new AnswerTeacherReview
            {
                AireviewId = req.AIReviewId,
                TeacherId = teacherId,
                ScoreOverall = req.ScoreOverall,
                ScoreTask = req.ScoreTask,
                ScoreLexial = req.ScoreLexical,
                ScoreGrammar = req.ScoreGrammar,
                ScorePronunciation = req.ScorePronunciation,
                ScoreFluency = req.ScoreFluency,
                ScoreCoherence = req.ScoreCoherence,
                Feedback = req.Feedback,
                CreatedAt = DateTime.UtcNow
            });
            return new
            {
                result.TeacherReviewId,
                result.ScoreOverall,
                result.ScoreTask,
                result.ScoreLexial,
                result.ScoreGrammar,
                result.ScorePronunciation,
                result.ScoreFluency,
                result.ScoreCoherence,
                result.Feedback,
                result.CreatedAt
            };

        }
        public async Task<List<object>> GetListPending()
        {
            var pending = await _ai.GetPendingForTeacherAsync();
            return pending.Select(x => new
            {
                AireviewId = x.AireviewId,
                Category = x.Submission?.Prompt?.SkillType,
                StudentName = x.Submission?.User?.Username,
                StudentAnswer = string.IsNullOrEmpty(x.Submission?.AnswerText) ? x.Submission?.Transcript : x.Submission?.AnswerText,
                AudioUrl = x.Submission?.AudioUrl,
                Transcript = x.Submission?.Transcript,
                AiScore = x.ScoreOverall,
                ScoreOverall = 0,
                AiFeedback = x.Feedback,
                AiGrammar = x.ScoreGrammar,
                AiLexical = x.ScoreLexical,
                IsTeacherReviewed = false,
                Prompt = new
                {
                    Title = x.Submission?.Prompt?.Title
                },
                AIReview = new
                {
                    x.ScoreOverall,
                    x.ScoreTask,
                    x.ScoreLexical,
                    x.ScoreGrammar,
                    x.ScorePronunciation,
                    x.ScoreFluency,
                    x.ScoreCoherence,
                },
                x.CreatedAt
            }).ToList<object>();
        }

        public async Task<object> GetDetail(int aiReviewId)
        {
            var data = await _score.GetByIdAsync(aiReviewId);

            if (data == null)
                throw new Exception("Not found");

            return new
            {
                data.AireviewId,

                Prompt = new
                {
                    data.Submission.Prompt.Title,
                    data.Submission.Prompt.Content
                },

                Answer = new
                {
                    data.Submission.Transcript,
                    data.Submission.AnswerText
                },

                AIReview = new
                {
                    data.ScoreOverall,
                    data.ScoreTask,
                    data.ScoreLexical,
                    data.ScoreGrammar,
                    data.ScorePronunciation,
                    data.ScoreFluency,
                    data.ScoreCoherence,
                    data.Feedback
                },
                data.CreatedAt
            };
        }
    }
}

