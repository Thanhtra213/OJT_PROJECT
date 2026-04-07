using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EasyEnglish_API.Data;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;


namespace EMT_API.Services
{
    public class PayOSService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _cfg;
        private readonly EasyEnglishDbContext _db;

        public PayOSService(HttpClient http, IConfiguration cfg, EasyEnglishDbContext db)
        {
            _http = http;
            _cfg = cfg;
            _db = db;
        }

        public async Task<string> CreatePaymentAsync(int buyerId, int planId, string? voucherCode = null)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(planId)
                ?? throw new Exception("Không tìm thấy gói học.");

            decimal discountAmount = 0;
            int? voucherId = null;

            if (!string.IsNullOrEmpty(voucherCode))
            {
                var voucher = await _db.Vouchers
                    .Include(v => v.Usages)
                    .FirstOrDefaultAsync(v => v.Code == voucherCode.ToUpper() && v.IsActive)
                    ?? throw new Exception("Mã voucher không hợp lệ.");

                if (voucher.ExpiresAt < DateOnly.FromDateTime(DateTime.UtcNow))
                    throw new Exception("Mã voucher đã hết hạn.");

                if (voucher.Usages.Any(u => u.UserId == buyerId))
                    throw new Exception("Bạn đã sử dụng mã voucher này rồi.");

                if (voucher.ApplicablePlanId.HasValue && voucher.ApplicablePlanId != planId)
                    throw new Exception("Mã voucher không áp dụng cho gói học này.");

                discountAmount = voucher.DiscountAmount;
                voucherId = voucher.VoucherId;
            }

            var finalAmount = (int)Math.Max(0, plan.Price - discountAmount);

            var order = new PaymentOrder
            {
                BuyerId = buyerId,
                PlanId = planId,
                Amount = plan.Price,
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount,
                VoucherId = voucherId,
                Status = "PENDING"
            };
            _db.PaymentOrders.Add(order);
            await _db.SaveChangesAsync();

            // 2️⃣ Tạo chuỗi signature đúng format
            var cancelUrl = _cfg["PayOS:CancelUrl"];
            var returnUrl = _cfg["PayOS:ReturnUrl"];
            var description = $"Gói {plan.Name}".Length > 25
     ? $"Gói {plan.Name}".Substring(0, 25)
     : $"Gói {plan.Name}";



            var dataToSign =
                $"amount={finalAmount}&cancelUrl={cancelUrl}&description={description}&orderCode={order.OrderId}&returnUrl={returnUrl}";

            var signature = ComputeHmacSHA256(dataToSign, _cfg["PayOS:ChecksumKey"]);

            // 3️⃣ Tạo payload đúng theo tài liệu PayOS
            var payload = new
            {
                orderCode = order.OrderId,
                amount = finalAmount,
                description,
                cancelUrl,
                returnUrl,
                signature
            };

            var json = JsonSerializer.Serialize(payload);
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v2/payment-requests");
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");
            req.Headers.Add("x-client-id", _cfg["PayOS:ClientId"]);
            req.Headers.Add("x-api-key", _cfg["PayOS:ApiKey"]);

            var res = await _http.SendAsync(req);
            var raw = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"PayOS {res.StatusCode}: {raw}");
            }

            // 4️⃣ Parse JSON phản hồi
            using var doc = JsonDocument.Parse(raw);
            if (!doc.RootElement.TryGetProperty("data", out var dataElem) || dataElem.ValueKind == JsonValueKind.Null)
            {
                var msg = doc.RootElement.TryGetProperty("desc", out var descElem)
                    ? descElem.GetString()
                    : "PayOS response missing 'data'";
                throw new InvalidOperationException($"PayOS error: {msg}\nRaw: {raw}");
            }

            var checkoutUrl = dataElem.GetProperty("checkoutUrl").GetString();
            if (string.IsNullOrEmpty(checkoutUrl))
                throw new InvalidOperationException($"PayOS không trả về checkoutUrl. Raw: {raw}");

            return checkoutUrl!;
        }

        private static string ComputeHmacSHA256(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(data))).ToLower();
        }

        public string GetChecksumKey() => _cfg["PayOS:ChecksumKey"] ?? string.Empty;

        public string ComputeSignature(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(data))).ToLower();
        }

    }
}
