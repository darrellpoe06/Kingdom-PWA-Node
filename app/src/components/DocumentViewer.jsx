// =============================================================================
// DocumentViewer — a document opens INSIDE the app, whatever kind it is
// (DR-1078; Darrell 2026-10-16: "We are supposed to be a one place to see all
// types of documents")
// =============================================================================
// One sheet over the page, used by every shelf that holds documents. It asks
// the shelf for the url (signed storage path, an uploaded data url, or a link),
// fetches the bytes with a hard wait, and shows them by kind: pictures as
// pictures, PDFs as pages (pdf.js), Word files as their text, text as text.
// What it cannot show inside the app it says so, plainly, and offers the two
// ways out (a new tab, a saved copy). It never shows a blank and never blames
// the person for a file that is not on the server.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import {
  documentKind, urlSource, fetchDocument, readDocx, loadPdfjs, viewerFailureText,
} from '../lib/document-viewer.js';
import { fingerprintOf, presenceLine, recordText } from '../lib/document-record.js';

const RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-3 py-1.5 min-h-[36px] rounded-full border';
const QUIET = `${BTN} border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white`;
const SERIF = { fontFamily: '"Fraunces", serif' };
const PDF_FIRST_PAGES = 5;

/** Normalize what a shelf's resolver returns: a string, null, or { ok, url, reason }. */
export function normalizeResolved(r) {
  if (typeof r === 'string') return r.trim() ? { ok: true, url: r.trim() } : { ok: false, reason: 'no-file' };
  if (r && typeof r === 'object') {
    if (r.ok && r.url) return { ok: true, url: r.url };
    if (r.ok === false) return { ok: false, reason: r.reason || 'unknown' };
  }
  return { ok: false, reason: 'unknown' };
}

function PdfPages({ blob, title }) {
  const [pdf, setPdf] = useState(null);
  const [err, setErr] = useState('');
  const [shown, setShown] = useState(PDF_FIRST_PAGES);
  useEffect(() => {
    let alive = true;
    let doc = null;
    (async () => {
      try {
        const lib = await loadPdfjs();
        const data = new Uint8Array(await blob.arrayBuffer());
        doc = await lib.getDocument({ data, isEvalSupported: false }).promise;
        if (alive) setPdf(doc);
      } catch (e) {
        if (alive) setErr(String((e && e.message) || e));
      }
    })();
    return () => { alive = false; if (doc) { try { doc.destroy(); } catch { /* gone */ } } };
  }, [blob]);
  if (err) return <p className="text-sm text-[#991B1B]" role="status" style={SERIF} data-testid="viewer-pdf-error">The PDF could not be drawn on this device ({err}). Use the buttons below to open or save it.</p>;
  if (!pdf) return <p className="text-sm text-[#5A5751]" aria-live="polite" style={SERIF}>Opening the PDF…</p>;
  const pages = Array.from({ length: Math.min(shown, pdf.numPages) }, (_, i) => i + 1);
  return (
    <div className="space-y-3" data-testid="viewer-pdf" data-pages={pdf.numPages}>
      {pages.map((n) => <PdfPage key={n} pdf={pdf} n={n} title={title} />)}
      {pdf.numPages > shown && (
        <div className="text-center">
          <button type="button" onClick={() => setShown((s) => s + PDF_FIRST_PAGES)} className={`${QUIET} ${RING}`} data-testid="viewer-pdf-more">
            Show more pages ({shown} of {pdf.numPages})
          </button>
        </div>
      )}
    </div>
  );
}

function PdfPage({ pdf, n, title }) {
  const ref = useRef(null);
  useEffect(() => {
    let task = null;
    let alive = true;
    (async () => {
      const page = await pdf.getPage(n);
      const canvas = ref.current;
      if (!alive || !canvas) return;
      const box = canvas.parentElement ? canvas.parentElement.clientWidth || 800 : 800;
      const base = page.getViewport({ scale: 1 });
      const ratio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      const viewport = page.getViewport({ scale: (box / base.width) * ratio });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      try { await task.promise; } catch { /* cancelled on close */ }
    })();
    return () => { alive = false; if (task) { try { task.cancel(); } catch { /* done */ } } };
  }, [pdf, n]);
  return <canvas ref={ref} className="block w-full bg-white border border-[#E8E4DC]" aria-label={`${title}, page ${n}`} />;
}

