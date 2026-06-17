// =============================================================================
// Study — Darrell's private thinking & processing space (Darrell 2026-06-16)
// =============================================================================
// The 4th-dimensional layer beneath the plain-language Technology Briefings: the
// deep theological / reflective exchanges kept here as SOURCE MATERIAL the
// briefings and presentations unfold from (progressive disclosure — one click
// deeper). Three rooms:
//   1. Reflections — captured deep exchanges + a way to capture/import more.
//   2. Processing  — notes, code-for-building scratch, ideas being organized,
//      each with the distillation path (deep 4th-dimensional <-> plain wider-
//      audience), both directions, feeding the briefing's two depth layers.
//   3. Cultural research — research a culture and rework the truth to reach it
//      (1 Cor 9:19-23, "all things to all men").
//
// ACCESS is gated in the monolith to the smallest circle (Darrell + Christina +
// Bishop Gwin). DATA is device-local + sovereign (study-space.js) — never sent to
// the cloud, never mined, never trained on. This component owns the surface; the
// pure logic + persistence live in ../lib/study-space.js (shared, testable).
//
// Accessibility mirrors the Pulpit/Choir surfaces: white / #FAF8F4 cards, #1A1815
// body, #5A5751 secondary, labelled inputs, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import EternalAlgorithms from './EternalAlgorithms.jsx';
import {
  KINDS, KIND_ORDER, DEFAULT_LABEL,
  loadStudy, saveStudy, seedIfEmpty,
  normalizeEntry, upsertEntry, removeEntry, togglePin,
  sortEntries, filterEntries, countsByKind, distillState, captureExchange,
} from '../lib/study-space.js';

const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

const nowMs = () => Date.now();
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return (iso || '').slice(0, 10); } };

// A small mic button that appends dictation into a textarea/input (the shared
// voice primitive — reused, not re-rolled). Renders nothing where unsupported.
function MicButton({ onText, label }) {
  const mic = useVoiceDictation({ onTranscript: (t) => onText(t) });
  if (!mic.supported) return null;
  return (
    <button
      type="button" onClick={mic.toggle} aria-pressed={mic.listening}
      aria-label={mic.listening ? `Stop voice input for ${label}` : `Speak instead of typing for ${label}`}
      className={`${BTN} border ${mic.listening ? 'bg-[#B85838] text-white border-[#B85838]' : 'text-[#B85838] border-[#B85838] hover:bg-[#FAF8F4]'}`}
    >{mic.listening ? '⏹ Stop' : '🎤 Speak'}</button>
  );
}

const DISTILL_BADGE = {
  both:       { text: 'Distilled · deep + plain', cls: 'bg-[#5A6E3D] text-white' },
  'deep-only':  { text: 'Needs a plain version', cls: 'bg-[#FAF8F4] text-[#5A5751] border border-[#E8E4DC]' },
  'plain-only': { text: 'Needs the deep source', cls: 'bg-[#FAF8F4] text-[#5A5751] border border-[#E8E4DC]' },
  empty:      { text: 'Empty', cls: 'bg-[#FAF8F4] text-[#5A5751] border border-[#E8E4DC]' },
};

