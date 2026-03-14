using EasyEnglish_API.DTOs.Transaction;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Transaction
{
    public interface ITransactionService
    {
        Task<List<TransactionListResponse>> GetAllTransactionsAsync();
        Task<List<TransactionListResponse>> SearchTransactionsAsync(string? keyword);
        Task<TransactionDetailResponse?> GetTransactionDetailAsync(int orderId);
    }
}
