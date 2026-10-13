// =============================================================================
// ThoughtFinalizer — review unfinalized thoughts and apply the 4D framework
// =============================================================================
// The third Study space. The owner writes thoughts in the Workspace; here he
// presses "Finalize my thoughts" ONCE and every unfinalized thought is reviewed
// by the local model (qwen2.5 on the NAS) and given its 4th-dimensional framework
// treatment — 4D (eternal / scriptural), 3D (practical), and the OUTCOME — so
// each looks finished and is teaching-ready.
//
// FAITHFUL + ADDITIVE: the left side shows the thought's OWN words, read-only and
// untouched. The right side is the suggested treatment — editable — that the
// owner accepts, tweaks, or dismisses. His meaning stays senior to the model's.
//
// ON-DEMAND (no auto-fire), with the brakes an owner-initiated batch still wants:
// a single in-flight LOCK (one run at a time), a Stop button (kill-switch), and a
// per-press CAP that is reported, never silent. HONEST OFFLINE (DR-0076): if the
// NAS model is unreachable, it says so and offers the framework scaffold to fill
// by hand — it never paints a finished thought.
//
// Accessibility mirrors the Study/Pulpit surfaces: white / #FAF8F4 cards, #1A1815
// body, #5A5751 secondary, labelled inputs, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import { normalizeFinalization } from '../lib/study-space.js';
import {
  unfinalizedThoughts, finalizationProgress, isTeachingReady,
  askFinalizer, applySuggestion, editFinalization, acceptFinalization, clearFinalization,
  toEternalAlgorithmDraft,
} from '../lib/thought-finalizer.js';
import {
  loadLibrary, saveLibrary, seedIfEmpty, promoteFromStudy, promotedSourceIds,
} from '../lib/eternal-algorithms.js';

const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const serif = { fontFamily: '"Fraunces", serif' };

