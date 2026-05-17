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
