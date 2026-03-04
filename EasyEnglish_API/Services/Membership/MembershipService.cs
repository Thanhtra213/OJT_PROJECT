using EasyEnglish_API.DTOs.Membership;
using EasyEnglish_API.Exceptions;
using EasyEnglish_API.Interfaces.Membership;
using System.Collections.Generic;

namespace EasyEnglish_API.Services.Membership
{
    public class MembershipService : IMembershipService
    {
        private readonly IMembershipRepository _membership;

        public MembershipService(IMembershipRepository membership)
        {
            _membership = membership;
        }

        public async Task<MembershipResponseDto> CheckMembershipAsync(int userId)
        {
            if (userId <= 0)
                throw new UnauthorizedException("User không hợp lệ.");
            var active = await _membership.GetActiveMembershipByUserAsync(userId);
            if (active == null)
            {
                return new MembershipResponseDto
                {
                    HasMembership = false
                };
            }
            return new MembershipResponseDto
            {
                HasMembership = true,
                StartsAt = active.StartsAt,
                EndsAt = active.EndsAt,
                Status = active.Status
            };
        }

        public async Task<IEnumerable<MembershipHistoryDto>> GetMembershipAsync(int userId)
        {
            var history = await _membership.GetMembershipHistoryAsync(userId);
            if (history == null)
                throw new NotFoundException("Lịch sử trống");
            return history.Select(m => new MembershipHistoryDto
            {
                MembershipId = m.MembershipId,
                StartsAt = m.StartsAt,
                EndsAt = m.EndsAt,
                Status = m.Status,
                CreateAt = m.CreatedAt,
                CanceleAt = m.CanceledAt 
            });
        }
    }
}
