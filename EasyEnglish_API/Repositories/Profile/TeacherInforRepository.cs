using Amazon.S3.Model;
using EasyEnglish_API.Data;
using EasyEnglish_API.DTOs.Profile;
using EasyEnglish_API.Interfaces.Profile;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Profile
{
    public class TeacherInforRepository :ITeacherInForRepository
    {
        private readonly EasyEnglishDbContext _db;

        public TeacherInforRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<Teacher?> GetTeacherByIdAsync(int teacherId)
        {
            return await _db.Teachers
                .Include(t => t.TeacherNavigation)
                .FirstOrDefaultAsync(t => t.TeacherId == teacherId);
        }

        
        public async Task<Teacher?> GetTeacherByAccountIdAsync(int accountId)
        {
            return await _db.Teachers
                .FirstOrDefaultAsync(t => t.TeacherId == accountId);
        }

        public async Task SaveChangesAsync()
        {
            await _db.SaveChangesAsync();
        }
    }
}
