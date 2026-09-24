import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { environment } from './environments/environment';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Syncfusion license registration — no watermark.
registerLicense(environment.syncfusionLicenseKey);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
