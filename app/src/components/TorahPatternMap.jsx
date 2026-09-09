// =============================================================================
// TorahPatternMap — the whole first five books at a glance, so we can SEE.
// =============================================================================
// Darrell, 2026-09-08: "Are there more patterns in the first 5 books... we want
// ALL of the visible patterns of these relationships so we can See!!!!" — and
// then, setting the standard: "Rigorous analysis."
//
// SEEING IS THE WHOLE JOB, so the surface leads with the shape and only then
// offers the detail: the headline counts, then coverage by book and by Person,
// then the families, then each pattern with its verses. A reader should be able
// to take in the map before reading a word of it.
//
// EVERY NUMBER ON THIS SCREEN IS DERIVED from lib/torah-patterns.js at render
// time — familyCoverage(), bookCoverage(), personCoverage(), enemyRoll(),
// mapSummary(). None is typed into the markup. A painted count on a surface
// whose entire value is trust is the exact failure DR-0121 forbids, and the
// gate asserts the derivation rather than trusting this comment.
//
// THE TWO TIERS ARE VISIBLE, NOT BURIED. Every pattern shows whether the text
// NAMES the thing or SHOWS it, and a 'shown' pattern prints our confession as
// ours, in its own marked block. A reader can always tell what Scripture states
// from what we read into it (DR-0076 §8).
// =============================================================================
import React, { useEffect, useState } from 'react';
import VerseChips from './VerseChips.jsx';
import WordInline from './WordInline.jsx';
import ShowTheWordToggle from './ShowTheWordToggle.jsx';
import { useShowTheWord } from '../lib/show-the-word.js';
import {
  TORAH_PATTERNS, FAMILIES, PERSONS,
  patternsInFamily, familyCoverage, bookCoverage, personCoverage,
  enemyRoll, mapSummary, booksOf, jointPatterns,
} from '../lib/torah-patterns.js';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

// A person chip — the colour is by ROLE, never by rank. Red is reserved for the
// Blood and is deliberately not used here (DR-0099 colour theology).
// Distinguished by BORDER, never by a bespoke text colour. Four custom dark
// text colours were tried first and the per-theme contrast guard caught every
// one of them failing AA on the midnight theme (ratios 1.95 to 3.14) — so the
// text stays on the palette token that is already proven in both themes, and
// the border carries the distinction. The guard was right; this is its fix.
const PERSON_STYLE = {
  father: 'border-[#5A6E3D] text-[#1A1815]',
  son:    'border-[#B85838] text-[#1A1815]',
  spirit: 'border-[#5A5751] text-[#1A1815]',
};

function PersonChips({ ids }) {
  if (!ids || ids.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id) => {
        const p = PERSONS.find((x) => x.id === id);
        if (!p) return null;
        return (
          <span key={id} className={`px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider border bg-white ${PERSON_STYLE[id] || 'border-[#C9C2B6] text-[#5A5751]'}`}>
            {p.label}
          </span>
        );
      })}
    </span>
  );
}

