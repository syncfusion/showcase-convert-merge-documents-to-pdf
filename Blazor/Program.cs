using ConvertAndMergeDocumentsToPdf.Components;
using Syncfusion.Blazor;
using Syncfusion.Licensing;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Syncfusion Blazor (Material 3 theme via static assets in App.razor).
builder.Services.AddSyncfusionBlazor();

// HttpClient for server-side calls to the convert/merge API.
// Base address from configuration; defaults to the API dev port (http://localhost:5183).
var apiBaseUrl = builder.Configuration["ApiBaseUrl"]
    ?? "http://localhost:5183";
builder.Services.AddHttpClient("MergeApi", client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
});

// Syncfusion license — env var first, then config.
var licenseKey =
    Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY")
    ?? builder.Configuration["Syncfusion:LicenseKey"];
if (!string.IsNullOrWhiteSpace(licenseKey))
{
    SyncfusionLicenseProvider.RegisterLicense(licenseKey);
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
