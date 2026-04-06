using EasyEnglish_API.DTOs.Vouchers;
using EasyEnglish_API.Interfaces.Subscriptionplan;
using EasyEnglish_API.Interfaces.Vouchers;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Vouchers
{
    public class VoucherService : IVoucherService
    {
        private readonly IVoucherRepository _voucherRepository;
        private readonly ISubscriptionPlanRepository _subscriptionPlanRepository; 
        public VoucherService(IVoucherRepository voucherRepository, ISubscriptionPlanRepository subscriptionPlanRepository)
        {
            _voucherRepository = voucherRepository;
            _subscriptionPlanRepository = subscriptionPlanRepository;
        }

        public async Task<Voucher> CreateVoucherAsync(CreateVoucherRequest req)
        {
            var voucher = new Voucher
            {
                Code = req.Code,
                DiscountAmount = req.DiscountAmount,
                ExpiresAt = req.ExpiresAt,
                ApplicablePlanId = req.ApplicablePlanId
            };

            var created = await _voucherRepository.CreateVoucherAsync(voucher);

            return created;
        }

        public async Task<List<VoucherResponse>> GetAllVoucherAsync()
        {
            var data = await _voucherRepository.GetAllVoucherAsync();

            var vouchers = data
                .Select(v => new VoucherResponse
                {
                    VoucherId = v.VoucherId,
                    Code = v.Code,
                    DiscountAmount = v.DiscountAmount,
                    ExpiresAt = v.ExpiresAt,
                    IsActive = v.IsActive,
                    ApplicablePlanId= v.ApplicablePlanId,
                }).ToList();

            return vouchers;
        }

        public async Task<bool> ToggleActiveAsync(int voucherId)
        {
            var voucher = await _voucherRepository.GetVoucherByIdAsync(voucherId)
            ?? throw new Exception("Không tìm thấy voucher.");
            voucher.IsActive = !voucher.IsActive;
            return await _voucherRepository.UpdateVoucherAsync(voucher);
        }

        public async Task<ValidateVoucherResponse> ValidateVoucherAsync(int userId, ValidateVoucherRequest req)
        {
            var voucher = await _voucherRepository.GetVoucherByCodeAsync(req.Code)
            ?? throw new Exception("Mã voucher không tồn tại hoặc đã bị vô hiệu hóa.");

            if (voucher.ExpiresAt < DateOnly.FromDateTime(DateTime.UtcNow))
                throw new Exception("Mã voucher đã hết hạn.");

            if (await _voucherRepository.HasUserUsedVoucherAsync(userId, voucher.VoucherId))
                throw new Exception("Bạn đã sử dụng mã voucher này rồi.");

            if (voucher.ApplicablePlanId.HasValue && voucher.ApplicablePlanId != req.PlanId)
                throw new Exception("Mã voucher không áp dụng cho gói học này.");

            var plan = await _subscriptionPlanRepository.GetPlanByIdAsync(req.PlanId)
                ?? throw new Exception("Không tìm thấy gói học.");

            var finalPrice = Math.Max(0, plan.Price - voucher.DiscountAmount);

            return new ValidateVoucherResponse
            {
                VoucherId = voucher.VoucherId,
                DiscountAmount = voucher.DiscountAmount,
                OriginalPrice = plan.Price,
                FinalPrice = finalPrice
            };
        }
    }
}
