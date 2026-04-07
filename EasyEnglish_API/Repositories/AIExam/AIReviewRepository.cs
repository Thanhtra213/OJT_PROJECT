using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.AIExam
{
    public class AIReviewRepository : IAIReviewRepository
    {
        private readonly EasyEnglishDbContext _db;

        public AIReviewRepository(EasyEnglishDbContext db) 
        { 
            _db = db; 
        }

        public async Task<AnswerAIReview> CreateAsync(AnswerAIReview review)
        {
            _db.AnswerAIReviews.Add(review);
            await _db.SaveChangesAsync();
            return review;
        }

        public async Task<AnswerAIReview?> GetBySubmissionAsync(long submissionId)
        {
            return await _db.AnswerAIReviews
                .Include(r => r.Submission)
                .FirstOrDefaultAsync(r => r.SubmissionId == submissionId);
        }

        public async Task<List<AnswerAIReview>> GetPendingForTeacherAsync()
        {
            return await _db.AnswerAIReviews
                .Include(r => r.Submission)
                .ThenInclude(s => s.Prompt)
                .Where(r => r.IsSentToTeacher)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<AnswerAIReview> GetByIdAsync(long id)
        {
            return await _db.AnswerAIReviews.FirstOrDefaultAsync(a => a.AireviewId == id);
        }

        public async Task<object?> GetStudentReviewAsync(int userId, long submissionId)
        {
            var result = await _db.AnswerAIReviews
                .Include(r => r.Submission)
                    .ThenInclude(s => s.Prompt)
                .Include(r => r.AnswerTeacherReviews)
                .Where(r => r.Submission.SubmissionId == submissionId
                         && r.Submission.UserId == userId)
                .Select(r => new
                {
                    Prompt = new
                    {
                        r.Submission.Prompt.Title,
                        r.Submission.Prompt.Content
                    },

                    Answer = new
                    {
                        r.Submission.Transcript,
                        r.Submission.AnswerText
                    },

                    AIReview = new
                    {
                        r.ScoreOverall,
                        r.ScoreFluency,
                        r.ScoreLexical,
                        r.ScoreGrammar,
                        r.ScorePronunciation,
                        r.ScoreCoherence,
                        r.Feedback
                    },

                    TeacherReview = r.AnswerTeacherReviews
                        .Select(t => new
                        {
                            t.ScoreOverall,
                            t.ScoreTask,
                            t.ScoreLexial,
                            t.ScoreGrammar,
                            t.ScorePronunciation,
                            t.ScoreFluency,
                            t.ScoreCoherence,
                            t.Feedback
                        })
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            return result;
        }

        public async Task<List<object>> GetSubmissionListAsync(int userId)
        {
            return await _db.AnswerAIReviews
                .Include(r => r.Submission)
                    .ThenInclude(s => s.Prompt)
                .Include(r => r.AnswerTeacherReviews)
                .Where(r => r.Submission.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Submission.SubmissionId,
                    r.AireviewId,
                    Prompt = new
                    {
                        r.Submission.Prompt.Title,
                        r.Submission.Prompt.Content
                    },
                    r.ScoreOverall,
                    r.CreatedAt,
                    IsTeacherReviewed = r.AnswerTeacherReviews.Any()
                })
                .Cast<object>()
                .ToListAsync();
        }
    }
}
