// =============================================================================
// LessonDecide — the Governor decides which version ships: choose one, merge
// part by part, or take all with the best part of each (DR-0672)
// =============================================================================
// Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for
// me to review their and the decide on which one or merge 2 of them or all of
// them..."
// The live preview is the lesson as it will be. Text can be edited before
// publishing, but a quoted verse span is locked: the editor only offers the
// words between spans, and the publish contract refuses any other change
// (lib/lesson-decisions.js). PUBLISH writes one lesson_decisions row; the
// builder re-runs every gate on the composite and ships only if all pass.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  partsFor, partOf, isTextPart, defaultPicks, composeLesson, faultsIn,
  splitLocked, editSegment, joinSegments, publishDecision,
} from '../lib/lesson-decisions.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838]';

export function partLabel(part) {
  if (part === 'base') return 'Everything else (anchor, big idea, benefits, talking points)';
  if (part === 'title') return 'Title';
  if (part === 'lesson') return 'The full lesson';
  if (part === 'quiz') return 'Quiz';
  if (part.startsWith('movement:')) return `Movement ${part.slice(9)}`;
  if (part.startsWith('band:')) return `${part.slice(5)[0].toUpperCase()}${part.slice(6)} band`;
  return part;
}

function when(iso) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

// The state of the newest decision, said plainly.
function DecisionStatus({ review }) {
  const d = review && review.latest;
  if (!review || review.state === 'awaiting') return <p className="text-[0.75rem] text-[#8B6F47] font-semibold" style={SERIF} data-testid="decide-status" data-state="awaiting">Waiting for your decision. Nothing ships until you decide.</p>;
  if (review.state === 'pending') return <p className="text-[0.75rem] text-[#2A5A8E] font-semibold" style={SERIF} data-testid="decide-status" data-state="pending">Sent {when(d.decided_at)} ({d.mode}). The builder re-runs every gate on the final lesson before it ships.</p>;
  if (review.state === 'building') return <p className="text-[0.75rem] text-[#2A5A8E] font-semibold" style={SERIF} data-testid="decide-status" data-state="building">The builder is gating the final lesson now.</p>;
  if (review.state === 'shipped') return <p className="text-[0.75rem] text-[#5A6E3D] font-semibold" style={SERIF} data-testid="decide-status" data-state="shipped">Shipped: every gate passed on the final lesson{d.lesson_id ? ` (${d.lesson_id}` : ''}{d.pr_number ? `, PR #${d.pr_number}` : ''}{d.lesson_id ? ')' : ''}.</p>;
  if (review.state === 'gate-failed') {
    return (
      <div data-testid="decide-status" data-state="gate-failed">
        <p className="text-[0.75rem] text-[#B85838] font-semibold" style={SERIF}>A gate failed on the final lesson. Nothing shipped. Decide again below.</p>
        <ul className="list-disc ml-4 text-[0.6875rem] text-[#1A1815]" style={SERIF} data-testid="decide-gate-failures">
          {(review.failures || []).map((f, i) => <li key={i} className="break-words"><span className="font-semibold">{f.check}</span> · {partLabel(f.part)}{f.detail ? `: ${f.detail}` : ''}</li>)}
          {!(review.failures || []).length && <li>The builder did not name the check.</li>}
        </ul>
      </div>
    );
  }
  return null;
}

// Edit one text part; each quoted verse span is shown locked, never a field.
function LockedEditor({ part, text, onChange }) {
  const segments = splitLocked(text);
  return (
    <div className="mt-1 border border-[#E8E4DC] bg-white p-1.5" data-testid={`decide-editor-${part}`}>
      {segments.map((seg, i) => (seg.locked ? (
        <p key={i} className="text-[0.75rem] text-[#1A1815] bg-[#FAF8F4] border-l-2 border-[#5A6E3D] px-1.5 my-1 break-words" style={SERIF} data-testid="decide-locked-span">
          <span className="sr-only">Scripture, locked: </span><span aria-hidden="true">{'\u{1F512} '}</span>{seg.text}
        </p>
      ) : (
        <textarea
          key={i}
          aria-label={`${partLabel(part)}, your words ${i + 1}`}
          className="w-full text-[0.75rem] text-[#1A1815] border border-[#E8E4DC] p-1 min-h-[44px]"
          style={SERIF}
          rows={Math.min(8, Math.max(2, Math.ceil(seg.text.length / 80)))}
          value={seg.text}
          onChange={(e) => onChange(joinSegments(editSegment(segments, i, e.target.value)))}
        />
      )))}
    </div>
  );
}

