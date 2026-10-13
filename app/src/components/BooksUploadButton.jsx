// =============================================================================
// BooksUploadButton — the ONE Upload control, top right of every Books tab
// (DR-0709)
// =============================================================================
// Darrell 2026-09-30: "Where do we upload our documents into the PoeTech App
// for financial support and processing to include in our books a data?" and
// "Build the single upload button now!!!!" Then: the importer on every Books
// tab page, in the same spot, top right.
//
// Two pieces, because the Books tab row sits in the app header ABOVE the
// Financial PIN gate while the documents themselves must stay behind it:
//   <BooksUploadButton/>  in the header row (the same spot on every sub-tab)
//   <BooksUploadMount/>   inside the PIN gate, where the panel opens
// The button only asks; the mount answers. A tap before the gate is passed is
// remembered and the panel opens the moment the gate lets the person in.
//
// The panel (components/BooksUpload.jsx) and everything it pulls in (pdf.js,
// the readers) load only when it is first opened, so the Books tabs pay
// nothing for it until someone actually uploads.
// =============================================================================
import React, { Suspense, lazy, useEffect, useState } from 'react';
import UiIcon from './UiIcon.jsx';

const BooksUpload = lazy(() => import('./BooksUpload.jsx'));

export const OPEN_EVENT = 'poetech:books-upload-open';
export const COUNT_EVENT = 'poetech:books-upload-count';
let pendingOpen = false;
let lastCount = 0;

export function requestBooksUpload() {
  pendingOpen = true;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/** The panel reports its queue size here so the button can show it. */
export function reportBooksUploadCount(n) {
  lastCount = Number(n) || 0;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(COUNT_EVENT, { detail: lastCount }));
}

export function BooksUploadButton() {
  const [count, setCount] = useState(lastCount);
  useEffect(() => {
    const on = (e) => setCount(Number(e.detail) || 0);
    window.addEventListener(COUNT_EVENT, on);
    return () => window.removeEventListener(COUNT_EVENT, on);
  }, []);
  const label = count ? `Upload a financial document (${count} waiting for your answer)` : 'Upload a financial document';
  return (
    <button
      type="button"
      onClick={requestBooksUpload}
      aria-label={label}
      title={label}
      data-testid="books-upload-button"
      className="shrink-0 ml-1 mr-1 sm:mr-6 lg:mr-8 inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 text-xs font-semibold uppercase tracking-wider border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] relative"
    >
      <UiIcon name="upload" className="text-base" />
      <span className="hidden min-[380px]:inline">Upload</span>
      {count > 0 && (
        <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B85838] text-white text-[0.625rem] leading-[18px] text-center">{count}</span>
      )}
    </button>
  );
}

/** Mounted inside the Financial PIN gate on every Books tab. */
export function BooksUploadMount(props) {
  const [open, setOpen] = useState(pendingOpen);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, on);
    if (pendingOpen) setOpen(true);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);
  // The queue count is read once the person is inside the gate, even before
  // the panel is opened, so the badge is true from the first look.
  useEffect(() => {
    let alive = true;
    import('../lib/books-intake-questions.js').then(async ({ queueSummary }) => {
      const { intakeStore } = await import('../lib/books-intake-store.js');
      const docs = await intakeStore({ demoMode: !!props.demo }).listDocs().catch(() => []);
      if (alive) reportBooksUploadCount(queueSummary(docs).waiting);
    }).catch(() => {});
    return () => { alive = false; };
  }, [props.demo]);
  if (!open) return null;
  return (
    <Suspense fallback={<div role="status" className="fixed inset-0 z-[120] bg-black/30 flex items-center justify-center text-white text-sm">Opening the upload…</div>}>
      <BooksUpload {...props} onClose={() => { pendingOpen = false; setOpen(false); }} />
    </Suspense>
  );
}
