using System.Security.Claims;
using System.Text.Json;
using EasyEnglish_API.Services.Payment;
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

        public PaymentController(IPaymentService paymentService, PayOSService payOSService)
        {
            _paymentService = paymentService;
            _payOSService = payOSService;
        }

        // Student tạo đơn thanh toán
        [HttpPost("create")]
        [Authorize(Roles = "STUDENT")]
        public async Task<IActionResult> CreatePayment(int planId)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var url = await _payOSService.CreatePaymentAsync(userId, planId);
                return Ok(new { paymentUrl = url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
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