function Preview({ lesson }) {
  const bands = lesson.levels || {};
  const qs = (lesson.quiz && lesson.quiz.questions) || [];
  return (
    <div className="border border-[#5A6E3D] bg-white p-2 mt-2" data-testid="decide-preview">
      <p className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">Preview, as it will ship</p>
      <p className="text-sm font-semibold text-[#1A1815] break-words" style={SERIF} data-testid="decide-preview-title">{lesson.title || '(no title)'}</p>
      {Array.isArray(lesson.movements) && lesson.movements.length > 0 && (
        <ol className="list-decimal ml-4 text-[0.6875rem] text-[#1A1815] break-words" style={SERIF} data-testid="decide-preview-movements">
          {lesson.movements.map((m, i) => <li key={i}>{m}</li>)}
        </ol>
      )}
      <details className="mt-1">
        <summary className="cursor-pointer min-h-[44px] flex items-center text-[0.625rem] uppercase tracking-wider text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Read the full lesson and bands</summary>
        <p className="text-[0.75rem] text-[#1A1815] whitespace-pre-wrap break-words" style={SERIF} data-testid="decide-preview-lesson">{lesson.lesson || ''}</p>
        {Object.entries(bands).map(([b, t]) => <p key={b} className="text-[0.6875rem] text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF}><span className="font-semibold">{partLabel(`band:${b}`)}:</span> {t}</p>)}
      </details>
      <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>Quiz: {qs.length} questions</p>
    </div>
  );
}

export default function LessonDecide({ versions, teachingRowId, buildId = null, review, deps, onPublished }) {
  const withIds = useMemo(() => versions.filter((v) => v.id), [versions]);
  const best = useMemo(() => defaultPicks(withIds), [withIds]);
  const [mode, setMode] = useState('all');
  const [chosen, setChosen] = useState(best.base || '');
  const [picks, setPicks] = useState(best);
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const parts = partsFor(withIds);
  const open = !review || review.state === 'awaiting' || review.state === 'gate-failed';

  const effectivePicks = mode === 'choose'
    ? Object.fromEntries(parts.map((p) => [p, chosen]))
    : picks;
  const preview = composeLesson(withIds, effectivePicks, edits);
  const sourceOf = (part) => withIds.find((v) => v.id === effectivePicks[part]);

  const setMode2 = (m) => {
    setMode(m); setEdits({}); setEditing({}); setResult(null);
    if (m === 'all') setPicks(best);
    if (m === 'merge') setPicks(Object.fromEntries(parts.map((p) => [p, partOf(withIds.find((v) => v.id === best.base), p) !== undefined ? best.base : best[p]]).filter(([, v]) => v)));
  };

  const publish = async () => {
    setBusy(true);
    const res = await publishDecision({
      supabase: deps.supabase, uid: deps.uid, email: deps.email,
      decision: { teachingRowId, buildId, mode, chosenVersionId: chosen, picks, edits, versions: withIds },
    });
    setBusy(false);
    setResult(res);
    if (res.ok && onPublished) onPublished(res);
  };

  if (withIds.length < 2) return null;
  return (
    <section className="mt-2 border-t border-[#E8E4DC] pt-2" data-testid="lesson-decide" aria-label="Decide which version ships">
      <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Your decision</h4>
      <DecisionStatus review={review} />
      {open && (
        <>
          <div className="flex flex-wrap gap-1 mt-1" role="radiogroup" aria-label="How to decide">
            {[['choose', 'Choose one'], ['merge', 'Merge parts'], ['all', 'Take all (best part of each)']].map(([m, label]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} data-testid={`decide-mode-${m}`} onClick={() => setMode2(m)}
                className={`${BTN} ${mode === m ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#1A1815] text-[#1A1815] bg-white'}`}>{label}</button>
            ))}
          </div>

          {mode === 'choose' ? (
            <fieldset className="mt-1">
              <legend className="sr-only">Choose one version</legend>
              {withIds.map((v) => (
                <label key={v.id} className="flex items-center gap-2 min-h-[44px] text-[0.75rem] text-[#1A1815]" style={SERIF}>
                  <input type="radio" name={`choose-${teachingRowId}`} checked={chosen === v.id} onChange={() => { setChosen(v.id); setEdits({}); }} data-testid="decide-choose-option" />
                  <span className="break-words">{v.writer} · {v.model}{v.gates.verses.measured ? ` · verses ${v.gates.verses.verbatim}/${v.gates.verses.total}` : ''}</span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className="overflow-x-auto mt-1">
              <table className="text-[0.6875rem] text-[#1A1815] border-collapse" style={SERIF} data-testid="decide-merge-map">
                <caption className="sr-only">For each part, which version to use</caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-left pr-2 font-semibold">Part</th>
                    {withIds.map((v) => <th key={v.id} scope="col" className="text-left pr-2 font-semibold break-words">{v.writer}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part} data-part={part}>
                      <th scope="row" className="text-left pr-2 font-normal">{partLabel(part)}</th>
                      {withIds.map((v) => {
                        const has = partOf(v, part) !== undefined;
                        const faults = has ? faultsIn(v, part) : 0;
                        return (
                          <td key={v.id} className="pr-2">
                            <label className="inline-flex items-center gap-1 min-h-[44px]">
                              <input type="radio" name={`${teachingRowId}-${part}`} disabled={!has} checked={picks[part] === v.id}
                                onChange={() => { setPicks((p) => ({ ...p, [part]: v.id })); setEdits((e) => { const n = { ...e }; delete n[part]; return n; }); }}
                                aria-label={`${partLabel(part)} from ${v.writer}`} />
                              <span className={faults ? 'text-[#B85838]' : 'text-[#5A5751]'}>{has ? (faults ? `${faults} verse fault${faults > 1 ? 's' : ''}` : 'use') : 'none'}</span>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* EDIT BEFORE PUBLISHING — Scripture spans locked. */}
          <div className="mt-1" data-testid="decide-edits">
            {parts.filter(isTextPart).filter((p) => sourceOf(p) && partOf(sourceOf(p), p) !== undefined).map((part) => {
              const original = partOf(sourceOf(part), part);
              const value = typeof edits[part] === 'string' ? edits[part] : original;
              return (
                <div key={part}>
                  <button type="button" className={`${BTN} border-[#E8E4DC] text-[#5A5751] mr-1 mt-1`} aria-expanded={!!editing[part]} data-testid={`decide-edit-${part}`}
                    onClick={() => setEditing((e) => ({ ...e, [part]: !e[part] }))}>
                    {editing[part] ? 'Done editing' : `Edit ${partLabel(part).toLowerCase()}`}{edits[part] !== undefined && edits[part] !== original ? ' (edited)' : ''}
                  </button>
                  {editing[part] && <LockedEditor part={part} text={value} onChange={(t) => setEdits((e) => ({ ...e, [part]: t }))} />}
                </div>
              );
            })}
          </div>

          <Preview lesson={preview} />

          <button type="button" disabled={busy} onClick={publish} data-testid="decide-publish"
            className={`${BTN} mt-2 border-[#5A6E3D] bg-[#5A6E3D] text-white disabled:opacity-50`}>
            {busy ? 'Sending…' : 'Publish this decision'}
          </button>
          <p className="text-[0.625rem] text-[#5A5751] italic" style={SERIF}>The builder re-runs every gate on this final lesson. If any gate fails, nothing ships and the failure shows here.</p>
          {result && !result.ok && (
            <ul className="list-disc ml-4 text-[0.6875rem] text-[#B85838]" style={SERIF} data-testid="decide-problems">
              {result.problems.map((p, i) => <li key={i} className="break-words">{p}</li>)}
            </ul>
          )}
          {result && result.ok && <p className="text-[0.75rem] text-[#5A6E3D] font-semibold" style={SERIF} data-testid="decide-sent">Sent. The builder takes it from here.</p>}
        </>
      )}
    </section>
  );
}
