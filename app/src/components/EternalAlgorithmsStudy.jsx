// =============================================================================
// EternalAlgorithmsStudy — the PUBLIC "Eternal Algorithms" study series surface
// =============================================================================
// Darrell 2026-07-01: Yahweh's word is decision-logic; His if/then truths are the
// eternal algorithms of Information, Intelligence and Decision-making we return
// to. This is the PUBLIC series (a sibling to Church > Learn / Scripture; NOT the
// circle-gated Study). Entry #1 = Conditional Truth. Interactive: read the
// Scripture-anchored teaching (two-tier: plain, then go-deeper), then examine
// yourself honestly (device-local answers), then run a belief-vs-action round
// scored on the SAME eight Yahweh axes as the Generations game — solo, or carry
// it into a family/team Game Night.
//
// WORD-FIRST + LICENSE: verse TEXT is rendered from the public-domain KJV layer
// (scriptures.js kjvText); the ESV citation is linked, never reproduced
// (bible-editions.js; DR-0076). Data model + game transform live in
// lib/eternal-algorithms-studies.js (pure, tested). Accessibility mirrors the
// Scripture/Study surfaces: white / #FAF8F4 cards, #1A1815 body, #5A5751
// secondary, labelled inputs, visible #B85838 focus outline (AA).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import HelpButton from './HelpButton.jsx';
import UiIcon from './UiIcon.jsx';
import { kjvText, readOnline } from '../lib/scriptures.js';
import { verseText as fullKjvVerse } from '../lib/bible-kjv.js';
import {
  SERIES, listStudies, getStudy, AXES,
  studyToGameCards, algorithmsToGameCards, scoreRound,
  loadResponses, saveResponses,
} from '../lib/eternal-algorithms-studies.js';
import { withStudyDeck } from '../lib/games/generations.js';
import { fetchPublishedAlgorithms } from '../lib/eternal-algorithms-sync.js';
import { GODHEAD_ALGORITHMS, godheadBySection, godheadVerse, godheadToGameCards, BOOK_MASTERPIECES, booksInCatalog, algorithmsForBook } from '../lib/godhead-study.js';
import { WITNESS_SOURCES, WITNESS_TAGLINE, witnessVerse, witnessScienceOnly } from '../lib/third-witness.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
const CARD = 'bg-white border border-[#E8E4DC] p-3';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const AREA = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white text-[#1A1815] leading-relaxed focus:outline focus:outline-2 focus:outline-[#B85838]';

// The verbatim KJV text for a ref — curated set FIRST (instant, bundled), then
// the WHOLE in-app KJV as a fallback (Darrell 2026-07-04: "are we linked
// internally for all those scripture references"). So ANY reference resolves to
// the Word inside the app; no ref dead-ends to "look it up" and no fabrication.
export function useInAppKjv(refStr) {
  const curated = kjvText(refStr);
  const [full, setFull] = useState(null);
  useEffect(() => {
    if (curated) { setFull(null); return undefined; }
    let on = true;
    fullKjvVerse(refStr).then((t) => { if (on) setFull(t || null); });
    return () => { on = false; };
  }, [refStr, curated]);
  return curated || full;
}

// A verse rendered from the in-app KJV (curated set or the whole Bible), with the
// ESV citation LINKED as an OTHER-translation option (copyright — never
// reproduced). Now that the whole KJV is hosted, the Word shows in-app for any
// ref; the reference only shows alone if a malformed ref resolves to nothing.
export function Verse({ refStr, translationCited = 'ESV' }) {
  const text = useInAppKjv(refStr);
  return (
    <div className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-1.5 my-1.5">
      {text
        ? <p className="text-sm text-[#1A1815]" style={serif}>“{text}”<span className="text-[0.625rem] text-[#5A5751] ml-1 align-baseline" style={mono}>KJV</span></p>
        : <p className="text-xs text-[#5A5751] italic" style={serif}>{refStr} — read it in your Bible.</p>}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[0.6875rem] text-[#5A6E3D]" style={serif}>{refStr}</span>
        <a href={readOnline(refStr, translationCited)} target="_blank" rel="noopener noreferrer"
          title={`Read ${refStr} in the ${translationCited} (other translation, opens BibleGateway)`}
          className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
          {translationCited} ↗
        </a>
      </div>
    </div>
  );
}

// One teaching section: plain layer first, the deeper layer + extra anchors one
// click beneath (the two-tier self-explain motion).
function Section({ section }) {
  const [deep, setDeep] = useState(false);
  const extra = (section.anchors || []).filter((a) => a.ref !== section.primaryRef);
  return (
    <div className={CARD}>
      <h4 className="text-[#1A1815] mb-1" style={{ ...serif, fontWeight: 600 }}>{section.heading}</h4>
      <p className="text-sm text-[#1A1815] leading-relaxed" style={serif}>{section.plain}</p>
      {section.primaryRef && <Verse refStr={section.primaryRef} translationCited={(section.anchors?.[0]?.translation) || 'ESV'} />}
      {/* Full-width tap target (Darrell 2026-07-04: reachable by a right thumb,
          not just the left link) — the text stays small + left so it looks the same. */}
      <button type="button" onClick={() => setDeep((v) => !v)} aria-expanded={deep}
        className="w-full text-left mt-1.5 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:bg-[#FAF8F4] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
        {deep ? '↑ Close' : '↓ Go deeper'}
      </button>
      {deep && (
        <div className="mt-1.5 border-l-2 border-[#1A1815] pl-3 pr-1 py-1">
          <p className="text-sm text-[#1A1815] leading-relaxed" style={serif}>{section.deep}</p>
          {extra.map((a) => <Verse key={a.ref} refStr={a.ref} translationCited={a.translation || 'ESV'} />)}
          {section.citation && (
            <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>
              <span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">Research cited</span> — {section.citation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// From the forge — a PUBLISHED finalized framework (the forge→pulpit bridge,
// 2026-07-03). Rendered from the database's ONE public window
// (eternal_algorithms_public): only entries the owner explicitly published,
// and the deep 4D layer only when the owner chose to include it (fourD is
// null otherwise — the section is omitted, never painted). Scripture refs
// render through the same KJV-verbatim / link-don't-reproduce Verse.
// -----------------------------------------------------------------------------
function ForgeFramework({ alg }) {
  const [openDeep, setOpenDeep] = useState(false);
  const refs = String(alg.scripture || '').split(';').map((r) => r.trim()).filter(Boolean);
  return (
    <div className={CARD}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h4 className="text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>✦ {alg.name}</h4>
        <span className="text-[0.5625rem] uppercase tracking-wider bg-[#FAF8F4] border border-[#E8E4DC] text-[#5A5751] px-1.5 py-0.5">From the family forge</span>
      </div>
      {alg.outcome && (
        <div className="mt-1.5 bg-[#F2F4EC] border-l-2 border-[#5A6E3D] pl-3 pr-2 py-1.5">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">✦ Outcome — you win with it</div>
          <p className="text-sm text-[#1A1815]" style={serif}>{alg.outcome}</p>
        </div>
      )}
      {alg.threeD && <p className="text-sm text-[#1A1815] leading-relaxed mt-1.5" style={serif}>{alg.threeD}</p>}
      {refs.map((r) => <Verse key={r} refStr={r} />)}
      {alg.fourD && (
        <div className="mt-1.5">
          <button type="button" onClick={() => setOpenDeep((v) => !v)} aria-expanded={openDeep}
            className="w-full text-left py-1.5 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:bg-[#FAF8F4] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {openDeep ? '↑ Close the deep layer' : '↓ Go deeper (the eternal expression)'}
          </button>
          {openDeep && (
            <div className="mt-1 border-l-2 border-[#1A1815] pl-3 pr-1 py-1">
              <p className="text-sm text-[#1A1815] leading-relaxed whitespace-pre-wrap" style={serif}>{alg.fourD}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// THE GODHEAD STUDY (Darrell 2026-07-03) — the Bible's deterministic algorithms,
// Torah through Revelation. Each entry states the IF/THEN in the verse's own
// logic, renders the verse VERBATIM (KJV from the verified fetch — never from
// memory), then the 3D practice and the outcome. Collapsible per entry so the
// study reads as exploration, not a wall ("Real study is fun and exploration").
// -----------------------------------------------------------------------------
// The END FROM THE BEGINNING (Darrell 2026-07-04): "it shows the outcome first
// so the user can see what they will receive first — like Yahweh shows the end
// from the beginning." The Outcome you win with it LEADS the card, visible even
// collapsed; the IF/THEN mechanism, verses, and practice follow on expand.
function GodheadEntry({ entry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={CARD}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full text-left focus:outline focus:outline-2 focus:outline-[#B85838]">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>✦ {entry.name}</span>
          <span className="text-[0.625rem] text-[#5A6E3D]" style={mono}>{entry.refs.join(' · ')} {open ? '▾' : '▸'}</span>
        </div>
        {/* The end from the beginning — the outcome you win with it, first. */}
        <div className="mt-1.5 bg-[#F2F4EC] border-l-2 border-[#5A6E3D] pl-3 pr-2 py-1.5">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">✦ Outcome — you win with it</div>
          <p className="text-sm text-[#1A1815]" style={serif}>{entry.outcome}</p>
        </div>
        <p className="text-[0.75rem] text-[#5A5751] mt-1.5" style={serif}>
          <span className="uppercase tracking-wider text-[0.5625rem] text-[#B85838] font-semibold">If</span> {entry.condition}
          {!open && <span className="text-[0.625rem] text-[#5A6E3D] ml-1">— open for the pattern ▸</span>}
        </p>
      </button>
      {open && (
        <div className="mt-1.5">
          <p className="text-[0.75rem] text-[#1A1815]" style={serif}>
            <span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D] font-semibold">Then</span> {entry.consequence}
          </p>
          {entry.refs.map((r) => {
            const text = godheadVerse(r);
            return (
              <div key={r} className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-1.5 my-1.5">
                {text
                  ? <p className="text-sm text-[#1A1815]" style={serif}>“{text}”<span className="text-[0.625rem] text-[#5A5751] ml-1" style={mono}>KJV</span></p>
                  : <p className="text-xs text-[#5A5751] italic" style={serif}>{r} — read it in your Bible.</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[0.6875rem] text-[#5A6E3D]" style={serif}>{r}</span>
                  <a href={readOnline(r, 'ESV')} target="_blank" rel="noopener noreferrer"
                    className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Read ESV ↗</a>
                </div>
              </div>
            );
          })}
          <p className="text-sm text-[#1A1815] leading-relaxed" style={serif}>{entry.threeD}</p>
          {entry.psyche && (
            <div className="mt-1.5 border-l-2 border-[#5A5751] pl-3 pr-2 py-1">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">How the mind runs it — the psychological perspective</div>
              <p className="text-[0.8rem] text-[#1A1815] leading-relaxed" style={serif}>{entry.psyche}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GodheadStudyView() {
  // Each book is its own masterpiece (Darrell 2026-07-03): tap a book to see
  // its identity line and filter to the algorithms drawn from it.
  const [book, setBook] = useState(null);
  const books = booksInCatalog();
  const bookEntries = book ? algorithmsForBook(book) : null;
  return (
    <div>
      <div className="bg-[#1A1815] text-[#FAF8F4] p-3 mb-3">
        <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-[#B89838] mb-1">The Godhead Study · Torah → Revelation</p>
        <p className="text-sm leading-relaxed" style={serif}>
          The Bible's deterministic algorithms — the if/then patterns the Living Godhead states in His own words. Eternal Algorithms: Yahweh's perspectives and Will, as high above our thoughts as the heavens are above the earth (Isaiah 55:8-9). Forever Eternal Beings inviting us into a bloodline family: every soul gets its turn to be tested, even the Son came off the Throne of Glory, and the meek — strength under the control of the Holy Spirit, The General — inherit. {GODHEAD_ALGORITHMS.length} patterns, every verse rendered verbatim (KJV, public domain).
        </p>
        <p className="text-[0.75rem] leading-relaxed mt-2 text-[#D8D4CC]" style={serif}>
          Pattern recognition is how Yahweh helps us — blind 3rd-dimensional sheep, lions and lambs — understand the Knowledge of the Most Holy. Each entry carries the practice AND, where it helps, how the mind runs it (the psychological perspective of His Word). Not the destination — the journey molds you.
        </p>
        <p className="text-[0.75rem] leading-relaxed mt-2 text-[#D8D4CC]" style={serif}>
          Die daily. This 3rd-dimensional space is not Home — it is the development environment: the sheep, lions and lambs of the Church of the Living Yahweh are built and tested HERE before the release Home. Suffering for His Glory is only 100–150 years for Him — I win still. Yahweh IS, and He IS GOOD. This platform is that work: bringing the church to the streets, using the world's technology so there is a Way — from Yahweh, His tool, held humbly by the Tribe. See you when you get there.
        </p>
      </div>
      {/* THE BOOKS — each its own masterpiece; tap to read its identity and
          filter to its algorithms. */}
      <div className="mb-3">
        <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1.5">Each book is its own masterpiece</div>
        <div className="flex gap-1.5 flex-wrap">
          {books.map((b) => (
            <button key={b} type="button" onClick={() => setBook(book === b ? null : b)} aria-pressed={book === b}
              className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${book === b ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815] hover:border-[#1A1815]'}`}>
              {b}
            </button>
          ))}
        </div>
        {book && BOOK_MASTERPIECES[book] && (
          <blockquote className="border-l-2 border-[#B85838] bg-[#FAF8F4] pl-3 pr-2 py-2 mt-2" style={serif}>
            <p className="text-sm text-[#1A1815] italic">{BOOK_MASTERPIECES[book]}</p>
            <footer className="text-[0.6875rem] text-[#5A5751] mt-0.5">— {book} · {bookEntries.length} algorithm{bookEntries.length === 1 ? '' : 's'} in the study{book === 'Proverbs' ? ' · for the kings of The Eternal King, and for The Way' : ''}</footer>
          </blockquote>
        )}
      </div>

      {book ? (
        <div className="space-y-2 mb-4">
          {bookEntries.map((e) => <GodheadEntry key={e.id} entry={e} />)}
        </div>
      ) : godheadBySection().map((s) => (
        <div key={s.key} className="mb-4">
          <h3 className="text-lg text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{s.label} · {s.entries.length}</h3>
          <p className="text-[0.75rem] text-[#5A5751] mb-2" style={serif}>{s.blurb}</p>
          <div className="space-y-2">
            {s.entries.map((e) => <GodheadEntry key={e.id} entry={e} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// THE 3RD-DIMENSION WITNESS (Darrell 2026-07-03) — high-quality, cited expert
// data cross-referenced with the Scriptures, "so we can see this trauma from
// the 3rd-dimension better as a Body of Christ." Every source cited; every
// verse verbatim from the verified fetch; the science is the witness, the
// Word is the authority. Pastoral, not clinical.
// -----------------------------------------------------------------------------
function WitnessPair({ pair }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={CARD}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full text-left focus:outline focus:outline-2 focus:outline-[#B85838]">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>✦ {pair.refs.join(' · ')}</span>
          <span className="text-[0.625rem] text-[#5A6E3D]" style={mono}>at {pair.cite} {open ? '▾' : '▸'}</span>
        </div>
        <p className="text-[0.75rem] text-[#5A5751] mt-0.5" style={serif}>
          <span className="uppercase tracking-wider text-[0.5625rem] text-[#B85838] font-semibold">3rd dimension</span> {pair.claim}
        </p>
      </button>
      {open && (
        <div className="mt-1.5">
          {pair.refs.map((r) => {
            const text = witnessVerse(r);
            return (
              <div key={r} className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-1.5 my-1.5">
                {text
                  ? <p className="text-sm text-[#1A1815]" style={serif}>“{text}”<span className="text-[0.625rem] text-[#5A5751] ml-1" style={mono}>KJV</span></p>
                  : <p className="text-xs text-[#5A5751] italic" style={serif}>{r} — read it in your Bible.</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[0.6875rem] text-[#5A6E3D]" style={serif}>{r}</span>
                  <a href={readOnline(r, 'ESV')} target="_blank" rel="noopener noreferrer"
                    className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Read ESV ↗</a>
                </div>
              </div>
            );
          })}
          <div className="border-l-2 border-[#5A5751] pl-3 pr-2 py-1">
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">The intertwine — 4th dimension said it first</div>
            <p className="text-[0.8rem] text-[#1A1815] leading-relaxed" style={serif}>{pair.bridge}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function WitnessView() {
  // MIXED is the default (Darrell 2026-07-03: "stays mixed for those of us who
  // need that"). The separation is an opt-in toggle — a CHOICE, not a wall
  // (Darrell 2026-07-04: "knowledgeable is the goal... inform... we only let
  // people choose what they want but why guard anything except training videos
  // explicitly for the msw workers"). On = science only, every expert still
  // cited, no Scripture riding along. Medical topics inform and point to a
  // physician; nothing here is withheld.
  const [sciOnly, setSciOnly] = useState(false);
  return (
    <div>
      <div className="bg-[#1A1815] text-[#FAF8F4] p-3 mb-3">
        <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-[#B89838] mb-1">The 3rd-Dimension Witness · science cross-referenced with the Word</p>
        <p className="text-sm leading-relaxed" style={serif}>{WITNESS_TAGLINE}</p>
        <p className="text-[0.75rem] leading-relaxed mt-2 text-[#D8D4CC]" style={serif}>
          So we can see this trauma from the 3rd dimension better, as a Body of Christ. Every expert is cited — honour to whom honour is due — and every verse is rendered verbatim. The science describes the frame Yahweh made; His Word governs. This room helps the Body see; it does not diagnose or treat.
        </p>
        <p className="text-[0.75rem] leading-relaxed mt-2 text-[#D8D4CC]" style={serif}>
          Knowledgeable is the goal — so the full, Architect-quality information is here, and you choose the view. Mixed keeps the Word and the witness together; science-only shows the same cited experts with no Scripture. Nothing is guarded either way. The medical and fasting topics inform, they do not prescribe — always consult your physician.
        </p>
        <div className="mt-3 inline-flex rounded overflow-hidden border border-[#5A6E3D]" role="group" aria-label="Witness view mode">
          <button type="button" onClick={() => setSciOnly(false)} aria-pressed={!sciOnly}
            className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838] ${sciOnly ? 'text-[#D8D4CC]' : 'bg-[#5A6E3D] text-[#FAF8F4] font-semibold'}`}>
            Mixed (Word + witness)
          </button>
          <button type="button" onClick={() => setSciOnly(true)} aria-pressed={sciOnly}
            className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838] ${sciOnly ? 'bg-[#5A6E3D] text-[#FAF8F4] font-semibold' : 'text-[#D8D4CC]'}`}>
            Science only (Practice)
          </button>
        </div>
      </div>
      {WITNESS_SOURCES.map((src) => {
        const sci = witnessScienceOnly(src);
        return (
          <div key={src.id} className="mb-4">
            <h3 className="text-lg text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{src.topic}</h3>
            <p className="text-[0.75rem] text-[#5A5751]" style={serif}>{src.summary}</p>
            <p className="text-[0.6875rem] text-[#5A6E3D] mb-2" style={mono}>
              Source: {src.source.expert} ({src.source.credential}) — {src.source.work}
            </p>
            {sciOnly ? (
              <ul className="space-y-1.5">
                {sci.points.map((pt) => (
                  <li key={pt.id} className={CARD}>
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="uppercase tracking-wider text-[0.5625rem] text-[#B85838] font-semibold">3rd dimension</span>
                      <span className="text-[0.625rem] text-[#5A6E3D]" style={mono}>at {pt.cite}</span>
                    </div>
                    <p className="text-[0.8rem] text-[#1A1815] mt-0.5" style={serif}>{pt.claim}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2">
                {src.pairs.map((p) => <WitnessPair key={p.id} pair={p} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// One self-examination item: the Word, a stated-input choice, an honest action
// probe (saved device-local), and the mirror (mercy + accountability) revealed
// once the person engages.
function SelfExamItem({ item, value, onChange }) {
  const v = value || {};
  const engaged = !!v.agree || String(v.probe || '').trim().length > 0;
  const opts = [['agree', 'I agree'], ['mostly', 'Mostly'], ['not-yet', 'Not yet']];
  return (
    <div className={CARD}>
      <Verse refStr={item.wordRef} />
      <p className="text-sm text-[#1A1815] mt-1" style={serif}>{item.prompt}</p>
      <div className="flex gap-1.5 flex-wrap my-1.5" role="group" aria-label={`Your response to ${item.wordRef}`}>
        {opts.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={v.agree === k}
            onClick={() => onChange({ ...v, agree: k })}
            className={`${BTN} border ${v.agree === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{label}</button>
        ))}
      </div>
      <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1" htmlFor={`probe-${item.id}`}>
        Honestly — {item.probe}
      </label>
      <textarea id={`probe-${item.id}`} rows="2" className={AREA} value={v.probe || ''}
        onChange={(e) => onChange({ ...v, probe: e.target.value })}
        placeholder="Just between you and Yahweh. This stays on your device." />
      {engaged && (
        <p className="text-sm text-[#5A6E3D] mt-1.5 border-l-2 border-[#5A6E3D] pl-2" style={serif}>{item.mirror}</p>
      )}
    </div>
  );
}

// The belief-vs-action round: each self-exam item becomes a card; picking a
// choice scores on the eight Yahweh axes (reusing the Generations engine), so the
// "do the word" path is Kingdom-forward and restating-the-belief yields nothing.
function BeliefVsActionRound({ cards }) {
  const [picks, setPicks] = useState({});
  const { scores, totals } = useMemo(() => scoreRound(cards, picks), [cards, picks]);
  const answered = Object.keys(picks).length;
  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <div key={card.id} className={CARD}>
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D]" style={serif}>{card.lens}</p>
          <Verse refStr={card.scripture.ref} />
          <p className="text-sm text-[#1A1815] my-1" style={serif}>{card.body}</p>
          <div className="space-y-1.5">
            {card.choices.map((c, i) => (
              <button key={i} type="button" aria-pressed={picks[card.id] === i}
                onClick={() => setPicks((p) => ({ ...p, [card.id]: i }))}
                className={`block w-full text-left ${BTN} border ${picks[card.id] === i ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'text-[#1A1815] border-[#E8E4DC] hover:border-[#B85838]'}`}>
                {c.redemption ? '✦ ' : ''}{c.label}
                {picks[card.id] === i && c.body && <span className="block text-[0.6875rem] normal-case tracking-normal mt-0.5 opacity-90">{c.body}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
      {answered > 0 && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-1">Where your choices lean — measured by Yahweh</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {AXES.map((a) => (
              <span key={a.key} className="text-[0.6875rem] text-[#1A1815]" style={serif} title={a.short}>
                {a.label}: <strong>{scores[a.key] || 0}</strong>
              </span>
            ))}
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>
            Kingdom-weighted total <strong>{totals.weighted}</strong> — faith, family and souls weigh most (Matthew 6:33). This is a mirror, not a verdict.
          </p>
        </div>
      )}
    </div>
  );
}

export default function EternalAlgorithmsStudy({ email, view, churchView, setView, setChurchView }) {
  const studies = listStudies();
  const [activeId, setActiveId] = useState(studies[0]?.id || null);
  const study = getStudy(activeId) || studies[0];
  const [aboutOpen, setAboutOpen] = useState(false);
  const [responses, setResponses] = useState({});
  const [showRound, setShowRound] = useState(false);
  // Published frameworks from the family forge (Study › Eternal Algorithms).
  // Read through the DB's public window — works signed-out; empty stays empty
  // (the section is omitted, never painted).
  const [forge, setForge] = useState([]);
  useEffect(() => {
    let on = true;
    fetchPublishedAlgorithms().then((a) => { if (on) setForge(a); });
    return () => { on = false; };
  }, []);

  // Load the reader's device-local answers for this identity.
  useEffect(() => { setResponses(loadResponses(email)); }, [email]);
  const setItem = (itemId, val) => {
    setResponses((prev) => {
      const next = { ...prev, [itemId]: val };
      saveResponses(email, next);
      return next;
    });
  };

  // The full deck: the study's belief-vs-action items, every framework
  // published from the family forge, AND the whole-Bible Godhead Study catalog
  // (Darrell 2026-07-03: "All eternal algorithms going into the game so they
  // can be further aware of the Word. Real study is fun and exploration.").
  // Same axes, one engine.
  const cards = useMemo(
    () => [...studyToGameCards(study, responses), ...algorithmsToGameCards(forge), ...godheadToGameCards()],
    [study, responses, forge],
  );
  // Which room of the surface is open: the study series, or the whole-Bible
  // Godhead Study (deterministic algorithms, Torah → Revelation).
  const [room, setRoom] = useState('series');
  // Persist the generated deck so a Game Night (Generations) can pick it up, and
  // go to the games hub. withStudyDeck proves the deck injects into a real def.
  const toGameNight = () => {
    try {
      const def = withStudyDeck(null, cards); // validates the deck builds a real def
      localStorage.setItem('poetech.gamenight.studyDeck.v1', JSON.stringify({ studyId: study.id, cards: def.decks.study || cards }));
    } catch { /* storage optional */ }
    if (typeof setView === 'function') setView('games');
  };

  const helpNav = { view, churchView, setView, setChurchView };

  return (
    <div className="max-w-3xl">
      <SectionTitle eyebrow="Word-first · for honest self-examination">
        <span className="inline-flex items-center gap-2">
          <UiIcon name="sparkle" /> {SERIES.title}
          <HelpButton variant="inline" topic="church:eternal-algorithms" {...helpNav} />
        </span>
      </SectionTitle>

      {/* Three rooms, one surface: the interactive study series, the
          whole-Bible Godhead Study, and the 3rd-Dimension Witness — cited
          science cross-referenced with the Word (Darrell 2026-07-03). */}
      <div className="flex gap-2 flex-wrap mb-3" role="tablist" aria-label="Eternal Algorithms rooms">
        <button type="button" role="tab" aria-selected={room === 'series'} onClick={() => setRoom('series')}
          className={`${BTN} border ${room === 'series' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
          Study series
        </button>
        <button type="button" role="tab" aria-selected={room === 'godhead'} onClick={() => setRoom('godhead')}
          className={`${BTN} border ${room === 'godhead' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
          The Godhead Study · whole Bible
        </button>
        <button type="button" role="tab" aria-selected={room === 'witness'} onClick={() => setRoom('witness')}
          className={`${BTN} border ${room === 'witness' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
          3rd-Dimension Witness
        </button>
      </div>

      {room === 'godhead' && <GodheadStudyView />}
      {room === 'witness' && <WitnessView />}

      {room === 'series' && (<>
      {/* The series frame — reverent, humble-seeking. */}
      <div className="bg-[#1A1815] text-[#FAF8F4] p-3 mb-3">
        <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-[#B89838] mb-1">{SERIES.kicker}</p>
        <p className="text-sm leading-relaxed" style={serif}>{SERIES.banner}</p>
        <p className="text-[0.75rem] leading-relaxed mt-2 text-[#D8D4CC]" style={serif}>{SERIES.posture}</p>
      </div>

      {/* Two-tier self-explain (inline About + Help "Learn more"). */}
      <div className="border border-[#E8E4DC] bg-white mb-3">
        <button type="button" onClick={() => setAboutOpen((o) => !o)} aria-expanded={aboutOpen}
          className="w-full flex items-center gap-2 text-left px-3 py-2 text-[0.6875rem] text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
          <span className="uppercase tracking-[0.2em]">About this{aboutOpen ? '' : ' — what it is, where it comes from, how it works'}</span>
          <span className="ml-auto">{aboutOpen ? '▾' : '▸'}</span>
        </button>
        {aboutOpen && (
          <div className="px-3 pb-2 space-y-1 text-[0.8rem] text-[#1A1815]" style={serif}>
            <p>{study.about.what}</p>
            <p><span className="uppercase tracking-wider text-[0.625rem] text-[#5A6E3D]">Your data</span> — {study.about.where}</p>
            <p><span className="uppercase tracking-wider text-[0.625rem] text-[#5A6E3D]">How to use it</span> — {study.about.how}</p>
            <HelpButton variant="inline" topic="church:eternal-algorithms" {...helpNav} />
          </div>
        )}
      </div>

      {/* Series index — study #1 now; honest room-for-more (not painted). */}
      <div className="flex gap-2 flex-wrap mb-3" role="tablist" aria-label="Studies in this series">
        {studies.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === activeId}
            onClick={() => setActiveId(s.id)}
            className={`${BTN} border ${s.id === activeId ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
            {s.number}. {s.title}
          </button>
        ))}
        <span className="text-[0.6875rem] text-[#5A5751] self-center italic" style={serif}>More studies in this series are on the way.</span>
      </div>

      {/* The study. */}
      <div className="mb-2">
        <h3 className="text-xl text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>Study {study.number} · {study.title}</h3>
        <p className="text-sm text-[#5A5751]" style={serif}>{study.subtitle}</p>
        <p className="text-sm text-[#1A1815] leading-relaxed mt-1.5" style={serif}>{study.intro}</p>
      </div>

      <div className="space-y-2 mb-4">
        {study.sections.map((sec) => <Section key={sec.id} section={sec} />)}
      </div>

      {/* Interactive self-examination. */}
      <div className="border-t-2 border-[#1A1815] pt-3 mb-3">
        <h3 className="text-lg text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>Examine yourself</h3>
        <p className="text-sm text-[#5A5751] mb-2" style={serif}>
          “Examine yourselves, to see whether you are in the faith” (2 Corinthians 13:5). Answer honestly — it stays on your device. No condemnation; a mirror held in mercy and truth.
        </p>
        <div className="space-y-2">
          {study.selfExam.map((item) => (
            <SelfExamItem key={item.id} item={item} value={responses[item.id]} onChange={(val) => setItem(item.id, val)} />
          ))}
        </div>
      </div>

      </>)}

      {/* The game hook — belief-vs-action round + Game Night hand-off. */}
      <div className="border-t-2 border-[#1A1815] pt-3">
        <h3 className="text-lg text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>Take it to the game</h3>
        <p className="text-sm text-[#5A5751] mb-2" style={serif}>
          Your self-examination — and every framework published from the family forge — becomes a playable round, each choice scored on the same eight Yahweh axes the Generations game uses (faith, family, souls, wisdom, service, peace, joy, provision). Real study is fun and exploration: run the algorithm, or teach it to someone, and the Word travels with the play. The belief-vs-action round below is live right here; carrying your deck into a full Generations Game Night is in build — the button opens the Games hub today.
        </p>
        <div className="flex gap-2 flex-wrap mb-2">
          <button type="button" onClick={() => setShowRound((v) => !v)} className={`${BTN} bg-[#5A6E3D] text-white font-semibold hover:bg-[#1A1815]`}>
            {showRound ? 'Hide the round' : 'Run the belief-vs-action round'}
          </button>
          <button type="button" onClick={toGameNight} className={`${BTN} border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4]`}>
            <UiIcon name="dice" /> Open the Games hub (Generations)
          </button>
        </div>
        {showRound && <BeliefVsActionRound cards={cards} />}
      </div>

      {/* FROM THE FORGE — finalized frameworks published from the family's
          Study gallery (the forge→pulpit bridge). Only what the owner
          explicitly published appears here; the deep layer only where they
          chose to include it. Hidden entirely when nothing is published. */}
      {forge.length > 0 && (
        <div className="border-t-2 border-[#1A1815] pt-3 mt-4">
          <h3 className="text-lg text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>Finalized frameworks · from the family forge</h3>
          <p className="text-sm text-[#5A5751] mb-2" style={serif}>
            Frameworks finished in the family's Study and published here on purpose — each pairs the pattern with the outcome you win with it, anchored in the Word.
          </p>
          <div className="space-y-2">
            {forge.map((alg) => <ForgeFramework key={alg.id} alg={alg} />)}
          </div>
        </div>
      )}

      <p className="text-[0.6875rem] text-[#5A5751] mt-4" style={serif}>
        King James Version (Public Domain) shown in-app, fetched verbatim and verified; other translations are referenced and linked, not reproduced (copyright). The Word is the arbiter; where we are unsure, we go back to it. Held in grace and truth, for the soul.
      </p>
    </div>
  );
}
