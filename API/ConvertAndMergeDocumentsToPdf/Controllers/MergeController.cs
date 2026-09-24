using ConvertAndMergeDocumentsToPdf.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConvertAndMergeDocumentsToPdf.Controllers;

/// <summary>
/// Converts uploaded documents (PDF, Word, Excel, PowerPoint, images, HTML,
/// XPS, Markdown) to PDF and merges them into a single PDF download.
/// </summary>
public sealed class MergeController(
    IDocumentMergeService mergeService,
    ILogger<MergeController> logger) : ControllerBase
{
    /// <summary>Merges the posted files into one PDF.</summary>
    [HttpPost("/Merge/MergeDocuments")]
    public async Task<IActionResult> MergeDocuments(
        List<IFormFile> files,
        CancellationToken cancellationToken)
    {
        if (files is not { Count: > 0 })
        {
            logger.LogWarning("Merge rejected: no files were uploaded.");
            return BadRequest(ApiMessages.NoFiles);
        }

        try
        {
            byte[] pdf = await mergeService.MergeAsync(files, cancellationToken);
            logger.LogInformation("Merged {FileCount} file(s) into a PDF.", files.Count);
            return File(pdf, "application/pdf", "MergedDocument.pdf");
        }
        catch (NotSupportedException ex)
        {
            logger.LogWarning(ex, "Merge rejected an unsupported file.");
            return BadRequest(ex.Message);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Merge failed for {FileCount} file(s).", files.Count);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiMessages.MergeFailed);
        }
    }
}
