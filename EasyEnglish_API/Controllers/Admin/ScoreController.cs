using Microsoft.AspNetCore.Mvc;

namespace EasyEnglish_API.Controllers.Admin
{
    public class ScoreController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
