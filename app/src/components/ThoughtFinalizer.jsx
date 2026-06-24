// =============================================================================
// ThoughtFinalizer — distill deep-only reflections + auto-add their algorithms
// =============================================================================
// The third Study space. He captures a deep source in the Workspace; here he
// presses "Finalize my thoughts" ONCE and every reflection that still NEEDS A
// PLAIN VERSION is reviewed by the local model (qwen2.5 on the NAS): the 3rd-
// dimensional plain distillation (ending with the practical benefit) + scripture
// + tags are written into the reflection so it flips to "DISTILLED · DEEP +
// PLAIN" — finished, teaching-ready — and the eternal algorithm(s) it distills to
// are AUTO-ADDED to the Eternal Algorithms tab in the same pass (idempotent).
//
// FAITHFUL + ADDITIVE + REVERSIBLE: the 4th-dimensional DEEP SOURCE is shown
// verbatim, read-only, and never changed. Only the empty plain/scripture/tags are
// filled, with a snapshot kept so "Revert" restores the deep-only state.
//
// ON-DEMAND (no auto-fire), with the brakes an owner-initiated batch wants: a
// single in-flight LOCK, a Stop kill-switch, and a per-press CAP that is reported.
// HONEST OFFLINE (DR-0076): NAS unreachable -> it says so; nothing is fabricated,
// and he can write the plain by hand (saves the same way).
//
// CIRCLE-SCOPED: lives inside the Study, gated to Darrell + Christina + Bishop
// Gwin in the monolith; data is device-local per identity. Accessibility mirrors
// the Study surfaces (white / #FAF8F4 cards, #1A1815 body, #B85838 focus; AA).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import { loadLibrary, saveLibrary, seedIfEmpty } from '../lib/eternal-algorithms.js';
import {
  pendingDistillation, distillationProgress, isDistilled,
  askFinalizer, algorithmsFromResult, mergeAlgorithmsIntoLibrary,
  applyDistillation, revertDistillation,
} from '../lib/thought-finalizer.js';

const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const serif = { fontFamily: '"Fraunces", serif' };

