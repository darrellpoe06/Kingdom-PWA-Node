import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './shims/storage.js';
import './index.css';
import PoeFinancialSystem from './poe-financial-mvp-v28.jsx';

window.storage = storage;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PoeFinancialSystem />
  </React.StrictMode>
);

// PWA service worker — registration + update detection.
// - Registers /sw.js on window load so first paint isn't delayed.
// - Watches for a waiting SW (new version downloaded). When one appears,
//   dispatches a 'poetech:update-available' custom event with the registration
//   attached. The UpdatePrompt component listens for this and shows a polite
//   "New version available — Reload to update" banner.
// - Stores the registration on window.__pwaReg so the UI can post SKIP_WAITING
//   directly without re-fetching.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      window.__pwaReg = reg;
      const fireIfWaiting = () => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent('poetech:update-available', { detail: { reg } }));
        }
      };
      fireIfWaiting();
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('poetech:update-available', { detail: { reg } }));
          }
        });
      });
      // When a new SW takes control, reload exactly once to load fresh assets.
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}
