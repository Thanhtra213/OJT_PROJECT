namespace EasyEnglish_API.DTOs.Authentication
{
    public record AuthResponse(
        int AccountID,
        string AccessToken,
        int ExpiresIn
    );
}
