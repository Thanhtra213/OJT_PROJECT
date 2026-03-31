using EasyEnglish_API.Services.Transaction;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/transactions")]
    [Authorize(Roles = "ADMIN")]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }
        // -----------------------------------------------------
        // 1️⃣ Xem toàn bộ lịch sử giao dịch
        // -----------------------------------------------------
        [HttpGet("view")]
        public async Task<IActionResult> GetAllTransactions()
        {
            var result = await _transactionService.GetAllTransactionsAsync();

            return Ok(result);
        }

        // -----------------------------------------------------
        // 2️⃣ Tìm kiếm giao dịch theo OrderID, Email, Trạng thái, hoặc Tên gói
        // -----------------------------------------------------
        [HttpGet("search")]
        public async Task<IActionResult> SearchTransactions([FromQuery] string? keyword)
        {
            try
            {
                var result = await _transactionService.SearchTransactionsAsync(keyword);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // -----------------------------------------------------
        // 3️⃣ Xem chi tiết một giao dịch (bao gồm log webhook)
        // -----------------------------------------------------
        [HttpGet("detail/{orderId:int}")]
        public async Task<IActionResult> GetTransactionDetail(int orderId)
        {
            try
            {
                var result = await _transactionService.GetTransactionDetailAsync(orderId);

                return Ok(result);
            } catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
