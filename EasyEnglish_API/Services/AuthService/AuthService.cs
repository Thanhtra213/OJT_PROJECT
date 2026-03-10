using EasyEnglish_API.DTOs.Authentication;
using EasyEnglish_API.Interfaces.Authentication;
using EasyEnglish_API.Models;
using EasyEnglish_API.Security;
using EasyEnglish_API.Sercurity;
using EasyEnglish_API.Services.AuthService;
using EasyEnglish_API.Utils;
using Google.Apis.Auth;
using System.Security.Claims;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _repo;
    private readonly ITokenService _tokens;
    private readonly IOtpService _otp;
    private readonly EmailSender _mailer;
    private readonly IConfiguration _cfg;

    public AuthService(
        IAuthRepository repo,
        ITokenService tokens,
        IOtpService otp,
        EmailSender mailer,
        IConfiguration cfg)
    {
        _repo = repo;
        _tokens = tokens;
        _otp = otp;
        _mailer = mailer;
        _cfg = cfg;
    }

    // REGISTER STUDENT
    public async Task<Account> RegisterStudentAsync(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Username) ||
            string.IsNullOrWhiteSpace(req.Password) ||
            string.IsNullOrWhiteSpace(req.ConfirmPassword) ||
            string.IsNullOrWhiteSpace(req.Otp))
            throw new Exception("Vui lòng nhập đầy đủ thông tin.");

        if (req.Password != req.ConfirmPassword)
            throw new Exception("Mật khẩu xác nhận không khớp.");

        if (!_otp.Verify(req.Email, req.Otp))
            throw new Exception("OTP không hợp lệ hoặc đã hết hạn.");

        if (await _repo.IsEmailExistsAsync(req.Email))
            throw new Exception("Email đã tồn tại.");

        if (await _repo.IsUsernameExistsAsync(req.Username))
            throw new Exception("Username đã tồn tại.");

        var acc = new Account
        {
            Email = req.Email,
            Username = req.Username,
            Hashpass = PasswordHasher.Hash(req.Password),
            CreateAt = DateTime.UtcNow,
            Status = "ACTIVE",
            Role = "STUDENT"
        };

        await _repo.CreateAccountAsync(acc);
        await _repo.CreateUserDetailAsync(acc.AccountId);

        return acc;
    }

    //REGISTER TEACHER
    public async Task<Account> RegisterTeacherAsync(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Username) ||
            string.IsNullOrWhiteSpace(req.Password) ||
            string.IsNullOrWhiteSpace(req.ConfirmPassword))
            throw new Exception("Vui lòng nhập đầy đủ thông tin.");

        if (req.Password != req.ConfirmPassword)
            throw new Exception("Mật khẩu xác nhận không khớp.");

        if (await _repo.IsEmailExistsAsync(req.Email))
            throw new Exception("Email đã tồn tại.");

        if (await _repo.IsUsernameExistsAsync(req.Username))
            throw new Exception("Username đã tồn tại.");

        var acc = new Account
        {
            Email = req.Email,
            Username = req.Username,
            Hashpass = PasswordHasher.Hash(req.Password),
            CreateAt = DateTime.UtcNow,
            Status = "ACTIVE",
            Role = "TEACHER"
        };

        await _repo.CreateAccountAsync(acc);
        await _repo.CreateUserDetailAsync(acc.AccountId);
        await _repo.CreateTeacherAsync(acc.AccountId);

        return acc;
    }

    // LOGIN
    public async Task<Account> LoginAsync(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.EmailOrUsername) ||
            string.IsNullOrWhiteSpace(req.Password))
            throw new Exception("Vui lòng nhập đầy đủ email/username và mật khẩu.");

        var user = await _repo.GetByEmailOrUsernameAsync(req.EmailOrUsername);

        if (user == null)
            throw new Exception("Email/username không đúng.");

        if (!PasswordHasher.Verify(req.Password, user.Hashpass))
            throw new Exception("Mật khẩu không đúng.");

        if (user.Status != "ACTIVE")
            throw new Exception("Tài khoản đã bị khoá.");


        return user;
    }

    //LOGIN GOOGLE
    public async Task<Account> LoginWithGoogleAsync(GoogleLoginDto dto)
    {
        var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken);

        var user = await _repo.GetByEmailAsync(payload.Email);

        if (user == null)
        {
            user = new Account
            {
                Email = payload.Email,
                Username = payload.Email.Split('@')[0],
                GoogleSub = payload.Subject,
                Role = "STUDENT",
                Status = "ACTIVE",
                CreateAt = DateTime.UtcNow
            };

            await _repo.CreateAccountAsync(user);
            await _repo.CreateUserDetailAsync(user.AccountId);
        }

        return user;
    }

    //REFRESH TOKEN
    public async Task<Account> RefreshAsync(int userId, string refreshToken)
    {
        var user = await _repo.GetByIdAsync(userId);

        if (user == null)
            throw new Exception("User không tồn tại.");

        if (user.RefreshTokenExpiresAt <= DateTime.UtcNow)
            throw new Exception("Refresh token expired.");

        var hash = _tokens.HashRefreshToken(refreshToken);

        if (hash != user.RefreshTokenHash)
        {
            user.RefreshTokenVersion++;
            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresAt = null;
            await _repo.UpdateAccountAsync(user);

            throw new Exception("Refresh token reuse detected.");
        }

        return user;
    }

    //SEND OTP
    public async Task SendOtpAsync(SendOtpRequest req)
    {
        var otp = _otp.Generate(req.Email);
        var html = $"<h3>Mã OTP của bạn là <b>{otp}</b></h3>";
        await _mailer.SendEmailAsync(req.Email, "OTP EMT", html);
    }

    //FORGOT PASS
    public async Task ForgotPasswordAsync(ForgotPasswordRequest req)
    {
        var acc = await _repo.GetByEmailAsync(req.Email);
        if (acc == null) return;

        var token = ResetPasswordTokenService.Create(acc, _cfg);
        var link = $"{_cfg["FrontendBaseUrl"]}/reset-password?token={Uri.EscapeDataString(token)}";

        var html = EmailTemplate.BuildResetPasswordEmail(acc.Username ?? acc.Email, link);
        try
        {
            await _mailer.SendEmailAsync(acc.Email!, "Đặt lại mật khẩu tài khoản", html);
        }
        catch { }
    }

    //RESET PASS
    public async Task ResetPasswordAsync(ResetPasswordRequest req)
    {
        if (req.NewPassword != req.ConfirmNewPassword)
            throw new Exception("Mật khẩu xác nhận không khớp.");

        if (!ResetPasswordTokenService.TryValidate(req.Token, _cfg, out var id, out _))
            throw new Exception("Token không hợp lệ.");

        var acc = await _repo.GetByIdAsync(id);

        if (acc == null)
            throw new Exception("Tài khoản không tồn tại.");


        acc.Hashpass = PasswordHasher.Hash(req.NewPassword);
        await _repo.UpdateAccountAsync(acc);
    }

    //LOGOUT
    public async Task LogoutAsync(int userId)
    {
        var user = await _repo.GetByIdAsync(userId);
        if (user == null) return;

        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await _repo.UpdateAccountAsync(user);
    }
}