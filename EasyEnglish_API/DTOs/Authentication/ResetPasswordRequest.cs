namespace EasyEnglish_API.DTOs.Authentication
{
    public record ResetPasswordRequest(string Token, string NewPassword, string ConfirmNewPassword);
}
