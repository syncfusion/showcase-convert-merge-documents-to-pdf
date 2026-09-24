namespace ConvertAndMergeDocumentsToPdf.Services;

/// <summary>Converts uploaded documents to PDF and merges them into one file.</summary>
public interface IDocumentMergeService
{
    /// <summary>Converts each file to PDF and returns the merged PDF bytes.</summary>
    Task<byte[]> MergeAsync(IReadOnlyList<IFormFile> files, CancellationToken cancellationToken);
}
