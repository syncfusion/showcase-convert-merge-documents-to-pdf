using ConvertAndMergeDocumentsToPdf.Middleware;
using ConvertAndMergeDocumentsToPdf.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<IDocumentMergeService, DocumentMergeService>();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();

var syncfusionLicenseKey =
    Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY")
    ?? builder.Configuration["Syncfusion:LicenseKey"];

if (!string.IsNullOrWhiteSpace(syncfusionLicenseKey))
{
    Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(syncfusionLicenseKey);
}


var corsOrigins = (builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Where(origin => origin != "*")
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

var enableAppCors = corsOrigins.Length > 0;
if (!enableAppCors && builder.Environment.IsDevelopment())
{
    corsOrigins =
    [
        "http://localhost:5173",
        "http://localhost:4200",
        "http://localhost:5200",
    ];
    enableAppCors = true;
}

if (enableAppCors)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowSpaApps", policy =>
        {
            policy
                .WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });
}

var app = builder.Build();

// Dev clients call http://localhost:5183 (Blazor HttpClient, Vite and Angular proxies).
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler();
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseRouting();
if (enableAppCors)
{
    app.UseCors("AllowSpaApps");
}
app.UseAuthorization();
app.MapControllers();

//For linux runtime environment
BlinkDependencyInstaller.Install(app.Logger, app.Environment.ContentRootPath);

app.Run();
