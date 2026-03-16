using System.Text.Json;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Payment
{
    public interface IPaymentService
    {
        Task<bool> WebhookCallback(JsonElement body);
    }
}
