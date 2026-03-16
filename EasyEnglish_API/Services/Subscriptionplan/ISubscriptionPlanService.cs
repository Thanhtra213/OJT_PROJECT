using EasyEnglish_API.DTOs.SubScriptionplan;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Subscriptionplan
{
    public interface ISubscriptionPlanService
    {
        // --- CRUD ---
        Task<List<SubscriptionPlan>> GetAllPlansAsync();
        Task<List<ViewSubscriptionPlanResponse>> ViewAllPlansAsync();
        Task<SubscriptionPlan?> GetPlanByIdAsync(int id);
        Task<SubscriptionPlan?> CreatePlanAsync(CreateSubscriptionPlanRequest req);
        Task<bool> UpdatePlanAsync(int id, UpdateSubscriptionPlanRequest req);
        Task<bool> SoftDeletePlanAsync(int id);
        Task<bool> HardDeletePlanAsync(int id);

        Task<bool> DeletePlanAsync(int id, bool force = false);

        // --- Validation ---
        Task<bool> PlanCodeExistsAsync(string planCode, int? excludeId = null);
    }
}
