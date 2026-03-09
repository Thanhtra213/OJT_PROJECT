using EasyEnglish_API.Models;
using EasyEnglish_API.DTOs.User;

namespace EasyEnglish_API.Services.UserService
{
    public interface IUserService
    {
        Task<List<GetUserResponse>> GetAllUsersAsync();
        Task<List<GetUserResponse>> GetAllStudentsAsync();
        Task<List<GetUserResponse>> GetAllTeachersAsync();
        Task<Account?> LockUserAsync(int id);
        Task<Account?> UnlockUserAsync(int id);
        Task<List<GetUserResponse>> SearchUsersAsync(string? keyword, string? role, string? status);
        Task<Account?> AssignRoleAsync(AssignRoleRequest req);
    }
}
