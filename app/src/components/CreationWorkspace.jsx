// =============================================================================
// CreationWorkspace — the in-app document / image creation space
// =============================================================================
// "Can we create a document view/creation space — like a Word document -> an
// image file — a big area for working, with a click drop-down for workspace
// type." (Darrell, 2026-06-17.)
//
// A generous working CANVAS for composing a document, a CLICK DROP-DOWN to pick
// the workspace TYPE (Document / Image, extensible via WORKSPACE_TYPES config),
// SAVE to the cloud (creation_workspaces, migration 0037 — synced cross-device,
// family-private), and EXPORT the composed document as a real PNG/JPG image file.
//
// SOVEREIGN / dependency-free: the rich-text editing is a native contenteditable
// surface driven by document.execCommand (universally supported, no library), and
// the export rasterizes through a native SVG <foreignObject> + <canvas> (see
// lib/creation-workspace.js) — no html2canvas, no html-to-image, no external
// service, fully offline.
//
// UNBREAKABLE basics:
//   - error boundary: mounted inside <SectionBoundary> by the monolith.
//   - empty-state: a clear first-run card when nothing is saved yet.
//   - offline-safe: edits persist to localStorage via the same optimistic path
//     as projects/discussions; cloud sync resumes on sign-in. Export is local.
//   - no white-screen: every async (export) is try/caught with a friendly notice.
//   - keyboard-operable: real <button>s, native <select>, focusable canvas.
//   - large-print-safe: chrome is rem-based, so the GLOBAL text-size control
//     scales it; this surface adds no text-size control of its own. The exported
//     artifact is rasterized at standard size on purpose (large print is a
//     viewing aid for composing; the saved/exported document stays standard).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  WORKSPACE_TYPES, typeFor, exportFormatsFor, blankWorkspace,
  validateWorkspace, sanitizeHtml, exportNodeToImage, triggerDownload,
} from '../lib/creation-workspace.js';
import Presenter from './Presenter.jsx';
import { documentPresentable } from '../lib/presentable.js';

const FORMAT_LABEL = { png: 'PNG', jpg: 'JPG', jpeg: 'JPG' };

// Rich-text commands the toolbar exposes. execCommand is deprecated-but-universal
// and needs no dependency — the lightest reliable contenteditable formatting.
const TOOLS = [
  { cmd: 'bold', label: 'B', title: 'Bold', style: { fontWeight: 700 } },
  { cmd: 'italic', label: 'I', title: 'Italic', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'U', title: 'Underline', style: { textDecoration: 'underline' } },
];

