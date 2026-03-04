using EasyEnglish_API.Models;
using EasyEnglish_API.DTOs.User;

namespace EasyEnglish_API.Services.UserService
{
    public interface IUserService
    {
        Task<List<GetUserRespone>> GetAllUsersAsync();
        Task<List<GetUserRespone>> GetAllStudentsAsync();
        Task<List<GetUserRespone>> GetAllTeachersAsync();
        Task<Account?> LockUserAsync(int id);
        Task<Account?> UnlockUserAsync(int id);
        Task<List<GetUserRespone>> SearchUsersAsync(string? keyword, string? role, string? status);
        Task<Account?> AssignRoleAsync(AssignRoleRequest req);
    }
}
