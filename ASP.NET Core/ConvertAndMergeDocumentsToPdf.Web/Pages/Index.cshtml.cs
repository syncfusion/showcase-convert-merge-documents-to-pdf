using Microsoft.AspNetCore.Mvc.RazorPages;

namespace ConvertAndMergeDocumentsToPdf.Web.Pages;

public class IndexModel(IConfiguration configuration) : PageModel
{
    public const string AllowedExtensions =
        ".pdf,.doc,.docx,.dot,.dotx,.rtf,.xlsx,.xls,.pptx,.ppt,.jpg,.jpeg,.png,.html,.htm,.xps,.md";

    public string ApiBaseUrl { get; private set; } = "";

    public void OnGet()
    {
        ApiBaseUrl = (configuration["ApiBaseUrl"] ?? "http://localhost:5183").TrimEnd('/');
    }
}