export default function CreationWorkspace({
  workspaces = [],
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  currentUserPersona = null,
}) {
  const editorRef = useRef(null);
  const [type, setType] = useState(WORKSPACE_TYPES[0].key);
  const [title, setTitle] = useState('Untitled');
  const [activeId, setActiveId] = useState(null); // id of the saved workspace being edited, or null for a new one
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [errs, setErrs] = useState([]);
  const [notice, setNotice] = useState(null); // { kind: 'ok'|'err', text }
  const [busy, setBusy] = useState(false);
  // editorKey forces a contenteditable remount when we load a different document,
  // so React's initial render seeds the right innerHTML without fighting the DOM.
  const [editorKey, setEditorKey] = useState(0);
  const initialHtmlRef = useRef('');
  const [presenting, setPresenting] = useState(null); // a presentable to present, or null

  const cfg = typeFor(type);
  const formats = exportFormatsFor(type);

  // Sorted newest-first for the "open a saved document" list.
  const saved = [...workspaces].sort((a, b) => {
    const at = new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    return at;
  });

  const flash = useCallback((kind, text) => {
    setNotice({ kind, text });
    if (typeof window !== 'undefined') window.setTimeout(() => setNotice(null), 4000);
  }, []);

  // Load a fresh, empty canvas of a given type.
  const startNew = useCallback((nextType = type) => {
    const draft = blankWorkspace(nextType);
    setType(draft.type);
    setTitle(draft.title);
    setActiveId(null);
    setDirty(false);
    setSavedAt(null);
    setErrs([]);
    initialHtmlRef.current = '';
    setEditorKey((k) => k + 1);
  }, [type]);

  // Open an existing saved workspace into the canvas.
  const openWorkspace = useCallback((ws) => {
    if (!ws) return;
    setType(typeFor(ws.type).key);
    setTitle(ws.title || 'Untitled');
    setActiveId(ws.id);
    setDirty(false);
    setSavedAt(ws.updatedAt || ws.createdAt || null);
    setErrs([]);
    initialHtmlRef.current = sanitizeHtml(ws.content || '');
    setEditorKey((k) => k + 1);
  }, []);

  // Seed the contenteditable's HTML whenever it (re)mounts for a new/opened doc.
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtmlRef.current || '';
  }, [editorKey]);

  const exec = (command) => {
    if (typeof document === 'undefined') return;
    editorRef.current?.focus();
    try { document.execCommand(command, false, null); } catch (_) { /* command unsupported — non-fatal */ }
    setDirty(true);
  };

  const formatBlock = (tag) => {
    if (typeof document === 'undefined') return;
    editorRef.current?.focus();
    try { document.execCommand('formatBlock', false, tag); } catch (_) { /* non-fatal */ }
    setDirty(true);
  };

  const list = (ordered) => exec(ordered ? 'insertOrderedList' : 'insertUnorderedList');

  // Save: update the open workspace, or create a new one. Returns the id saved.
  // The draft is collected from the live editor + controls at save time.
  const save = useCallback(() => {
    const draft = {
      type,
      title: title.trim() || 'Untitled',
      content: sanitizeHtml(editorRef.current ? editorRef.current.innerHTML : ''),
      meta: { page: { ...cfg.page }, format: formats[0] },
      authorPersona: currentUserPersona?.key || currentUserPersona || null,
    };
    const problems = validateWorkspace(draft);
    if (problems.length) { setErrs(problems); return null; }
    setErrs([]);
    if (activeId) {
      updateWorkspace?.(activeId, draft);
      setSavedAt(new Date().toISOString());
      setDirty(false);
      flash('ok', 'Saved.');
      return activeId;
    }
    const created = addWorkspace?.(draft);
    // addWorkspace returns the new local id (see monolith reducer).
    if (created) setActiveId(created);
    setSavedAt(new Date().toISOString());
    setDirty(false);
    flash('ok', 'Saved.');
    return created || null;
  }, [activeId, addWorkspace, updateWorkspace, type, title, currentUserPersona, cfg, formats, flash]);

  // Export the composed canvas to a downloadable image. Saves first so the
  // exported artifact and the stored document never drift.
  const exportImage = useCallback(async (format) => {
    if (busy) return;
    setBusy(true);
    try {
      save();
      const { blob, dataUrl, filename } = await exportNodeToImage(editorRef.current, {
        type,
        title: title.trim() || 'workspace',
        format,
      });
      const ok = triggerDownload(blob || dataUrl, filename);
      flash(ok ? 'ok' : 'err', ok ? `Exported ${filename}` : 'Export could not start a download here.');
    } catch (e) {
      console.warn('[creation-workspace] export failed', e);
      flash('err', 'Export failed — your document is still saved. Try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, save, type, title, flash]);

  const removeWorkspace = (ws) => {
    if (!ws) return;
    deleteWorkspace?.(ws.id);
    if (ws.id === activeId) startNew(type);
    flash('ok', 'Deleted.');
  };

  // Present the open document on a screen. Saves first so the projected artifact
  // and the stored document never drift (same discipline as export), then builds
  // a presentable from the live editor HTML — split into one slide per H1/H2 the
  // document already uses. Document type only; an image tile has no sections to
  // advance through. Everything in a document is audience-facing, so there are no
  // presenter notes to leak.
  const presentDoc = useCallback(() => {
    const id = save() || activeId;
    const snapshot = {
      id: id || 'workspace',
      title: title.trim() || 'Untitled document',
      content: sanitizeHtml(editorRef.current ? editorRef.current.innerHTML : ''),
    };
    setPresenting(documentPresentable(snapshot, { id: `doc:${snapshot.id}`, kicker: snapshot.title }));
  }, [save, activeId, title]);

  // ----- styles (palette-matched, rem-based so the global text-size scales it)
  const accent = '#B85838';
  const ink = '#1A1815';
  const muted = '#5A5751';
  const border = '#E8E4DC';

  // Live present mode takes over the surface — a clean document screen pops in a
  // second window; this stays the presenter console. Same shared Presenter the
  // Learn courses + The Word use.
  if (presenting) {
    return <Presenter presentable={presenting} onClose={() => setPresenting(null)} />;
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: accent }}>Create</div>
        <h1 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', color: ink }}>Creation Workspace</h1>
        <p className="text-sm mt-1" style={{ color: muted }}>
          A big space for composing a document — then save it, or export it as an image file.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-4">
        {/* ---- working column: controls + canvas ---- */}
        <div>
          {/* Controls row: type dropdown + title */}
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: muted }}>Workspace type</span>
              <select
                value={type}
                onChange={(e) => {
                  const next = e.target.value;
                  setType(next);
                  setDirty(true);
                }}
                className="border bg-white px-2 py-2 text-sm focus:outline focus:outline-2"
                style={{ borderColor: border, color: ink, outlineColor: accent }}
                aria-label="Workspace type"
              >
                {WORKSPACE_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block flex-1 min-w-[12rem]">
              <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: muted }}>Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                placeholder="Untitled"
                className="w-full border bg-white px-2 py-2 text-sm focus:outline focus:outline-2"
                style={{ borderColor: border, color: ink, outlineColor: accent }}
                aria-label="Document title"
              />
            </label>
          </div>
          <p className="text-xs mb-3" style={{ color: muted }}>{cfg.blurb}</p>

          {/* Formatting toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-x border-t p-2" style={{ borderColor: border, background: '#FAF8F4' }} role="toolbar" aria-label="Formatting">
            {TOOLS.map((t) => (
              <button
                key={t.cmd}
                type="button"
                onClick={() => exec(t.cmd)}
                title={t.title}
                aria-label={t.title}
                className="w-9 h-9 border bg-white text-sm hover:bg-[#F0ECE4] focus:outline focus:outline-2"
                style={{ borderColor: border, color: ink, outlineColor: accent, ...t.style }}
              >
                {t.label}
              </button>
            ))}
            <span className="mx-1 h-6 border-l" style={{ borderColor: border }} aria-hidden="true" />
            <button type="button" onClick={() => formatBlock('h1')} title="Heading 1" className="px-2 h-9 border bg-white text-sm font-bold hover:bg-[#F0ECE4] focus:outline focus:outline-2" style={{ borderColor: border, color: ink, outlineColor: accent }}>H1</button>
            <button type="button" onClick={() => formatBlock('h2')} title="Heading 2" className="px-2 h-9 border bg-white text-sm font-bold hover:bg-[#F0ECE4] focus:outline focus:outline-2" style={{ borderColor: border, color: ink, outlineColor: accent }}>H2</button>
            <button type="button" onClick={() => formatBlock('p')} title="Normal text" className="px-2 h-9 border bg-white text-xs hover:bg-[#F0ECE4] focus:outline focus:outline-2" style={{ borderColor: border, color: ink, outlineColor: accent }}>Body</button>
            <span className="mx-1 h-6 border-l" style={{ borderColor: border }} aria-hidden="true" />
            <button type="button" onClick={() => list(false)} title="Bulleted list" aria-label="Bulleted list" className="w-9 h-9 border bg-white text-sm hover:bg-[#F0ECE4] focus:outline focus:outline-2" style={{ borderColor: border, color: ink, outlineColor: accent }}>•</button>
            <button type="button" onClick={() => list(true)} title="Numbered list" aria-label="Numbered list" className="w-9 h-9 border bg-white text-xs hover:bg-[#F0ECE4] focus:outline focus:outline-2" style={{ borderColor: border, color: ink, outlineColor: accent }}>1.</button>
          </div>

          {/* The big working canvas — a page on a neutral mat. */}
          <div className="border p-4 sm:p-6 overflow-auto" style={{ borderColor: border, background: '#EDE9E1', maxHeight: '70vh' }}>
            <div
              className="mx-auto shadow-sm"
              style={{
                width: '100%',
                maxWidth: `${cfg.page.width}px`,
                background: cfg.background,
              }}
            >
              <div
                key={editorKey}
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="Document canvas"
                data-placeholder={cfg.placeholder}
                onInput={() => { setDirty(true); }}
                className="creation-canvas outline-none"
                style={{
                  minHeight: `${Math.min(cfg.page.height, 640)}px`,
                  padding: '3rem',
                  fontFamily: cfg.fontStack,
                  color: ink,
                  fontSize: '1rem',
                  lineHeight: 1.5,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={save}
              className="px-4 py-2 text-sm font-medium text-white focus:outline focus:outline-2"
              style={{ background: accent, outlineColor: ink }}
            >
              Save
            </button>
            {formats.length === 1 ? (
              <button
                type="button"
                onClick={() => exportImage(formats[0])}
                disabled={busy}
                className="px-4 py-2 text-sm font-medium border focus:outline focus:outline-2 disabled:opacity-50"
                style={{ borderColor: accent, color: accent, outlineColor: ink }}
              >
                {busy ? 'Exporting…' : `Export ${FORMAT_LABEL[formats[0]] || 'image'}`}
              </button>
            ) : (
              <span className="inline-flex items-stretch border" style={{ borderColor: accent }}>
                <span className="px-3 py-2 text-sm font-medium" style={{ color: accent }}>Export</span>
                {formats.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => exportImage(f)}
                    disabled={busy}
                    className="px-3 py-2 text-sm font-medium border-l hover:bg-[#FAF1EC] focus:outline focus:outline-2 disabled:opacity-50"
                    style={{ borderColor: accent, color: accent, outlineColor: ink }}
                  >
                    {busy ? '…' : FORMAT_LABEL[f] || f.toUpperCase()}
                  </button>
                ))}
              </span>
            )}
            {type === 'document' && (
              <button
                type="button"
                onClick={presentDoc}
                className="px-4 py-2 text-sm font-medium border focus:outline focus:outline-2"
                style={{ borderColor: '#5A6E3D', color: '#5A6E3D', outlineColor: ink }}
                title="Put this document on a screen, one section at a time"
              >
                ▶ Present
              </button>
            )}
            <button
              type="button"
              onClick={() => startNew(type)}
              className="px-3 py-2 text-sm border focus:outline focus:outline-2"
              style={{ borderColor: border, color: muted, outlineColor: accent }}
            >
              New
            </button>
            <span className="text-xs ml-1" style={{ color: muted }} aria-live="polite">
              {dirty ? 'Unsaved changes' : savedAt ? `Saved ${new Date(savedAt).toLocaleString()}` : 'Not saved yet'}
            </span>
          </div>

          {errs.length > 0 && (
            <ul className="mt-2 text-sm" style={{ color: accent }} role="alert">
              {errs.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
          {notice && (
            <p className="mt-2 text-sm" role="status" style={{ color: notice.kind === 'err' ? accent : '#3F7A4F' }}>
              {notice.text}
            </p>
          )}
        </div>

        {/* ---- sidebar: saved documents ---- */}
        <aside>
          <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: muted }}>Your documents</div>
          {saved.length === 0 ? (
            <div className="border p-4 text-center" style={{ borderColor: border, background: 'white' }}>
              <div className="text-2xl mb-1" aria-hidden="true">📄</div>
              <p className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif', color: ink }}>Nothing saved yet</p>
              <p className="text-xs mt-1" style={{ color: muted }}>Compose something on the canvas, then press Save. It’ll appear here and sync to your other devices.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {saved.map((ws) => (
                <li key={ws.id}>
                  <div
                    className={`border px-3 py-2 ${ws.id === activeId ? 'ring-2' : ''}`}
                    style={{ borderColor: border, background: 'white', ...(ws.id === activeId ? { boxShadow: `inset 0 0 0 2px ${accent}` } : {}) }}
                  >
                    <button
                      type="button"
                      onClick={() => openWorkspace(ws)}
                      className="block w-full text-left focus:outline focus:outline-2"
                      style={{ outlineColor: accent }}
                    >
                      <span className="block text-sm font-medium truncate" style={{ color: ink }}>{ws.title || 'Untitled'}</span>
                      <span className="block text-[10px] uppercase tracking-wider" style={{ color: muted }}>
                        {typeFor(ws.type).label}{ws.updatedAt ? ` · ${new Date(ws.updatedAt).toLocaleDateString()}` : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWorkspace(ws)}
                      className="mt-1 text-[11px] focus:outline focus:outline-2"
                      style={{ color: muted, outlineColor: accent }}
                      aria-label={`Delete ${ws.title || 'Untitled'}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Placeholder for the empty contenteditable — shows the type's hint text. */}
      <style>{`
        .creation-canvas:empty:before {
          content: attr(data-placeholder);
          color: #9A958C;
          pointer-events: none;
        }
        .creation-canvas h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 .5rem; }
        .creation-canvas h2 { font-size: 1.375rem; font-weight: 700; margin: 1rem 0 .5rem; }
        .creation-canvas p { margin: 0 0 .625rem; }
        .creation-canvas ul, .creation-canvas ol { margin: 0 0 .625rem 1.5rem; }
        .creation-canvas li { margin: 0 0 .25rem; }
      `}</style>
    </div>
  );
}
