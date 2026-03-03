namespace EasyEnglish_API.DTOs.Authentication
{
    public record LoginRequest(string EmailOrUsername, string Password);

    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = string.Empty;
    }
}
