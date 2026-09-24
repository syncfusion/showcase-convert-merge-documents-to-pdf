// API client for the Convert & Merge Documents to PDF backend.

/**
 * API origin. Leave empty in dev so `/Merge` uses the Vite proxy (http://localhost:5183).
 * In prod, set `VITE_API_BASE_URL` at build time (e.g. https://api.example.com).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** Accepted file extensions. Matches MergeController.ConvertToPdfAsync. */
export const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.dot',
  '.dotx',
  '.rtf',
  '.xlsx',
  '.xls',
  '.pptx',
  '.ppt',
  '.jpg',
  '.jpeg',
  '.png',
  '.html',
  '.htm',
  '.xps',
  '.md',
];

export class MergeError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MergeError';
    this.status = status;
  }
}

/**
 * POST the provided files to /Merge/MergeDocuments as multipart/form-data
 * under the field name `files`. Returns the merged PDF as a Blob.
 */
export async function mergeFiles(files: File[]): Promise<Blob> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const url = `${API_BASE_URL}/Merge/MergeDocuments`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser sets multipart boundary automatically.
    });
  } catch (err) {
    throw new MergeError(0, `Network error calling ${url}: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const message = (await res.text()) || `Request failed with status ${res.status}`;
    throw new MergeError(res.status, message);
  }

  return res.blob();
}

/** Format a byte count as KB with one decimal. */
export function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Trigger a browser download of a Blob as the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke after the click is dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
