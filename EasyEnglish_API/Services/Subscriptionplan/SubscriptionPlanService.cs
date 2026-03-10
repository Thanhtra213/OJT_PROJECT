using EasyEnglish_API.DTOs.SubScriptionplan;
using EasyEnglish_API.Interfaces.Subscriptionplan;
using EasyEnglish_API.Models;

namespace EasyEnglish_API.Services.Subscriptionplan
{
    public class SubscriptionPlanService : ISubscriptionPlanService
    {
        private readonly ISubscriptionPlanRepository _subscriptionRepository;

        public SubscriptionPlanService(ISubscriptionPlanRepository subscriptionRepository)
        {
            _subscriptionRepository = subscriptionRepository;
        }

        public async Task<SubscriptionPlan?> CreatePlanAsync(CreateSubscriptionPlanRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.PlanCode) || string.IsNullOrWhiteSpace(req.Name))
                throw new Exception("PlanCode and Name are required.");

            if (await _subscriptionRepository.PlanCodeExistsAsync(req.PlanCode))
                throw new Exception("PlanCode already exists.");

            var plan = new SubscriptionPlan
            {
                PlanCode = req.PlanCode,
                Name = req.Name,
                Price = req.Price,
                DurationDays = req.DurationDays,
                IsActive = req.IsActive ?? true
            };

            var created = await _subscriptionRepository.CreatePlanAsync(plan);

            return created;
        }

        public async Task<List<SubscriptionPlan>> GetAllPlansAsync()
        {
            var plans = await _subscriptionRepository.GetAllPlansAsync();
            return plans;
        }

        public async Task<SubscriptionPlan?> GetPlanByIdAsync(int id)
        {
            return await _subscriptionRepository.GetPlanByIdAsync(id);
        }

        public async Task<bool> HardDeletePlanAsync(int id)
        {
            return await _subscriptionRepository.HardDeletePlanAsync(id);
        }

        public async Task<bool> SoftDeletePlanAsync(int id)
        {
            return await _subscriptionRepository.SoftDeletePlanAsync(id);
        }

        public async Task<bool> DeletePlanAsync(int id, bool force = false)
        {
            bool success;

            if (force)
                success = await _subscriptionRepository.HardDeletePlanAsync(id);
            else
                success = await _subscriptionRepository.SoftDeletePlanAsync(id);

            if (!success)
                throw new Exception(
                    force
                    ? "Cannot hard-delete plan (has dependencies or not found)."
                    : "Cannot soft-delete plan (already inactive or not found).");
            return success;
        }

        public async Task<bool> PlanCodeExistsAsync(string planCode, int? excludeId = null)
        {
            return await _subscriptionRepository.PlanCodeExistsAsync(planCode, excludeId);
        }

        public async Task<bool> UpdatePlanAsync(int id, UpdateSubscriptionPlanRequest req)
        {
            var existing = await _subscriptionRepository.GetPlanByIdAsync(id);
            if (existing == null)
                throw new Exception("Subscription plan not found.");

            if (!string.IsNullOrWhiteSpace(req.PlanCode) && req.PlanCode != existing.PlanCode)
            {
                if (await _subscriptionRepository.PlanCodeExistsAsync(req.PlanCode, id))
                    throw new Exception("PlanCode already used by another plan.");
                existing.PlanCode = req.PlanCode;
            }

            if (!string.IsNullOrWhiteSpace(req.Name)) existing.Name = req.Name;
            if (req.Price.HasValue) existing.Price = req.Price.Value;
            if (req.DurationDays.HasValue) existing.DurationDays = req.DurationDays.Value;
            if (req.IsActive.HasValue) existing.IsActive = req.IsActive.Value;

            var updated = await _subscriptionRepository.UpdatePlanAsync(existing);
            return true;
        }
    }
}
