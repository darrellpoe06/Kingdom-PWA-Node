// =============================================================================
// HomeHero — the welcome banner on the Life Hub (DR-1046 Phase 3)
// =============================================================================
// Christina's reference: a landscape, "Welcome back, <name>", a line under it,
// and a quote card. What is real here: the name is the signed-in profile's
// (the shell's PROFILES list, handed in as `name`); the verse is the KJV text
// of Proverbs 4:23 copied from the Bible the app ships (public/bible/kjv), and
// a test pins it to that file so it can never drift from the Word (DR-0076,
// never from memory). The picture is PAINTED — a sky and three ridgelines in
// the theme's own greens — because the house keeps no stock photography
// (VISUAL-IDENTITY) and a family photo on the front screen is a choice for
// the family to make on their own record, not one this component makes for
// them: `re-review: 2026-10-29` in DR-1046 for "use a Life Gallery photo as
// the banner".
//
// COLORS ARE CLASSES OR THE SVG'S OWN FILLS, never an inline hex on text:
// the words sit on a dark painted ground in every theme, so they are the
// one light token (#F6F1E7) with its midnight twin. The banner is CONTENT,
// not chrome: it scrolls with the page and never enters the header's
// text-size budget (DR-0438).
import React from 'react';

export const HERO_VERSE = {
  ref: 'Proverbs 4:23',
  translation: 'KJV',
  text: 'Keep thy heart with all diligence; for out of it are the issues of life.',
};

export default function HomeHero({ name = '', sub = 'Same vision · A brighter tomorrow' }) {
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  return (
    <section
      data-testid="home-hero"
      aria-label="Welcome"
      className="relative overflow-hidden rounded-2xl text-[#F6F1E7] bg-[#1F3A2E] min-h-[11rem] grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_16rem]"
    >
      <svg aria-hidden="true" className="absolute inset-0 w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="poe-hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D7B36A" />
            <stop offset="0.3" stopColor="#B9834A" />
            <stop offset="0.65" stopColor="#3B4A42" />
            <stop offset="1" stopColor="#1A2A24" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="300" fill="url(#poe-hero-sky)" />
        <path d="M0 220 L120 120 L220 180 L330 70 L430 160 L520 110 L640 190 L740 90 L860 170 L1000 100 L1000 300 L0 300Z" fill="#2E4A3E" />
        <path d="M0 260 L150 200 L280 240 L400 190 L520 230 L650 200 L800 250 L1000 210 L1000 300 L0 300Z" fill="#1F3A2E" />
        <path d="M0 290 L200 270 L420 285 L640 265 L820 290 L1000 275 L1000 300 L0 300Z" fill="#16291F" />
      </svg>
      <div className="relative p-5 sm:p-7 flex flex-col justify-center min-w-0">
        <div className="text-lg sm:text-xl italic" style={{ fontFamily: '"Fraunces", serif', fontWeight: 400 }}>{first ? 'Welcome back,' : 'Welcome home.'}</div>
        {first && (
          <h2 data-testid="home-hero-name" className="text-4xl sm:text-5xl leading-none break-words" style={{ fontFamily: '"Fraunces", serif', fontWeight: 700, letterSpacing: '-0.02em' }}>{first}</h2>
        )}
        {sub && <div className="mt-2 text-[0.625rem] uppercase tracking-[0.26em] text-[#F0D58A] font-semibold">{sub}</div>}
      </div>
      <blockquote
        data-testid="home-hero-verse"
        className="relative m-4 md:ml-0 md:my-5 md:mr-5 rounded-xl border-l-4 border-[#C9A227] bg-[#1A1D1B]/80 p-4 text-[0.9375rem] leading-snug"
        style={{ fontFamily: '"Fraunces", serif' }}
      >
        {HERO_VERSE.text}
        <cite className="block mt-2 not-italic text-[0.5625rem] uppercase tracking-[0.2em] text-[#F0D58A]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>{HERO_VERSE.translation} — {HERO_VERSE.ref}</cite>
      </blockquote>
    </section>
  );
}
