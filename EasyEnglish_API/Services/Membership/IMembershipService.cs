using EasyEnglish_API.DTOs.Membership;

namespace EasyEnglish_API.Services.Membership
{
    public interface IMembershipService
    {
        Task<MembershipResponseDto> CheckMembershipAsync(int userId);
        Task<IEnumerable<MembershipHistoryDto>> GetMembershipAsync(int userId);

        Task<bool> HasActiveMembershipAsync(int userId);
    }
}
