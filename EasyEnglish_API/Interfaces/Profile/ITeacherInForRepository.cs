using EasyEnglish_API.DTOs.Profile;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Profile
{
    public interface ITeacherInForRepository
    {
        Task<Teacher?> GetTeacherByIdAsync(int teacherId);
        Task<Teacher?> GetTeacherByAccountIdAsync(int accountId);
        Task SaveChangesAsync();
    }
}
