namespace EasyEnglish_API.DTOs.Membership
{
    public class MembershipRequestDto
    {
        public int UserId { get; set; }   // optional nếu FE gửi user id, thường không cần vì lấy từ token
    }

    public class MembershipResponseDto
    {
        public bool HasMembership { get; set; }
        public DateTime? StartsAt { get; set; }
        public DateTime? EndsAt { get; set; }
        public string? PlanName { get; set; }
        public string? Status { get; set; }
    }

    public class MembershipHistoryDto
    {
        public long MembershipId { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreateAt { get; set; }
        public DateTime? CanceleAt { get; set; }
    }
}
