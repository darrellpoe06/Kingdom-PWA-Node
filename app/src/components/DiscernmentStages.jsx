// =============================================================================
// DiscernmentStages — the dedicated FIVE-STAGE renderer for a World-Issues lesson
// =============================================================================
// Renders the structured `issue` carried on a discernment module
// (lib/discernment-track.js → buildDiscernmentModule → module.issue) as the five
// labeled stages the pattern teaches:
//   1. THE CLAIM (labeled + attributed, never a verdict)
//   2. VERIFIABLE vs INTERPRETATION (documented fact w/ dated sources, kept apart
//      from inference)
//   3. PERSPECTIVES (each steelmanned)
//   4. THE BELIEVER'S LENS (4D source -> plain -> benefits, truth + grace, no
//      condemnation, stewardship)
//   5. REFLECTION + SKILL (prompts + the transferable discernment skill)
//
// It lives INSIDE ChurchLearn's light "paper" surface and reuses that exact
// palette in Tailwind className arbitrary values (colors are never inline styles,
// so the contrast guard stays clean); inline style is fontFamily only, matching
// the surrounding course UI. Default-open, collapsible, keyboard-accessible.
// Everything shown is the authored, source-checked issue data — nothing painted.
// =============================================================================
import React, { useState } from 'react';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

// Visual tint + label per claim type. Text is always the near-black ink token so
// every badge clears WCAG AA on the light surface; the colored border/label is
// the at-a-glance signal.
const CLAIM_STYLE = {
  allegation: { label: 'Allegation', border: 'border-[#7A1F1F]', tint: 'bg-[#7A1F1F]/[0.06]', accent: 'text-[#7A1F1F]' },
  claim: { label: 'Claim', border: 'border-[#5A6E3D]', tint: 'bg-[#5A6E3D]/[0.06]', accent: 'text-[#5A6E3D]' },
  opinion: { label: 'Opinion', border: 'border-[#5A5751]', tint: 'bg-[#5A5751]/[0.06]', accent: 'text-[#5A5751]' },
  'call-to-action': { label: 'Call to action', border: 'border-[#B85838]', tint: 'bg-[#B85838]/[0.08]', accent: 'text-[#7A1F1F]' },
};

const STATUS_STYLE = {
  documented: { label: 'Documented', accent: 'text-[#5A6E3D]', border: 'border-[#5A6E3D]' },
  'partly-documented': { label: 'Partly documented', accent: 'text-[#7A1F1F]', border: 'border-[#7A1F1F]' },
  disputed: { label: 'Disputed', accent: 'text-[#B85838]', border: 'border-[#B85838]' },
};

function StageHeading({ n, title }) {
  return (
    <div className="flex items-baseline gap-2 mt-4 mb-2">
      <span className="text-[0.625rem] font-bold text-white bg-[#1A1815] rounded-full w-5 h-5 inline-flex items-center justify-center shrink-0" style={mono}>{n}</span>
      <h4 className="text-[0.6875rem] uppercase tracking-[0.2em] text-[#1A1815] font-semibold" style={serif}>{title}</h4>
    </div>
  );
}

function Badge({ text, accent, border }) {
  return (
    <span className={`text-[0.5625rem] uppercase tracking-wider font-semibold px-1.5 py-0.5 border ${border} ${accent}`} style={mono}>{text}</span>
  );
}

