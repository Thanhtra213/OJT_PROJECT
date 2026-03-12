namespace EasyEnglish_API.DTOs.Profile
{
    public class GetProfileDetail
    {
        public int AccountID { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public DateOnly? Dob { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }
}
