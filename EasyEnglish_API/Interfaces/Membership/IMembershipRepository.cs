using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Membership
{
    public interface IMembershipRepository
    {
        // ====== Query membership ======
        Task<UserMembership?> GetActiveMembershipByUserAsync(int userId);
        Task<List<UserMembership>> GetMembershipHistoryAsync(int userId);

        // ====== Create & Update ======
        Task<UserMembership> CreateMembershipAsync(UserMembership membership);
        Task<bool> UpdateMembershipStatusAsync(long membershipId, string newStatus);

        // ====== Utility ======
        Task<bool> HasActiveMembershipAsync(int userId);
    }
}
