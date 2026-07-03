// =============================================================================
// EternalAlgorithms — the ETERNAL ALGORITHMS library (Darrell 2026-06-16)
// =============================================================================
// "Frameworks and outcomes": the biblical patterns kept as eternal algorithms —
// patterns from the eternal that run identically in both dimensions. Each entry
// pairs its 4th-dimensional expression (eternal / scriptural) with its 3rd-
// dimensional expression (practical) AND the OUTCOME it yields — the "you win
// with it." Two views:
//   • Frameworks & Outcomes (default) — the pairing list: framework on the left,
//     the outcome it produces on the right, for pattern recognition.
//   • Cards — the full entry, 3D plain layer first, 4D source one click beneath
//     (the same progressive-disclosure motion as the Study reflections and the
//     Technology Briefings).
//
// Lives INSIDE Darrell's Study (gated to the circle in the monolith). DATA is
// sovereign: device-local is the immediate truth (eternal-algorithms.js), and
// since 2026-07-03 the gallery SYNCS across the owner's own devices through the
// family's self-hosted server (eternal-algorithms-sync.js + migration 0071 —
// owner-only RLS). THE BRIDGE: a finalized framework can be PUBLISHED to the
// public Church › Eternal Algorithms series — the owner chooses per entry
// whether the deep 4D layer goes out (DR-0094); unpublished work never leaves
// the circle (DB-enforced, never a UI-only lock).
// Accessibility mirrors the Study/Pulpit surfaces: white / #FAF8F4 cards,
// #1A1815 body, #5A5751 secondary, labelled inputs, visible #B85838 focus (AA).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import {
  DEFAULT_LABEL,
  loadLibrary, saveLibrary, seedIfEmpty, validateFinal,
  normalizeAlgorithm, upsertAlgorithm, removeAlgorithm, togglePin,
  sortAlgorithms, filterAlgorithms, frameworksAndOutcomes,
} from '../lib/eternal-algorithms.js';
import {
  fetchLibraryCloud, mergeLibrary, pushAlgorithms, tombstoneAlgorithms,
  subscribeAlgorithmsRealtime,
} from '../lib/eternal-algorithms-sync.js';

const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const serif = { fontFamily: '"Fraunces", serif' };

const nowMs = () => Date.now();

// Honest sync footer (DR-0076): the surface states its REAL persistence state.
// "The family's own server" is literal — self-hosted, owner-only rows (0071).
// Anything marked published is visible in the public Church series by design;
// everything else never leaves the circle.
const EA_SYNC_FOOT = {
  synced: 'Sovereign & private: the gallery is yours alone — owner-only at the database — and follows your sign-in across your devices through the family’s own server. Only what you explicitly publish appears in the church series.',
  syncing: 'Sovereign & private: everything here is safe on this device — checking the family server for your gallery…',
  local: 'Sovereign & private: the family server isn’t reachable right now, so you’re working from this device’s copy. It syncs automatically when the connection returns.',
  error: 'Sovereign & private: some recent changes haven’t reached the family server yet. They are safe on this device and will be re-sent with your next change.',
};

// Shared voice primitive — appends dictation into a field; renders nothing where
// unsupported. (Reused, not re-rolled.)
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

