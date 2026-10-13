// =============================================================================
// games/HeritageGallery.jsx — the family photos under the games' feet
// =============================================================================
// Renders lib/games/heritage.js — the real photos Darrell declared as the
// games' foundational data (2026-07-07): the Turnkey place now torn down, the
// soldiers who covered the family, the family the covering carried. Shown where
// the Generations game begins (the journey start) and where it ends (the
// Legacy finish), and on the big screen's lobby — the game's claim ("measured
// by what is passed on") standing on a real inheritance.
//
// Two grounds, one component: `on="light"` uses the single-player theme token
// classes (theme-remappable, guard-covered); `on="dark"` uses the board's
// inline light-text idiom on its ink ground. Photos are real static assets
// under /games/heritage/ — the vitest gate asserts every src resolves to a real
// file, so a painted path can never ship (Reality-Trace, DR-0061).
//
// Scripture text resolves verbatim through scripture-link (DR-0076); alt text
// on every photo (accessibility is default, COMMUNITY-FIRST).
// =============================================================================
import React from 'react';
import UiIcon from '../UiIcon.jsx';
import { HERITAGE } from '../../lib/games/heritage.js';
import { resolveScripture } from '../../lib/games/scripture-link.js';

const DARK = {
  card: '#1d1a16',
  ink: '#FAF8F4',
  mute: '#A8A29A',
  accent: '#f4b740',
  verse: '#86efac',
};

export default function HeritageGallery({ on = 'light', className = '' }) {
  const banner = resolveScripture(HERITAGE.scripture);
  const dark = on === 'dark';

  const shell = dark
    ? { background: DARK.card }
    : undefined;

  return (
    <section
      className={`rounded-2xl p-4 ${dark ? '' : 'bg-white border border-[#E8E4DC]'} ${className}`}
      style={shell}
      aria-label={HERITAGE.title}
    >
      <div className="flex items-center gap-1.5">
        <UiIcon name="users" className={dark ? '' : 'text-[#B85838]'} />
        <span
          className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold ${dark ? '' : 'text-[#B85838]'}`}
          style={dark ? { color: DARK.accent } : undefined}
        >
          {HERITAGE.eyebrow}
        </span>
      </div>
      <h3
        className={`mt-1 text-lg font-semibold ${dark ? '' : 'text-[#1A1815]'}`}
        style={{ fontFamily: 'Fraunces, serif', ...(dark ? { color: DARK.ink } : null) }}
      >
        {HERITAGE.title}
      </h3>
      <p className={`mt-1 text-sm italic leading-relaxed ${dark ? '' : 'text-[#5A5751]'}`} style={dark ? { color: '#d6d1c8' } : undefined}>
        {HERITAGE.dedication}
      </p>
      {banner?.text && (
        <p className={`mt-2 text-sm leading-relaxed ${dark ? '' : 'text-[#5A6E3D]'}`} style={dark ? { color: DARK.verse } : undefined}>
          <span className="font-semibold">{banner.ref}</span>{' '}
          <span className={dark ? '' : 'text-[#5A5751]'} style={dark ? { color: DARK.mute } : undefined}>({banner.translation})</span>
          {' '}&mdash; &ldquo;{banner.text}&rdquo;
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {HERITAGE.photos.map((p) => {
          const verse = p.scripture ? resolveScripture(p.scripture) : null;
          return (
            <figure key={p.id} className={`rounded-xl overflow-hidden ${dark ? '' : 'bg-[#FAF8F4] border border-[#E8E4DC]'}`} style={dark ? { background: '#12100E' } : undefined}>
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="w-full aspect-square object-cover"
              />
              <figcaption className="p-3">
                <div className={`text-sm font-semibold ${dark ? '' : 'text-[#1A1815]'}`} style={dark ? { color: DARK.ink } : undefined}>
                  {p.title}
                </div>
                <p className={`mt-1 text-xs leading-relaxed ${dark ? '' : 'text-[#5A5751]'}`} style={dark ? { color: DARK.mute } : undefined}>
                  {p.caption}
                </p>
                {verse && (
                  <p className={`mt-1.5 text-xs ${dark ? '' : 'text-[#5A6E3D]'}`} style={dark ? { color: DARK.verse } : undefined}>
                    {verse.ref}
                  </p>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
