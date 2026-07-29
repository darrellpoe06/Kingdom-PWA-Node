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
// Bishop Gwin). DATA is sovereign: device-local localStorage is the immediate
// truth (study-space.js), and since 2026-07-03 it SYNCS across the owner's own
// devices through the family's self-hosted Supabase on the NAS (study-sync.js +
// migration 0070 — owner-only RLS; BG's sign-in reads BG's rows and nothing
// else). Never a third-party cloud, never mined, never trained on. This
// component owns the surface; pure logic lives in ../lib (shared, testable).
//
// Accessibility mirrors the Pulpit/Choir surfaces: white / #FAF8F4 cards, #1A1815
// body, #5A5751 secondary, labelled inputs, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle, TabScroll } from './shared.jsx';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import EternalAlgorithms from './EternalAlgorithms.jsx';
import ThoughtFinalizer from './ThoughtFinalizer.jsx';
import UiIcon from './UiIcon.jsx';
import Presenter from './Presenter.jsx';
import { studyPresentable } from '../lib/presentable.js';
import { unfinalizedThoughts } from '../lib/thought-finalizer.js';
import {
  KINDS, KIND_ORDER, DEFAULT_LABEL,
  loadStudy, saveStudy, seedIfEmpty, mergeMissingSeeds,
  normalizeEntry, upsertEntry, removeEntry, togglePin,
  sortEntries, filterEntries, countsByKind, distillState, captureExchange,
  deriveFrom,
} from '../lib/study-space.js';
import {
  fetchStudyCloud, mergeStudy, pushStudyEntries, tombstoneStudyEntries,
  pushStudyLabel, subscribeStudyRealtime,
} from '../lib/study-sync.js';

const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
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

