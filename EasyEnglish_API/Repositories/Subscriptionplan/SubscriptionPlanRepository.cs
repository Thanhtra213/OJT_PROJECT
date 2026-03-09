using EasyEnglish_API.Data;
using EasyEnglish_API.Interfaces.Subscriptionplan;
using EasyEnglish_API.Models;
using Microsoft.EntityFrameworkCore;

namespace EasyEnglish_API.Repositories.Subscriptionplan
{
    public class SubscriptionPlanRepository : ISubscriptionPlanRepository
    {
        private readonly EasyEnglishDbContext _db;

        public SubscriptionPlanRepository(EasyEnglishDbContext db)
        {
            _db = db;
        }

        public async Task<List<SubscriptionPlan>> GetAllPlansAsync()
        {
            return await _db.SubscriptionPlans
                .OrderBy(p => p.PlanId)
                .ToListAsync();
        }

        public async Task<SubscriptionPlan?> GetPlanByIdAsync(int id)
        {
            return await _db.SubscriptionPlans.FindAsync(id);
        }

        public async Task<SubscriptionPlan?> CreatePlanAsync(SubscriptionPlan plan)
        {
            plan.CreatedAt = DateTime.UtcNow;
            _db.SubscriptionPlans.Add(plan);
            await _db.SaveChangesAsync();
            return plan;
        }

        public async Task<bool> UpdatePlanAsync(SubscriptionPlan plan)
        {
            if (!await _db.SubscriptionPlans.AnyAsync(p => p.PlanId == plan.PlanId))
                return false;

            _db.SubscriptionPlans.Update(plan);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeletePlanAsync(int id)
        {
            var plan = await _db.SubscriptionPlans.FindAsync(id);
            if (plan == null) return false;

            if (!plan.IsActive) return false; // already inactive
            plan.IsActive = false;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HardDeletePlanAsync(int id)
        {
            var plan = await _db.SubscriptionPlans
                .Include(p => p.PaymentOrders)
                .FirstOrDefaultAsync(p => p.PlanId == id);

            if (plan == null) return false;

            bool hasRelations = plan.PaymentOrders.Any();
            if (hasRelations) return false;

            _db.SubscriptionPlans.Remove(plan);
            await _db.SaveChangesAsync();
            return true;
        }

        // ========== Validation ==========
        public async Task<bool> PlanCodeExistsAsync(string planCode, int? excludeId = null)
        {
            return await _db.SubscriptionPlans.AnyAsync(p =>
                p.PlanCode == planCode && (!excludeId.HasValue || p.PlanId != excludeId.Value));
        }
    }
}
