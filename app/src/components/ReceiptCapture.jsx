// =============================================================================
// ReceiptCapture — the PHOTO/OCR capture front door onto the shared VALIDATION gate
// =============================================================================
// Take a picture of a receipt (or upload one, or drop a whole stack), and it
// becomes a validation CANDIDATE that flows into the ONE shared review gate
// (InputValidation.jsx) — the SAME gate email receipts, manual entries, and bank
// files use. Per image:
//   1. Read + STRIP metadata (EXIF capture time kept; GPS detected + dropped) —
//      the stored proof image is privacy-clean (receipt-image.js).
//   2. OCR on-device (Tesseract, sovereign — the image never leaves the device).
//   3. Structure + match + categorize -> a candidate, handed UP to the gate,
//      where the user confirms or corrects before anything commits. Nothing is
//      filed silently; low-confidence / unmatched candidates surface there for a
//      quick fix. Bulk = every photo becomes a candidate in one review.
//
// This component ONLY captures + extracts; it does not commit. The gate owns
// validate -> preview -> confirm -> commit, so the experience is identical to
// every other input path. Display-only, consumer-intuitive, tooltips, no emoji.
// =============================================================================
import React, { useState, useRef, useCallback } from 'react';
import { prepareReceiptImage } from '../lib/receipt-image.js';
import { processReceipt } from '../lib/receipt-capture.js';
import { ocrImage } from '../lib/recipe-photo-import.js';
import { candidateFromReceipt } from '../lib/input-validation.js';

export default function ReceiptCapture({ transactions = [], onValidate, emailReceipts = [], ocr = ocrImage }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState([]); // [{name, status, pct}]
  const [dragOver, setDragOver] = useState(false);
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  const handOff = useCallback((candidates, title) => {
    if (typeof onValidate === 'function' && candidates.length) onValidate(candidates, title);
  }, [onValidate]);

  const runFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|heic|webp)$/i.test(f.name || ''));
    if (!files.length) return;
    setBusy(true);
    setProgress(files.map((f) => ({ name: f.name || 'photo', status: 'reading', pct: 0 })));
    const candidates = [];
    for (let i = 0; i < files.length; i++) {
      const set = (patch) => setProgress((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
      try {
        const prepared = await prepareReceiptImage(files[i]);
        set({ status: 'reading text' });
        const decision = await processReceipt(prepared, {
          ocr, transactions,
          onProgress: (pct) => set({ status: 'reading text', pct: Math.round((pct || 0) * 100) }),
        });
        const cand = candidateFromReceipt(decision.receipt, { source: 'photo', transactions, image: decision.image });
        candidates.push(cand);
        set({ status: cand.status === 'ready' ? 'ready to confirm' : 'needs a fix', pct: 100 });
      } catch (e) {
        set({ status: 'could not read', pct: 100 });
      }
    }
    setBusy(false);
    handOff(candidates, files.length > 1 ? `Review ${files.length} captured receipts` : 'Review this receipt');
  }, [ocr, transactions, handOff]);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files) runFiles(e.dataTransfer.files);
  };

  // Emailed receipts waiting to be confirmed -> the SAME gate. The list is
  // whatever the NAS email feed delivered (raw parsed receipts); each becomes a
  // candidate matched to a bank charge, reviewed exactly like a photo.
  const reviewEmail = () => {
    const cands = (emailReceipts || []).map((r) => candidateFromReceipt(r, { source: 'email', transactions }));
    handOff(cands, `Review ${cands.length} emailed receipt${cands.length === 1 ? '' : 's'}`);
  };

  const statusColor = (s) => (s === 'ready to confirm' ? 'text-[#5A6E3D]' : s === 'needs a fix' || s === 'could not read' ? 'text-[#B85838]' : 'text-[#5A5751]');

  return (
    <section className="bg-white border border-[#1A1815] p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">Snap a receipt</div>
          <h3 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Photograph a receipt — review it, then it files against the bank charge.</h3>
        </div>
        <div className="flex items-center gap-2">
          {emailReceipts && emailReceipts.length > 0 && (
            <button type="button" onClick={reviewEmail}
              className="text-xs uppercase tracking-wider border border-[#B85838] text-[#B85838] px-3 py-2 min-h-[40px] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
              title="Emailed receipts waiting — review them in the same gate as photos">
              Review {emailReceipts.length} emailed
            </button>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
            className="text-xs uppercase tracking-wider border border-[#1A1815] px-3 py-2 min-h-[40px] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            title="Open the camera + upload panel to add receipt photos">
            {open ? 'Close' : 'Add receipts'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Take a picture, upload one, or drop a whole stack. Each photo is read on your device (the image never leaves it),
            the location tag is stripped before it&apos;s stored, and the items are matched to the matching bank charge —
            the bank stays the source of truth for the amount. Then you review everything and confirm before anything is filed.
          </p>

          <div className="flex flex-wrap gap-2">
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { runFiles(e.target.files); e.target.value = ''; }} />
            <button type="button" onClick={() => cameraRef.current && cameraRef.current.click()} disabled={busy}
              className="text-xs uppercase tracking-wider bg-[#1A1815] text-white px-4 py-2 min-h-[44px] hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]"
              title="Use your device camera to photograph a receipt now">
              Take a photo
            </button>
            <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { runFiles(e.target.files); e.target.value = ''; }} />
            <button type="button" onClick={() => uploadRef.current && uploadRef.current.click()} disabled={busy}
              className="text-xs uppercase tracking-wider border border-[#1A1815] px-4 py-2 min-h-[44px] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]"
              title="Upload one receipt photo, or select several at once for a bulk drop">
              Upload photo(s)
            </button>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed p-6 text-center text-sm ${dragOver ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}
            style={{ fontFamily: '"Fraunces", serif' }}
            title="Drag one or many receipt photos here to process them all at once">
            <span className="text-[#5A5751]">{dragOver ? 'Drop to process' : 'or drag a stack of receipt photos here (bulk)'}</span>
          </div>

          {busy && <div className="text-xs text-[#5A5751] uppercase tracking-wider">Reading receipts…</div>}

          {progress.length > 0 && (
            <div className="space-y-1">
              {progress.map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{row.name}</span>
                  <span className={`uppercase tracking-wider whitespace-nowrap ${statusColor(row.status)}`}>
                    {row.status}{row.status === 'reading text' && row.pct ? ` ${row.pct}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