// One owner-initiated press never spins forever — cap the batch, REPORT the rest.
const BATCH_CAP = 25;

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
// One reflection: the deep source (read-only) beside the plain distillation.
// -----------------------------------------------------------------------------
function FinalizeCard({ entry, onSave, algNames, busy }) {
  const fin = entry.finalization || {};
  const finished = isDistilled(entry);
  const [plain, setPlain] = useState(entry.plain || '');
  const [editing, setEditing] = useState(false);

  // Re-sync the editable plain when a fresh distillation lands for this entry.
  const stamp = `${fin.generatedAt || ''}|${entry.plain || ''}`;
  useEffect(() => {
    setPlain(entry.plain || '');
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp]);

  const linkedNames = (fin.algorithmIds || []).map((id) => algNames[id]).filter(Boolean);

  const saveManual = () => {
    // Manual fill / edit of the plain layer (e.g. honest-offline path). Keeps the
    // deep source untouched; marks provenance 'manual'.
    onSave({
      ...entry,
      plain,
      finalization: {
        ...fin,
        status: plain.trim() ? 'distilled' : 'unfinalized',
        autofilled: { ...(fin.autofilled || {}), plain: false },
        original: fin.original || { plain: entry.plain || '', scripture: entry.scripture || '', tags: entry.tags || [] },
        source: 'manual',
      },
    });
    setEditing(false);
  };
  const revert = () => onSave(revertDistillation(entry));

  return (
    <div className={`bg-white border p-3 ${finished ? 'border-[#5A6E3D]' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{entry.title || 'Untitled reflection'}</span>
        {finished
          ? <span className="text-[9px] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">✓ Distilled · deep + plain</span>
          : <span className="text-[9px] uppercase tracking-wider bg-[#FAF8F4] border border-[#B85838] text-[#B85838] px-1.5 py-0.5">Needs a plain version</span>}
      </div>
      {entry.scripture && <p className="text-[11px] text-[#5A6E3D] mb-1" style={serif}>{entry.scripture}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 4th-dimensional DEEP SOURCE — verbatim, read-only. */}
        <div className="border-l-2 border-[#1A1815] pl-2">
          <div className="text-[9px] uppercase tracking-wider text-[#1A1815] font-semibold mb-1">4D · deep source · unchanged</div>
          <p className="text-[13px] text-[#5A5751] whitespace-pre-wrap" style={serif}>{entry.deep}</p>
        </div>

        {/* 3rd-dimensional PLAIN distillation — generated, editable. */}
        <div className="border-l-2 border-[#5A6E3D] pl-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold">
              3D · plain version {fin.source ? <span className="text-[#5A5751] normal-case">· {fin.source === 'manual' ? 'your words' : fin.source === 'vendor' ? 'vendor model' : 'local model'}</span> : ''}
            </div>
            {finished && !editing && <button type="button" disabled={busy} onClick={() => setEditing(true)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>}
          </div>
          {finished && !editing ? (
            <p className="text-sm text-[#1A1815] whitespace-pre-wrap" style={serif}>{entry.plain}</p>
          ) : (
            <>
              <div className="flex items-center justify-end mb-1"><MicButton onText={(t) => setPlain((p) => (p ? p + ' ' : '') + t)} label="the plain version" /></div>
              <textarea className={AREA} rows="5" value={plain} onChange={(e) => setPlain(e.target.value)} placeholder="The plain wider-audience version, ending with the practical benefit. Press “Finalize my thoughts” to draft it, or write it here." aria-label={`Plain version of ${entry.title || 'reflection'}`} />
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <button type="button" disabled={busy || !plain.trim()} onClick={saveManual} className={`${BTN} bg-[#5A6E3D] text-white font-semibold hover:bg-[#1A1815] disabled:opacity-50`}>Save plain version</button>
                {editing && <button type="button" onClick={() => { setPlain(entry.plain || ''); setEditing(false); }} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-[#FAF8F4]`}>Cancel</button>}
              </div>
            </>
          )}
        </div>
      </div>

      {(entry.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.tags.map((t) => <span key={t} className="text-[10px] bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">{t}</span>)}
        </div>
      )}

      {/* The auto-added eternal algorithm(s). */}
      {linkedNames.length > 0 && (
        <div className="mt-2 bg-[#FAF8F4] border-l-2 border-[#5A6E3D] pl-3 pr-2 py-1.5">
          <div className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold">✦ Added to Eternal Algorithms</div>
          <p className="text-[12px] text-[#1A1815]" style={serif}>{linkedNames.join(' · ')}</p>
        </div>
      )}

      {(finished || (fin.algorithmIds || []).length > 0) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
          <button type="button" disabled={busy} onClick={revert} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">↩ Revert to deep-only</button>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
export default function ThoughtFinalizer({ entries = [], onSaveEntry, email }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [notice, setNotice] = useState(null); // { kind, text }
  const abortRef = useRef(null);
  // Bump after a batch so the EA-id -> name map re-reads the (just-written) store.
  const [algEpoch, setAlgEpoch] = useState(0);

  const prog = useMemo(() => distillationProgress(entries), [entries]);
  const pending = useMemo(() => pendingDistillation(entries), [entries]);
  const distilled = useMemo(() => entries.filter((e) => isDistilled(e) && (e.finalization || {}).status === 'distilled'), [entries]);

  // Map EA ids -> names for the per-card "Added to Eternal Algorithms" readout.
  const algNames = useMemo(() => {
    const out = {};
    try {
      const lib = loadLibrary(email);
      for (const a of (lib.entries || [])) out[a.id] = a.name;
    } catch { /* no storage */ }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, algEpoch]);

  const stop = () => { if (abortRef.current) abortRef.current.abort(); setRunning(false); };

  const finalizeAll = async () => {
    if (running) return; // single in-flight LOCK
    const batch = pending.slice(0, BATCH_CAP);
    const remainder = pending.length - batch.length;
    if (!batch.length) { setNotice({ kind: 'done', text: 'Every reflection is already distilled.' }); return; }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    setNotice(null);
    setProgress({ done: 0, total: batch.length });

    // The EA library is loaded ONCE and merged into across the batch, then saved
    // once at the end — the auto-add rides this same owner-pressed run, idempotent.
    let lib = seedIfEmpty(loadLibrary(email), Date.now());
    let applied = 0; let offline = 0; let added = 0;

    for (let i = 0; i < batch.length; i++) {
      if (ctrl.signal.aborted) break;
      const entry = batch[i];
      const res = await askFinalizer(entry, { signal: ctrl.signal });
      if (res.ok && res.result) {
        const drafts = algorithmsFromResult(res.result);
        const merged = mergeAlgorithmsIntoLibrary(lib.entries, drafts, { nowMs: Date.now() });
        lib = { ...lib, entries: merged.entries };
        added += merged.addedIds.length;
        onSaveEntry(applyDistillation(entry, res.result, { source: res.source, generatedAt: new Date().toISOString(), algorithmIds: merged.linkedIds }));
        applied += 1;
      } else if (res.error === 'unreachable' || res.error === 'empty' || (res.error || '').startsWith('http_')) {
        offline += 1;
      }
      setProgress({ done: i + 1, total: batch.length });
    }

    try { saveLibrary(email, lib); } catch { /* no storage */ }
    setAlgEpoch((n) => n + 1);
    setRunning(false);
    abortRef.current = null;

    if (offline > 0 && applied === 0) {
      setNotice({ kind: 'offline', text: 'The local model on the NAS is not reachable right now — nothing was fabricated. You can write each plain version by hand below; it saves the same way.' });
    } else if (remainder > 0) {
      setNotice({ kind: 'capped', text: `Distilled ${applied} reflection${applied === 1 ? '' : 's'} and added ${added} eternal algorithm${added === 1 ? '' : 's'}. ${remainder} more remain (capped at ${BATCH_CAP} per press) — press again to continue.` });
    } else {
      setNotice({ kind: 'done', text: `Distilled ${applied} reflection${applied === 1 ? '' : 's'} and added ${added} eternal algorithm${added === 1 ? '' : 's'} to the Eternal Algorithms tab. Review each below; edit or revert any you like.` });
    }
  };

  return (
    <div>
      <div className="bg-white border border-[#1A1815] p-3 mb-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#1A1815] font-semibold">Finalize my thoughts</div>
            <p className="text-[11px] text-[#5A5751] mt-0.5" style={serif}>
              Review every reflection that still needs a plain version: from its 4th-dimensional deep source, draft the 3rd-dimensional plain distillation (ending with the practical benefit) + scripture + tags, so it flips to <span className="text-[#5A6E3D] font-semibold">Distilled · deep + plain</span>. The eternal algorithm(s) each one distills to are added to the Eternal Algorithms tab in the same pass. Your deep source is never changed.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">{prog.finished} distilled</div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{prog.pending} need a plain version</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {!running ? (
            <button type="button" onClick={finalizeAll} disabled={pending.length === 0} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>
              ✦ Finalize my thoughts{pending.length ? ` · ${pending.length}` : ''}
            </button>
          ) : (
            <>
              <span className="text-xs text-[#5A5751]" style={serif}>Reviewing {progress.done}/{progress.total}…</span>
              <button type="button" onClick={stop} className={`${BTN} border border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4]`}>⏹ Stop</button>
            </>
          )}
          <span className="text-[10px] text-[#5A5751] italic" style={serif}>On-demand only — runs when you press it, never on its own.</span>
        </div>
        {notice && (
          <div className={`mt-2 text-[11px] p-2 border ${notice.kind === 'offline' ? 'border-[#B45309] bg-[#FAF8F4] text-[#9A3412]' : 'border-[#E8E4DC] bg-[#FAF8F4] text-[#5A5751]'}`} style={serif} role="status">
            {notice.text}
          </div>
        )}
      </div>

      {pending.length === 0 && distilled.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">✦</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={serif}>Nothing to finalize yet.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>Capture a deep reflection in the Workspace, then come back and finalize it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Needs-a-plain-version first (the work), then the distilled ones. */}
          {pending.map((e) => <FinalizeCard key={e.id} entry={e} onSave={onSaveEntry} algNames={algNames} busy={running} />)}
          {distilled.map((e) => <FinalizeCard key={e.id} entry={e} onSave={onSaveEntry} algNames={algNames} busy={running} />)}
        </div>
      )}

      <p className="text-[10px] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif}>
        Distilled reflections + extracted algorithms feed teaching / curriculum downstream. Sovereign &amp; private: this lives on this device only, reviewed by the family&apos;s local model — never sent to the cloud, never mined, never used to train anything. For the circle (Darrell, Christina, Bishop Gwin).
      </p>
    </div>
  );
}

export { ThoughtFinalizer };
