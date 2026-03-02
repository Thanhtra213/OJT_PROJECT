using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Authentication
{
    public interface IAuthRepositories
    {
        Task<Account?> GetByEmailOrUsernameAsync(string emailOrUsername);
        Task<Account?> GetByEmailAsync(string email);
        Task<bool> IsEmailExistsAsync(string email);
        Task<bool> IsUsernameExistsAsync(string username);
        Task<Account> CreateAccountAsync(Account acc);
        Task<UserDetail> CreateUserDetailAsync(int accountId);
        Task<Teacher> CreateTeacherAsync(int accountId, string? desc = null, string? cert = null);
        Task UpdateAccountAsync(Account acc);
        Task<Account?> GetByIdAsync(int id);
    }
}
