import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerLicense } from '@syncfusion/ej2-base';
// Per-component Material 3 themes from the already-installed EJ2 packages.
// Base first, then each component's own stylesheet — keeps the bundle small.
import '@syncfusion/ej2-base/styles/material3.css';
import '@syncfusion/ej2-buttons/styles/button/material3.css';
import '@syncfusion/ej2-inputs/styles/uploader/material3.css';
import '@syncfusion/ej2-navigations/styles/appbar/material3.css';
import '@syncfusion/ej2-popups/styles/spinner/material3.css';
import App from './App';
import './styles.css';

// Syncfusion license registration — no watermark.
registerLicense(import.meta.env.VITE_SYNCFUSION_LICENSE_KEY);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
