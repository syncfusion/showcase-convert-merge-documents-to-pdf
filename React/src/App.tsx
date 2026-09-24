import { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { UploaderComponent } from '@syncfusion/ej2-react-inputs';
import { AppBarComponent } from '@syncfusion/ej2-react-navigations';
import { createSpinner, hideSpinner, showSpinner } from '@syncfusion/ej2-popups';
import {
  ACCEPTED_EXTENSIONS,
  downloadBlob,
  mergeFiles,
  MergeError,
} from './services/apiClient';

interface SelectedFile {
  id: string;
  file: File;
}

/** Uploader file-info subset (mirrors EJ2 `FileInfo`). */
interface UploaderFileInfo {
  id?: string;
  name: string;
  size: number;
  rawFile?: unknown;
}

/** Selected event arguments (mirrors EJ2 `SelectedEventArgs`). */
interface UploaderSelectedArgs {
  filesData: UploaderFileInfo[];
  preventDefault(): void;
}

/** Removing event arguments (mirrors EJ2 `RemovingEventArgs`). */
interface UploaderRemovingArgs {
  filesData: UploaderFileInfo[];
}

const DOWNLOAD_FILENAME = 'MergedDocument.pdf';
const ACCEPTED_SET = new Set(ACCEPTED_EXTENSIONS.map((e) => e.toLowerCase()));
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',');

function App() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploaderRef = useRef<UploaderComponent | null>(null);
  const spinnerHostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = spinnerHostRef.current;
    if (!loading || !host) {
      return;
    }
    createSpinner({ target: host, type: 'Material3' });
    showSpinner(host);
    return () => hideSpinner(host);
  }, [loading]);

  const onSelected = useCallback((e: UploaderSelectedArgs) => {
    const incoming = e.filesData || [];
    const valid: SelectedFile[] = [];
    const rejected: string[] = [];

    // `selected` fires before EJ2 base64-encodes the file, so `rawFile` is the
    // actual `File` and we can validate the extension synchronously for both
    // browse and drag-and-drop.
    for (const info of incoming) {
      const raw = info.rawFile as File | undefined;
      const ext = info.name.slice(info.name.lastIndexOf('.')).toLowerCase();
      if (raw instanceof File && ACCEPTED_SET.has(ext)) {
        valid.push({
          id: `${info.id ?? info.name}-${info.size}`,
          file: raw,
        });
      } else if (raw instanceof File) {
        rejected.push(info.name);
      }
    }

    if (rejected.length > 0) {
      // Reject the incoming file(s) so they don't stick in the uploader list.
      e.preventDefault();
      setError(`Unsupported file type(s): ${rejected.join(', ')}`);
      return;
    }

    if (valid.length > 0) {
      setError(null);
      setFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.file.name}-${f.file.size}`));
        const additions = valid.filter(
          (f) => !seen.has(`${f.file.name}-${f.file.size}`),
        );
        return [...prev, ...additions];
      });
    }
  }, []);

  const onRemoving = useCallback((e: UploaderRemovingArgs) => {
    const removedNames = new Set((e.filesData || []).map((f) => f.name));
    setError(null);
    setFiles((prev) => prev.filter((f) => !removedNames.has(f.file.name)));
  }, []);

  const onGenerate = useCallback(async () => {
    if (files.length === 0) {
      setError('Please add at least one file before generating a PDF.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = await mergeFiles(files.map((f) => f.file));
      downloadBlob(blob, DOWNLOAD_FILENAME);
    } catch (err) {
      if (err instanceof MergeError) {
        setError(err.message);
      } else {
        setError(`Unexpected error: ${(err as Error).message}`);
      }
    } finally {
      setLoading(false);
      // Reset the uploader's internal file list + local state after completion.
      setFiles([]);
      uploaderRef.current?.clearAll();
    }
  }, [files]);

  return (
    <>
    <AppBarComponent colorMode="Light" isSticky={true}>
      <a href="/" aria-label="Syncfusion">
        <div className="syncfusion-logo" />
      </a>
      <span className="appbar-title">Convert & Merge Documents to PDF</span>
    </AppBarComponent>
    <div className="app-root">
      <header className="hero">
        <h1 className="hero__title">Convert & Merge Documents to PDF</h1>
        <p className="hero__tagline">
          Upload Word, Excel, PowerPoint, HTML, Markdown, XPS, images, or PDF — merge them all
          into one PDF.
        </p>
      </header>

      <main className="panel">
        {loading ? (
          <div className="loading" aria-live="polite" aria-busy="true">
            <div className="spinner-host" ref={spinnerHostRef} />
            <p className="loading__text">Generating merged PDF…</p>
          </div>
        ) : (
          <>
            <p className="hint">
              Drag &amp; drop files here or browse. Allowed: {ACCEPTED_EXTENSIONS.join(', ')}
            </p>

            <div className="dropzone">
              <UploaderComponent
                ref={uploaderRef}
                autoUpload={false}
                multiple
                allowedExtensions={ACCEPT_ATTR}
                selected={onSelected}
                removing={onRemoving}
              />
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <ButtonComponent
              cssClass="e-success"
              className="generate-btn"
              disabled={files.length === 0}
              onClick={onGenerate}
              aria-label="Generate PDF"
            >
              Generate PDF
            </ButtonComponent>
          </>
        )}
      </main>
    </div>
    </>
  );
}

export default App;
