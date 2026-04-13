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

        public async Task InvokeAsync(HttpContext context, EasyEnglishDbContext db)
        {
            var log = new RequestLog
            {
                Path = context.Request.Path.Value ?? "",
                IP = context.Connection.RemoteIpAddress?.ToString(),
                CreatedAt = DateTime.UtcNow,
            };

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var id = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (int.TryParse(id, out int userId)) log.ActorId = userId;
            }

            try
            {
                db.RequestLogs.Add(log);
                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[RequestLog] Save failed: {ex.Message}");
            }
            try
            {
                await _next(context);
            }
            catch (System.IO.IOException ex) when (ex.Message.Contains("reset"))
            {
            }
            catch (OperationCanceledException)
            {}
        }
    }
}