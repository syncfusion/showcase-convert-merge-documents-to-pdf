using System.Diagnostics;

namespace ConvertAndMergeDocumentsToPdf.Services;

/// <summary>Installs the Linux system libraries Chromium needs for HTML to PDF.</summary>
public static class BlinkDependencyInstaller
{
    /// <summary>
    /// Runs dependenciesInstall.sh on Linux. A failed install is logged and does not stop the API.
    /// </summary>
    public static void Install(ILogger logger, string contentRoot)
    {
        if (!OperatingSystem.IsLinux())
        {
            return;
        }

        string scriptPath = Path.Combine(contentRoot, "dependenciesInstall.sh");
        if (!File.Exists(scriptPath))
        {
            logger.LogWarning(
                "Blink dependency script was not found at {ScriptPath}. HTML to PDF conversion needs the Chromium system libraries.",
                scriptPath);
            return;
        }

        logger.LogInformation("Installing Blink system libraries required for HTML to PDF.");

        using Process process = new()
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "/bin/bash",
                ArgumentList = { scriptPath },
                WorkingDirectory = contentRoot,
                CreateNoWindow = true,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            }
        };

        process.Start();
        Task<string> outputTask = process.StandardOutput.ReadToEndAsync();
        Task<string> errorTask = process.StandardError.ReadToEndAsync();
        process.WaitForExit();
        string output = outputTask.GetAwaiter().GetResult();
        string error = errorTask.GetAwaiter().GetResult();

        if (process.ExitCode == 0)
        {
            logger.LogInformation("Blink system libraries are installed.");
            return;
        }

        logger.LogError(
            "Blink dependency install exited {ExitCode}. HTML to PDF will fail until the packages are present. {Error} {Output}",
            process.ExitCode,
            error.Trim(),
            output.Trim());
    }
}
