using EasyEnglish_API.Exceptions;
using System.Text.Json;

namespace EasyEnglish_API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ApiException ex)
        {
            await HandleException(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            await HandleException(context, 500, ex.Message);
        }
    }

    private static async Task HandleException(HttpContext context, int statusCode, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new
        {
            success = false,
            statusCode = statusCode,
            message = message
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}