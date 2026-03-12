using EasyEnglish_API.DTOs.Profile;

namespace EasyEnglish_API.Services.Profile
{
    public interface IProfileService
    {
        Task<GetProfileDetail> GetDetailAsync(int userId);
        Task<string> GetAvatarAsync(int userId);
        Task UpdateDetailAsync(int userId, UpdateUserDetailRequest req);
        Task<string> ChangeAvatarAsync(int userId, IFormFile file);
        Task ChangePasswordAsync(int userId, ChangePasswordRequest req);
    }
}
