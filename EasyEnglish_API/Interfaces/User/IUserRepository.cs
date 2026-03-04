using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.User
{
    public interface IUserRepository
    {
        // Admin: user management
        Task<List<Account>> GetAllUsersAsync();
        Task<List<Account>> GetAllStudentsAsync();
        Task<List<Account>> GetAllTeachersAsync();
        Task<Account?> LockUserAsync(int id);
        Task<Account?> UnlockUserAsync(int id);
        Task<List<Account>> SearchUsersAsync(string? keyword, string? role, string? status);
        Task<Account?> AssignRoleAsync(int userId, string newRole);
    }
}
