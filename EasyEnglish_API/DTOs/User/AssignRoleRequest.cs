namespace EasyEnglish_API.DTOs.User
{
    public class AssignRoleRequest
    {
        public int UserId { get; set; }
        public string Role { get; set; } = string.Empty;
    }
}
