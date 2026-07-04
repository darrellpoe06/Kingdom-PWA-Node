// =============================================================================
// ScriptureLibrary — the in-app, themed, depth-adaptive Scripture resource that
// BACKS the Spiritual Module + the Learn courses (Darrell 2026-06-24).
// =============================================================================
// Surface only. Content lives in ../lib/scriptures.js; the adaptive engine (depth
// tiers, experience levels, personalization, retention testing, the governing
// lens) lives in ../lib/scripture-teaching.js — both pure + tested.
//
// THE LENS (binding): every theme explains Yahweh's perspective and His love, held
// in grace AND truth, delivered with NO condemnation, teaching His purposes and
// forming the learner to put His will and way first — all ordered to one aim:
// SOULS home with the Father. The surface shows that lens, not just verses.
//
// ADAPTIVE: read at your DEPTH (essential → standard → deep/book-capable) and at
// your LEVEL (child / new believer / standard / scholar — Universal Design for
// Learning). PERSONALIZE (opt-in, owner-scoped, served-not-surveilled) by the
// interests you choose. HOLD the Word with encouraging, retry-friendly checks.
//
// Accessibility mirrors Pulpit/Choir/Study: white / #FAF8F4 cards, #1A1815 body,
// #5A5751 secondary, #5A6E3D scripture green, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useMemo, useState, useEffect } from 'react';
import { SectionTitle } from './shared.jsx';
// Live church corpus for the Scripture "appearances" cross-module link: where a
// verse already shows up in the church's REAL sermons + songs. Subscribed here
// (the real source) instead of receiving empty props — the monolith holds no
// sermon/song state, so passing data.* would have starved the engine with [].
import { subscribeSermons, subscribeSongs } from '../lib/choir-sync.js';
import {
  THEMES, SURFACES, OTHER_VERSIONS, VERSE_ROLES, COPYRIGHT_NOTE,
  kjvText, readOnline, searchVerses,
} from '../lib/scriptures.js';
import {
  DEPTH_TIERS, EXPERIENCE_LEVELS, GOVERNING_LENS, PRIVACY, ACCESSIBILITY,
  resolveDepth, resolveLevel, rankByInterest, gradeTest, encouragement,
} from '../lib/scripture-teaching.js';
import {
  buildStudyEntry, checkSeparation, clarifiedRefs, INTEGRITY_BANNER,
} from '../lib/study-edition.js';
import { provenanceLine } from '../lib/bible-editions.js';
import { fetchPublishedAlgorithms, algorithmsAnchoredAt } from '../lib/eternal-algorithms-sync.js';
import ScriptureConnections from './ScriptureConnections.jsx';
import { studySeedFromVerse } from '../lib/studyable.js';
import { loadStudy, saveStudy, addSeedToStudy } from '../lib/study-space.js';
import VerseHighlighter from './VerseHighlighter.jsx';
import { loadHighlights, saveHighlights, getMark, setMark, cssForHighlight } from '../lib/scripture-highlights.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

const ROLE_CLS = {
  anchor: 'bg-[#1A1815] text-white',
  love: 'bg-[#B85838] text-white',
  promise: 'bg-[#5A6E3D] text-white',
  hope: 'bg-[#5A6E3D] text-white',
  invitation: 'bg-[#5A6E3D] text-white',
  truth: 'bg-[#FAF8F4] text-[#5A5751] border border-[#E8E4DC]',
  warning: 'bg-[#7A4A1E] text-white',
};

const surfaceLabels = (ids) => (ids || []).map((s) => SURFACES[s]?.label || s);

// The interest topics a consumer can opt into (the real, self-chosen signal).
// Viewing-history (YouTube) personalization feeds the SAME ranking when a
// consented feed is connected — we never fabricate a feed, so the honest control
// today is explicit interest selection.
const INTEREST_TOPICS = [
  ['salvation', 'Salvation'], ['evangelism', 'Souls / evangelism'], ['word', 'The Word'],
  ['prayer', 'Prayer'], ['worship', 'Worship'], ['love', 'Love'], ['peace', 'Peace'],
  ['suffering', 'Suffering'], ['mind', 'The mind'], ['growth', 'Growth'],
  ['holiness', 'Holiness'], ['wisdom', 'Wisdom'], ['stewardship', 'Stewardship'],
  ['warfare', 'Warfare'], ['discernment', 'Discernment'], ['service', 'Service'],
  ['grace-truth', 'Grace & truth'], ['godhead', 'The Godhead'],
];