export default function DiscernmentStages({ issue }) {
  const [open, setOpen] = useState(true);
  if (!issue) return null;

  const claims = issue.claims || [];
  const verifiable = issue.verifiable || [];
  const interpretation = issue.interpretation || [];
  const perspectives = issue.perspectives || [];
  const lens = issue.lens || {};
  const reflection = issue.reflection || {};
  const src = issue.source || {};

  return (
    <section className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4]" aria-label="Five-step discernment">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
      >
        <span className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold" style={serif}>
          Think it through — the five steps
        </span>
        <span className="text-[0.625rem] text-[#5A5751]" style={mono}>{open ? '– hide' : '+ show'}</span>
      </button>

      {open && (
        <div className="px-3 pb-4">
          {/* The source — examined as ONE creator's argument, not repeated as truth */}
          {(src.creator || src.note) && (
            <p className="text-[0.6875rem] text-[#5A5751] border-l-2 border-[#5A6E3D] pl-2 mb-1" style={serif}>
              {src.creator && (
                <><strong className="text-[#1A1815]">Source:</strong> {src.creator}
                  {src.medium ? `'s ${src.medium}` : ''}{src.asOf ? ` (as of ${src.asOf})` : ''}. </>
              )}
              {src.note}
            </p>
          )}

          {/* STAGE 1 — THE CLAIM */}
          <StageHeading n={1} title="The claim" />
          <p className="text-[0.625rem] text-[#5A5751] mb-2" style={serif}>
            Each point below is stated AS the creator MADE it, labeled, and attributed. Where a court has already ruled, we say so plainly — a jury finding is a verdict, not an allegation. Documented deeds are named; no one’s soul is judged.
          </p>
          <ul className="space-y-2">
            {claims.map((c) => {
              const s = CLAIM_STYLE[c.label] || CLAIM_STYLE.claim;
              return (
                <li key={c.id} className={`border-l-4 ${s.border} ${s.tint} pl-2 py-1.5`}>
                  <div className="mb-1"><Badge text={s.label} accent={s.accent} border={s.border} /></div>
                  <p className="text-xs text-[#1A1815]" style={serif}>{c.text}</p>
                  {c.attribution && <p className="text-[0.625rem] text-[#5A5751] mt-0.5" style={serif}>— {c.attribution}</p>}
                  {c.note && <p className="text-[0.625rem] text-[#5A5751] italic mt-0.5" style={serif}>{c.note}</p>}
                </li>
              );
            })}
          </ul>

          {/* STAGE 2 — VERIFIABLE vs INTERPRETATION */}
          <StageHeading n={2} title="Verifiable vs interpretation" />
          <p className="text-[0.625rem] text-[#5A5751] mb-2" style={serif}>
            Documented fact (checkable against primary sources, with dates) kept apart from interpretation.
          </p>
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">What is documented</div>
          <ul className="space-y-2 mb-3">
            {verifiable.map((v) => {
              const st = STATUS_STYLE[v.status] || STATUS_STYLE.documented;
              return (
                <li key={v.id} className="border border-[#E8E4DC] bg-white p-2">
                  <div className="mb-1"><Badge text={st.label} accent={st.accent} border={st.border} /></div>
                  <p className="text-xs text-[#1A1815]" style={serif}>{v.statement}</p>
                  {v.note && <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={serif}>{v.note}</p>}
                  {Array.isArray(v.sources) && v.sources.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {v.sources.map((s, i) => (
                        <li key={i} className="text-[0.625rem] text-[#5A5751]" style={serif}>
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#5A6E3D] underline hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
                              {s.publisher ? `${s.publisher} — ` : ''}{s.title}
                            </a>
                          ) : (
                            <>{s.publisher ? `${s.publisher} — ` : ''}{s.title}</>
                          )}
                          {s.asOf ? <span style={mono}> (as of {s.asOf})</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          {interpretation.length > 0 && (
            <>
              <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">What is interpretation (inference, not fact)</div>
              <ul className="space-y-1">
                {interpretation.map((n) => (
                  <li key={n.id} className="text-xs text-[#1A1815] border-l-2 border-[#B85838] pl-2" style={serif}>{n.statement}</li>
                ))}
              </ul>
            </>
          )}

          {/* STAGE 3 — PERSPECTIVES. The sharpened preamble (DR-0129/DR-0130,
              routed 2026-07-15) rides the ENGINE so every issue carries it:
              documented facts were stated plainly in Stage 2 and are not up
              for a vote — perspectives judge only the unresolved parts. */}
          <StageHeading n={3} title="Perspectives — every side, at its strongest" />
          <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={serif}>
            The documented facts are not up for a vote here — Stage 2 already stated them plainly. These perspectives judge only what remains genuinely unresolved: the unadjudicated claims, motives, and what should happen next.
          </p>
          <ul className="space-y-2">
            {perspectives.map((p) => (
              <li key={p.id} className="border border-[#E8E4DC] bg-white p-2">
                <div className="text-[0.6875rem] font-semibold text-[#1A1815]" style={serif}>
                  {p.label}{p.heldBy ? <span className="text-[#5A5751] font-normal"> · {p.heldBy}</span> : null}
                </div>
                <p className="text-xs text-[#1A1815] mt-1" style={serif}>{p.steelman}</p>
              </li>
            ))}
          </ul>

          {/* STAGE 4 — THE BELIEVER'S LENS */}
          <StageHeading n={4} title="The believer's lens — truth AND grace" />
          {lens.fourD?.deepSource && (
            <p className="text-xs text-[#1A1815] mb-2" style={serif}>{lens.fourD.deepSource}</p>
          )}
          {lens.fourD?.scripture && (
            <p className="text-[0.625rem] text-[#5A6E3D] mb-2" style={mono}>{lens.fourD.scripture}</p>
          )}
          {lens.threeD && <p className="text-xs text-[#1A1815] mb-2" style={serif}>{lens.threeD}</p>}
          {lens.accountability?.statement && (
            <div className="border-l-4 border-[#1A1815] bg-[#1A1815]/[0.04] pl-3 py-2 mb-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] font-semibold mb-1">Accountability — what the Word requires (the two courts)</div>
              <p className="text-xs text-[#1A1815]" style={serif}>{lens.accountability.statement}</p>
              {lens.accountability.scripture && (
                <p className="text-[0.625rem] text-[#5A6E3D] mt-1" style={mono}>{lens.accountability.scripture}</p>
              )}
            </div>
          )}
          {lens.stewardship && (
            <div className="border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2 mb-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Stewardship — build, don't just react</div>
              <p className="text-xs text-[#1A1815]" style={serif}>{lens.stewardship}</p>
            </div>
          )}
          {lens.graceNote && (
            <div className="border-l-4 border-[#7A1F1F] bg-white pl-3 py-2 mb-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#7A1F1F] font-semibold mb-1">No condemnation</div>
              <p className="text-xs text-[#1A1815]" style={serif}>{lens.graceNote}</p>
            </div>
          )}
          {Array.isArray(lens.benefits) && lens.benefits.length > 0 && (
            <>
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">What this frees in you</div>
              <ul className="list-disc pl-4 space-y-1">
                {lens.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-[#1A1815]" style={serif}>{b}</li>
                ))}
              </ul>
            </>
          )}

          {/* STAGE 5 — REFLECTION + SKILL */}
          <StageHeading n={5} title="Reflection + the skill you carry out" />
          {reflection.skill && (
            <div className="border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2 mb-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#7A1F1F] font-semibold mb-1">The transferable skill</div>
              <p className="text-xs text-[#1A1815]" style={serif}>{reflection.skill}</p>
            </div>
          )}
          {Array.isArray(reflection.prompts) && reflection.prompts.length > 0 && (
            <>
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Discussion prompts</div>
              <ul className="list-disc pl-4 space-y-1 mb-2">
                {reflection.prompts.map((d, i) => (
                  <li key={i} className="text-xs text-[#1A1815]" style={serif}>{d}</li>
                ))}
              </ul>
            </>
          )}
          {reflection.practice && (
            <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>
              <strong className="text-[#1A1815]">Practice the skill:</strong> {reflection.practice}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
