using EasyEnglish_API.DTOs.SubScriptionplan;
using EasyEnglish_API.Services.Subscriptionplan;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Public
{
    [ApiController]
    [Route("api/public/plan")]
    public class PlanController : ControllerBase
    {
        private readonly ISubscriptionPlanService _subscriptionPlanService;

        public PlanController(ISubscriptionPlanService subscriptionPlanService)
        {
            _subscriptionPlanService = subscriptionPlanService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPlans()
        { 
            var plans = await _subscriptionPlanService.ViewAllPlansAsync();

            if (plans == null) 
                return NoContent();

            return Ok(plans);
        }
    }
}
