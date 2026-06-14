import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './shims/storage.js';
import './index.css';
import PoeFinancialSystem from './poe-financial-mvp-v28.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { wireUpdates, startUpdateChecks } from './lib/sw-update.js';

window.storage = storage;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PoeFinancialSystem />
    </ErrorBoundary>
  </React.StrictMode>
);

// PWA service worker — registration + zero-click auto-update. The lifecycle
// wiring (skip-waiting the new worker, reload exactly once on a real controller
// swap, never on first-install claim, surface the UpdatePrompt banner) lives in
// lib/sw-update.js so it can be locked by an exhaustive node-env test. See that
// file's header for the root-cause writeup of the "Reload to update did nothing"
// bug. window.__pwaReg keeps the registration handle for the banner's late mount.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      window.__pwaReg = reg;
      wireUpdates(reg, navigator, window);
      startUpdateChecks(reg, window, navigator);
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}