// --- Read other translations (links only — copyright) ------------------------
function OtherTranslations({ refStr }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
        {open ? '↑ Hide other translations' : '↓ Read other translations'}
      </button>
      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {OTHER_VERSIONS.map((v) => (
            <a key={v.id} href={readOnline(refStr, v.id)} target="_blank" rel="noopener noreferrer"
              title={`${v.label} — ${v.note} (opens BibleGateway)`}
              className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">{v.label} ↗</a>
          ))}
        </div>
      )}
    </div>
  );
}

// Save one curated verse into the personal Study as a seed (the content flywheel).
// Renders only for Study-circle users (canStudy) — gate-respecting, never widens the
// private Study. Idempotent: re-saving the same verse refreshes, never duplicates.
function AddVerseToStudy({ verse, email }) {
  const [saved, setSaved] = useState(null);
  const save = () => {
    const seed = studySeedFromVerse(verse);
    const study = loadStudy(email);
    const { study: next, added } = addSeedToStudy(study, seed, Date.now(), study.entries.length);
    saveStudy(email, next);
    setSaved({ added });
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" onClick={save}
        title="Save this verse into your personal Study to keep studying and build on it"
        className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">+ Study</button>
      {saved && <span className="text-[0.625rem] text-[#5A6E3D]" style={serif}>{saved.added ? '✓ Saved' : '✓ Refreshed'}</span>}
    </span>
  );
}

// --- One verse ---------------------------------------------------------------
// Published eternal algorithms, fetched ONCE per session (module cache) through
// the DB's public window — the Scripture tab's cross-reference source. Only what
// the owner explicitly published can appear here (the forge→pulpit bridge);
// private Study frameworks never reach this surface by construction.
let forgeFetch = null;
function usePublishedAlgs() {
  const [algs, setAlgs] = useState([]);
  useEffect(() => {
    forgeFetch = forgeFetch || fetchPublishedAlgorithms();
    let on = true;
    forgeFetch.then((a) => { if (on) setAlgs(a); });
    return () => { on = false; };
  }, []);
  return algs;
}

