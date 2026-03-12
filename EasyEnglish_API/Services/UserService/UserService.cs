using EasyEnglish_API.DTOs.User;
using EasyEnglish_API.Interfaces.User;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.UserService
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepositories)
        {
            _userRepository = userRepositories;
        }

        public async Task<List<GetUserResponse>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllUsersAsync();
            var data = users.Select(u => new GetUserResponse
            {
                AccountId = u.AccountId,
                UserName = u.Username,
                Email = u.Email,
                Status = u.Status,
                Role = u.Role
            }).ToList();
            return data;
        }

        public async Task<List<GetUserResponse>> GetAllStudentsAsync()
        {
            var users = await _userRepository.GetAllStudentsAsync();
            var data = users.Select(u => new GetUserResponse
            {
                AccountId = u.AccountId,
                UserName = u.Username,
                Email = u.Email,
                Status = u.Status,
                Role = u.Role
            }).ToList();
            return data;
        }

        public async Task<List<GetUserResponse>> GetAllTeachersAsync()
        {
            var users = await _userRepository.GetAllTeachersAsync();
            var data = users.Select(u => new GetUserResponse
            {
                AccountId = u.AccountId,
                UserName = u.Username,
                Email = u.Email,
                Status = u.Status,
                Role = u.Role
            }).ToList();
            return data;
        }

        public Task<Account?> LockUserAsync(int id)
        {
            return _userRepository.LockUserAsync(id);
        }

        public Task<Account?> UnlockUserAsync(int id)
        {
            return _userRepository.UnlockUserAsync(id);
        }

        public async Task<List<GetUserResponse>> SearchUsersAsync(string? keyword, string? role, string? status)
        {
            var users = await _userRepository.SearchUsersAsync(keyword, role, status);
            List<GetUserResponse> data = new List<GetUserResponse>();
            foreach (var user in users)
            {
                data.Add(new GetUserResponse
                {
                    AccountId = user.AccountId,
                    UserName = user.Username,
                    Email = user.Email,
                    Status = user.Status,
                    Role = user.Role
                });
            }
            return data;    
        }

        public async Task<Account?> AssignRoleAsync(AssignRoleRequest req)
        {
            var validRoles = new[] { "ADMIN", "TEACHER", "STUDENT" };
            var normalizedRole = req.Role.ToUpper();

            if (!validRoles.Contains(normalizedRole))
                throw new Exception("Invalid role. Role must be ADMIN, TEACHER, or STUDENT.");

            var user = await _userRepository.AssignRoleAsync(req.UserId, normalizedRole);
            if (user == null)
                throw new Exception("User not found.");

            if (normalizedRole == "TEACHER")
                await _userRepository.EnsureTeacherProfileAsync(req.UserId);

            return user;
        }

         private static GetUserResponse ToResponse(Account u) => new()
        {
            AccountId = u.AccountId,
            UserName = u.Username,
            Email = u.Email,
            Status = u.Status,
            Role = u.Role
        };
    }
}
