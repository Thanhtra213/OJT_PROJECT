using EasyEnglish_API.DTOs.Authentication;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.AuthService
{
    public interface IAuthService
    {
        Task<Account> RegisterStudentAsync(RegisterRequest req);
        Task<Account> RegisterTeacherAsync(RegisterRequest req);

        Task<Account> LoginAsync(LoginRequest req);
        Task<Account> LoginWithGoogleAsync(GoogleLoginDto dto);

        Task<Account> RefreshAsync(int userId, string refreshToken);

        Task SendOtpAsync(SendOtpRequest req);

        Task ForgotPasswordAsync(ForgotPasswordRequest req);
        Task ResetPasswordAsync(ResetPasswordRequest req);

        Task LogoutAsync(int userId);
    }
}
