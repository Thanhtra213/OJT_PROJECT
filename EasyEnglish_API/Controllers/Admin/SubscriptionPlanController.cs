using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    public class SubscriptionPlanController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
