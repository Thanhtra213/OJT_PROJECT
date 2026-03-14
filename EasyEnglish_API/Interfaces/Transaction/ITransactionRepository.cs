using Microsoft.AspNetCore.Mvc;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Transaction
{
    public interface ITransactionRepository
    {
        Task<List<PaymentOrder>> GetAllTransactionsAsync();
        Task<List<PaymentOrder>> SearchTransactionsAsync(string? keyword);
        Task<PaymentOrder?> GetTransactionDetailAsync(int orderId);
    }
}
