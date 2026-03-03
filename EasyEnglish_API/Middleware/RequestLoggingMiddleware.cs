using EasyEnglish_API.Data;
using EasyEnglish_API.Models;
using System.Security.Claims;

namespace EasyEnglish_API.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public RequestLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        //Logger
        public async Task InvokeAsync(HttpContext context, EasyEnglishDbContext db)
        {

            var log = new RequestLog
            {
                Path = context.Request.Path.Value ?? "",
                IP = context.Connection.RemoteIpAddress?.ToString(),
                CreatedAt = DateTime.UtcNow
            };

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var id = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (int.TryParse(id, out int userId)) log.ActorId = userId;
            }

            db.RequestLogs.Add(log);
            await db.SaveChangesAsync();

            await _next(context);
        }
    }
}