// -----------------------------------------------------------------------------
// Entry editor — the distillation path. Deep (4th-dimensional source) and plain
// (wider-audience) sit side by side so the reprocess works both directions.
// -----------------------------------------------------------------------------
function EntryEditor({ initial, kind, onSave, onCancel }) {
  const isResearch = kind === 'research';
  const [f, setF] = useState({
    id: initial?.id || null,
    title: initial?.title || '',
    deep: initial?.deep || '',
    plain: initial?.plain || '',
    scripture: initial?.scripture || '',
    culture: initial?.culture || '',
    tags: (initial?.tags || []).join(', '),
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const append = (k) => (t) => setF((p) => ({ ...p, [k]: (p[k] ? p[k] + ' ' : '') + t }));
  const submit = () => onSave({
    ...f,
    kind,
    tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
  });
  return (
    <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 my-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit' : 'New'} {KINDS[kind].label.toLowerCase()}</div>
      <div>
        <label className={LABEL} htmlFor="se-title">Title</label>
        <input id="se-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="Name the thought" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className={LABEL} htmlFor="se-scr">Scripture (optional)</label>
          <input id="se-scr" className={FIELD} value={f.scripture} onChange={set('scripture')} placeholder="e.g. 2 Cor 10:4-5; Rom 12:2" />
        </div>
        {isResearch ? (
          <div>
            <label className={LABEL} htmlFor="se-culture">Culture / audience in view</label>
            <input id="se-culture" className={FIELD} value={f.culture} onChange={set('culture')} placeholder="Who are we reworking this to reach?" />
          </div>
        ) : (
          <div>
            <label className={LABEL} htmlFor="se-tags">Tags (comma-separated)</label>
            <input id="se-tags" className={FIELD} value={f.tags} onChange={set('tags')} placeholder="metanoia, joy, table…" />
          </div>
        )}
      </div>

      {/* The distillation path — both layers, side by side. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
        <div className="border-l-2 border-[#1A1815] pl-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] uppercase tracking-wider text-[#1A1815] font-semibold block" htmlFor="se-deep">↓ Deep · 4th-dimensional source</label>
            <MicButton onText={append('deep')} label="the deep layer" />
          </div>
          <textarea id="se-deep" className={AREA} rows="8" value={f.deep} onChange={set('deep')} placeholder={isResearch ? 'The full research — what this culture believes, how the truth lands, the careful version.' : 'The deep reflection / the captured exchange / the code-for-building scratch. The full-strength version.'} />
        </div>
        <div className="border-l-2 border-[#5A6E3D] pl-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold block" htmlFor="se-plain">↑ Plain · wider-audience version</label>
            <MicButton onText={append('plain')} label="the plain layer" />
          </div>
          <textarea id="se-plain" className={AREA} rows="8" value={f.plain} onChange={set('plain')} placeholder="The same truth in plain language — what a wide room hears first. (This is the briefing layer; the deep source unfolds one click beneath it.)" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={!f.title.trim() && !f.deep.trim() && !f.plain.trim()} onClick={submit} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Save</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Entry card — plain layer shown first; the deep 4th-dimensional source unfolds
// one click beneath (progressive disclosure, the exact briefing motion).
// -----------------------------------------------------------------------------
function EntryCard({ entry, onEdit, onDelete, onPin }) {
  const [openDeep, setOpenDeep] = useState(false);
  const ds = distillState(entry);
  const badge = DISTILL_BADGE[ds];
  const serif = { fontFamily: '"Fraunces", serif' };
  return (
    <div className={`bg-white border p-3 ${entry.pinned ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{entry.pinned ? '📌 ' : ''}{KINDS[entry.kind].icon} {entry.title || 'Untitled'}</span>
          {entry.seed && <span className="text-[9px] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">seed theme</span>}
        </div>
        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${badge.cls}`}>{badge.text}</span>
      </div>
      {entry.scripture && <p className="text-[11px] text-[#5A6E3D] mt-0.5" style={serif}>{entry.scripture}</p>}
      {entry.culture && <p className="text-[11px] text-[#5A5751] mt-0.5" style={serif}><span className="uppercase tracking-wider text-[9px]">For:</span> {entry.culture}</p>}

      {/* Plain layer — the wider-audience version reads first. */}
      {entry.plain
        ? <p className="text-sm text-[#1A1815] whitespace-pre-wrap mt-1.5" style={serif}>{entry.plain}</p>
        : <p className="text-xs text-[#5A5751] italic mt-1.5" style={serif}>No plain version yet — the distillation is the next step.</p>}

      {/* Deep source — one click deeper. */}
      {entry.deep && (
        <div className="mt-2">
          <button type="button" onClick={() => setOpenDeep((v) => !v)} aria-expanded={openDeep} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {openDeep ? '↑ Hide the deep source' : '↓ Open the deep source (4th-dimensional)'}
          </button>
          {openDeep && (
            <div className="mt-1.5 bg-[#FAF8F4] border-l-2 border-[#1A1815] pl-3 pr-2 py-2">
              <p className="text-sm text-[#1A1815] whitespace-pre-wrap" style={serif}>{entry.deep}</p>
            </div>
          )}
        </div>
      )}

      {(entry.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.tags.map((t) => <span key={t} className="text-[10px] bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">{t}</span>)}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
        <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtDate(entry.createdAt)}</span>
        <button type="button" onClick={() => onEdit(entry)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
        <button type="button" onClick={() => onPin(entry.id)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">{entry.pinned ? 'Unpin' : 'Pin'}</button>
        <button type="button" onClick={() => { if (window.confirm('Delete this entry? It is only on this device.')) onDelete(entry.id); }} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Capture composer — paste a deep exchange straight in as a new reflection.
// -----------------------------------------------------------------------------
function CaptureBox({ onCapture }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const append = (t) => setText((p) => (p ? p + ' ' : '') + t);
  const go = () => { if (!text.trim()) return; onCapture({ title, text }); setText(''); setTitle(''); };
  return (
    <div className="bg-white border border-[#1A1815] p-3 mb-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#1A1815] font-semibold mb-1.5">Capture an exchange</div>
      <p className="text-[11px] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Paste a deep reflective exchange here. It lands as the <strong>deep source</strong> of a new reflection — distill the plain wider-audience version next. Stays on this device, just for the circle.</p>
      <input className={`${FIELD} mb-2`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional — first line is used if blank)" aria-label="Reflection title" />
      <textarea className={AREA} rows="4" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the exchange…" aria-label="Exchange text" />
      <div className="flex gap-2 mt-2 flex-wrap">
        <button type="button" disabled={!text.trim()} onClick={go} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Capture as reflection</button>
        <MicButton onText={append} label="the exchange" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
export default function Study({ email }) {
  const [study, setStudy] = useState(() => emptyStateFor(email));
  const [space, setSpace] = useState('workspace'); // 'workspace' | 'algorithms'
  const [kind, setKind] = useState('reflection');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // entry being edited, {} = new, null = none
  const [renaming, setRenaming] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const loadedFor = useRef(null);

  // Load (and first-time seed) the device-local store for this identity. Reloads
  // when the signed-in email changes so one device never shows another's space.
  useEffect(() => {
    const loaded = seedIfEmpty(loadStudy(email), nowMs());
    setStudy(loaded);
    loadedFor.current = email || null;
    // Persist the seed on first open so it survives reload.
    saveStudy(email, loaded);
  }, [email]);

  // Persist on every change (after the initial load for this identity).
  useEffect(() => {
    if (loadedFor.current !== (email || null)) return;
    saveStudy(email, study);
  }, [study, email]);

  const counts = useMemo(() => countsByKind(study.entries), [study.entries]);
  const shown = useMemo(() => sortEntries(filterEntries(study.entries, kind, query)), [study.entries, kind, query]);

  const saveEntry = (raw) => {
    setStudy((s) => {
      const existing = raw.id ? s.entries.find((e) => e.id === raw.id) : null;
      const entry = normalizeEntry(
        { ...existing, ...raw, updatedAt: new Date(nowMs()).toISOString() },
        nowMs(), s.entries.length,
      );
      return { ...s, entries: upsertEntry(s.entries, entry) };
    });
    setEditing(null);
  };
  const onCapture = (payload) => {
    setStudy((s) => ({ ...s, entries: upsertEntry(s.entries, captureExchange(payload, nowMs(), s.entries.length)) }));
  };
  const onDelete = (id) => setStudy((s) => ({ ...s, entries: removeEntry(s.entries, id) }));
  const onPin = (id) => setStudy((s) => ({ ...s, entries: togglePin(s.entries, id) }));
  const commitRename = () => {
    const next = labelDraft.trim() || DEFAULT_LABEL;
    setStudy((s) => ({ ...s, label: next }));
    setRenaming(false);
  };

  const serif = { fontFamily: '"Fraunces", serif' };
  return (
    <div className="max-w-3xl">
      <SectionTitle eyebrow="Private · for the circle only">
        {renaming ? (
          <span className="inline-flex items-center gap-2">
            <label className="sr-only" htmlFor="study-label">Rename this space</label>
            <input id="study-label" autoFocus className="border-b-2 border-[#B85838] bg-transparent text-2xl sm:text-3xl text-[#1A1815] focus:outline-none" style={{ ...serif, fontWeight: 600 }} value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }} placeholder={DEFAULT_LABEL} />
            <button type="button" onClick={commitRename} className="text-xs uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">Save</button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            {study.label || DEFAULT_LABEL}
            <button type="button" onClick={() => { setLabelDraft(study.label || ''); setRenaming(true); }} aria-label="Rename this space" title="Rename (e.g. Father of Lights)" className="text-[11px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ rename</button>
          </span>
        )}
      </SectionTitle>

      {/* James 1:17 — the Father of lights; the room of illumination. KJV-free ESV. */}
      <blockquote className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-2 mb-4" style={serif}>
        <p className="text-sm text-[#1A1815] italic">“Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shadow due to change.”</p>
        <footer className="text-[11px] text-[#5A5751] mt-1">— James 1:17 (ESV). The deep layer beneath the briefings — your thinking, processing, and reprocessing, kept on this device for you, Christina, and Bishop Gwin.</footer>
      </blockquote>

      {/* Space toggle — the reflective workspace vs. the Eternal Algorithms
          library (the 4th-dimensional source that powers the two-layer
          progressive disclosure of the briefings + courses). */}
      <div className="flex gap-1 text-xs mb-4 flex-wrap" role="tablist" aria-label="Study spaces">
        <button type="button" role="tab" aria-selected={space === 'workspace'} onClick={() => setSpace('workspace')} className={`px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${space === 'workspace' ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>📓 Workspace</button>
        <button type="button" role="tab" aria-selected={space === 'algorithms'} onClick={() => setSpace('algorithms')} className={`px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${space === 'algorithms' ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>✦ Eternal Algorithms</button>
      </div>

      {space === 'algorithms' ? <EternalAlgorithms email={email} /> : (
      <>
      {/* Room tabs */}
      <div className="flex gap-1 text-xs mb-3 overflow-x-auto" role="tablist" aria-label="Study rooms">
        {KIND_ORDER.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setEditing(null); }} className={`px-3 py-2 whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${kind === k ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>
            {KINDS[k].icon} {KINDS[k].label} · {counts[k]}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#5A5751] mb-3" style={serif}>{KINDS[kind].blurb}</p>

      {kind === 'reflection' && <CaptureBox onCapture={onCapture} />}

      {/* Add / search */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {editing === null && (
          <button type="button" onClick={() => setEditing({})} className={`${BTN} text-[#B85838] hover:text-[#1A1815] border border-[#B85838]`}>+ New {KINDS[kind].label.toLowerCase()}</button>
        )}
        <label className="sr-only" htmlFor="study-q">Search this space</label>
        <input id="study-q" className={`${FIELD} flex-1 min-w-[12rem]`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, both layers, scripture, tags…" />
      </div>

      {editing !== null && (
        <EntryEditor initial={editing.id ? editing : null} kind={kind} onSave={saveEntry} onCancel={() => setEditing(null)} />
      )}

      {shown.length ? (
        <div className="space-y-2">
          {shown.map((e) => <EntryCard key={e.id} entry={e} onEdit={setEditing} onDelete={onDelete} onPin={onPin} />)}
        </div>
      ) : (
        <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">{KINDS[kind].icon}</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={serif}>{query ? 'Nothing matches that search.' : `This room is empty.`}</p>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>{query ? 'Try a different word.' : `Start a ${KINDS[kind].label.toLowerCase()} above — it stays here, on this device, for the circle.`}</p>
        </div>
      )}

      <p className="text-[10px] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif}>
        Sovereign &amp; private: everything here lives on this device only — never sent to the cloud, never mined, never used to train anything. A shared sovereign rail for the circle (your NAS) is the next step; for now this is yours.
      </p>
      </>
      )}
    </div>
  );
}

// A fresh empty study for the very first render before the load effect runs.
function emptyStateFor() {
  return { version: 1, label: DEFAULT_LABEL, entries: [] };
}

export { Study };
