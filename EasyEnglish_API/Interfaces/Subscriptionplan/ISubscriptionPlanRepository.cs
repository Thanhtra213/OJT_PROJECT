using EasyEnglish_API.Models;

namespace EasyEnglish_API.Interfaces.Subscriptionplan
{
    public interface ISubscriptionPlanRepository
    {
        // --- CRUD ---
        Task<List<SubscriptionPlan>> GetAllPlansAsync();
        Task<SubscriptionPlan?> GetPlanByIdAsync(int id);
        Task<SubscriptionPlan?> CreatePlanAsync(SubscriptionPlan plan);
        Task<bool> UpdatePlanAsync(SubscriptionPlan plan);
        Task<bool> SoftDeletePlanAsync(int id);
        Task<bool> HardDeletePlanAsync(int id);

        // --- Validation ---
        Task<bool> PlanCodeExistsAsync(string planCode, int? excludeId = null);
    }
}