// -----------------------------------------------------------------------------
// Editor — name, OUTCOME (first-class, its own field), the 4D expression (with
// Scripture) and the 3D expression, plus tags.
// -----------------------------------------------------------------------------
function AlgorithmEditor({ initial, onSave, onCancel }) {
  const [f, setF] = useState({
    id: initial?.id || null,
    name: initial?.name || '',
    outcome: initial?.outcome || '',
    fourSummary: initial?.fourD?.summary || '',
    scripture: initial?.fourD?.scripture || '',
    threeSummary: initial?.threeD?.summary || '',
    tags: (initial?.tags || []).join(', '),
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const append = (k) => (t) => setF((p) => ({ ...p, [k]: (p[k] ? p[k] + ' ' : '') + t }));
  const candidate = {
    id: f.id,
    name: f.name,
    outcome: f.outcome,
    fourD: { summary: f.fourSummary, scripture: f.scripture },
    threeD: { summary: f.threeSummary },
    tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
  };
  // The no-rough-drafts gate, applied at the source: the finished gallery only
  // saves a COMPLETE framework (name + 4D + 3D + outcome). A missing part keeps
  // Save disabled and names what's needed — drafts belong in Study, not here.
  const check = validateFinal(candidate);
  const submit = () => { if (check.ok) onSave(candidate); };
  return (
    <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 my-2">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit' : 'New'} eternal algorithm</div>
      <div>
        <label className={LABEL} htmlFor="ea-name">Framework name</label>
        <input id="ea-name" className={FIELD} value={f.name} onChange={set('name')} placeholder="e.g. Response over Circumstance (90/10)" />
      </div>

      {/* OUTCOME — first-class, given its own emphasized field. */}
      <div className="border-l-2 border-[#5A6E3D] pl-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold block" htmlFor="ea-outcome">✦ Outcome · the result you win with it</label>
          <MicButton onText={append('outcome')} label="the outcome" />
        </div>
        <textarea id="ea-outcome" className={AREA} rows="2" value={f.outcome} onChange={set('outcome')} placeholder="What running this algorithm produces — the win." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
        <div className="border-l-2 border-[#1A1815] pl-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[0.5625rem] uppercase tracking-wider text-[#1A1815] font-semibold block" htmlFor="ea-4d">4D · eternal / scriptural</label>
            <MicButton onText={append('fourSummary')} label="the 4th-dimensional expression" />
          </div>
          <textarea id="ea-4d" className={AREA} rows="6" value={f.fourSummary} onChange={set('fourSummary')} placeholder="The eternal / scriptural expression — quote Scripture accurately." />
          <label className={`${LABEL} mt-1`} htmlFor="ea-scr">Scripture refs</label>
          <input id="ea-scr" className={FIELD} value={f.scripture} onChange={set('scripture')} placeholder="e.g. James 1:2-4" />
        </div>
        <div className="border-l-2 border-[#5A5751] pl-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold block" htmlFor="ea-3d">3D · practical / temporal</label>
            <MicButton onText={append('threeSummary')} label="the 3rd-dimensional expression" />
          </div>
          <textarea id="ea-3d" className={AREA} rows="6" value={f.threeSummary} onChange={set('threeSummary')} placeholder="How it plays out in this-world life and work." />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="ea-tags">Tags (comma-separated, for pattern recognition)</label>
        <input id="ea-tags" className={FIELD} value={f.tags} onChange={set('tags')} placeholder="response, joy, 90-10…" />
      </div>

      {!check.ok && (
        <p className="text-[0.6875rem] text-[#9A3412]" style={serif} role="status">
          Final only — still needs: {check.missing.join(', ')}. (Rough drafts live in Study › Finalize.)
        </p>
      )}
      {check.ok && !check.hasScripture && (
        <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No Scripture ref yet — add one if it has a clear anchor (never invent a verse).</p>
      )}
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={!check.ok} onClick={submit} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`} title={check.ok ? '' : `Needs: ${check.missing.join(', ')}`}>Save</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Frameworks & Outcomes — the pairing list. Framework (with its Scripture) on
// one side, the outcome it yields on the other. The default, browsable view.
// -----------------------------------------------------------------------------
function PairingList({ rows, onOpen }) {
  if (!rows.length) return null;
  return (
    <div className="border border-[#E8E4DC] bg-white">
      <div className="hidden sm:grid grid-cols-2 gap-0 bg-[#FAF8F4] border-b border-[#E8E4DC]">
        <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] px-3 py-2 border-r border-[#E8E4DC]">Framework</div>
        <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A6E3D] px-3 py-2">✦ Outcome — you win with it</div>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-[#E8E4DC] last:border-b-0">
            <div className="px-3 py-2.5 sm:border-r border-[#E8E4DC]">
              <button type="button" onClick={() => onOpen(r.id)} className="text-left text-sm text-[#1A1815] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ ...serif, fontWeight: 600 }}>
                {r.pinned ? '📌 ' : ''}{r.name}
              </button>
              {r.scripture && <p className="text-[0.6875rem] text-[#5A6E3D] mt-0.5" style={serif}>{r.scripture}</p>}
            </div>
            <div className="px-3 py-2.5 bg-[#FCFBF8] sm:bg-transparent">
              <p className="text-sm text-[#1A1815]" style={serif}>{r.outcome || <span className="text-[#9A3412] italic">No outcome yet — add the win.</span>}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Card — 3D plain layer + OUTCOME first; the 4D source one click beneath.
// -----------------------------------------------------------------------------
function AlgorithmCard({ entry, onEdit, onDelete, onPin, onSetPublish, openByDefault }) {
  const [openDeep, setOpenDeep] = useState(!!openByDefault);
  const [publishing, setPublishing] = useState(false);   // inline publish panel
  const [include4D, setInclude4D] = useState(!!entry.publish4D);
  return (
    <div className={`bg-white border p-3 ${entry.pinned ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{entry.pinned ? '📌 ' : ''}✦ {entry.name || 'Untitled framework'}</span>
        <span className="flex items-baseline gap-1.5 flex-wrap">
          {/* The reflect badge — the two rooms visibly agree on what's public. */}
          {entry.published && (
            <span className="text-[0.5625rem] uppercase tracking-wider bg-[#B85838] text-white px-1.5 py-0.5" title={entry.publish4D ? 'Published to the Church series, including the deep 4D layer' : 'Published to the Church series (3D + outcome + scripture; the deep 4D layer stays in the circle)'}>
              ● Live in the church series{entry.publish4D ? ' · with 4D' : ''}
            </span>
          )}
          {entry.seed
            ? <span className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">seed</span>
            : entry.source === 'study'
              ? <span className="text-[0.5625rem] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5" title="Promoted from a finalized Study thought">✓ Finalized from Study</span>
              : null}
        </span>
      </div>

      {/* OUTCOME — first-class, highlighted. */}
      <div className="mt-1.5 bg-[#F2F4EC] border-l-2 border-[#5A6E3D] pl-3 pr-2 py-1.5">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">✦ Outcome — you win with it</div>
        {entry.outcome
          ? <p className="text-sm text-[#1A1815]" style={serif}>{entry.outcome}</p>
          : <p className="text-xs text-[#9A3412] italic" style={serif}>No outcome yet — the framework↔outcome pairing needs the win.</p>}
      </div>

      {/* 3D plain layer — how it plays out. */}
      <div className="mt-2">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">3D · practical / temporal</div>
        {entry.threeD?.summary
          ? <p className="text-sm text-[#1A1815] whitespace-pre-wrap" style={serif}>{entry.threeD.summary}</p>
          : <p className="text-xs text-[#5A5751] italic" style={serif}>No 3D expression yet.</p>}
      </div>

      {/* 4D source — one click deeper (progressive disclosure). */}
      {(entry.fourD?.summary || entry.fourD?.scripture) && (
        <div className="mt-2">
          <button type="button" onClick={() => setOpenDeep((v) => !v)} aria-expanded={openDeep} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {openDeep ? '↑ Hide the 4D source' : '↓ Open the 4D source (eternal / scriptural)'}
          </button>
          {openDeep && (
            <div className="mt-1.5 bg-[#FAF8F4] border-l-2 border-[#1A1815] pl-3 pr-2 py-2">
              {entry.fourD?.scripture && <p className="text-[0.6875rem] text-[#5A6E3D] mb-1" style={serif}>{entry.fourD.scripture}</p>}
              <p className="text-sm text-[#1A1815] whitespace-pre-wrap" style={serif}>{entry.fourD?.summary}</p>
            </div>
          )}
        </div>
      )}

      {(entry.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.tags.map((t) => <span key={t} className="text-[0.625rem] bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">{t}</span>)}
        </div>
      )}

      {(entry.links || []).length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-[#E8E4DC]">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Shows up in</div>
          <div className="flex flex-wrap gap-1.5">
            {entry.links.map((l, i) => (
              <span key={i} className="text-[0.625rem] text-[#5A5751]" style={serif}>
                <span className="text-[#1A1815]">{l.label}</span>{l.where ? ` · ${l.where}` : ''}{i < entry.links.length - 1 ? '  •' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The forge→pulpit publish panel — the owner decides, per entry, per
          layer (DR-0094). Publishing sends the framework name + outcome + 3D
          + scripture to the public Church series; the deep 4D layer goes ONLY
          if the box is checked. Unpublish pulls it back. */}
      {publishing && !entry.published && (
        <div className="mt-2 bg-[#FAF8F4] border border-[#B85838] p-2.5 space-y-2">
          <p className="text-xs text-[#1A1815]" style={serif}>
            Publish <strong>{entry.name}</strong> to the public <strong>Church › Eternal Algorithms</strong> series? Everyone (including visitors) will see the framework, its outcome, the 3D expression, and the Scripture anchors.
          </p>
          <label className="flex items-baseline gap-2 text-xs" style={serif}>
            <input type="checkbox" checked={include4D} onChange={(e) => setInclude4D(e.target.checked)} className="accent-[#B85838]" />
            Also publish the deep 4D layer (otherwise it stays in the circle)
          </label>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => { onSetPublish(entry.id, true, include4D); setPublishing(false); }} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Publish</button>
            <button type="button" onClick={() => setPublishing(false)} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#5A5751] text-[#5A5751] hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
        <button type="button" onClick={() => onEdit(entry)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
        <button type="button" onClick={() => onPin(entry.id)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">{entry.pinned ? 'Unpin' : 'Pin'}</button>
        {entry.published ? (
          <button type="button" onClick={() => { if (window.confirm('Unpublish this framework? It will leave the public Church series (your gallery copy is untouched).')) onSetPublish(entry.id, false, false); }} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">Unpublish</button>
        ) : (
          <button type="button" onClick={() => setPublishing((v) => !v)} className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">Publish to church series</button>
        )}
        <button type="button" onClick={() => { if (window.confirm(`Delete this algorithm from your gallery on all your devices${entry.published ? ' — it will ALSO leave the public church series' : ''}?`)) onDelete(entry.id); }} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
export default function EternalAlgorithms({ email }) {
  const [library, setLibrary] = useState(() => emptyStateFor());
  const [view, setView] = useState('pairs'); // 'pairs' (frameworks & outcomes) | 'cards'
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // {} = new, entry = edit, null = none
  const [focusId, setFocusId] = useState(null);  // a framework opened from the pairing list
  // Cross-device sync state (eternal-algorithms-sync.js) — same rail + same
  // honest states as the Study: 'syncing' | 'synced' | 'local' | 'error'.
  const [syncStatus, setSyncStatus] = useState('syncing');
  const loadedFor = useRef(null);
  const libraryRef = useRef(null);
  const cloudShadow = useRef({ entries: new Map(), ready: false });
  const pendingTombstones = useRef([]);

  useEffect(() => {
    const loaded = seedIfEmpty(loadLibrary(email), nowMs());
    setLibrary(loaded);
    libraryRef.current = loaded;
    loadedFor.current = email || null;
    saveLibrary(email, loaded); // persist the seed on first open

    cloudShadow.current = { entries: new Map(), ready: false };
    pendingTombstones.current = [];
    setSyncStatus('syncing');
    let cancelled = false;

    const pullMerge = async () => {
      const cloud = await fetchLibraryCloud();
      if (cancelled) return;
      if (!cloud) { setSyncStatus('local'); return; }
      const base = libraryRef.current || loaded;
      const { library: merged, pushEntries: up, pushTombstones } = mergeLibrary(base, cloud);
      const shadow = cloudShadow.current;
      shadow.entries = new Map(merged.entries.map((e) => [e.id, JSON.stringify(e)]));
      shadow.ready = true;
      if (JSON.stringify(merged) !== JSON.stringify(base)) {
        setLibrary(merged);
        libraryRef.current = merged;
        saveLibrary(email, merged);
      }
      const okUp = await pushAlgorithms(up);
      const okTomb = await tombstoneAlgorithms(pushTombstones);
      if (!cancelled) setSyncStatus(okUp && okTomb ? 'synced' : 'error');
    };

    pullMerge();
    const unsubscribe = subscribeAlgorithmsRealtime(pullMerge);
    const onOnline = () => pullMerge();
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, [email]);

  useEffect(() => {
    if (loadedFor.current !== (email || null)) return;
    saveLibrary(email, library);
    libraryRef.current = library;
    const shadow = cloudShadow.current;
    if (!shadow.ready) return;
    const changed = [];
    const present = new Set();
    for (const e of library.entries) {
      present.add(e.id);
      const j = JSON.stringify(e);
      if (shadow.entries.get(e.id) !== j) { changed.push(e); shadow.entries.set(e.id, j); }
    }
    for (const id of [...shadow.entries.keys()]) {
      if (!present.has(id)) { pendingTombstones.current.push(id); shadow.entries.delete(id); }
    }
    const tombstones = pendingTombstones.current;
    if (!changed.length && !tombstones.length) return;
    (async () => {
      const okUp = await pushAlgorithms(changed);
      const okTomb = await tombstoneAlgorithms(tombstones);
      if (okTomb) pendingTombstones.current = [];
      if (!okUp) for (const e of changed) shadow.entries.delete(e.id);
      setSyncStatus(okUp && okTomb ? 'synced' : 'error');
    })();
  }, [library, email]);

  const filtered = useMemo(() => filterAlgorithms(library.entries, query), [library.entries, query]);
  const cards = useMemo(() => sortAlgorithms(filtered), [filtered]);
  const pairs = useMemo(() => frameworksAndOutcomes(filtered), [filtered]);

  const saveEntry = (raw) => {
    // The no-rough-drafts gate, also enforced here (not only in the editor): the
    // finished gallery never persists an incomplete framework.
    if (!validateFinal(raw).ok) return;
    setLibrary((s) => {
      const existing = raw.id ? s.entries.find((e) => e.id === raw.id) : null;
      const entry = normalizeAlgorithm(
        { ...existing, ...raw, updatedAt: new Date(nowMs()).toISOString() },
        nowMs(), s.entries.length,
      );
      return { ...s, entries: upsertAlgorithm(s.entries, entry) };
    });
    setEditing(null);
  };
  const onDelete = (id) => setLibrary((s) => ({ ...s, entries: removeAlgorithm(s.entries, id) }));
  const onPin = (id) => setLibrary((s) => ({ ...s, entries: togglePin(s.entries, id) }));
  const openFramework = (id) => { setFocusId(id); setView('cards'); };
  // The forge→pulpit bridge: publish/unpublish an entry to the public Church
  // series. The owner chooses per entry whether the deep 4D layer goes out
  // (DR-0094). updatedAt bumps so the sync pushes the new state immediately;
  // the DATABASE window (eternal_algorithms_public) is what the church reads —
  // nothing unpublished can leak from here.
  const onSetPublish = (id, published, publish4D) => setLibrary((s) => ({
    ...s,
    entries: s.entries.map((e) => e.id === id
      ? normalizeAlgorithm({
          ...e,
          published,
          publish4D: published ? !!publish4D : false,
          publishedAt: published ? new Date(nowMs()).toISOString() : null,
          updatedAt: new Date(nowMs()).toISOString(),
        })
      : e),
  }));

  return (
    <div>
      <SectionTitle eyebrow="Eternal algorithms — patterns from the eternal, in both dimensions">
        {library.label || DEFAULT_LABEL}
      </SectionTitle>

      {/* Ecclesiastes 3:14 — what the eternal does endures and runs unchanged. */}
      <blockquote className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-2 mb-4" style={serif}>
        <p className="text-sm text-[#1A1815] italic">“I perceived that whatever God does endures forever; nothing can be added to it, nor anything taken from it.”</p>
        <footer className="text-[0.6875rem] text-[#5A5751] mt-1">— Ecclesiastes 3:14 (ESV). Each framework runs the same in the eternal (4D) and in this-world life and work (3D); the outcome is what you win with it.</footer>
      </blockquote>

      {/* The rule, stated on the surface: this is the finished gallery; the
          workshop is Study › Finalize. No rough drafts here. */}
      <p className="text-[0.6875rem] text-[#5A6E3D] bg-[#F2F4EC] border border-[#E8E4DC] px-3 py-1.5 mb-3" style={serif}>
        <strong>The finished gallery.</strong> Only final, finalized frameworks live here. Drafting and iteration happen in <strong>Study › Finalize</strong> — a thought promotes in only once it's complete (4D · 3D · outcome) and accepted.
      </p>

      {/* View toggle + count */}
      <div className="flex items-center gap-1 text-xs mb-3 flex-wrap" role="tablist" aria-label="Library views">
        <button type="button" role="tab" aria-selected={view === 'pairs'} onClick={() => setView('pairs')} className={`px-3 py-2 border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${view === 'pairs' ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>⇄ Frameworks &amp; Outcomes</button>
        <button type="button" role="tab" aria-selected={view === 'cards'} onClick={() => { setView('cards'); setFocusId(null); }} className={`px-3 py-2 border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${view === 'cards' ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>▦ Cards</button>
        <span className="text-[0.625rem] text-[#5A5751] ml-auto">{library.entries.length} algorithms</span>
      </div>

      {/* Add / search */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {editing === null && (
          <button type="button" onClick={() => { setEditing({}); setView('cards'); }} className={`${BTN} text-[#B85838] hover:text-[#1A1815] border border-[#B85838]`}>+ New algorithm</button>
        )}
        <label className="sr-only" htmlFor="ea-q">Search the library</label>
        <input id="ea-q" className={`${FIELD} flex-1 min-w-[12rem]`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search frameworks, outcomes, scripture, tags…" />
      </div>

      {editing !== null && (
        <AlgorithmEditor initial={editing.id ? editing : null} onSave={saveEntry} onCancel={() => setEditing(null)} />
      )}

      {filtered.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">✦</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={serif}>{query ? 'Nothing matches that search.' : 'The library is empty.'}</p>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>{query ? 'Try a different word.' : 'Add an algorithm above — it stays here, on this device, for the circle.'}</p>
        </div>
      ) : view === 'pairs' ? (
        <PairingList rows={pairs} onOpen={openFramework} />
      ) : (
        <div className="space-y-2">
          {cards.map((e) => <AlgorithmCard key={e.id} entry={e} onEdit={setEditing} onDelete={onDelete} onPin={onPin} onSetPublish={onSetPublish} openByDefault={e.id === focusId} />)}
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif} role="status">
        These power the two-layer progressive disclosure across PoeTech: the 3D side is the plain-audience teaching layer (briefings, courses); the 4D side is the deep source. {EA_SYNC_FOOT[syncStatus] || EA_SYNC_FOOT.local}
      </p>
    </div>
  );
}

function emptyStateFor() {
  return { version: 1, label: DEFAULT_LABEL, entries: [] };
}

export { EternalAlgorithms };
