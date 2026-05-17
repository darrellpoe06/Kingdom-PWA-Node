import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './shims/storage.js';
import './index.css';
import PoeFinancialSystem from './poe-financial-mvp-v28.jsx';
import MirrorPreview from './dev/MirrorPreview.jsx';

window.storage = storage;

// Dev preview routes - opt-in via query string. Production behavior
// (the full Financial OS) is unchanged when no ?dev= param is present.
const params = new URLSearchParams(window.location.search);
const devRoute = params.get('dev');

const Root =
  devRoute === 'mirror-preview' ? MirrorPreview : PoeFinancialSystem;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
