using System.Text.Json;

namespace EasyEnglish_API.Exceptions;

    public class ApiException : Exception
    {
        public int StatusCode { get; }

        public ApiException(string message, int statusCode)
            : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class BadRequestException : ApiException
    {
        public BadRequestException(string message)
            : base(message, StatusCodes.Status400BadRequest) { }
    }

    public class UnauthorizedException : ApiException
    {
        public UnauthorizedException(string message)
            : base(message, StatusCodes.Status401Unauthorized) { }
    }

    public class NotFoundException : ApiException
    {
        public NotFoundException(string message)
            : base(message, StatusCodes.Status404NotFound) { }
    }

    public class ConflictException : ApiException
    {
        public ConflictException(string message)
            : base(message, StatusCodes.Status409Conflict) { }
}