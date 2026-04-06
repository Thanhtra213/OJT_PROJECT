using System.Security.Claims;
using System.Text.Json;
using EasyEnglish_API.DTOs.Vouchers;
using EasyEnglish_API.Services.Payment;
using EasyEnglish_API.Services.Vouchers;
using EMT_API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Payment
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly PayOSService _payOSService;
        private readonly IVoucherService _voucherService;

        public PaymentController(IPaymentService paymentService, PayOSService payOSService, IVoucherService voucherService)
        {
            _paymentService = paymentService;
            _payOSService = payOSService;
            _voucherService = voucherService;
        }

        [HttpPost("validate-voucher")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> ValidateVoucher([FromBody] ValidateVoucherRequest req)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var result = await _voucherService.ValidateVoucherAsync(userId, req);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("create")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> CreatePayment(int planId, [FromQuery] string? voucherCode)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var url = await _payOSService.CreatePaymentAsync(userId, planId, voucherCode);
                return Ok(new { paymentUrl = url });
            }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> WebhookCallback([FromBody] JsonElement body)
        {
            try
            {
                await _paymentService.WebhookCallback(body);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
            return Ok();
        }
    }
}
