// =============================================================================
// recipe-photo-import — snap a photo of a recipe, OCR it ON-DEVICE, structure it
// =============================================================================
// "Snap it and it's in." The user takes/picks a picture of a recipe; we read the
// text out of the image and run it through the SAME parseRecipeText that the paste
// path uses, so the photo lands in the structured fields (title, servings,
// sectioned ingredients, steps) — no manual typing, no JSON.
//
// SOVEREIGN BY DESIGN: OCR runs IN THE BROWSER via Tesseract.js (WebAssembly).
// The recipe IMAGE never leaves the device — only the open-source OCR engine +
// English model are downloaded, the exact same on-demand-from-unpkg pattern the
// app already uses for Leaflet (lib/leaflet-loader.js). No content, no family
// data, no recipe goes to any server. Lazy-loaded so it costs nothing until used.
//
// CSP: tesseract.min.js + worker + core load from unpkg.com (allowed by
// script-src); the model + wasm are fetched over https (connect-src https:);
// WASM compilation needs 'wasm-unsafe-eval' in script-src (added in vercel.json +
// public/_headers — that token is NOT 'unsafe-eval' and does not re-open JS eval).
// =============================================================================
import { parseRecipeText } from './chefs-corner.js';

// Pinned to the 5.x line; `@5` lets unpkg resolve the latest compatible patch for
// BOTH the lib and the core (released together within the major).
const TESS_VERSION = '5';
const SCRIPT_URL = `https://unpkg.com/tesseract.js@${TESS_VERSION}/dist/tesseract.min.js`;
const WORKER_URL = `https://unpkg.com/tesseract.js@${TESS_VERSION}/dist/worker.min.js`;
const CORE_URL = `https://unpkg.com/tesseract.js-core@${TESS_VERSION}`;
const LANG_URL = 'https://tessdata.projectnaptha.com/4.0.0';

let scriptPromise = null;

// Inject the Tesseract UMD script once; resolve to window.Tesseract. Mirrors
// leaflet-loader: reuse an in-flight tag, fail soft.
export function loadTesseract() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tesseract]');
    if (existing) {
      if (window.Tesseract) { resolve(window.Tesseract); return; }
      existing.addEventListener('load', () => resolve(window.Tesseract || null));
      existing.addEventListener('error', () => { scriptPromise = null; reject(new Error('OCR engine failed to load')); });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.setAttribute('data-tesseract', '');
    script.onload = () => resolve(window.Tesseract || null);
    script.onerror = () => { scriptPromise = null; reject(new Error('OCR engine failed to load')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// OCR an image (File | Blob | data URL | <img> | canvas) to raw text. onProgress
// gets a 0..1 number during recognition (for a progress bar). Throws a friendly
// Error if the engine can't load or recognition fails — the caller falls back to
// the paste path.
export async function ocrImage(image, onProgress) {
  const Tesseract = await loadTesseract();
  if (!Tesseract) throw new Error('OCR is not available in this environment.');
  const { data } = await Tesseract.recognize(image, 'eng', {
    workerPath: WORKER_URL,
    corePath: CORE_URL,
    langPath: LANG_URL,
    logger: (m) => {
      if (m && m.status === 'recognizing text' && typeof m.progress === 'number' && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  return (data && data.text) || '';
}

// The whole "snap -> structured" flow: OCR the image, then parse the recognized
// text into the structured recipe shape. Returns { recipe, rawText }. The recipe
// is always editable in the form before saving (OCR is a first pass, not gospel).
export async function importRecipeFromImage(image, onProgress) {
  const rawText = await ocrImage(image, onProgress);
  const recipe = parseRecipeText(rawText || '');
  return { recipe, rawText };
}