// ---------------------------------------------------------------------------
// The document's record (DR-1085): what it is, where it came from, when, and
// where it lives, beside the document itself. Every value comes from the row
// the shelf loaded (lib/document-record.js); the presence line comes from what
// the server just answered; the fingerprint from the bytes just opened.
// ---------------------------------------------------------------------------
function RecordPanel({ record, title, state, fingerprint }) {
  const presence = presenceLine(state, record);
  const [saveUrl, setSaveUrl] = useState('');
  useEffect(() => {
    if (state.phase === 'loading' || typeof Blob !== 'function' || typeof URL === 'undefined' || !URL.createObjectURL) return undefined;
    const text = recordText(record, { title, presence, fingerprint });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    setSaveUrl(url);
    return () => { try { if (URL.revokeObjectURL) URL.revokeObjectURL(url); } catch { /* already freed */ } };
  }, [record, title, presence, fingerprint, state.phase]);
  const missing = state.phase === 'failed';
  return (
    <section className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 space-y-3" aria-label="About this document" data-testid="document-record">
      {presence && (
        <p className={`text-sm leading-relaxed ${missing ? 'text-[#991B1B]' : 'text-[#3F5226]'}`} style={SERIF} data-testid="record-presence">{presence}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {record.sections.map((sec) => (
          <div key={sec.id} data-testid={`record-${sec.id}`}>
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">{sec.heading}</div>
            <dl className="text-xs space-y-0.5" style={SERIF}>
              {sec.rows.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 text-[#5A5751]">{k}:</dt>
                  <dd className="text-[#1A1815] break-all">{v}</dd>
                </div>
              ))}
            </dl>
            {sec.card && sec.card.kind === 'email' && (
              <div className="mt-2 bg-white border border-[#1A1815] p-2 text-xs" style={SERIF} data-testid="record-email-card">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">The email it came in</div>
                <div><span className="text-[#5A5751]">From</span> {sec.card.from}</div>
                {sec.card.subject && <div><span className="text-[#5A5751]">Subject</span> <strong>{sec.card.subject}</strong></div>}
                {sec.card.messageId && <div className="break-all"><span className="text-[#5A5751]">Message-ID</span> {sec.card.messageId}</div>}
                <div className="text-[0.625rem] text-[#5A5751] italic mt-1">Sender as read by the team-documents import, which reads only this address.</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {fingerprint && (
        <p className="text-[0.625rem] text-[#5A5751] break-all" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid="record-fingerprint">
          Fingerprint (SHA-256 of the file as opened): {fingerprint}
        </p>
      )}
      {saveUrl && (
        <a href={saveUrl} download={`${(title || 'document').replace(/[^A-Za-z0-9 ._-]+/g, '').trim() || 'document'} - record.txt`}
          className={`${QUIET} ${RING} inline-flex items-center`} data-testid="record-save">Save this record</a>
      )}
    </section>
  );
}

export default function DocumentViewer({ title = 'Document', name = '', resolve, onClose, record = null }) {
  const [state, setState] = useState({ phase: 'loading' });
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    let alive = true;
    let objectUrl = '';
    (async () => {
      let resolved;
      try { resolved = normalizeResolved(await resolve()); } catch { resolved = { ok: false, reason: 'unknown' }; }
      if (!alive) return;
      if (!resolved.ok) { setState({ phase: 'failed', reason: resolved.reason }); return; }
      const url = resolved.url;
      if (urlSource(url) === 'external') { setState({ phase: 'shown', kind: 'link', url }); return; }
      const got = await fetchDocument(url);
      if (!alive) return;
      if (!got.ok) { setState({ phase: 'failed', reason: got.reason, url }); return; }
      objectUrl = URL.createObjectURL(got.blob);
      fingerprintOf(got.blob).then((fp) => { if (alive && fp) setFingerprint(fp); });
      const kind = documentKind({ contentType: got.contentType, name, url });
      if (kind === 'text') {
        const text = await got.blob.text();
        if (alive) setState({ phase: 'shown', kind, url, objectUrl, text });
      } else if (kind === 'docx') {
        const blocks = await readDocx(await got.blob.arrayBuffer());
        if (alive) setState({ phase: 'shown', kind: blocks.length ? 'docx' : 'unknown', url, objectUrl, blocks });
      } else if (alive) {
        setState({ phase: 'shown', kind, url, objectUrl, blob: got.blob });
      }
    })();
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [resolve, name]);

  const saveName = name || title;
  const ways = (state.objectUrl || state.url) ? (
    <div className="flex flex-wrap gap-2" data-testid="viewer-ways">
      {state.url && <a href={state.url} target="_blank" rel="noopener noreferrer" className={`${QUIET} ${RING} inline-flex items-center`} data-testid="viewer-new-tab">Open in a new tab</a>}
      {state.objectUrl && <a href={state.objectUrl} download={saveName} className={`${QUIET} ${RING} inline-flex items-center`} data-testid="viewer-save">Save a copy</a>}
    </div>
  ) : null;

  let body;
  if (state.phase === 'loading') {
    body = <p className="text-sm text-[#5A5751]" aria-live="polite" style={SERIF} data-testid="viewer-loading">Opening {title}…</p>;
  } else if (state.phase === 'failed' && record && presenceLine(state, record)) {
    // The record's presence line already says it, with the reason (DR-1085).
    body = null;
  } else if (state.phase === 'failed') {
    body = <p className="text-sm text-[#991B1B] leading-relaxed" role="status" style={SERIF} data-testid="viewer-failed" data-reason={state.reason}>{viewerFailureText(state.reason, `“${title}”`)}</p>;
  } else if (state.kind === 'image') {
    body = <img src={state.objectUrl} alt={title} className="block w-full h-auto object-contain" data-testid="viewer-image" />;
  } else if (state.kind === 'pdf') {
    body = <PdfPages blob={state.blob} title={title} />;
  } else if (state.kind === 'text') {
    body = <pre className="whitespace-pre-wrap break-words text-sm text-[#1A1815] bg-white border border-[#E8E4DC] p-3" data-testid="viewer-text">{state.text}</pre>;
  } else if (state.kind === 'docx') {
    body = (
      <article className="bg-white border border-[#E8E4DC] p-4 space-y-2 text-[#1A1815]" style={SERIF} data-testid="viewer-docx">
        {state.blocks.map((b, i) => (b.kind === 'h'
          ? <h3 key={i} className="text-base font-semibold mt-2">{b.text}</h3>
          : <p key={i} className={`text-sm leading-relaxed whitespace-pre-wrap ${b.kind === 'row' ? 'border-b border-[#E8E4DC] pb-1' : ''}`}>{b.text || ' '}</p>))}
      </article>
    );
  } else if (state.kind === 'link') {
    body = <p className="text-sm text-[#1A1815] leading-relaxed" style={SERIF} data-testid="viewer-link">“{title}” lives on another website, which does not let other apps show its pages inside them. Use the button below to open it there.</p>;
  } else if (state.kind === 'word-legacy') {
    body = <p className="text-sm text-[#1A1815] leading-relaxed" style={SERIF} data-testid="viewer-legacy">“{title}” is an older Word file (.doc). Phones cannot show that format inside an app; save a copy to open it in Word or Google Docs, or open it in a new tab.</p>;
  } else {
    body = <p className="text-sm text-[#1A1815] leading-relaxed" style={SERIF} data-testid="viewer-unknown">This kind of file cannot be shown inside the app yet. Save a copy or open it in a new tab.</p>;
  }

  // The shared dialog shell (Modal.jsx): portalled to the page body so no row
  // or card can clip it, Escape and the close button, a focus trap, the page
  // locked behind it, and focus handed back to the OPEN that was tapped.
  return (
    <Modal open onClose={onClose} label={title} maxWidthClass="max-w-4xl">
      <div className="space-y-4" data-testid="document-viewer">
        <h2 className="pr-12 text-base text-[#1A1815] break-words" style={{ ...SERIF, fontWeight: 600 }}>{title}</h2>
        {record && <RecordPanel record={record} title={title} state={state} fingerprint={fingerprint} />}
        {body}
        {ways}
      </div>
    </Modal>
  );
}

/**
 * Every shelf opens documents the same way:
 *   const viewer = useDocumentViewer();
 *   <button onClick={() => viewer.open({ title, name, resolve: () => signer(path) })}>
 *   {viewer.element}
 */
export function useDocumentViewer() {
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);
  const openDoc = useCallback(({ title, name = '', resolve, record = null }) => {
    setOpen({ title, name, resolve, record, key: Date.now() });
  }, []);
  const element = open
    ? <DocumentViewer key={open.key} title={open.title} name={open.name} resolve={open.resolve} record={open.record} onClose={close} />
    : null;
  return { open: openDoc, close, element };
}
