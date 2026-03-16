using System.Text.Json;
using EasyEnglish_API.Interfaces.Payment;
using EasyEnglish_API.Repositories.Payment;

namespace EasyEnglish_API.Services.Payment
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;

        public PaymentService(IPaymentRepository paymentRepository)
        {
            _paymentRepository = paymentRepository;
        }

        public async Task<bool> WebhookCallback(JsonElement body)
        {
            if (!body.TryGetProperty("data", out var dataElem))
            {
                Console.WriteLine("Invalid payload: missing data");
                return false;
            }

            var orderId = dataElem.GetProperty("orderCode").GetInt32();
            var code = dataElem.TryGetProperty("code", out var codeElem)
                ? codeElem.GetString() : "UNKNOWN";

            string status = code == "00" ? "PAID" : "FAILED";

            await _paymentRepository.LogWebhookEventAsync(orderId, body.ToString() ?? "{}");

            var order = await _paymentRepository.GetOrderByIdAsync(orderId);
            if (order == null)
            {
                Console.WriteLine("Order not found, ignored");
                return true;
            }

            if (status == "PAID")
                await _paymentRepository.HandlePaymentSuccessAsync(order);
            else
                await _paymentRepository.HandlePaymentFailedAsync(order);

            Console.WriteLine($"✅ Webhook handled for order {orderId} - {status}");
            return true;
        }
    }
}
