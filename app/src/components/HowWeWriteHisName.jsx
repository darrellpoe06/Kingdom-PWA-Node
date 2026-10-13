// =============================================================================
// HowWeWriteHisName — the reader is told the rule, not left to guess at it
// =============================================================================
// Darrell 2026-09-19: "Still quoting however give an overall we capitalize etc
// for etc reasons..."
//
// Both halves of the Typographic Theology are enforced by machine already. What
// was missing was the reader's side. Someone who meets "satan" in lower case in
// the middle of a sentence reads a typo; someone who meets "Satan" capitalised
// inside a King James quotation on the next line reads an inconsistency. Both
// are deliberate, and neither is visible without being said.
//
// DERIVED, NOT DESCRIBED. Every name on this surface comes from
// lib/typographic-theology.js — the same module the gates import. Nothing here
// is a second copy of the rule written for display, so this page cannot fall
// out of step with what the build actually enforces. If a name is added to the
// rule, it appears here in the same commit with nobody remembering to do it.
//
// THEME-SAFE BY CONSTRUCTION. Body text carries NO color class: it inherits
// the theme's own ink, which is correct in cream and in midnight without a
// remap entry existing for it. The first cut hardcoded #1A1815 and #5A5751 to
// match the Scripture surfaces and put five new lines of dark-on-dark debt into
// the legibility baseline -- caught by legibility-guard, and fixed here rather
// than frozen. Only the scripture green (#5A6E3D) is named, because the dark
// themes remap it.
import React from 'react';
import {
  ALWAYS_CAPITALIZED, NEVER_CAPITALIZED, WHY_LOWERCASE, THE_EXCEPTION, HIS_PRONOUNS,
} from '../lib/typographic-theology.js';

export default function HowWeWriteHisName() {
  return (
    <section
      data-testid="how-we-write-his-name"
      className="border border-[#E8E4DC] bg-[#FAF8F4] p-4 sm:p-5"
      aria-labelledby="how-we-write-heading"
    >
      <h2 id="how-we-write-heading" className="font-semibold text-base sm:text-lg">
        How this house writes His Name
      </h2>
      <p className="mt-2 text-sm opacity-80 leading-relaxed">
        Some of the capital letters on these pages are not ordinary spelling. They are
        deliberate, and you are owed the reason rather than left to wonder whether
        something is a mistake.
      </p>

      <h3 className="mt-4 font-semibold text-sm">Always capitalised</h3>
      <ul className="mt-2 space-y-2">
        {ALWAYS_CAPITALIZED.map((n) => (
          <li key={n.name} className="text-sm leading-relaxed">
            <span className="text-[#5A6E3D] font-semibold">{n.name}</span>
            <span className="opacity-80"> — {n.why}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm opacity-80 leading-relaxed">
        Every pronoun that points at Him takes the capital too: {HIS_PRONOUNS.join(', ')}.
      </p>

      <h3 className="mt-4 font-semibold text-sm">Never capitalised</h3>
      <p className="mt-2 text-sm opacity-80 leading-relaxed">
        {NEVER_CAPITALIZED.join(', ')}.
      </p>
      <p className="mt-2 text-sm opacity-80 leading-relaxed">{WHY_LOWERCASE}</p>

      <h3 className="mt-4 font-semibold text-sm">{THE_EXCEPTION.headline}</h3>
      <p className="mt-2 text-sm opacity-80 leading-relaxed">{THE_EXCEPTION.body}</p>
    </section>
  );
}
