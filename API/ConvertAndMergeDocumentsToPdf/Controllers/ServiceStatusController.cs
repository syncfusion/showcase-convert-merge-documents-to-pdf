using System.Reflection;
using ConvertAndMergeDocumentsToPdf.Models;
using Microsoft.AspNetCore.Mvc;

namespace ConvertAndMergeDocumentsToPdf.Controllers;

/// <summary>Confirms that the API process is running.</summary>
[ApiController]
public sealed class ServiceStatusController(IWebHostEnvironment environment) : ControllerBase
{
    /// <summary>Returns the shared running message.</summary>
    [HttpGet("/")]
    public ContentResult GetRoot() => Content(ApiMessages.ServiceRunning, "text/plain");

    /// <summary>Returns process health, environment, version, and the current UTC time.</summary>
    [HttpGet("/health")]
    public HealthResponse GetHealth()
    {
        var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0";
        return new HealthResponse("Healthy", environment.EnvironmentName, version, DateTimeOffset.UtcNow);
    }
}
