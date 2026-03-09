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

        public async Task<SubscriptionPlan?> CreatePlanAsync(SubscriptionPlan plan)
        {
            return await _subscriptionRepository.CreatePlanAsync(plan);   
        }

        public async Task<List<SubscriptionPlan>> GetAllPlansAsync()
        {
            return await _subscriptionRepository.GetAllPlansAsync();
        }

        public async Task<SubscriptionPlan?> GetPlanByIdAsync(int id)
        {
            return await _subscriptionRepository.GetPlanByIdAsync(id);
        }

        public async Task<bool> HardDeletePlanAsync(int id)
        {
            return await _subscriptionRepository.HardDeletePlanAsync(id);
        }

        public async Task<bool> PlanCodeExistsAsync(string planCode, int? excludeId = null)
        {
            return await _subscriptionRepository.PlanCodeExistsAsync(planCode, excludeId);
        }

        public async Task<bool> SoftDeletePlanAsync(int id)
        {
            return await _subscriptionRepository.SoftDeletePlanAsync(id);
        }

        public async Task<bool> UpdatePlanAsync(SubscriptionPlan plan)
        {
            return await _subscriptionRepository.UpdatePlanAsync(plan);
        }
    }
}
