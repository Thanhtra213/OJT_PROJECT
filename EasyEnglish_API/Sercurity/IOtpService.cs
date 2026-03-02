namespace EasyEnglish_API.Sercurity
{
    public interface IOtpService
    {
        string Generate(string email);
        bool Verify(string email, string otp);
    }
}
