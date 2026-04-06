using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Payment;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Payment
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly EasyEnglishDbContext _db;

        public PaymentRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        // =============================
        // 🔹 CRUD
        // =============================
        public async Task<PaymentOrder?> GetOrderByIdAsync(int orderId)
        {
            return await _db.PaymentOrders
                .Include(o => o.Plan)
                .Include(o => o.Buyer)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
        }

        public async Task<PaymentOrder> CreateOrderAsync(PaymentOrder order)
        {
            order.CreatedAt = DateTime.UtcNow;
            _db.PaymentOrders.Add(order);
            await _db.SaveChangesAsync();
            return order;
        }
        // =============================
        // 🔹 Webhook Handling
        // =============================
        public async Task LogWebhookEventAsync(int orderId, string payload)
        {
            _db.WebhookEvents.Add(new WebhookEvent
            {
                OrderId = orderId,
                UniqueKey = Guid.NewGuid().ToString(),
                Payload = payload,
                ReceivedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        public async Task HandlePaymentSuccessAsync(PaymentOrder order)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(order.PlanId);
            if (plan == null) return;

            _db.UserMemberships.Add(new UserMembership
            {
                UserId = order.BuyerId,
                StartsAt = DateTime.UtcNow,
                EndsAt = DateTime.UtcNow.AddDays(plan.DurationDays),
                Status = "ACTIVE"
            });

            // Đánh dấu voucher đã dùng sau khi thanh toán thành công
            if (order.VoucherId.HasValue)
            {
                _db.VoucherUsages.Add(new VoucherUsage
                {
                    UserId = order.BuyerId,
                    VoucherId = order.VoucherId.Value
                });
            }

            order.Status = "PAID";
            order.PaidAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task HandlePaymentFailedAsync(PaymentOrder order)
        {
            order.Status = "CANCELED";
            await _db.SaveChangesAsync();
        }
    }
}
