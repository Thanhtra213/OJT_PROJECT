using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Vouchers
{
    public interface IVoucherRepository
    {
        Task<Voucher?> GetVoucherByCodeAsync(string code);
        Task<Voucher?> GetVoucherByIdAsync(int voucherId);
        Task<List<Voucher>> GetAllVoucherAsync();
        Task<Voucher> CreateVoucherAsync(Voucher voucher);
        Task<bool> UpdateVoucherAsync(Voucher voucher);
        Task<bool> HasUserUsedVoucherAsync(int userId, int voucherId);
        Task MarkAsUsedAsync(int userId, int voucherId);
    }
}
