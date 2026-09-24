// convertAndMerge.downloadBlob(base64, mime, filename)
// Used by Home.razor to trigger a browser download of the merged PDF.
window.convertAndMerge = window.convertAndMerge || {};
window.convertAndMerge.downloadBlob = function (base64, mime, filename) {
    try {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    } catch (err) {
        console.error('convertAndMerge.downloadBlob failed:', err);
    }
};
