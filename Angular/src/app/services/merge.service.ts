// Angular client for the Convert & Merge Documents to PDF backend.
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

export const DOWNLOAD_FILENAME = 'MergedDocument.pdf';

export class MergeError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MergeError';
    this.status = status;
  }
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

@Injectable({ providedIn: 'root' })
export class MergeService {
  private readonly http = inject(HttpClient);

  private readonly endpoint = `${environment.apiBaseUrl}/Merge/MergeDocuments`;

  /**
   * POST the provided files to /Merge/MergeDocuments as multipart/form-data
   * under the field name `files`. Returns the merged PDF as a Blob.
   */
  merge(files: File[]): Observable<Blob> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    return this.http.post(this.endpoint, formData, {
      observe: 'response',
      responseType: 'blob',
      reportProgress: false,
    }).pipe(
      map((res: HttpResponse<Blob>) => {
        if (!res.ok || !res.body) {
          throw new MergeError(res.status, 'Empty response from server.');
        }
        return res.body;
      }),
      catchError((err) => {
        // Network-level / Angular error.
        if (err instanceof MergeError) {
          return throwError(() => err);
        }
        if (err?.status != null && err.status >= 400) {
          const body = err.error;
          if (body instanceof Blob) {
            // Google Chrome caps Blob.text() at 64KB; slice to stay within quota.
            return new Observable<Blob>((subscriber) => {
              body
                .text()
                .then((text) => {
                  subscriber.error(new MergeError(err.status, text || `Request failed with status ${err.status}`));
                })
                .catch(() => {
                  subscriber.error(new MergeError(err.status, `Request failed with status ${err.status}`));
                });
            });
          }
          return throwError(
            () => new MergeError(err.status, (typeof body === 'string' && body) || `Request failed with status ${err.status}`),
          );
        }
        return throwError(() => new MergeError(0, `Network error calling ${this.endpoint}: ${err?.message ?? err}`));
      }),
    );
  }
}
