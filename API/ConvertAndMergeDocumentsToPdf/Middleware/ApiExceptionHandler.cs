using Microsoft.AspNetCore.Diagnostics;

namespace ConvertAndMergeDocumentsToPdf.Middleware;

/// <summary>Logs unhandled exceptions and returns a short plain-text body.</summary>
internal sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is OperationCanceledException)
        {
            return false;
        }

        logger.LogError(
            exception,
            "Unhandled exception for {Method} {Path}",
            httpContext.Request.Method,
            httpContext.Request.Path);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "text/plain";
        await httpContext.Response.WriteAsync(ApiMessages.MergeFailed, cancellationToken);
        return true;
    }
}
