// =============================================================================
// LessonDecide — the Governor decides which version ships: choose one, merge
// part by part, or take all with the best part of each (DR-0672 over DR-0669)
// =============================================================================
// Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for
// me to review their and the decide on which one or merge 2 of them or all of
// them..."
// The live preview is the lesson as the builder will assemble it. Text can be
// edited before publishing, but every quoted span is locked: the editor only
// offers the words between them, and the publish contract refuses any other
// change (lib/lesson-decisions.js), as the builder does again. PUBLISH inserts
// one lesson_decisions row; the builder re-runs every gate on the composite
// and ships only if all pass; a failure comes back here naming check and part.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  partsFor, partOf, defaultPicks, composeLesson, faultsIn, editKeysFor, editOriginal,
  splitLocked, editSegment, joinSegments, publishDecision,
} from '../lib/lesson-decisions.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838]';
const NAMES = {
  base: 'Everything else (anchor, in the app, placement)', title: 'Title', bigIdea: 'Big idea', lesson_intro: 'Opening',
  lesson_close: 'Closing', quiz: 'Quiz', benefits: 'Benefits', facilitator: 'Talking points', structure: 'Structure', levels: 'The bands',
};

export function partLabel(part) {
  const p = String(part || '');
  if (NAMES[p]) return NAMES[p];
  let m = /^movements\.(\d+)(?:\.(title|text))?$/.exec(p);
  if (m) return `Movement ${Number(m[1]) + 1}${m[2] === 'title' ? ' title' : m[2] === 'text' ? ' text' : ''}`;
  m = /^levels\.(child|youth|teen|senior)$/.exec(p);
  if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)} band`;
  return p || 'the lesson';
}

function when(iso) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

// The state of the newest decision, said plainly.
function DecisionStatus({ review }) {
  const d = review && review.latest;
  const say = (state, cls, text) => <p className={`text-[0.75rem] font-semibold ${cls}`} style={SERIF} data-testid="decide-status" data-state={state}>{text}</p>;
  if (!review || review.state === 'awaiting') return say('awaiting', 'text-[#8B6F47]', 'Waiting for your decision. Nothing ships until you decide.');
  if (review.state === 'pending') return say('pending', 'text-[#2A5A8E]', `Sent ${when(d.decided_at)}. The builder re-runs every gate on the final lesson before it ships.`);
  if (review.state === 'building') return say('building', 'text-[#2A5A8E]', 'The builder is gating and building the final lesson now.');
  if (review.state === 'shipped') {
    return (
      <p className="text-[0.75rem] font-semibold text-[#5A6E3D] break-words" style={SERIF} data-testid="decide-status" data-state="shipped">
        Shipped: every gate passed on the final lesson{d.lesson_id ? ` (${d.lesson_id})` : ''}.
        {d.pr_url ? <> <a href={d.pr_url} className="underline text-[#B85838] hover:text-[#1A1815] inline-flex items-center min-h-[44px]" data-testid="decide-pr-link">Its pull request</a></> : null}
      </p>
    );
  }
  if (review.state === 'gate-failed' || review.state === 'failed') {
    return (
      <div data-testid="decide-status" data-state={review.state}>
        <p className="text-[0.75rem] text-[#B85838] font-semibold" style={SERIF}>{review.state === 'gate-failed' ? 'A gate failed on the final lesson.' : 'The build of your decision failed.'} Nothing shipped. Decide again below.</p>
        <ul className="list-disc ml-4 text-[0.6875rem] text-[#1A1815]" style={SERIF} data-testid="decide-gate-failures">
          {(review.failures || []).map((f, i) => <li key={i} className="break-words"><span className="font-semibold">{f.check}</span>{f.part ? ` · ${partLabel(f.part)}` : ''}{f.detail ? `: ${f.detail}` : ''}</li>)}
          {!(review.failures || []).length && <li>The builder did not name the check.</li>}
        </ul>
      </div>
    );
  }
  return null;
}

// Edit one text; each quoted span is shown locked, never a field.
function LockedEditor({ editKey, text, onChange }) {
  const segments = splitLocked(text);
  return (
    <div className="mt-1 border border-[#E8E4DC] bg-white p-1.5" data-testid={`decide-editor-${editKey}`}>
      {segments.map((seg, i) => (seg.locked ? (
        <p key={i} className="text-[0.75rem] text-[#1A1815] bg-[#FAF8F4] border-l-2 border-[#5A6E3D] px-1.5 my-1 break-words" style={SERIF} data-testid="decide-locked-span">
          <span className="sr-only">Quoted, locked: </span><span aria-hidden="true">{'\u{1F512} '}</span>{seg.text}
        </p>
      ) : (
        <textarea
          key={i}
          aria-label={`${partLabel(editKey)}, your words ${i + 1}`}
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

const movementTitle = (m) => (m && typeof m === 'object' ? m.title || '' : String(m || ''));
const movementText = (m) => (m && typeof m === 'object' ? m.text || '' : '');

function Preview({ lesson }) {
  const bands = lesson.levels || {};
  const qs = (lesson.quiz && lesson.quiz.questions) || [];
  const ms = Array.isArray(lesson.movements) ? lesson.movements : [];
  return (
    <div className="border border-[#5A6E3D] bg-white p-2 mt-2" data-testid="decide-preview">
      <p className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">Preview, as it will be gated</p>
      <p className="text-sm font-semibold text-[#1A1815] break-words" style={SERIF} data-testid="decide-preview-title">{lesson.title || '(no title)'}</p>
      {ms.length > 0 && (
        <ol className="list-decimal ml-4 text-[0.6875rem] text-[#1A1815] break-words" style={SERIF} data-testid="decide-preview-movements">
          {ms.map((m, i) => <li key={i}>{movementTitle(m)}</li>)}
        </ol>
      )}
      <details className="mt-1">
        <summary className="cursor-pointer min-h-[44px] flex items-center text-[0.625rem] uppercase tracking-wider text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Read the whole lesson and bands</summary>
        <div data-testid="decide-preview-lesson">
          {lesson.lesson_intro && <p className="text-[0.75rem] text-[#1A1815] whitespace-pre-wrap break-words" style={SERIF}>{lesson.lesson_intro}</p>}
          {ms.map((m, i) => <p key={i} className="text-[0.75rem] text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF}><span className="font-semibold">{i + 1}. {movementTitle(m)}</span>{movementText(m) ? `\n${movementText(m)}` : ''}</p>)}
          {lesson.lesson_close && <p className="text-[0.75rem] text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF}>{lesson.lesson_close}</p>}
          {!lesson.lesson_intro && !ms.length && lesson.lesson && <p className="text-[0.75rem] text-[#1A1815] whitespace-pre-wrap break-words" style={SERIF}>{lesson.lesson}</p>}
        </div>
        {Object.entries(bands).map(([b, t]) => <p key={b} className="text-[0.6875rem] text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF}><span className="font-semibold">{partLabel(`levels.${b}`)}:</span> {t}</p>)}
      </details>
      <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>Quiz: {qs.length} questions</p>
    </div>
  );
}

export default function LessonDecide({ versions, review, deps, onPublished }) {
  const lessons = useMemo(() => versions.filter((v) => v.id && v.isLesson !== false), [versions]);
  const best = useMemo(() => defaultPicks(lessons), [lessons]);
  const [mode, setMode] = useState('all');
  const [chosen, setChosen] = useState(best.base || '');
  const [picks, setPicks] = useState(best);
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const parts = partsFor(lessons);
  const open = !review || ['awaiting', 'gate-failed', 'failed'].includes(review.state);

  const effectivePicks = mode === 'choose' ? { base: chosen } : picks;
  const unedited = composeLesson(lessons, effectivePicks, {});
  const preview = composeLesson(lessons, effectivePicks, edits);
  const sourceOf = (part) => lessons.find((v) => v.id === (mode === 'choose' ? chosen : (effectivePicks[part] || effectivePicks.base)));
  const editKeys = parts.filter((p) => p !== 'base').flatMap((p) => (sourceOf(p) ? editKeysFor(p, sourceOf(p)) : []))
    .filter((k) => typeof editOriginal(unedited, k) === 'string');

  const switchMode = (m) => {
    setMode(m); setEdits({}); setEditing({}); setResult(null);
    if (m === 'all') setPicks(best);
    if (m === 'merge') setPicks({ base: best.base });
  };

  const publish = async () => {
    setBusy(true);
    const res = await publishDecision({
      supabase: deps.supabase, uid: deps.uid, email: deps.email,
      decision: { mode, chosenVersionId: chosen, picks, edits, versions: lessons },
    });
    setBusy(false);
    setResult(res);
    if (res.ok && onPublished) onPublished(res);
  };

  if (lessons.length < 2) return null;
  return (
    <section className="mt-2 border-t border-[#E8E4DC] pt-2" data-testid="lesson-decide" aria-label="Decide which version ships">
      <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Your decision</h4>
      <DecisionStatus review={review} />
      {open && (
        <>
          <div className="flex flex-wrap gap-1 mt-1" role="radiogroup" aria-label="How to decide">
            {[['choose', 'Choose one'], ['merge', 'Merge parts'], ['all', 'Take all (best part of each)']].map(([m, label]) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} data-testid={`decide-mode-${m}`} onClick={() => switchMode(m)}
                className={`${BTN} ${mode === m ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#1A1815] text-[#1A1815] bg-white'}`}>{label}</button>
            ))}
          </div>

          {mode === 'choose' ? (
            <fieldset className="mt-1">
              <legend className="sr-only">Choose one version</legend>
              {lessons.map((v) => (
                <label key={v.id} className="flex items-center gap-2 min-h-[44px] text-[0.75rem] text-[#1A1815]" style={SERIF}>
                  <input type="radio" name={`choose-${v.buildId}`} checked={chosen === v.id} onChange={() => { setChosen(v.id); setEdits({}); }} data-testid="decide-choose-option" />
                  <span className="break-words">{v.writer} · {v.model}{v.gates.verses.measured ? ` · verses ${v.gates.verses.verbatim}/${v.gates.verses.total}` : ''}{v.gates.passed ? ' · every gate passed' : ''}</span>
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
                    {lessons.map((v) => <th key={v.id} scope="col" className="text-left pr-2 font-semibold break-words">{v.writer}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part} data-part={part}>
                      <th scope="row" className="text-left pr-2 font-normal">{partLabel(part)}</th>
                      {lessons.map((v) => {
                        const has = partOf(v, part) !== undefined;
                        const faults = has && part !== 'base' ? faultsIn(v, part) : 0;
                        const current = picks[part] || (part !== 'base' ? picks.base : undefined);
                        return (
                          <td key={v.id} className="pr-2">
                            <label className="inline-flex items-center gap-1 min-h-[44px]">
                              <input type="radio" name={`${v.buildId}-${part}`} disabled={!has} checked={current === v.id}
                                onChange={() => { setPicks((p) => ({ ...p, [part]: v.id })); setEdits({}); }}
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

          {/* EDIT BEFORE PUBLISHING — every quoted span locked. */}
          <div className="mt-1" data-testid="decide-edits">
            {editKeys.map((key) => {
              const original = editOriginal(unedited, key);
              const value = typeof edits[key] === 'string' ? edits[key] : original;
              return (
                <div key={key}>
                  <button type="button" className={`${BTN} border-[#E8E4DC] text-[#5A5751] mr-1 mt-1`} aria-expanded={!!editing[key]} data-testid={`decide-edit-${key}`}
                    onClick={() => setEditing((e) => ({ ...e, [key]: !e[key] }))}>
                    {editing[key] ? 'Done editing' : `Edit ${partLabel(key).toLowerCase()}`}{edits[key] !== undefined && edits[key] !== original ? ' (edited)' : ''}
                  </button>
                  {editing[key] && <LockedEditor editKey={key} text={value} onChange={(t) => setEdits((e) => ({ ...e, [key]: t }))} />}
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
