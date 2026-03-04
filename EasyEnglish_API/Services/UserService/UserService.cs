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

        public async Task<List<GetUserRespone>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllUsersAsync();
            var data = users.Select(u => new GetUserRespone
            {
                AccountId = u.AccountId,
                UserName = u.Username,
                Email = u.Email,
                Status = u.Status,
                Role = u.Role
            }).ToList();
            return data;
        }

        public async Task<List<GetUserRespone>> GetAllStudentsAsync()
        {
            var users = await _userRepository.GetAllStudentsAsync();
            var data = users.Select(u => new GetUserRespone
            {
                AccountId = u.AccountId,
                UserName = u.Username,
                Email = u.Email,
                Status = u.Status,
                Role = u.Role
            }).ToList();
            return data;
        }

        public async Task<List<GetUserRespone>> GetAllTeachersAsync()
        {
            var users = await _userRepository.GetAllTeachersAsync();
            var data = users.Select(u => new GetUserRespone
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

        public async Task<List<GetUserRespone>> SearchUsersAsync(string? keyword, string? role, string? status)
        {
            var users = await _userRepository.SearchUsersAsync(keyword, role, status);
            List<GetUserRespone> data = new List<GetUserRespone>();
            foreach (var user in users)
            {
                data.Add(new GetUserRespone
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
            if (!validRoles.Contains(req.Role.ToUpper()))
                throw new Exception("Invalid role. Role must be ADMIN, TEACHER, or STUDENT.");

            var user = await _userRepository.AssignRoleAsync(req.UserId, req.Role.ToUpper());
            if (user == null)
                throw new Exception("User not found.");
            return await _userRepository.AssignRoleAsync(req.UserId, req.Role);
        }
    }
}
