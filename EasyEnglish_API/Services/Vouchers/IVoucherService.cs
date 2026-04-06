using EasyEnglish_API.DTOs.Vouchers;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Vouchers
{
    public interface IVoucherService
    {
        Task<ValidateVoucherResponse> ValidateVoucherAsync(int userId, ValidateVoucherRequest req);
        Task<Voucher> CreateVoucherAsync(CreateVoucherRequest req);
        Task<List<VoucherResponse>> GetAllVoucherAsync();
        Task<bool> ToggleActiveAsync(int voucherId);
    }
}

