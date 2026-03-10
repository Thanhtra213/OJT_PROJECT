using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.AIExam;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.AIExam
{
    public class AISubmissionRepository : IAISubmissionRepository
    {
        private readonly EasyEnglishDbContext _db;

        public AISubmissionRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<AISubmission> CreateAsync(AISubmission submission)
        {
            _db.AISubmissions.Add(submission);
            await _db.SaveChangesAsync();
            return submission;
        }

        public async Task<AISubmission?> GetByIdAsync(long submissionId)
        {
            return await _db.AISubmissions
                .Include(s => s.Prompt)
                .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);
        }

        public async Task<List<AISubmission>> GetByUserAsync(int userId)
        {
            return await _db.AISubmissions
                .Include(s => s.Prompt)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }
    }
}