// One owner-initiated press should never spin forever — cap the batch and REPORT
// the remainder (no silent truncation; the count is shown, "press again").
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
// One thought: the owner's words (read-only) beside the editable treatment.
// -----------------------------------------------------------------------------
function FinalizeCard({ entry, onSave, busy, onPromote, inLibrary }) {
  const fin = normalizeFinalization(entry.finalization);
  const [draft, setDraft] = useState({
    fourSummary: fin.fourD.summary,
    scripture: fin.fourD.scripture,
    threeSummary: fin.threeD.summary,
    outcome: fin.outcome,
  });
  // Re-sync the editable draft when a fresh suggestion lands (a batch run replaces
  // this entry's finalization -> new generatedAt) or the status flips. An in-flight
  // manual edit is intentionally superseded by a new review, matching "re-review
  // replaces". Keyed on the stamp so unrelated re-renders don't clobber edits.
  useEffect(() => {
    setDraft({ fourSummary: fin.fourD.summary, scripture: fin.fourD.scripture, threeSummary: fin.threeD.summary, outcome: fin.outcome });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fin.generatedAt, fin.status]);
  const set = (k) => (e) => setDraft((p) => ({ ...p, [k]: e.target.value }));
  const append = (k) => (t) => setDraft((p) => ({ ...p, [k]: (p[k] ? p[k] + ' ' : '') + t }));

  const ready = isTeachingReady(entry);
  const draftHasAll = !!(draft.fourSummary.trim() && draft.threeSummary.trim() && draft.outcome.trim());
  const status = fin.status;

  const saveEdits = () => onSave(editFinalization(entry, draft));
  const accept = () => onSave(acceptFinalization(editFinalization(entry, draft), new Date().toISOString()));
  const dismiss = () => onSave(clearFinalization(entry));

  return (
    <div className={`bg-white border p-3 ${ready ? 'border-[#5A6E3D]' : status === 'suggested' ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{entry.title || 'Untitled thought'}</span>
        {ready
          ? <span className="text-[0.5625rem] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">✓ Teaching-ready</span>
          : status === 'suggested'
            ? <span className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#B85838] text-[#B85838] px-1.5 py-0.5">Suggested · review it</span>
            : <span className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">Not finalized</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* The owner's own words — READ-ONLY, never overwritten. */}
        <div className="border-l-2 border-[#1A1815] pl-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#1A1815] font-semibold mb-1">Your thought · unchanged</div>
          {entry.scripture && <p className="text-[0.6875rem] text-[#5A6E3D] mb-1" style={serif}>{entry.scripture}</p>}
          {entry.plain && <p className="text-sm text-[#1A1815] whitespace-pre-wrap" style={serif}>{entry.plain}</p>}
          {entry.deep && <p className="text-[0.8125rem] text-[#5A5751] whitespace-pre-wrap mt-1.5" style={serif}>{entry.deep}</p>}
          {!entry.plain && !entry.deep && <p className="text-xs text-[#5A5751] italic" style={serif}>No body — just a title.</p>}
        </div>

        {/* The framework treatment — editable suggestion. */}
        <div className="border-l-2 border-[#5A6E3D] pl-2 space-y-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">
            The 4D framework treatment {fin.source ? <span className="text-[#5A5751] normal-case">· {fin.source === 'manual' ? 'your words' : fin.source === 'vendor' ? 'vendor model' : 'local model'}</span> : ''}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={LABEL} htmlFor={`fz-out-${entry.id}`}>✦ Outcome — you win with it</label>
              <MicButton onText={append('outcome')} label="the outcome" />
            </div>
            <textarea id={`fz-out-${entry.id}`} className={AREA} rows="2" value={draft.outcome} onChange={set('outcome')} placeholder="The result of living it." />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={LABEL} htmlFor={`fz-4d-${entry.id}`}>4D · eternal / scriptural</label>
              <MicButton onText={append('fourSummary')} label="the 4D expression" />
            </div>
            <textarea id={`fz-4d-${entry.id}`} className={AREA} rows="3" value={draft.fourSummary} onChange={set('fourSummary')} placeholder="The eternal / scriptural reading. Quote ESV accurately; leave empty rather than inventing a verse." />
            <label className={`${LABEL} mt-1`} htmlFor={`fz-scr-${entry.id}`}>Scripture refs</label>
            <input id={`fz-scr-${entry.id}`} className={FIELD} value={draft.scripture} onChange={set('scripture')} placeholder="e.g. James 1:2-4 (optional)" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={LABEL} htmlFor={`fz-3d-${entry.id}`}>3D · practical / temporal</label>
              <MicButton onText={append('threeSummary')} label="the 3D expression" />
            </div>
            <textarea id={`fz-3d-${entry.id}`} className={AREA} rows="3" value={draft.threeSummary} onChange={set('threeSummary')} placeholder="How it plays out in this-world life and work." />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E8E4DC] flex-wrap">
        <button type="button" disabled={busy || !draftHasAll} onClick={accept} className={`${BTN} bg-[#5A6E3D] text-white font-semibold hover:bg-[#1A1815] disabled:opacity-50`} title={draftHasAll ? '' : 'Fill all three parts (4D, 3D, Outcome) first'}>{ready ? 'Re-accept' : '✓ Accept · teaching-ready'}</button>
        <button type="button" disabled={busy} onClick={saveEdits} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-[#FAF8F4] disabled:opacity-50`}>Save edits</button>
        {/* Promote to the finished gallery — ONLY when teaching-ready (accepted +
            all parts). A draft can't promote; it stays here in the workshop. */}
        {ready && onPromote && (
          <button type="button" disabled={busy} onClick={() => onPromote(entry)} className={`${BTN} ${inLibrary ? 'border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#F2F4EC]' : 'bg-[#B85838] text-white font-semibold hover:bg-[#1A1815]'} disabled:opacity-50`} title="Send this finished framework to the Eternal Algorithms library">
            {inLibrary ? '↻ Update in Eternal Algorithms' : '✦ Promote to Eternal Algorithms'}
          </button>
        )}
        {(status !== 'unfinalized' || draftHasAll) && (
          <button type="button" disabled={busy} onClick={dismiss} className={`${BTN} text-[#5A5751] hover:text-[#B85838] ml-auto`}>Clear treatment</button>
        )}
      </div>
      {ready && inLibrary && (
        <p className="text-[0.625rem] text-[#5A6E3D] mt-1.5" style={serif}>✓ In the Eternal Algorithms library. Edits here re-accept; press Update to refresh the finished entry.</p>
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
  const [notice, setNotice] = useState(null); // { kind:'offline'|'done'|'capped'|'promoted', text }
  // The Study-thought ids already promoted into the Eternal Algorithms library —
  // so a teaching-ready card shows Promote vs. Update. Loaded once per identity.
  const [promotedIds, setPromotedIds] = useState(() => new Set());
  const abortRef = useRef(null);

  useEffect(() => {
    setPromotedIds(promotedSourceIds(loadLibrary(email).entries));
  }, [email]);

  const prog = useMemo(() => finalizationProgress(entries), [entries]);
  const pending = useMemo(() => unfinalizedThoughts(entries), [entries]);
  const ready = useMemo(() => entries.filter(isTeachingReady), [entries]);

  // Promote a finalized thought into the finished gallery. The gate lives in
  // promoteFromStudy: a non-final draft is rejected (it never reaches here,
  // since the button only shows when teaching-ready). Idempotent by sourceId —
  // re-promoting an edited thought UPDATES its entry. The library is seeded first
  // so promoting before ever opening the gallery never drops the seed catalog.
  const onPromote = (entry) => {
    const draft = toEternalAlgorithmDraft(entry);
    if (!draft) return; // not teaching-ready — defensive; the button is gated already
    const lib = seedIfEmpty(loadLibrary(email), Date.now());
    const res = promoteFromStudy(lib, draft, { sourceId: entry.id, nowMs: Date.now() });
    if (!res.ok) {
      setNotice({ kind: 'offline', text: `Can't promote yet — still needs: ${(res.missing || []).join(', ')}.` });
      return;
    }
    saveLibrary(email, res.library);
    setPromotedIds(promotedSourceIds(res.library.entries));
    setNotice({ kind: 'promoted', text: `“${draft.name}” is in the Eternal Algorithms library — the finished gallery. Open it from the Eternal Algorithms tab.` });
  };

  const stop = () => { if (abortRef.current) abortRef.current.abort(); setRunning(false); };

  const finalizeAll = async () => {
    if (running) return; // single in-flight LOCK
    const batch = pending.slice(0, BATCH_CAP);
    const remainder = pending.length - batch.length;
    if (!batch.length) { setNotice({ kind: 'done', text: 'Every thought is already finalized.' }); return; }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    setNotice(null);
    setProgress({ done: 0, total: batch.length });
    let offline = 0;
    let applied = 0;
    for (let i = 0; i < batch.length; i++) {
      if (ctrl.signal.aborted) break;
      const entry = batch[i];
      const res = await askFinalizer(entry, { signal: ctrl.signal });
      if (res.ok && res.suggestion) {
        onSaveEntry(applySuggestion(entry, res.suggestion, { source: res.source, generatedAt: new Date().toISOString() }));
        applied += 1;
      } else if (res.error === 'unreachable' || res.error === 'empty' || (res.error || '').startsWith('http_')) {
        offline += 1;
      }
      setProgress({ done: i + 1, total: batch.length });
    }
    setRunning(false);
    abortRef.current = null;
    if (offline > 0 && applied === 0) {
      setNotice({ kind: 'offline', text: 'The local model on the NAS is not reachable right now — nothing was fabricated. You can fill each treatment by hand below; it saves the same way.' });
    } else if (remainder > 0) {
      setNotice({ kind: 'capped', text: `Reviewed ${applied} thought${applied === 1 ? '' : 's'}. ${remainder} more remain (capped at ${BATCH_CAP} per press) — press “Finalize my thoughts” again to continue.` });
    } else {
      setNotice({ kind: 'done', text: `Reviewed ${applied} thought${applied === 1 ? '' : 's'}. Read each suggestion, edit if needed, then Accept to make it teaching-ready.` });
    }
  };

  return (
    <div>
      <div className="bg-white border border-[#1A1815] p-3 mb-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold">Finalize my thoughts</div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={serif}>
              Review every unfinalized thought and apply your 4th-dimensional framework — 4D (eternal / scriptural), 3D (practical), and the Outcome — so each looks finished and is ready to teach from. Your own words are never changed.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">{prog.finalized} teaching-ready</div>
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{prog.pending} to finalize</div>
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
          <span className="text-[0.625rem] text-[#5A5751] italic" style={serif}>On-demand only — runs when you press it, never on its own.</span>
        </div>
        {notice && (
          <div className={`mt-2 text-[0.6875rem] p-2 border ${notice.kind === 'offline' ? 'border-[#B45309] bg-[#FAF8F4] text-[#9A3412]' : notice.kind === 'promoted' ? 'border-[#5A6E3D] bg-[#F2F4EC] text-[#5A6E3D]' : 'border-[#E8E4DC] bg-[#FAF8F4] text-[#5A5751]'}`} style={serif} role="status">
            {notice.text}
          </div>
        )}
      </div>

      {pending.length === 0 && ready.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">✦</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={serif}>No thoughts to finalize yet.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>Write a thought in the Workspace, then come back and finalize it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pending first (the work), then the teaching-ready ones (the proof). */}
          {pending.map((e) => <FinalizeCard key={e.id} entry={e} onSave={onSaveEntry} busy={running} onPromote={onPromote} inLibrary={promotedIds.has(e.id)} />)}
          {ready.map((e) => <FinalizeCard key={e.id} entry={e} onSave={onSaveEntry} busy={running} onPromote={onPromote} inLibrary={promotedIds.has(e.id)} />)}
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif}>
        Teaching-ready thoughts feed the content engine downstream (lessons, courses, the Eternal Algorithms library). Sovereign &amp; private: this lives on this device only, reviewed by the family&apos;s local model — never sent to the cloud, never mined, never used to train anything.
      </p>
    </div>
  );
}

export { ThoughtFinalizer };
