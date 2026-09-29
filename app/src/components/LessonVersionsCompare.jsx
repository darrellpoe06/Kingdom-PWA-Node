// =============================================================================
// LessonVersionsCompare — every writer's version of one lesson, side by side
// (DR-0672, over DR-0669's lesson_versions; the Governor only)
// =============================================================================
// Darrell 2026-09-29: "I want to be able to use any LLM? To see the difference
// between lessons after they receive the same prompts... and have both versions
// of the same lessons to validate against."
// Side by side from 1024px up, stacked on a phone. Each version: its writer and
// model, the gates as the builder measured them, how long it took, whether it
// shipped. Above them, the proof they all got one prompt (the sha256, and the
// prompt itself to read). Below, where they differ: movements and verses.
// =============================================================================
import React from 'react';
import { promptProof, compareVersions, shippedOf, formatMs } from '../lib/lesson-versions.js';
import LessonDecide from './LessonDecide.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const shortSha = (s) => (s && s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-8)}` : s || '');
const GRID = { 1: 'grid grid-cols-1 gap-2', 2: 'grid grid-cols-1 lg:grid-cols-2 gap-2', 3: 'grid grid-cols-1 lg:grid-cols-3 gap-2' };
const SUMMARY = 'cursor-pointer min-h-[44px] flex items-center text-[0.625rem] uppercase tracking-wider text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';

