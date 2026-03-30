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
            try
            {
                if (!body.TryGetProperty("data", out var dataElem))
                {
                    Console.WriteLine("Invalid payload: missing data");
                    return false;
                }

                long orderId = dataElem.GetProperty("orderCode").GetInt64();

                string code = "UNKNOWN";
                if (dataElem.TryGetProperty("code", out var codeElem)
                    && codeElem.ValueKind == JsonValueKind.String)
                {
                    code = codeElem.GetString()!;
                }

                string status = code == "00" ? "PAID" : "FAILED";

                await _paymentRepository.LogWebhookEventAsync((int)orderId, body.ToString() ?? "{}");

                var order = await _paymentRepository.GetOrderByIdAsync((int)orderId);
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
            catch (Exception ex)
            {
                Console.WriteLine("Webhook ERROR: " + ex.Message);
                return false;
            }
        }
    }
}
