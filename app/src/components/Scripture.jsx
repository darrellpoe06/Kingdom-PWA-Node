// Scripture — unified scripture rendering component
//
// Spec: UX-PATTERNS.md Pattern 1 (Scripture Component) + Pattern 3
// (Progressive Disclosure). Implementation follows the citation rubric
// in SCRIPTURE-REFERENCE-STANDARD.md: ESV primary, KJV/NIV/AMP on expand,
// Strong's word-study when annotated by content author.
//
// Phase 1: text is hard-coded by the caller (per approved hardening-plan
// decision). Phase 2 introduces a JSON catalog and provider abstraction.
//
// Props:
//   reference  (string, required)        e.g., 'Proverbs 22:7'
//   primary    ({ translation, text })   e.g., { translation: 'ESV', text: '...' }
//   alternates (array, optional)         [{ translation: 'KJV', text: '...' }, ...]
//   wordStudy  ({ word, lemma, strongs, gloss, note }, optional)
//   initiallyExpanded (boolean, optional) default false

import React, { useState } from 'react';
import TTSButton from './TTSButton.jsx';

export default function Scripture({
  reference,
  primary,
  alternates = [],
  wordStudy,
  initiallyExpanded = false,
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const hasMore = alternates.length > 0 || !!wordStudy;

  return (
    <section
      className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 sm:p-4 my-2"
      aria-label={`Scripture: ${reference}`}
    >
      {/* Header row: badge + reference + expand toggle */}
      <header className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-[#1A1815] text-white px-1.5 py-0.5">
            {primary.translation}
          </span>
          <span
            className="text-sm text-[#5A5751]"
            style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}
          >
            {reference}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse alternate translations' : 'Show alternate translations'}
            className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]"
          >
            {expanded ? '▴ Less' : '▾ More translations'}
          </button>
        )}
      </header>

      {/* Primary verse + audio */}
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-base sm:text-lg leading-relaxed flex-1"
          style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic' }}
        >
          {'"'}
          {primary.text}
          {'"'}
        </p>
        <TTSButton text={primary.text} label={primary.translation} />
      </div>

      {/* Expanded: alternates + word study */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC] space-y-3">
          {alternates.map((alt) => (
            <div
              key={alt.translation}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1">
                  {alt.translation}
                </div>
                <p
                  className="text-sm leading-relaxed text-[#1A1815]"
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  {'"'}
                  {alt.text}
                  {'"'}
                </p>
              </div>
              <TTSButton text={alt.text} label={alt.translation} />
            </div>
          ))}

          {wordStudy && (
            <div className="border-l-2 border-[#B85838] pl-3 mt-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">
                Word Study
              </div>
              <p
                className="text-sm leading-snug"
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                <strong>{wordStudy.word}</strong>
                {' — '}
                <em>{wordStudy.lemma}</em>
                {wordStudy.strongs && (
                  <span className="text-[#5A5751]"> ({wordStudy.strongs})</span>
                )}
                {wordStudy.gloss && <>: {wordStudy.gloss}</>}
              </p>
              {wordStudy.note && (
                <p
                  className="text-xs text-[#5A5751] mt-1 leading-snug"
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  {wordStudy.note}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