function Gates({ v }) {
  const g = v.gates;
  return (
    <dl className="text-[0.6875rem] text-[#1A1815] space-y-0.5" style={SERIF} data-testid="version-gates">
      <div className="flex gap-1 flex-wrap">
        <dt className="text-[#5A5751]">Verses verbatim:</dt>
        <dd className={g.verses.measured ? (g.verses.allVerbatim ? 'text-[#5A6E3D] font-semibold' : 'text-[#B85838] font-semibold') : 'text-[#5A5751]'} data-testid="version-verbatim">
          {g.verses.measured ? `${g.verses.verbatim} / ${g.verses.total}` : 'not measured'}
        </dd>
      </div>
      {g.verses.mismatches.length > 0 && (
        <div>
          <dt className="text-[#5A5751]">Not verbatim:</dt>
          <dd>
            <ul className="list-disc ml-4" data-testid="version-mismatches">
              {g.verses.mismatches.map((m, i) => <li key={i} className="break-words"><span style={MONO}>{m.ref || 'a verse'}</span>{m.where ? ` (in ${m.where})` : ''}{m.why ? `: ${m.why}` : ''}</li>)}
            </ul>
          </dd>
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        <dt className="text-[#5A5751]">Structure:</dt>
        <dd data-testid="version-structure">{g.structure.measured ? `${g.structure.passed} of ${g.structure.ran} checks pass` : 'not measured'}</dd>
      </div>
      {g.structure.checks.filter((c) => !c.ok).map((c, i) => (
        <dd key={i} className={`break-words ml-2 ${c.skipped ? 'text-[#5A5751]' : 'text-[#B85838]'}`} data-testid="version-check-failed">{c.skipped ? '–' : '✕'} {c.check}{c.detail ? `: ${c.detail}` : ''}</dd>
      ))}
      {g.verses.why && <dd className="text-[#B85838] break-words">{g.verses.why}</dd>}
      <div className="flex gap-1 flex-wrap">
        <dt className="text-[#5A5751]">Took:</dt>
        <dd style={MONO} data-testid="version-elapsed">{formatMs(v.elapsedMs) || 'not measured'}</dd>
      </div>
    </dl>
  );
}

export default function LessonVersionsCompare({ versions, state = 'ok', reason = '', decide = null }) {
  if (state === 'not-yet' || state === 'error' || !versions || versions.length === 0) {
    return (
      <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF} data-testid="versions-none">
        {state === 'error' ? `The versions could not be read (${reason}).` : 'No versions yet. When the lesson builder sends this teaching to more than one writer, every version appears here side by side.'}
      </p>
    );
  }
  const proof = promptProof(versions);
  const diff = compareVersions(versions);
  const ship = shippedOf(versions);
  const cols = Math.min(versions.length, 3);
  return (
    <section className="mt-2 border border-[#E8E4DC] p-2 bg-[#FAF8F4]" data-testid="versions-compare" aria-label="Every version of this lesson">
      <h3 className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Versions · {versions.length}</h3>

      {/* THE SAME PROMPT, PROVEN — the sha256 each row carries. */}
      <div className="mt-1" data-testid="prompt-proof" data-same={proof.same ? 'yes' : 'no'}>
        {proof.same ? (
          <p className="text-[0.6875rem] text-[#5A6E3D] font-semibold break-words" style={SERIF}>
            Same prompt for all {proof.count}: sha256 <span style={MONO} title={proof.sha}>{shortSha(proof.sha)}</span>
          </p>
        ) : (
          <p className="text-[0.6875rem] text-[#B85838] font-semibold break-words" style={SERIF}>
            Not the same prompt: {proof.shas.length} different sha256{proof.missing ? `, and ${proof.missing} with none recorded` : ''}. These versions cannot be compared fairly.
          </p>
        )}
        {versions[0].promptText && (
          <details className="mt-0.5">
            <summary className={SUMMARY}>Read the prompt</summary>
            <pre className="text-[0.6875rem] whitespace-pre-wrap break-words bg-white border border-[#E8E4DC] p-2 max-h-80 overflow-auto" style={MONO} data-testid="prompt-text">{versions[0].promptText}</pre>
          </details>
        )}
      </div>

      <p className="text-[0.6875rem] mt-1 text-[#1A1815] break-words" style={SERIF} data-testid="version-shipped-why">
        {ship.version ? <><span className="font-semibold text-[#5A6E3D]">Shipped: {ship.version.writer} ({ship.version.model}).</span> {ship.why}</> : ship.why}
      </p>

      <ul className={`${GRID[cols]} mt-2`}>
        {versions.map((v) => (
          <li key={v.key} className={`bg-white border p-2 min-w-0 ${v.published ? 'border-[#5A6E3D] border-2' : 'border-[#E8E4DC]'}`} data-testid="version-card" data-published={v.published ? 'yes' : 'no'}>
            <p className="text-xs font-semibold text-[#1A1815] break-words" style={SERIF}>
              {v.writer} <span className="text-[#5A5751] font-normal">· {v.model}</span>
            </p>
            {v.published && <p className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#5A6E3D]" data-testid="version-shipped">Shipped</p>}
            {v.title && <p className="text-[0.75rem] text-[#1A1815] italic break-words" style={SERIF}>{v.title}</p>}
            <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>{v.movements.length} movements · {v.refs.length} references</p>
            <Gates v={v} />
            <details className="mt-1">
              <summary className={SUMMARY}>Read the full version</summary>
              <div data-testid="version-full">
                {v.movements.length > 0 && (
                  <ol className="list-decimal ml-4 text-[0.6875rem] text-[#1A1815] break-words" style={SERIF}>
                    {v.movements.map((m, i) => <li key={i}>{m}</li>)}
                  </ol>
                )}
                <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF}>{v.lessonText || 'This version has no lesson text.'}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>

      {versions.length > 1 && (
        <div className="mt-2" data-testid="versions-diff">
          <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Where they differ</h4>
          <p className="text-[0.6875rem] text-[#1A1815] break-words" style={SERIF} data-testid="diff-movement-counts">
            Movements: {versions.map((v, i) => `${v.writer} ${diff.movementCounts[i]}`).join(', ')}{diff.sameMovementCount ? ' (the same number)' : ''}.
          </p>
          {diff.movements.filter((m) => m.differs || m.refsDiffer).map((m) => (
            <p key={m.index} className="text-[0.6875rem] text-[#B85838] break-words" style={SERIF} data-testid="diff-movement">
              Movement {m.index}: {m.cells.map((c, i) => (c === null ? `missing in ${versions[i].writer}` : null)).filter(Boolean).join(', ') || 'cites different verses across writers'}
            </p>
          ))}
          <div className="overflow-x-auto mt-1">
            <table className="text-[0.6875rem] text-[#1A1815] border-collapse" style={SERIF} data-testid="diff-verses">
              <caption className="sr-only">Which writer cites each verse</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left pr-2 font-semibold">Verse</th>
                  {versions.map((v) => <th key={v.key} scope="col" className="text-left pr-2 font-semibold break-words">{v.writer}</th>)}
                </tr>
              </thead>
              <tbody>
                {diff.verses.map((r) => (
                  <tr key={r.ref} data-differs={r.differs ? 'yes' : 'no'} className={r.differs ? 'bg-[#FAF8F4]' : ''}>
                    <th scope="row" className={`text-left pr-2 font-normal whitespace-nowrap ${r.differs ? 'text-[#B85838] font-semibold' : ''}`} style={MONO}>{r.ref}</th>
                    {r.citedBy.map((c, i) => <td key={i} className="pr-2">{c ? '✓ cites' : '– not cited'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={SERIF}>References are the ones each version names in its text (anchor, movements and lesson).</p>
        </div>
      )}
      {/* REVIEW AND DECIDE (Governor): choose, merge part by part, or take all. */}
      {decide && versions.length > 1 && <LessonDecide versions={versions} {...decide} />}
    </section>
  );
}
