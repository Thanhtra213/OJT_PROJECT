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
                .Where(r => r.IsSentToTeacher)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<AnswerAIReview> GetByIdAsync(long id)
        {
            return await _db.AnswerAIReviews.FirstOrDefaultAsync(a => a.AireviewId == id);
        }
    }
}
