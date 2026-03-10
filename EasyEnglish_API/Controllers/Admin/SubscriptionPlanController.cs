using EasyEnglish_API.DTOs.SubScriptionplan;
using EasyEnglish_API.DTOs.User;
using EasyEnglish_API.Models;
using EasyEnglish_API.Services.Subscriptionplan;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/plans")]
    [Authorize(Roles = "ADMIN")]
    public class SubscriptionPlanController : ControllerBase
    {
        private readonly ISubscriptionPlanService _subscriptionPlanService;

        public SubscriptionPlanController(ISubscriptionPlanService subscriptionPlanService)
        {
            _subscriptionPlanService = subscriptionPlanService;
        }

        [HttpGet("view")]
        public async Task<IActionResult> GetAllPlans()
        {
            var result = await _subscriptionPlanService.GetAllPlansAsync();
            return Ok(result);
        }

        // GET: api/admin/plans/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPlan(int id)
        {
            var plan = await _subscriptionPlanService.GetPlanByIdAsync(id);
            if (plan == null)
                return NotFound();

            return Ok(plan);
        }

        // POST: api/admin/plans/create
        [HttpPost("create")]
        public async Task<IActionResult> CreatePlan([FromBody] CreateSubscriptionPlanRequest req)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var created = await _subscriptionPlanService.CreatePlanAsync(req);
                return CreatedAtAction(nameof(GetPlan), new { id = created.PlanId }, new
                {
                    message = "Subscription plan created successfully.",
                    created.PlanId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }
        }

        // PUT: api/admin/plans/update/{id}
        [HttpPut("update/{id:int}")]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] UpdateSubscriptionPlanRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            try
            {
                var updated = await _subscriptionPlanService.UpdatePlanAsync(id, req);
                if (!updated)
                    return NotFound();

                return Ok(new { message = "Subscription plan updated successfully." });
            } catch (Exception ex)
            {
                return BadRequest(ex);
            }
        }

        // DELETE: api/admin/plans/delete/{id}?force=true
        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> DeletePlan(int id, [FromQuery] bool force = false)
        {
            try
            {
                var result = await _subscriptionPlanService.DeletePlanAsync(id, force);
                if (!result)
                    return NotFound();
                return Ok(new
                {
                    message = force
                    ? "Subscription plan permanently deleted."
                    : "Subscription plan deactivated (soft-delete)."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}
