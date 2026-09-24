using Syncfusion.DocIO.DLS;
using Syncfusion.DocIORenderer;
using Syncfusion.Drawing;
using Syncfusion.HtmlConverter;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Graphics;
using Syncfusion.Pdf.Parsing;
using Syncfusion.Presentation;
using Syncfusion.PresentationRenderer;
using Syncfusion.XlsIO;
using Syncfusion.XlsIORenderer;
using Syncfusion.XPS;

namespace ConvertAndMergeDocumentsToPdf.Services;

/// <summary>Syncfusion conversion and merge implementation.</summary>
public sealed class DocumentMergeService : IDocumentMergeService
{
    /// <inheritdoc />
    public async Task<byte[]> MergeAsync(IReadOnlyList<IFormFile> files, CancellationToken cancellationToken)
    {
        using PdfDocument mergedDocument = new();

        foreach (IFormFile file in files)
        {
            cancellationToken.ThrowIfCancellationRequested();
            MemoryStream pdfStream = await ConvertToPdfAsync(file, cancellationToken);

            using PdfLoadedDocument loadedDocument = new(pdfStream);
            PdfDocumentBase.Merge(mergedDocument, loadedDocument);
        }

        using MemoryStream outputStream = new();
        mergedDocument.Save(outputStream);
        return outputStream.ToArray();
    }

    private async Task<MemoryStream> ConvertToPdfAsync(IFormFile file, CancellationToken cancellationToken)
    {
        string extension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();

        return extension switch
        {
            ".pdf" => await GetPdfStream(file, cancellationToken),
            ".doc" or ".docx" or ".dot" or ".dotx" or ".rtf" => ConvertWordToPdf(file),
            ".xlsx" or ".xls" => ConvertExcelToPdf(file),
            ".pptx" or ".ppt" => ConvertPowerPointToPdf(file),
            ".jpg" or ".jpeg" or ".png" => ConvertImageToPdf(file),
            ".html" or ".htm" => await ConvertHtmlToPdf(file, cancellationToken),
            ".xps" => ConvertXpsToPdf(file),
            ".md" => ConvertMarkdownToPdf(file),
            _ => throw new NotSupportedException($"Unsupported file type: {extension}")
        };
    }

    private static async Task<MemoryStream> GetPdfStream(IFormFile file, CancellationToken cancellationToken)
    {
        MemoryStream stream = new();
        await file.CopyToAsync(stream, cancellationToken);
        stream.Position = 0;
        return stream;
    }

    private static MemoryStream ConvertWordToPdf(IFormFile file)
    {
        using Stream stream = file.OpenReadStream();

        WordDocument wordDocument = new(stream, Syncfusion.DocIO.FormatType.Automatic);
        DocIORenderer renderer = new();
        PdfDocument pdfDocument = renderer.ConvertToPDF(wordDocument);

        MemoryStream pdfStream = new();
        pdfDocument.Save(pdfStream);

        pdfDocument.Close(true);
        renderer.Dispose();
        wordDocument.Close();

        pdfStream.Position = 0;
        return pdfStream;
    }

    private static MemoryStream ConvertExcelToPdf(IFormFile file)
    {
        MemoryStream pdfStream = new();

        using ExcelEngine excelEngine = new();
        IApplication application = excelEngine.Excel;
        application.DefaultVersion = ExcelVersion.Xlsx;

        using Stream excelStream = file.OpenReadStream();
        IWorkbook workbook = application.Workbooks.Open(excelStream);

        XlsIORenderer renderer = new();
        PdfDocument pdfDocument = renderer.ConvertToPDF(workbook);
        pdfDocument.Save(pdfStream);

        workbook.Close();
        pdfDocument.Close(true);

        pdfStream.Position = 0;
        return pdfStream;
    }

    private static MemoryStream ConvertPowerPointToPdf(IFormFile file)
    {
        using Stream pptStream = file.OpenReadStream();

        IPresentation presentation = Presentation.Open(pptStream);
        PdfDocument pdfDocument = PresentationToPdfConverter.Convert(presentation);

        MemoryStream pdfStream = new();
        pdfDocument.Save(pdfStream);

        presentation.Close();
        pdfDocument.Close(true);

        pdfStream.Position = 0;
        return pdfStream;
    }

    private static MemoryStream ConvertImageToPdf(IFormFile file)
    {
        ImageToPdfConverter imageToPdfConverter = new();
        imageToPdfConverter.PageSize = PdfPageSize.A4;
        imageToPdfConverter.ImagePosition = PdfImagePosition.TopLeftCornerOfPage;

        using Stream imageStream = file.OpenReadStream();
        using PdfDocument pdfDocument = imageToPdfConverter.Convert(imageStream);

        MemoryStream pdfStream = new();
        pdfDocument.Save(pdfStream);
        pdfStream.Position = 0;
        return pdfStream;
    }

    private static async Task<MemoryStream> ConvertHtmlToPdf(IFormFile file, CancellationToken cancellationToken)
    {
        using StreamReader reader = new(file.OpenReadStream());
        string htmlContent = await reader.ReadToEndAsync(cancellationToken);

        HtmlToPdfConverter htmlConverter = new();
        BlinkConverterSettings settings = new();
        settings.ViewPortSize = new Size(1280, 0);
        htmlConverter.ConverterSettings = settings;

        PdfDocument document = htmlConverter.Convert(htmlContent, string.Empty);

        using MemoryStream tempStream = new();
        document.Save(tempStream);
        byte[] pdfBytes = tempStream.ToArray();
        document.Close();

        return new MemoryStream(pdfBytes);
    }

    private static MemoryStream ConvertXpsToPdf(IFormFile file)
    {
        using Stream xpsStream = file.OpenReadStream();

        XPSToPdfConverter converter = new();
        PdfDocument document = converter.Convert(xpsStream);

        using MemoryStream tempStream = new();
        document.Save(tempStream);
        byte[] pdfBytes = tempStream.ToArray();
        document.Close(true);

        return new MemoryStream(pdfBytes);
    }

    private static MemoryStream ConvertMarkdownToPdf(IFormFile file)
    {
        using Stream markdownStream = file.OpenReadStream();

        using WordDocument wordDocument = new(markdownStream, Syncfusion.DocIO.FormatType.Markdown);
        using DocIORenderer renderer = new();
        using PdfDocument pdfDocument = renderer.ConvertToPDF(wordDocument);

        using MemoryStream tempStream = new();
        pdfDocument.Save(tempStream);
        byte[] pdfBytes = tempStream.ToArray();

        return new MemoryStream(pdfBytes);
    }
}
