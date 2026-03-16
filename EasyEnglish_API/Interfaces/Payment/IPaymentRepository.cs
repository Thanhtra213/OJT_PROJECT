using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Payment
{
    public interface IPaymentRepository
    {
        // ===== CRUD & QUERY =====
        Task<PaymentOrder?> GetOrderByIdAsync(int orderId);
        Task<PaymentOrder> CreateOrderAsync(PaymentOrder order);

        // ===== Webhook & Membership =====
        Task LogWebhookEventAsync(int orderId, string payload);
        Task HandlePaymentSuccessAsync(PaymentOrder order);
        Task HandlePaymentFailedAsync(PaymentOrder order);
    }
}
