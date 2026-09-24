using Syncfusion.Licensing;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

var licenseKey =
    Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY")
    ?? builder.Configuration["Syncfusion:LicenseKey"];
if (!string.IsNullOrWhiteSpace(licenseKey))
{
    SyncfusionLicenseProvider.RegisterLicense(licenseKey);
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseRouting();
app.UseAuthorization();
app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();

app.Run();
