namespace ConvertAndMergeDocumentsToPdf.Models;

/// <summary>Reports whether the convert-and-merge API process is running.</summary>
public sealed record HealthResponse(
    string Status,
    string Environment,
    string Version,
    DateTimeOffset Timestamp);