function VerseCard({ refStr, kjv, gloss, role, backs, canStudy = false, email = null, themeId = null, themeTitle = null, onOpenAlgorithms = null }) {
  const roleLabel = (VERSE_ROLES[role] || {}).label || role;
  // "Scriptures are eternal algorithms" — the back-link from a verse to every
  // PUBLISHED framework it anchors (honest overlap match: same book+chapter,
  // verse ranges intersecting where both sides carry them).
  const published = usePublishedAlgs();
  const anchored = algorithmsAnchoredAt(refStr, published);
  // Personal, device-local highlight for this reference (Logos-style color
  // coding brought in-app). Seeded from storage once; a pick persists and
  // restyles the verse text immediately.
  const [mark, setMarkState] = useState(() => getMark(loadHighlights(email), refStr));
  const pickHighlight = (key) => {
    const next = setMark(loadHighlights(email), refStr, key);
    saveHighlights(email, next);
    setMarkState(getMark(next, refStr));
  };
  return (
    <div className="bg-white border border-[#E8E4DC] p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={mono}>{refStr}</div>
        <div className="flex items-center gap-2">
          {canStudy && <AddVerseToStudy verse={{ ref: refStr, kjv, gloss, role, themeId, themeTitle }} email={email} />}
          <VerseHighlighter value={mark} onPick={pickHighlight} refLabel={refStr} />
          {role && <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 ${ROLE_CLS[role] || ROLE_CLS.truth}`}>{roleLabel}</span>}
        </div>
      </div>
      <p className="text-sm text-[#1A1815] mt-1 leading-relaxed" style={serif}>
        <span className="sr-only">King James Version. </span>
        <span style={cssForHighlight(mark)}>“{kjv}”</span><span className="text-[0.625rem] text-[#5A5751] ml-1 align-baseline" style={mono}>KJV</span>
      </p>
      {gloss && <p className="text-xs text-[#5A5751] mt-1.5" style={serif}>{gloss}</p>}
      {anchored.length > 0 && (
        <div className="mt-1.5 border-l-2 border-[#5A6E3D] pl-2">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">✦ Anchors the eternal algorithm{anchored.length > 1 ? 's' : ''}:</span>{' '}
          {anchored.map((alg, i) => (
            <span key={alg.id} className="text-xs" style={serif}>
              {onOpenAlgorithms
                ? <button type="button" onClick={onOpenAlgorithms} className="underline text-[#5A6E3D] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Open Church › Eternal Algorithms">{alg.name}</button>
                : <span className="text-[#1A1815]">{alg.name}</span>}
              {i < anchored.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      )}
      {(backs || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] py-0.5">Backs:</span>
          {surfaceLabels(backs).map((label) => (
            <span key={label} className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">{label}</span>
          ))}
        </div>
      )}
      <OtherTranslations refStr={refStr} />
    </div>
  );
}

// --- Retention check (encouraging, retries) ----------------------------------
function ThemeTest({ test }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(null);
  const questions = (test && test.questions) || [];
  if (!questions.length) return null;

  const submit = () => setGraded(gradeTest(test, answers));
  const retry = () => { setAnswers({}); setGraded(null); };

  return (
    <div className="mt-3 border-t border-[#E8E4DC] pt-2">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
        {open ? '↑ Hide the check' : `✓ Check what you hold (${questions.length})`}
      </button>
      {open && (
        <div className="mt-2 bg-[#FAF8F4] border border-[#E8E4DC] p-3 space-y-3">
          {questions.map((q, i) => {
            const res = graded && graded.perQuestion[i];
            return (
              <fieldset key={i} className="space-y-1">
                <legend className="text-sm text-[#1A1815] font-medium" style={serif}>{i + 1}. {q.q}</legend>
                {q.options.map((opt, oi) => {
                  const chosen = answers[i] === oi;
                  const showCorrect = graded && oi === q.answer;
                  const showWrong = graded && chosen && oi !== q.answer;
                  return (
                    <label key={oi} className={`flex items-start gap-2 text-sm p-1.5 cursor-pointer border ${showCorrect ? 'border-[#5A6E3D] bg-white' : showWrong ? 'border-[#B85838] bg-white' : chosen ? 'border-[#1A1815] bg-white' : 'border-transparent hover:bg-white'}`} style={serif}>
                      <input type="radio" name={`q-${i}`} checked={chosen} disabled={!!graded}
                        onChange={() => setAnswers((p) => ({ ...p, [i]: oi }))} className="mt-1 accent-[#B85838]" />
                      <span className="text-[#1A1815]">{opt}{showCorrect ? ' ✓' : ''}</span>
                    </label>
                  );
                })}
                {graded && (
                  <p className={`text-xs mt-0.5 ${res && res.correct ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={serif}>
                    {q.explain} {q.ref && <span style={mono} className="text-[0.625rem]">({q.ref})</span>}
                  </p>
                )}
              </fieldset>
            );
          })}
          {!graded ? (
            <button type="button" onClick={submit} disabled={Object.keys(answers).length < questions.length}
              className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">Check my answers</button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-sm font-semibold ${graded.mastered ? 'text-[#5A6E3D]' : 'text-[#1A1815]'}`} style={serif}>
                {graded.correct}/{graded.total} — {encouragement(graded)}
              </span>
              <button type="button" onClick={retry}
                className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#B85838] text-[#B85838] hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Try again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- One theme ---------------------------------------------------------------
function ThemeSection({ theme, tier, level, canStudy = false, email = null, onOpenAlgorithms = null }) {
  const [localTier, setLocalTier] = useState(null); // per-theme override of global tier
  const effectiveTier = localTier || tier;
  const depth = resolveDepth(theme, effectiveTier);
  const lvl = resolveLevel(theme, level);
  const hasLevel = theme.levels && typeof theme.levels[level] === 'string' && level !== 'standard';

  return (
    <section aria-labelledby={`thm-${theme.id}`} className="mb-8">
      <h3 id={`thm-${theme.id}`} className="text-lg text-[#1A1815] font-semibold" style={serif}>
        {theme.title}
        {theme.subtitle && <span className="text-sm text-[#B85838] font-normal"> — {theme.subtitle}</span>}
      </h3>
      <p className="text-xs text-[#5A5751] mt-1 mb-2" style={serif}>{theme.blurb}</p>

      {/* The lens — His perspective, His heart, His love */}
      {theme.lens && (
        <div className="bg-[#FAF8F4] border-l-2 border-[#5A6E3D] pl-3 pr-2 py-2 mb-2 space-y-1" style={serif}>
          <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">His perspective · </span>{theme.lens.perspective}</p>
          <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">His heart · </span>{theme.lens.heart}</p>
          <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">His love · </span>{theme.lens.love}</p>
        </div>
      )}
      {theme.soul && (
        <p className="text-xs text-[#B85838] mb-2" style={serif}><span className="uppercase tracking-wider text-[0.5625rem]">For the soul · </span>{theme.soul}</p>
      )}

      {/* Backs */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] py-0.5">Backs:</span>
        {surfaceLabels(theme.surfaces).map((label) => (
          <span key={label} className="text-[0.5625rem] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">{label}</span>
        ))}
      </div>

      {/* The teaching at the chosen depth */}
      <div className="bg-white border border-[#E8E4DC] p-3 mb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Read at your depth · {DEPTH_TIERS.find((d) => d.id === depth.tierId)?.label}</span>
          <div className="flex gap-1" role="group" aria-label={`Depth for ${theme.title}`}>
            {DEPTH_TIERS.map((d) => (
              <button key={d.id} type="button" onClick={() => setLocalTier(d.id)} aria-pressed={depth.tierId === d.id}
                className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${depth.tierId === d.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{d.label}</button>
            ))}
          </div>
        </div>
        <p className="text-sm text-[#1A1815] whitespace-pre-line leading-relaxed" style={serif}>{depth.text}</p>
      </div>

      {/* Experience-level framing (when authored for the chosen level) */}
      {hasLevel && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-2">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838]">For a {EXPERIENCE_LEVELS.find((l) => l.id === level)?.label.toLowerCase()}</span>
          <p className="text-sm text-[#1A1815] mt-1 leading-relaxed" style={serif}>{lvl.text}</p>
        </div>
      )}

      {/* Evenhanded views + textual honesty (high-sensitivity themes) */}
      {theme.views && theme.views.length > 0 && (
        <div className="border border-[#B85838] p-3 mb-2">
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1.5">The main biblical views — presented fairly, Word-first</div>
          <div className="space-y-2">
            {theme.views.map((view) => (
              <div key={view.name}>
                <p className="text-sm text-[#1A1815] font-medium" style={serif}>{view.name}</p>
                <p className="text-xs text-[#5A5751]" style={serif}>{view.summary}</p>
                <p className="text-[0.625rem] text-[#5A6E3D] mt-0.5" style={mono}>{(view.scriptures || []).join(' · ')}</p>
              </div>
            ))}
          </div>
          {theme.textNote && <p className="text-xs text-[#5A5751] mt-2 italic" style={serif}>{theme.textNote}</p>}
        </div>
      )}
      {!theme.views && theme.textNote && <p className="text-xs text-[#5A5751] mb-2 italic" style={serif}>{theme.textNote}</p>}

      {/* The verses */}
      <div className="space-y-2">
        {theme.verses.map((v) => (
          <VerseCard key={v.ref} refStr={v.ref} kjv={kjvText(v.ref)} gloss={v.gloss} role={v.role} backs={v.backs || theme.surfaces}
            canStudy={canStudy} email={email} themeId={theme.id} themeTitle={theme.title} onOpenAlgorithms={onOpenAlgorithms} />
        ))}
      </div>

      {/* Hold the Word */}
      <ThemeTest test={theme.tests} />
    </section>
  );
}

// --- Study Edition: one reference, two structurally-distinct layers ----------
// The marquee of the sovereign edition. The SCRIPTURE layer is verbatim public-
// domain text (version + license labeled); the CLARIFICATION layer is OUR study
// help, rendered in a visibly different treatment so it can never read as the
// Word. checkSeparation() runs before render — if the guardrail ever failed, we
// show that honestly rather than blurring the line.
function StudyEditionEntry({ refStr }) {
  const entry = useMemo(() => buildStudyEntry(refStr), [refStr]);
  if (!entry) return null;
  const sep = checkSeparation(entry);
  const clar = entry.clarification;

  return (
    <div>
      {/* The binding banner — which is which */}
      <p className="text-[0.6875rem] text-[#5A5751] mb-2 leading-relaxed" style={serif}>{INTEGRITY_BANNER}</p>

      {!sep.ok && (
        <p className="text-xs text-white bg-[#7A4A1E] px-2 py-1 mb-2" style={serif}>
          Integrity check failed for this entry — the text/commentary separation could not be verified. Showing nothing rather than risk blurring the Word.
        </p>
      )}

      {sep.ok && (
        <>
          {/* SCRIPTURE TEXT LAYER — verbatim, version + license labeled */}
          <div className="border border-[#5A6E3D] bg-white mb-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-white bg-[#5A6E3D] px-3 py-1.5 font-semibold">
              Scripture text — public domain, reproduced verbatim
            </div>
            <div className="p-3 space-y-3">
              {entry.scripture.editions.map((ed) => (
                <div key={ed.versionId}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={mono}>{entry.ref}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5" style={mono}>{ed.versionId}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] px-1 py-0.5">{ed.license}</span>
                  </div>
                  <p className="text-sm text-[#1A1815] leading-relaxed" style={serif}>
                    <span className="sr-only">{ed.version}. </span>“{ed.text}”
                  </p>
                  <p className="text-[0.5625rem] text-[#5A5751] mt-0.5" style={mono}>{provenanceLine(ed.versionId)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CLARIFICATION LAYER — visibly distinct; clearly NOT Scripture */}
          {clar ? (
            <div className="border-2 border-dashed border-[#B85838] bg-[#FAF8F4]">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] px-3 py-1.5 font-semibold border-b border-dashed border-[#B85838]">
                Clarification — PoeTech Study Edition · study notes, not Scripture
              </div>
              <div className="p-3 space-y-2.5" style={serif}>
                {clar.plain && <p className="text-sm text-[#1A1815] leading-relaxed">{clar.plain}</p>}

                {clar.fourD && (
                  <div className="bg-white border border-[#E8E4DC] p-2.5 space-y-1">
                    <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#B85838]">Deep source · </span>{clar.fourD.source}</p>
                    <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#B85838]">In plain words · </span>{clar.fourD.plain}</p>
                    <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#B85838]">What it gives you · </span>{clar.fourD.benefits}</p>
                  </div>
                )}

                {clar.yahwehContext && (
                  <p className="text-xs text-[#1A1815]"><span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">In the context of Yahweh · </span>{clar.yahwehContext}</p>
                )}

                {clar.wordStudy && clar.wordStudy.length > 0 && (
                  <div>
                    <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Word study — Strong’s (public domain)</div>
                    <div className="space-y-1">
                      {clar.wordStudy.map((w) => (
                        <div key={w.strongs} className="bg-white border border-[#E8E4DC] p-2">
                          <p className="text-xs text-[#1A1815]">
                            <span className="font-semibold">{w.word}</span>
                            <span className="text-[#5A5751]"> — {w.original} </span>
                            <span style={mono} className="text-[0.625rem] text-[#5A6E3D]">{w.translit} · {w.strongs}</span>
                          </p>
                          <p className="text-xs text-[#5A5751]">{w.gloss}{w.note ? ` — ${w.note}` : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {clar.textNotes && clar.textNotes.length > 0 && (
                  <div className="border-l-2 border-[#B85838] pl-2.5">
                    <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] mb-0.5">Honest note about the text</div>
                    {clar.textNotes.map((n, i) => (
                      <p key={i} className="text-xs text-[#1A1815]">{n.note}</p>
                    ))}
                  </div>
                )}

                {clar.godheadViews && clar.godheadViews.length > 0 && (
                  <div className="border border-[#B85838] bg-white p-2.5">
                    <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1.5">The main biblical views — presented fairly, Word-first</div>
                    <div className="space-y-2">
                      {clar.godheadViews.map((view) => (
                        <div key={view.name}>
                          <p className="text-sm text-[#1A1815] font-medium">
                            {view.name}
                            {view.sme && <span className="text-[0.5625rem] uppercase tracking-wider bg-[#7A4A1E] text-white px-1.5 py-0.5 ml-2">SME call — Bishop / Darrell</span>}
                          </p>
                          <p className="text-xs text-[#5A5751]">{view.summary}</p>
                          {(view.scriptures || []).length > 0 && <p className="text-[0.625rem] text-[#5A6E3D] mt-0.5" style={mono}>{view.scriptures.join(' · ')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {clar.crossRefs && clar.crossRefs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Cross-references:</span>
                    {clar.crossRefs.map((r) => (
                      <span key={r} className="text-[0.625rem] bg-white border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5" style={mono}>{r}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#5A5751] italic" style={serif}>Clarification for this reference is on the way — the verbatim Scripture above stands on its own meanwhile.</p>
          )}
        </>
      )}
    </div>
  );
}

function StudyEdition() {
  const refs = clarifiedRefs();
  const [active, setActive] = useState(refs[0] || null);
  if (!refs.length) return null;
  return (
    <details className="mb-3 border border-[#5A6E3D] bg-white">
      <summary className="cursor-pointer px-3 py-2 text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
        Study Edition — Scripture + clarification, kept distinct (sovereign · public domain)
      </summary>
      <div className="px-3 pb-3">
        <p className="text-xs text-[#5A5751] mb-2" style={serif}>
          Our own freely-usable edition: public-domain Scripture (modern English + KJV, shown side by side) with our clarification beside it. The two are always kept visibly separate — the Word is the Word; the notes are notes.
        </p>
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" role="tablist" aria-label="Study Edition references">
          {refs.map((r) => (
            <button key={r} type="button" role="tab" aria-selected={active === r} onClick={() => setActive(r)}
              className={`px-2.5 py-1.5 text-xs whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${active === r ? 'bg-[#5A6E3D] text-white border-[#5A6E3D] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}
              style={mono}>{r}</button>
          ))}
        </div>
        {active && <StudyEditionEntry refStr={active} />}
      </div>
    </details>
  );
}

export default function ScriptureLibrary({ email = null, canStudy = false, sermons = [], lessons = [], songs = [], setChurchView = null }) {
  // Jump from a verse's "anchors" line to Church › Eternal Algorithms (when the
  // shell passes the navigator; otherwise the names render as plain text).
  const onOpenAlgorithms = typeof setChurchView === 'function' ? () => setChurchView('eternal-algorithms') : null;
  const [query, setQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState('all');
  const [tier, setTier] = useState('standard');
  const [level, setLevel] = useState('standard');
  const [consented, setConsented] = useState(false);
  const [interests, setInterests] = useState([]);

  // Live church corpus (real choir_sermons / choir_songs rows). A caller MAY still
  // inject rows via props (DI / tests); when it doesn't, we read the live source so
  // the "appearances" web is fed real data instead of always-empty arrays.
  const [liveSermons, setLiveSermons] = useState([]);
  const [liveSongs, setLiveSongs] = useState([]);
  useEffect(() => {
    const offSermons = subscribeSermons((rows) => setLiveSermons(rows || []));
    const offSongs = subscribeSongs((rows) => setLiveSongs(rows || []));
    return () => { if (typeof offSermons === 'function') offSermons(); if (typeof offSongs === 'function') offSongs(); };
  }, []);
  const liveAppearances = useMemo(() => ({
    sermons: sermons.length ? sermons : liveSermons,
    songs: songs.length ? songs : liveSongs,
  }), [sermons, songs, liveSermons, liveSongs]);

  const profile = useMemo(() => ({ consented, interests, youtube: [] }), [consented, interests]);
  const orderedThemes = useMemo(() => rankByInterest(THEMES, profile), [profile]);
  const results = useMemo(() => (query.trim() ? searchVerses(query) : null), [query]);
  const shownThemes = useMemo(
    () => (activeTheme === 'all' ? orderedThemes : orderedThemes.filter((t) => t.id === activeTheme)),
    [activeTheme, orderedThemes],
  );
  const toggleInterest = (id) => setInterests((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="max-w-3xl">
      <SectionTitle eyebrow="Word-first · KJV public domain · His perspective + His love">Scripture</SectionTitle>

      <blockquote className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-2 mb-3" style={serif}>
        <p className="text-sm text-[#1A1815] italic">“Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.”</p>
        <footer className="text-[0.6875rem] text-[#5A5751] mt-1">— Proverbs 4:7 (KJV). A curated, depth-adaptive Scripture resource that backs the spiritual teaching and the Learn lessons — explaining how Yahweh sees, what His heart is, and how His love speaks, held in grace and truth, all for the soul.</footer>
      </blockquote>

      {/* The governing lens */}
      <details className="mb-3 border border-[#E8E4DC] bg-white">
        <summary className="cursor-pointer px-3 py-2 text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">How this is taught — the lens</summary>
        <div className="px-3 pb-3 space-y-1" style={serif}>
          <p className="text-xs text-[#1A1815]"><strong>His love.</strong> {GOVERNING_LENS.love}</p>
          <p className="text-xs text-[#1A1815]"><strong>Grace and truth.</strong> {GOVERNING_LENS.graceAndTruth}</p>
          <p className="text-xs text-[#1A1815]"><strong>No condemnation.</strong> {GOVERNING_LENS.noCondemnation}</p>
          <p className="text-xs text-[#1A1815]"><strong>His will and way.</strong> {GOVERNING_LENS.willAndWay}</p>
          <p className="text-xs text-[#1A1815]"><strong>The aim — souls.</strong> {GOVERNING_LENS.soulsTelos}</p>
        </div>
      </details>

      {/* Study Edition — the sovereign two-layer reader (text + clarification, distinct) */}
      <StudyEdition />

      {/* Connections — the Logos-style navigable web (cross-refs, word study, harvest).
          Open-by-default closed; sermons/lessons/songs flow in for the "appearances"
          tie when the caller has them (DI; honestly empty otherwise). */}
      <details className="mb-3 border border-[#5A6E3D] bg-white">
        <summary className="cursor-pointer px-3 py-2 text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
          Scripture connections — cross-references + word study (sovereign · public domain)
        </summary>
        <div className="px-3 pb-3">
          <ScriptureConnections email={email} canStudy={canStudy} sermons={liveAppearances.sermons} lessons={lessons} songs={liveAppearances.songs} />
        </div>
      </details>

      <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={serif}>{COPYRIGHT_NOTE}</p>

      {/* Read-at-your-depth + level controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="border border-[#E8E4DC] bg-white p-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Depth — read as deep as you need</div>
          <div className="flex gap-1" role="group" aria-label="Reading depth">
            {DEPTH_TIERS.map((d) => (
              <button key={d.id} type="button" onClick={() => setTier(d.id)} aria-pressed={tier === d.id} title={d.hint}
                className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border flex-1 focus:outline focus:outline-2 focus:outline-[#B85838] ${tier === d.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{d.label}</button>
            ))}
          </div>
        </div>
        <div className="border border-[#E8E4DC] bg-white p-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Level — the same truth, for you</div>
          <div className="flex gap-1 flex-wrap" role="group" aria-label="Experience level">
            {EXPERIENCE_LEVELS.map((l) => (
              <button key={l.id} type="button" onClick={() => setLevel(l.id)} aria-pressed={level === l.id} title={l.hint}
                className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border focus:outline focus:outline-2 focus:outline-[#B85838] ${level === l.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{l.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Personalize — opt-in, owner-scoped, served-not-surveilled */}
      <details className="mb-3 border border-[#E8E4DC] bg-white">
        <summary className="cursor-pointer px-3 py-2 text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">Personalize what surfaces (optional)</summary>
        <div className="px-3 pb-3" style={serif}>
          <label className="flex items-center gap-2 text-sm text-[#1A1815] my-2 cursor-pointer">
            <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="accent-[#B85838]" />
            Order the themes by what I care about right now
          </label>
          <p className="text-[0.6875rem] text-[#5A5751] mb-2">{PRIVACY.consent} {PRIVACY.scope}</p>
          {consented && (
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_TOPICS.map(([id, label]) => (
                <button key={id} type="button" onClick={() => toggleInterest(id)} aria-pressed={interests.includes(id)}
                  className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${interests.includes(id) ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{label}</button>
              ))}
            </div>
          )}
          <p className="text-[0.625rem] text-[#5A5751] mt-2 italic">{PRIVACY.youtube} Your viewing history feeds this same ordering when you connect a consented feed — until then, your chosen interests are the signal.</p>
        </div>
      </details>

      {/* Search */}
      <div className="mb-3">
        <label className="sr-only" htmlFor="scr-q">Search Scripture by reference, theme, or words</label>
        <input id="scr-q" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a reference, a theme, or words in the verse…"
          className="w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" />
      </div>

      {results ? (
        <div>
          <p className="text-xs text-[#5A5751] mb-2" style={serif}>
            {results.length} {results.length === 1 ? 'verse' : 'verses'} match “{query.trim()}”.
            <button type="button" onClick={() => setQuery('')} className="ml-2 uppercase tracking-wider text-[0.625rem] text-[#B85838] hover:text-[#1A1815]">Clear</button>
          </p>
          {results.length ? (
            <div className="space-y-2">
              {results.map((v) => (
                <VerseCard key={`${v.themeId}-${v.ref}`} refStr={v.ref} kjv={v.kjv} role={v.role} gloss={`${v.gloss} · ${v.themeTitle}`} backs={v.backs}
                  canStudy={canStudy} email={email} themeId={v.themeId} themeTitle={v.themeTitle} onOpenAlgorithms={onOpenAlgorithms} />
              ))}
            </div>
          ) : (
            <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
              <p className="text-sm text-[#1A1815] font-semibold" style={serif}>Nothing matches that search.</p>
              <p className="text-xs text-[#5A5751] mt-1" style={serif}>Try a book name, a theme, or a word from the verse.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Scripture themes">
            <button type="button" role="tab" aria-selected={activeTheme === 'all'} onClick={() => setActiveTheme('all')}
              className={`px-2.5 py-1.5 text-xs whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${activeTheme === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>All {THEMES.length} themes</button>
            {orderedThemes.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={activeTheme === t.id} onClick={() => setActiveTheme(t.id)}
                className={`px-2.5 py-1.5 text-xs whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${activeTheme === t.id ? 'bg-[#1A1815] text-white border-[#1A1815] font-medium' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{t.title}</button>
            ))}
          </div>

          {shownThemes.map((t) => <ThemeSection key={t.id} theme={t} tier={tier} level={level} canStudy={canStudy} email={email} onOpenAlgorithms={onOpenAlgorithms} />)}
        </>
      )}

      <p className="text-[0.625rem] text-[#5A5751] mt-6 pt-3 border-t border-[#E8E4DC]" style={serif}>
        King James Version — Public Domain, fetched verbatim and verified; other translations referenced, not reproduced (copyright). {ACCESSIBILITY.dyslexia} Truth in love, no condemnation — for the soul’s sake.
      </p>
    </div>
  );
}

export { ScriptureLibrary };
