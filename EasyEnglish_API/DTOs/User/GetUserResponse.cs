namespace EasyEnglish_API.DTOs.User
{
    public class GetUserResponse
    {
        public int AccountId { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; } = null!;

        public string Status { get; set; } = null!;

        public string Role { get; set; } = null!;
    }
}
