using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Transaction;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Transaction
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly EasyEnglishDbContext _db;

        public TransactionRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<List<PaymentOrder>> GetAllTransactionsAsync()
        {
            var query = _db.PaymentOrders
                .Include(t => t.Buyer)
                .Include(t => t.Plan)
                .OrderByDescending(t => t.CreatedAt);

            var result = await query.ToListAsync();

            return result;
        }

        public async Task<PaymentOrder?> GetTransactionDetailAsync(int orderId)
        {
            var query = _db.PaymentOrders
                .Include(t => t.Buyer)
                .Include(t => t.Plan)
                .Include(t => t.WebhookEvents)
                .Where(t => t.OrderId == orderId);

            var result = await query.FirstOrDefaultAsync();

            return result;
        }

        public async Task<List<PaymentOrder>> SearchTransactionsAsync(string? keyword)
        {
            var query = _db.PaymentOrders
        .Include(t => t.Buyer)
        .Include(t => t.Plan)
        .AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();

                query = query.Where(t =>
                    t.OrderId.ToString().Contains(keyword) ||
                    t.Buyer.Username.ToLower().Contains(keyword) ||
                    t.Buyer.Email.ToLower().Contains(keyword) ||
                    t.Plan.Name.ToLower().Contains(keyword) ||
                    t.Status.ToLower().Contains(keyword));
            }

            query = query.OrderByDescending(t => t.CreatedAt);

            var result = await query.ToListAsync();

            return result;
        }
    }
}
