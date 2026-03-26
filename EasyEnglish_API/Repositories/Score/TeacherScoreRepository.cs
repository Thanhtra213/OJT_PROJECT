using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Score;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Score
{
    public class TeacherScoreRepository : ITeacherScoreRepository
    {
        private readonly EasyEnglishDbContext _db;

        public TeacherScoreRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<AnswerTeacherReview> CreateTeacherReviewAsync(AnswerTeacherReview review)
        {
             _db.AnswerTeacherReviews.AddAsync(review);
            await _db.SaveChangesAsync();
            return review;
        }

        public async Task<List<AnswerTeacherReview>> GetAllList(long id)
        {
            return await _db.AnswerTeacherReviews
           .Where(r => r.AireviewId == id)
           .OrderByDescending(r => r.CreatedAt).ToListAsync();
        }
    }
}
