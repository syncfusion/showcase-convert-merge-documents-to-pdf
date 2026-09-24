import { ChangeDetectorRef, Component, ElementRef, NgZone, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { AppBarModule } from '@syncfusion/ej2-angular-navigations';
import {
  UploaderModule,
  UploaderComponent,
} from '@syncfusion/ej2-angular-inputs';
import { createSpinner, hideSpinner, showSpinner } from '@syncfusion/ej2-popups';
import {
  ACCEPTED_EXTENSIONS,
  DOWNLOAD_FILENAME,
  MergeService,
  MergeError,
  downloadBlob,
} from './services/merge.service';

interface SelectedFile {
  id: string;
  file: File;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ButtonModule, AppBarModule, UploaderModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly mergeService = inject(MergeService);
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);

  protected readonly acceptedExtensions = ACCEPTED_EXTENSIONS;
  protected readonly acceptAttr = ACCEPTED_EXTENSIONS.join(',');
  private readonly acceptedSet = new Set(ACCEPTED_EXTENSIONS.map((e) => e.toLowerCase()));

  protected readonly files = signal<SelectedFile[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  @ViewChild(UploaderComponent) private uploaderRef?: UploaderComponent;
  @ViewChild('spinnerHost') private spinnerHost?: ElementRef<HTMLDivElement>;
  private spinnerReady = false;

  private syncSpinner(active: boolean): void {
    const host = this.spinnerHost?.nativeElement;
    if (!host) {
      return;
    }
    if (!this.spinnerReady) {
      createSpinner({ target: host, type: 'Material3' });
      this.spinnerReady = true;
    }
    if (active) {
      showSpinner(host);
    } else {
      hideSpinner(host);
    }
  }

  /**
   * EJ2 `selected` event. `rawFile` is still a real `File` here (base64
   * encoding happens later during actual upload), and this event fires for
   * both browse and drag-and-drop — so we can validate synchronously and
   * `e.preventDefault()` to drop disallowed files.
   */
  protected onSelected(e: any): void {
    const info: any[] = e.filesData || [];
    const valid: SelectedFile[] = [];
    const rejected: string[] = [];

    for (const item of info) {
      const raw = item.rawFile as File | undefined;
      const ext = (item.name as string)
        .slice((item.name as string).lastIndexOf('.'))
        .toLowerCase();
      if (raw instanceof File && this.acceptedSet.has(ext)) {
        valid.push({
          id: `${item.id ?? item.name}-${item.size}`,
          file: raw,
        });
      } else if (raw instanceof File) {
        rejected.push(item.name as string);
      }
    }

    if (rejected.length > 0) {
      e.preventDefault();
      this.error.set(`Unsupported file type(s): ${rejected.join(', ')}`);
      return;
    }

    if (valid.length > 0) {
      this.error.set(null);
      this.files.update((prev) => {
        const seen = new Set(prev.map((f) => `${f.file.name}-${f.file.size}`));
        const additions = valid.filter(
          (f) => !seen.has(`${f.file.name}-${f.file.size}`),
        );
        return [...prev, ...additions];
      });
    }
  }

  /** EJ2 `removing` event fires locally (autoUpload off). No server call. */
  protected onRemoving(e: any): void {
    const removedNames = new Set(
      ((e?.filesData as any[]) || []).map((f) => f.name as string),
    );
    this.error.set(null);
    this.files.update((prev) =>
      prev.filter((f) => !removedNames.has(f.file.name)),
    );
  }

  protected onGenerate(): void {
    const current = this.files();
    if (current.length === 0) {
      this.error.set('Please add at least one file before generating a PDF.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.changeDetector.detectChanges();
    this.syncSpinner(true);

    this.mergeService.merge(current.map((f) => f.file)).subscribe({
      next: (blob) => {
        downloadBlob(blob, DOWNLOAD_FILENAME);
        this.afterGenerate();
      },
      error: (err: unknown) => {
        const message =
          err instanceof MergeError
            ? err.message
            : `Unexpected error: ${(err as Error)?.message ?? err}`;
        this.zone.run(() => {
          this.error.set(message);
          this.loading.set(false);
          this.syncSpinner(false);
        });
      },
    });
  }

  private afterGenerate(): void {
    this.zone.run(() => {
      this.loading.set(false);
      this.syncSpinner(false);
      this.files.set([]);
      this.uploaderRef?.clearAll();
    });
  }
}