// The honest sync footer — the surface states its REAL persistence state
// (DR-0076: no claim without the state behind it). "The family's own server"
// is literal: Supabase self-hosted on the NAS, owner-only rows (0070).
const SYNC_FOOT = {
  synced: 'Sovereign & private: your Study is yours alone — owner-only at the database — and follows your sign-in across your devices through the family’s own server. Never a third-party cloud, never mined, never used to train anything.',
  syncing: 'Sovereign & private: everything here is safe on this device — checking the family server for your Study…',
  local: 'Sovereign & private: the family server isn’t reachable right now, so you’re working from this device’s copy. It syncs automatically when the connection returns — nothing is lost.',
  error: 'Sovereign & private: some recent changes haven’t reached the family server yet. They are safe on this device and will be re-sent with your next change.',
};

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
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit' : 'New'} {KINDS[kind].label.toLowerCase()}</div>
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
            <label className="text-[0.5625rem] uppercase tracking-wider text-[#1A1815] font-semibold block" htmlFor="se-deep">↓ Deep · 4th-dimensional source</label>
            <MicButton onText={append('deep')} label="the deep layer" />
          </div>
          <textarea id="se-deep" className={AREA} rows="8" value={f.deep} onChange={set('deep')} placeholder={isResearch ? 'The full research — what this culture believes, how the truth lands, the careful version.' : 'The deep reflection / the captured exchange / the code-for-building scratch. The full-strength version.'} />
        </div>
        <div className="border-l-2 border-[#5A6E3D] pl-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold block" htmlFor="se-plain">↑ Plain · wider-audience version</label>
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
function EntryCard({ entry, onEdit, onDelete, onPin, onDeriveFrom }) {
  const [openDeep, setOpenDeep] = useState(false);
  const ds = distillState(entry);
  const badge = DISTILL_BADGE[ds];
  const serif = { fontFamily: '"Fraunces", serif' };
  return (
    <div className={`bg-white border p-3 ${entry.pinned ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{entry.pinned ? <><UiIcon name="pin" /> </> : ''}<UiIcon name={KINDS[entry.kind].icon} /> {entry.title || 'Untitled'}</span>
          {entry.seed && <span className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">seed theme</span>}
          {entry.source && entry.source.label && <span className="text-[0.5625rem] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5" title={`Saved from ${entry.source.where || entry.source.label}`}>↓ {entry.source.label}</span>}
        </div>
        <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 ${badge.cls}`}>{badge.text}</span>
      </div>
      {entry.scripture && <p className="text-[0.6875rem] text-[#5A6E3D] mt-0.5" style={serif}>{entry.scripture}</p>}
      {entry.culture && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={serif}><span className="uppercase tracking-wider text-[0.5625rem]">For:</span> {entry.culture}</p>}

      {/* Plain layer — the wider-audience version reads first. */}
      {entry.plain
        ? <p className="text-sm text-[#1A1815] whitespace-pre-wrap mt-1.5" style={serif}>{entry.plain}</p>
        : <p className="text-xs text-[#5A5751] italic mt-1.5" style={serif}>No plain version yet — the distillation is the next step.</p>}

      {/* Deep source — one click deeper. */}
      {entry.deep && (
        <div className="mt-2">
          <button type="button" onClick={() => setOpenDeep((v) => !v)} aria-expanded={openDeep} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
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
          {entry.tags.map((t) => <span key={t} className="text-[0.625rem] bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">{t}</span>)}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
        <span className="text-[0.5625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtDate(entry.createdAt)}</span>
        <button type="button" onClick={() => onEdit(entry)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
        <button type="button" onClick={() => onDeriveFrom(entry)} title="Start a new study from this one — your own notes, building on it" className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">✦ Create from this</button>
        <button type="button" onClick={() => onPin(entry.id)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">{entry.pinned ? 'Unpin' : 'Pin'}</button>
        <button type="button" onClick={() => { if (window.confirm('Delete this entry from your Study? It will be removed on your other devices too.')) onDelete(entry.id); }} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete</button>
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
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold mb-1.5">Capture an exchange</div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Paste a deep reflective exchange here. It lands as the <strong>deep source</strong> of a new reflection — distill the plain wider-audience version next. Private to your sign-in, just for the circle.</p>
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
  const [space, setSpace] = useState('workspace'); // 'workspace' | 'algorithms' | 'finalize'
  const [kind, setKind] = useState('reflection');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // entry being edited, {} = new, null = none
  const [renaming, setRenaming] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [presenting, setPresenting] = useState(false); // live present mode (the circle)
  // Cross-device sync state (study-sync.js). 'syncing' → first pull in flight;
  // 'synced' → the family server holds this Study; 'local' → server unreachable
  // or signed out (device-local, exactly the pre-sync behavior); 'error' → some
  // pushes did not land (safe locally, retried on the next change).
  const [syncStatus, setSyncStatus] = useState('syncing');
  const loadedFor = useRef(null);
  const studyRef = useRef(null);
  // What we believe the family server holds (id → serialized entry, + label).
  // The persist effect diffs against this to push ONLY real changes, and merge
  // application updates it FIRST so pulled-down content never echoes back up.
  const cloudShadow = useRef({ entries: new Map(), label: null, ready: false });
  const pendingTombstones = useRef([]);

  // Load (and first-time seed) the device-local store for this identity, then
  // pull + merge the owner's Study from the family server and keep it live.
  // Reloads when the signed-in email changes so one device never shows
  // another's space.
  useEffect(() => {
    // seedIfEmpty handles a brand-new store (label + all seeds); mergeMissingSeeds
    // brings any teaching added AFTER a reader's first visit into their existing
    // store — without it, a new seed would be invisible to exactly the circle who
    // already opened the Study. Additive + idempotent; never overwrites edits.
    const loaded = mergeMissingSeeds(seedIfEmpty(loadStudy(email), nowMs()), nowMs());
    setStudy(loaded);
    studyRef.current = loaded;
    loadedFor.current = email || null;
    // Persist the seed on first open so it survives reload.
    saveStudy(email, loaded);

    cloudShadow.current = { entries: new Map(), label: null, ready: false };
    pendingTombstones.current = [];
    setSyncStatus('syncing');
    let cancelled = false;

    const pullMerge = async () => {
      const cloud = await fetchStudyCloud();
      if (cancelled) return;
      if (!cloud) { setSyncStatus('local'); return; }
      const base = studyRef.current || loaded;
      const { study: merged, pushEntries: up, pushTombstones, pushLabel: labelUp } = mergeStudy(base, cloud);
      const shadow = cloudShadow.current;
      shadow.entries = new Map(merged.entries.map((e) => [e.id, JSON.stringify(e)]));
      shadow.label = merged.label;
      shadow.ready = true;
      // Only re-render when the merge actually changed something (a realtime
      // echo of our own push merges to identical content — skip it).
      if (JSON.stringify(merged) !== JSON.stringify(base)) {
        setStudy(merged);
        studyRef.current = merged;
        saveStudy(email, merged);
      }
      const okUp = await pushStudyEntries(up);
      const okTomb = await tombstoneStudyEntries(pushTombstones);
      const okLabel = labelUp ? await pushStudyLabel(merged.label) : true;
      if (!cancelled) setSyncStatus(okUp && okTomb && okLabel ? 'synced' : 'error');
    };

    pullMerge();
    const unsubscribe = subscribeStudyRealtime(pullMerge);
    // A NAS that was unreachable at open syncs as soon as the device is back
    // online — the 'local' state is a moment, not a mode.
    const onOnline = () => pullMerge();
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, [email]);

  // Persist on every change (after the initial load for this identity), then
  // push exactly what changed up to the family server (diff vs the shadow).
  useEffect(() => {
    if (loadedFor.current !== (email || null)) return;
    saveStudy(email, study);
    studyRef.current = study;
    const shadow = cloudShadow.current;
    if (!shadow.ready) return; // first pull not landed yet — nothing to diff against
    const changed = [];
    const present = new Set();
    for (const e of study.entries) {
      present.add(e.id);
      const j = JSON.stringify(e);
      if (shadow.entries.get(e.id) !== j) { changed.push(e); shadow.entries.set(e.id, j); }
    }
    for (const id of [...shadow.entries.keys()]) {
      if (!present.has(id)) { pendingTombstones.current.push(id); shadow.entries.delete(id); }
    }
    const label = study.label || DEFAULT_LABEL;
    const labelChanged = shadow.label !== label;
    if (labelChanged) shadow.label = label;
    const tombstones = pendingTombstones.current;
    if (!changed.length && !tombstones.length && !labelChanged) return;
    (async () => {
      const okUp = await pushStudyEntries(changed);
      const okTomb = await tombstoneStudyEntries(tombstones);
      const okLabel = labelChanged ? await pushStudyLabel(label) : true;
      if (okTomb) pendingTombstones.current = [];
      if (!okUp) for (const e of changed) shadow.entries.delete(e.id); // re-push on the next change
      setSyncStatus(okUp && okTomb && okLabel ? 'synced' : 'error');
    })();
  }, [study, email]);

  const counts = useMemo(() => countsByKind(study.entries), [study.entries]);
  const shown = useMemo(() => sortEntries(filterEntries(study.entries, kind, query)), [study.entries, kind, query]);
  // Reflections ready to put on a screen: the present adapter keeps the deep
  // 4th-dimensional source in presenter notes (off the projector) and shows only
  // the plain wider-audience layer, so an entry needs a plain version to qualify.
  const presentable = useMemo(() => studyPresentable(study.entries, { id: 'study', title: study.label || DEFAULT_LABEL, kicker: study.label || DEFAULT_LABEL }), [study.entries, study.label]);
  const canPresent = presentable.scenes.length > 0;

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
  // The flywheel: create a NEW study seeded from an existing one, switch to its room,
  // and open it in the editor so the owner builds on it right away.
  const onDeriveFrom = (entry) => {
    const derived = deriveFrom(entry, nowMs(), study.entries.length);
    setStudy((s) => ({ ...s, entries: upsertEntry(s.entries, derived) }));
    setKind(derived.kind);
    setEditing(derived);
  };
  // The finalizer writes back a whole (already-normalized) entry whose ONLY
  // change is the added `finalization` layer — the owner's words are untouched.
  const onFinalizeSave = (entry) => setStudy((s) => ({ ...s, entries: upsertEntry(s.entries, entry) }));
  const pendingFinalize = useMemo(() => unfinalizedThoughts(study.entries).length, [study.entries]);
  const commitRename = () => {
    const next = labelDraft.trim() || DEFAULT_LABEL;
    setStudy((s) => ({ ...s, label: next }));
    setRenaming(false);
  };

  const serif = { fontFamily: '"Fraunces", serif' };

  // Live present mode takes over the surface (presenter console here, a clean
  // reflection screen in a popped window) — the same shared Presenter the Learn
  // courses + The Word use. The deep source stays presenter-side by construction.
  if (presenting) {
    return <Presenter presentable={presentable} onClose={() => setPresenting(false)} />;
  }

  return (
    <div className="w-full">
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
            <button type="button" onClick={() => { setLabelDraft(study.label || ''); setRenaming(true); }} aria-label="Rename this space" title="Rename (e.g. Father of Lights)" className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ rename</button>
          </span>
        )}
      </SectionTitle>

      {/* James 1:17 — the Father of lights; the room of illumination. KJV-free ESV. */}
      <blockquote className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-2 mb-4" style={serif}>
        <p className="text-sm text-[#1A1815] italic">“Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shadow due to change.”</p>
        <footer className="text-[0.6875rem] text-[#5A5751] mt-1">— James 1:17 (ESV). The deep layer beneath the briefings — your thinking, processing, and reprocessing. Private to your own sign-in within the circle; your notes follow you across your devices.</footer>
      </blockquote>

      {/* Space toggle — the reflective workspace vs. the Eternal Algorithms
          library (the 4th-dimensional source that powers the two-layer
          progressive disclosure of the briefings + courses). */}
      <div className="flex gap-1 text-xs mb-4 flex-wrap" role="tablist" aria-label="Study spaces">
        <button type="button" role="tab" aria-selected={space === 'workspace'} onClick={() => setSpace('workspace')} className={`px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${space === 'workspace' ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}><UiIcon name="book" /> Workspace</button>
        <button type="button" role="tab" aria-selected={space === 'algorithms'} onClick={() => setSpace('algorithms')} className={`px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${space === 'algorithms' ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}><UiIcon name="sparkle" /> Eternal Algorithms</button>
        <button type="button" role="tab" aria-selected={space === 'finalize'} onClick={() => setSpace('finalize')} className={`px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${space === 'finalize' ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}><UiIcon name="check" /> Finalize{pendingFinalize ? ` · ${pendingFinalize}` : ''}</button>
      </div>

      {space === 'finalize' ? <ThoughtFinalizer entries={study.entries} onSaveEntry={onFinalizeSave} email={email} />
      : space === 'algorithms' ? <EternalAlgorithms email={email} /> : (
      <>
      {/* Room tabs — shared <TabScroll> primitive (same fluid scroll as the
          main nav); children keep role="tab", so the row is a real tablist. */}
      <TabScroll className="mb-3" label="Study rooms">
        {KIND_ORDER.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setEditing(null); }} className={`px-3 py-2 whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${kind === k ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>
            <UiIcon name={KINDS[k].icon} /> {KINDS[k].label} · {counts[k]}
          </button>
        ))}
      </TabScroll>

      <p className="text-xs text-[#5A5751] mb-3" style={serif}>{KINDS[kind].blurb}</p>

      {kind === 'reflection' && <CaptureBox onCapture={onCapture} />}

      {/* Add / search */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {editing === null && (
          <button type="button" onClick={() => setEditing({})} className={`${BTN} text-[#B85838] hover:text-[#1A1815] border border-[#B85838]`}>+ New {KINDS[kind].label.toLowerCase()}</button>
        )}
        {canPresent && (
          <button type="button" onClick={() => setPresenting(true)} className={`${BTN} border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white`} title="Put the plain layer on a screen; the deep source stays with you">▶ Present</button>
        )}
        <label className="sr-only" htmlFor="study-q">Search this space</label>
        <input id="study-q" className={`${FIELD} flex-1 min-w-[12rem]`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, both layers, scripture, tags…" />
      </div>

      {editing !== null && (
        <EntryEditor initial={editing.id ? editing : null} kind={kind} onSave={saveEntry} onCancel={() => setEditing(null)} />
      )}

      {shown.length ? (
        <div className="space-y-2">
          {shown.map((e) => <EntryCard key={e.id} entry={e} onEdit={setEditing} onDelete={onDelete} onPin={onPin} onDeriveFrom={onDeriveFrom} />)}
        </div>
      ) : (
        <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1 text-[#5A5751]"><UiIcon name={KINDS[kind].icon} /></div>
          <p className="text-sm text-[#1A1815] font-semibold" style={serif}>{query ? 'Nothing matches that search.' : `This room is empty.`}</p>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>{query ? 'Try a different word.' : `Start a ${KINDS[kind].label.toLowerCase()} above — it stays private to you, in your Study.`}</p>
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif} role="status">
        {SYNC_FOOT[syncStatus] || SYNC_FOOT.local}
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
