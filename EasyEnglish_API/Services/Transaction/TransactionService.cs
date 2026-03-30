using EasyEnglish_API.DTOs.Transaction;
using EasyEnglish_API.Interfaces.Transaction;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Transaction
{
    public class TransactionService :ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;

        public TransactionService(ITransactionRepository transactionRepository)
        {
            _transactionRepository = transactionRepository;
        }

        public async Task<List<TransactionListResponse>> GetAllTransactionsAsync()
        {
            var transactions = await _transactionRepository.GetAllTransactionsAsync();

            var result = transactions.Select(t => new TransactionListResponse
            {
                OrderID = t.OrderId,
                BuyerID = t.BuyerId,
                BuyerUsername = t.Buyer.Username,
                BuyerEmail = t.Buyer.Email,

                PlanID = t.PlanId,
                PlanName = t.Plan.Name,

                Amount = t.Amount,
                Status = t.Status,

                CreatedAt = t.CreatedAt,
                PaidAt = t.PaidAt
            }).ToList();

            return result;
        }

        public async Task<TransactionDetailResponse?> GetTransactionDetailAsync(int orderId)
        {
            var t = await _transactionRepository.GetTransactionDetailAsync(orderId);

            if (t == null)
                throw new Exception("Not found!");

            var result = new TransactionDetailResponse
            {
                OrderID = t.OrderId,

                BuyerID = t.BuyerId,
                BuyerUsername = t.Buyer.Username,
                BuyerEmail = t.Buyer.Email,

                PlanID = t.PlanId,
                PlanCode = t.Plan.PlanCode,
                PlanName = t.Plan.Name,

                Price = t.Plan.Price,
                DurationDays = t.Plan.DurationDays,

                Amount = t.Amount,
                Status = t.Status,

                CreatedAt = t.CreatedAt,
                PaidAt = t.PaidAt,

                WebhookEvents = t.WebhookEvents
                    .OrderByDescending(w => w.ReceivedAt)
                    .Select(w => new WebhookEventResponse
                    {
                        WebhookID = w.WebhookId,
                        UniqueKey = w.UniqueKey,
                        Signature = w.Signature,
                        ReceivedAt = w.ReceivedAt,
                        Payload = w.Payload
                    }).ToList()
            };

            return result;
        }

        public async Task<List<TransactionListResponse>> SearchTransactionsAsync(string? keyword)
        {
            var transactions = await _transactionRepository.SearchTransactionsAsync(keyword);

            if (transactions == null)
                throw new Exception("Not found!");

            var result = transactions.Select(t => new TransactionListResponse
            {
                OrderID = t.OrderId,
                BuyerID = t.BuyerId,
                BuyerUsername = t.Buyer.Username,
                BuyerEmail = t.Buyer.Email,

                PlanID = t.PlanId,
                PlanName = t.Plan.Name,

                Amount = t.Amount,
                Status = t.Status,

                CreatedAt = t.CreatedAt,
                PaidAt = t.PaidAt
            }).ToList();

            return result;
        }
    }
}
