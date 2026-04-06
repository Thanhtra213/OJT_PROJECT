using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Vouchers;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Vouchers
{
    public class VoucherRepository : IVoucherRepository
    {
        private readonly EasyEnglishDbContext _db;
        public VoucherRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }
        public async Task<Voucher?> GetVoucherByCodeAsync(string code)
        => await _db.Vouchers
            .Include(v => v.Usages)
            .FirstOrDefaultAsync(v => v.Code == code.ToUpper() && v.IsActive);

        public async Task<Voucher?> GetVoucherByIdAsync(int voucherId)
            => await _db.Vouchers.Include(v => v.Usages).FirstOrDefaultAsync(v => v.VoucherId == voucherId);

        public async Task<List<Voucher>> GetAllVoucherAsync()
            => await _db.Vouchers.Include(v => v.Usages).OrderByDescending(v => v.CreatedAt).ToListAsync();

        public async Task<Voucher> CreateVoucherAsync(Voucher voucher)
        {
            voucher.Code = voucher.Code.ToUpper();
            _db.Vouchers.Add(voucher);
            await _db.SaveChangesAsync();
            return voucher;
        }

        public async Task<bool> UpdateVoucherAsync(Voucher voucher)
        {
            _db.Vouchers.Update(voucher);
            return await _db.SaveChangesAsync() > 0;
        }

        public async Task<bool> HasUserUsedVoucherAsync(int userId, int voucherId)
            => await _db.VoucherUsages.AnyAsync(u => u.UserId == userId && u.VoucherId == voucherId);

        public async Task MarkAsUsedAsync(int userId, int voucherId)
        {
            _db.VoucherUsages.Add(new VoucherUsage { UserId = userId, VoucherId = voucherId });
            await _db.SaveChangesAsync();
        }
    }
}