function Pattern({ pattern }) {
  // ONE TAP OPENS THE MAP (Darrell, 2026-09-09, from his phone: "Button does
  // not work" — "don't want to have to click to open the main points... one
  // click operational"). The Show-the-Word switch had opened every verse
  // INSIDE cards that were still collapsed, so nothing showed. The cards now
  // follow the same switch: on, every pattern is open; off, closed; a tap on
  // one card still flips that card on its own, and flipping the switch clears
  // those individual choices — the model the chips already run on.
  const all = useShowTheWord();
  const [flip, setFlip] = useState(false);
  useEffect(() => { setFlip(false); }, [all]);
  const open = flip ? !all : all;
  const books = booksOf(pattern);
  return (
    <li className="border border-[#E8E4DC] bg-white">
      <button
        type="button"
        onClick={() => setFlip((f) => !f)}
        aria-expanded={open}
        className="w-full text-left px-3 py-2 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        {/* The title owns the row; the Person chips sit on their OWN line
            beneath it. Side by side, at large text on a phone, the chips took
            the width and the title wrapped one word per line (his screenshot,
            2026-09-09). */}
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-[#1A1815]" style={serif}>{pattern.name}</span>
            <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">
              {books.join(' · ')}
              {pattern.enemy ? <span className="text-[#B85838]"> · vs {pattern.enemy.replace(/-/g, ' ')}</span> : null}
            </span>
          </span>
          <span aria-hidden="true" className="text-[#5A5751] shrink-0">{open ? '▾' : '▸'}</span>
        </span>
        <span className="block mt-1"><PersonChips ids={pattern.persons} /></span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Prose too: a reference named in the sentence opens right there. */}
          <WordInline text={pattern.shows} className="text-sm text-[#1A1815] leading-relaxed" style={serif} />
          {/* TAP A REFERENCE, THE WORD OPENS HERE (Darrell, 2026-09-08: "don't
              leave the page... open at the location it's clicked... inline").
              The verse renders beneath these chips, in this card; nothing
              scrolls or navigates. VerseChips.jsx is the one primitive. */}
          <VerseChips refs={pattern.refs} />
          <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
            {pattern.basis === 'named'
              ? 'The text NAMES this — nothing is read in.'
              : 'The text SHOWS this; our reading is marked below as ours.'}
          </p>
          {pattern.confession && (
            <div className="border-l-2 border-[#B85838] pl-2">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">Our confession, not the text’s claim</div>
              <WordInline text={pattern.confession} className="text-[0.8rem] text-[#1A1815] leading-relaxed" style={serif} />
            </div>
          )}
          {pattern.reticence && (
            <div className="border-l-2 border-[#5A5751] pl-2">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Where the text stops, we stop</div>
              <WordInline text={pattern.reticence} className="text-[0.8rem] text-[#1A1815] leading-relaxed" style={serif} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function TorahPatternMap() {
  const [familyId, setFamilyId] = useState('all');
  const [onlyJoint, setOnlyJoint] = useState(false);

  const summary = mapSummary();
  const families = familyCoverage();
  const books = bookCoverage();
  const persons = personCoverage();
  const enemies = enemyRoll();

  const base = familyId === 'all' ? TORAH_PATTERNS : patternsInFamily(familyId);
  // The joint view reuses jointPatterns() rather than re-implementing its rule
  // here — one definition of what together means, in the module that owns it.
  const jointIds = new Set(jointPatterns().map((p) => p.id));
  const shown = onlyJoint ? base.filter((p) => jointIds.has(p.id)) : base;
  const maxBook = Math.max(...books.map((b) => b.count), 1);

  return (
    <div>
      <div className="bg-[#1A1815] text-[#FAF8F4] p-3 mb-3">
        <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-[#B89838] mb-1">The first five books · the whole shape at once</p>
        <p className="text-sm leading-relaxed" style={serif}>
          Every visible pattern of the Father, the Son and the Holy Spirit at work — and of the enemies opposed — drawn only from Genesis through Deuteronomy.
        </p>
        <p className="text-[0.75rem] leading-relaxed mt-2 text-[#D8D4CC]" style={serif}>
          Each pattern says whether the text NAMES the thing or SHOWS it. Where we read something into what is shown, our reading is printed separately and marked as ours. Where the text is silent, so are we.
        </p>
      </div>

      {/* THE HEADLINE — every figure derived from the patterns themselves. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {[
          { n: summary.patterns, label: 'patterns' },
          { n: summary.refs, label: 'verses, all KJV-verified' },
          { n: summary.allThree, label: 'show all Three together' },
          { n: summary.enemies, label: 'enemies named' },
        ].map((s) => (
          <div key={s.label} className="border border-[#E8E4DC] bg-white p-2 text-center">
            <div className="text-2xl text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{s.n}</div>
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* COVERAGE — where in the five books, and which Person. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="border border-[#E8E4DC] bg-white p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">Across the five books</div>
          <ul className="space-y-1">
            {books.map((b) => (
              <li key={b.book} className="flex items-center gap-2">
                <span className="text-[0.75rem] text-[#1A1815] w-24 shrink-0">{b.book}</span>
                <span className="h-2 bg-[#5A6E3D]" style={{ width: `${Math.round((b.count / maxBook) * 100)}%`, minWidth: b.count ? '4px' : 0 }} aria-hidden="true" />
                <span className="text-[0.6875rem] text-[#5A5751]">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-[#E8E4DC] bg-white p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">Who is visibly at work</div>
          <ul className="space-y-1.5">
            {persons.map((p) => (
              <li key={p.id}>
                <div className="flex items-baseline gap-2">
                  <PersonChips ids={[p.id]} />
                  <span className="text-[0.6875rem] text-[#5A5751]">{p.count} patterns</span>
                </div>
                <p className="text-[0.75rem] text-[#5A5751] leading-snug mt-0.5" style={serif}>{p.blurb}</p>
              </li>
            ))}
          </ul>
          <p className="text-[0.6875rem] text-[#5A5751] mt-2 leading-relaxed">
            {summary.joint} patterns show more than one Person acting in the same account; {summary.allThree} show all Three.
          </p>
        </div>
      </div>

      {/* THE ENEMY ROLL — derived; an enemy cannot be listed without a pattern. */}
      <div className="border border-[#E8E4DC] bg-white p-3 mb-3">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-2">The enemies the Torah names</div>
        <div className="flex flex-wrap gap-1.5">
          {enemies.map((e) => (
            <span key={e.enemy} className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">
              {e.enemy.replace(/-/g, ' ')} <span className="text-[#5A5751]">({e.count})</span>
            </span>
          ))}
        </div>
      </div>

      {/* FILTERS — family, and the relationships filter Darrell asked for. */}
      <div className="flex gap-1.5 flex-wrap mb-2" role="tablist" aria-label="Pattern families">
        <button type="button" role="tab" aria-selected={familyId === 'all'} onClick={() => setFamilyId('all')}
          className={`${BTN} border ${familyId === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
          All {summary.patterns}
        </button>
        {families.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={familyId === f.id} onClick={() => setFamilyId(f.id)}
            className={`${BTN} border ${familyId === f.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
            {f.label} {f.count}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {/* One tap opens every verse on the map, or hides them all (DR-0341);
            each chip still toggles on its own on top of it. */}
        <ShowTheWordToggle />
        <button type="button" onClick={() => setOnlyJoint((v) => !v)} aria-pressed={onlyJoint}
          className={`${BTN} border ${onlyJoint ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
          {onlyJoint ? 'Showing only where two or more work together' : 'Show only where two or more work together'}
        </button>
      </div>

      {familyId !== 'all' && (
        <p className="text-[0.8rem] text-[#5A5751] leading-relaxed mb-2" style={serif}>
          {FAMILIES.find((f) => f.id === familyId)?.blurb}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-xs text-[#5A5751]" role="status">No patterns match that combination.</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((p) => <Pattern key={p.id} pattern={p} />)}
        </ul>
      )}

      <p className="text-[0.6875rem] text-[#5A5751] mt-3 leading-relaxed">
        {summary.named} of these patterns are stated in the text itself; {summary.shown} are patterns the text shows, where our reading is printed separately and marked as ours. Every verse is quoted from the King James text hosted in this app, and every reference is inside the first five books — nothing is imported to complete the picture.
      </p>
    </div>
  );
}
