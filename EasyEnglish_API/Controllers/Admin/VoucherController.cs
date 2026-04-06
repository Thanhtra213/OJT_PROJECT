using EasyEnglish_API.DTOs.Vouchers;
using EasyEnglish_API.Services.Vouchers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/vouchers")]
    [Authorize(Roles = "ADMIN")]
    public class VoucherController : ControllerBase
    {
        private readonly IVoucherService _voucherService;
        public VoucherController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }
        [HttpGet]
        public async Task<IActionResult> GetAllVoucher()
        {
            try
            {
                var voucher = await _voucherService.GetAllVoucherAsync();
                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherRequest req)
        {
            try 
            {
                var voucher = await _voucherService.CreateVoucherAsync(req);

                return Ok(voucher); 
            }
            catch (Exception ex) 
            { 
                return BadRequest(ex.Message); 
            }
        }
        [HttpPatch]
        public async Task<IActionResult> ToggleVoucher(int voucherId)
        {
            try
            {
                await _voucherService.ToggleActiveAsync(voucherId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
