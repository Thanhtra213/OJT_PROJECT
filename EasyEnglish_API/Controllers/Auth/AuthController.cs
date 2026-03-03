using EasyEnglish_API.DTOs.Authentication;
using EasyEnglish_API.Interfaces.Authentication;
using EasyEnglish_API.Models;
using EasyEnglish_API.Sercurity;
using EasyEnglish_API.Services.AuthService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace EasyEnglish_API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    private readonly ITokenService _tokens;
    private readonly IConfiguration _cfg;

    public AuthController(
        IAuthService service,
        ITokenService tokens,
        IConfiguration cfg)
    {
        _service = service;
        _tokens = tokens;
        _cfg = cfg;
    }

    // REGISTER STUDENT 
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        var user = await _service.RegisterStudentAsync(req);

        var access = _tokens.CreateAccessToken(user, user.RefreshTokenVersion);
        var (rt, exp) = _tokens.CreateRefreshToken();

        user.RefreshTokenHash = _tokens.HashRefreshToken(rt);
        user.RefreshTokenExpiresAt = exp.UtcDateTime;

        Response.Cookies.Append("emt_rt", rt, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = exp
        });

        return Created("", new AuthResponse(
            user.AccountId,
            access,
            int.Parse(_cfg["Jwt:AccessTokenMinutes"]!) * 60
        ));
    }

    //  REGISTER TEACHER 
    [HttpPost("registerTeacher")]
    public async Task<ActionResult<AuthResponse>> RegisterTeacher(RegisterRequest req)
    {
        var user = await _service.RegisterTeacherAsync(req);

        var access = _tokens.CreateAccessToken(user, user.RefreshTokenVersion);
        var (rt, exp) = _tokens.CreateRefreshToken();

        user.RefreshTokenHash = _tokens.HashRefreshToken(rt);
        user.RefreshTokenExpiresAt = exp.UtcDateTime;

        Response.Cookies.Append("emt_rt", rt, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = exp
        });

        return Created("", new AuthResponse(
            user.AccountId,
            access,
            int.Parse(_cfg["Jwt:AccessTokenMinutes"]!) * 60
        ));
    }

    //  SEND OTP 
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp(SendOtpRequest req)
    {
        await _service.SendOtpAsync(req);
        return Ok(new { message = "Đã gửi OTP tới email." });
    }

    // LOGIN 
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _service.LoginAsync(req);

        var access = _tokens.CreateAccessToken(user, user.RefreshTokenVersion);
        var (rt, exp) = _tokens.CreateRefreshToken();

        user.RefreshTokenHash = _tokens.HashRefreshToken(rt);
        user.RefreshTokenExpiresAt = exp.UtcDateTime;

        Response.Cookies.Append("emt_rt", rt, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = exp
        });

        return Ok(new
        {
            AccountID = user.AccountId,
            AccessToken = access,
            ExpiresIn = int.Parse(_cfg["Jwt:AccessTokenMinutes"]!) * 60,
            Role = user.Role,
            RedirectUrl = BuildRedirectUrl(user.Role)
        });
    }

    //  LOGIN GOOGLE 
    [HttpPost("login/google")]
    public async Task<IActionResult> LoginGoogle(GoogleLoginDto dto)
    {
        var user = await _service.LoginWithGoogleAsync(dto);

        var access = _tokens.CreateAccessToken(user, user.RefreshTokenVersion);
        var (rt, exp) = _tokens.CreateRefreshToken();

        user.RefreshTokenHash = _tokens.HashRefreshToken(rt);
        user.RefreshTokenExpiresAt = exp.UtcDateTime;

        Response.Cookies.Append("emt_rt", rt, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = exp
        });

        return Ok(new
        {
            AccountID = user.AccountId,
            AccessToken = access,
            ExpiresIn = int.Parse(_cfg["Jwt:AccessTokenMinutes"]!) * 60,
            Role = user.Role,
            RedirectUrl = BuildRedirectUrl(user.Role)
        });
    }

    //  REFRESH 
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh()
    {
        var rt = Request.Cookies["emt_rt"];
        if (string.IsNullOrEmpty(rt))
            return Unauthorized("Missing refresh token.");

        var bearer = Request.Headers["Authorization"].ToString();
        var accessOld = bearer.Replace("Bearer ", "");

        var principal = _tokens.ValidateExpiredAccessToken(accessOld);
        if (principal == null)
            return Unauthorized("Invalid access token.");

        var uid = int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var user = await _service.RefreshAsync(uid, rt);

        var access = _tokens.CreateAccessToken(user, user.RefreshTokenVersion);
        var (newRt, exp) = _tokens.CreateRefreshToken();

        user.RefreshTokenHash = _tokens.HashRefreshToken(newRt);
        user.RefreshTokenExpiresAt = exp.UtcDateTime;

        Response.Cookies.Append("emt_rt", newRt, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = exp
        });

        return Ok(new AuthResponse(
            user.AccountId,
            access,
            int.Parse(_cfg["Jwt:AccessTokenMinutes"]!) * 60
        ));
    }

    //  LOGOUT 
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.LogoutAsync(uid);

        Response.Cookies.Delete("emt_rt");

        return Ok();
    }

    //  FORGOT PASSWORD 
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest req)
    {
        await _service.ForgotPasswordAsync(req);
        return Ok(new { message = "If the email exists, a reset link has been sent." });
    }

    //  RESET PASSWORD 
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req)
    {
        await _service.ResetPasswordAsync(req);
        return Ok(new { message = "Đổi mật khẩu thành công." });
    }

    //  HELPER 
    private string BuildRedirectUrl(string role)
    {
        var baseUrl = _cfg["Frontend:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:3000";

        return role switch
        {
            "ADMIN" => $"{baseUrl}/admin/dashboard",
            "TEACHER" => $"{baseUrl}/teacher/dashboard",
            _ => $"{baseUrl}/home"
        };
    }
}