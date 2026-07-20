// =============================================================================
// AudienceSlide — the CLEAN slide body the room sees (no controls, no notes)
// =============================================================================
// The projector-styled rendering of one slide, shared by BOTH ways the audience
// content reaches a room:
//   • AudienceWindow (?audience=1) — a second window/display, synced over the
//     BroadcastChannel (a real two-screen setup).
//   • Presenter's "Present on this screen" mode — the SAME clean view rendered
//     inline on the presenter's own device, so a solo presenter on one screen
//     (a tablet held up, or one cast to a TV) can present with NO popup, no
//     second browser, and no second person (Darrell 2026-07-16: the window dance
//     "would open what the audience can see and not your notes... then ask the
//     other to open in browser then redo everything in front of those you are
//     presenting to").
//
// It is PURELY presentational: give it a `slide` (from buildSlideForScene / the
// broadcast) or a `hold` (the holding placeholder). No channel, no state, no
// controls a viewer could trip over — the caller owns the frame + any chrome.
//
// Contrast (WCAG AA, on #14110E near-black): #FAF8F4 body (>16:1), #CFC9BD
// secondary (~9:1), #C9D9A6 green + #EBA77E orange accents (>=4.5:1).
import React, { useEffect, useState } from 'react';
import { verseText } from '../lib/bible-kjv.js';

export default function AudienceSlide({ slide = null, hold = null }) {
  const showHold = !!hold || !slide;

  // Resolve any Scripture the slide CITES to its VERBATIM KJV text (from the sovereign
  // in-app corpus), so the room reads the Word directly, in context (Darrell 2026-07-19).
  // Fail-soft: a ref that doesn't resolve is simply dropped, never invented (DR-0076).
  const citedRefs = (slide && Array.isArray(slide.citedRefs)) ? slide.citedRefs : null;
  const citedKey = citedRefs ? citedRefs.join('|') : '';
  const [cited, setCited] = useState([]);
  useEffect(() => {
    let alive = true;
    if (!citedRefs || !citedRefs.length) { setCited([]); return undefined; }
    Promise.all(citedRefs.map(async (ref) => ({ ref, text: await verseText(ref).catch(() => '') })))
      .then((rows) => { if (alive) setCited(rows.filter((r) => r.text)); })
      .catch(() => { if (alive) setCited([]); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citedKey]);

  // The running "Scriptures so far" rail (Darrell 2026-07-19): every reference cited up
  // to THIS slide, with the lesson's total; the current slide's own references glow.
  const soFar = (slide && Array.isArray(slide.scripturesSoFar)) ? slide.scripturesSoFar : [];
  const scriptureTotal = (slide && slide.scripturesTotal) || soFar.length;
  const currentRefs = new Set([
    ...((slide && Array.isArray(slide.citedRefs)) ? slide.citedRefs : []),
    ...String((slide && slide.anchorRef) || '').split(';').map((s) => s.trim()).filter(Boolean),
  ]);
  const RAIL_MAX = 16;
  const railShown = soFar.slice(-RAIL_MAX);
  const railHidden = soFar.length - railShown.length;
  if (showHold) {
    return (
      <div style={{ textAlign: 'center', margin: 'auto' }}>
        <div style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#EBA77E', marginBottom: 24 }}>
          {hold?.kicker || 'The Church of the Living God'}
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 104px)', fontWeight: 600, lineHeight: 1.04, letterSpacing: '-0.02em', margin: 0 }}>
          {hold?.title || 'Learning A.I. The Way'}
        </h1>
        <p style={{ fontSize: 'clamp(16px, 1.8vw, 24px)', color: '#CFC9BD', marginTop: 28 }}>
          {slide ? 'Ready when you are.' : 'Waiting for the teacher to begin…'}
        </p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', gap: 'clamp(20px, 3vw, 52px)', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 'clamp(16px, 2vw, 28px)' }}>
        {/* Generic position label (indexLabel) for any surface; falls back to the
            original "Week X of Y" if an older presenter posts the legacy shape. */}
        {(slide.indexLabel || slide.week) && (
          <span style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#EBA77E' }}>
            {slide.indexLabel || `Week ${slide.week} of ${slide.total}`}
          </span>
        )}
        {slide.dateLabel && (
          <span style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#CFC9BD', fontFamily: '"JetBrains Mono", monospace' }}>
            {slide.dateLabel}
          </span>
        )}
      </div>

      <h1 style={{ fontSize: 'clamp(36px, 6vw, 96px)', fontWeight: 600, lineHeight: 1.03, letterSpacing: '-0.02em', margin: 0 }}>
        {slide.title}
      </h1>

      {(slide.lead || slide.bigIdea) && (
        <p style={{ fontSize: 'clamp(20px, 2.8vw, 42px)', lineHeight: 1.3, marginTop: 'clamp(20px, 3vw, 40px)', marginBottom: 0 }}>
          {slide.lead || slide.bigIdea}
        </p>
      )}

      {/* Bullet / numbered points UNDER the main idea — details for the room and for
          note-takers (Darrell 2026-07-19). Each point is its OWN visual block (a tinted
          card with an accent marker) so it STANDS ALONE, and the uniform style + column
          keeps them reading TOGETHER as one set. Full teaching stays in presenter notes. */}
      {Array.isArray(slide.points) && slide.points.length > 0 && (
        React.createElement(
          slide.ordered ? 'ol' : 'ul',
          { style: { listStyle: 'none', margin: 'clamp(20px, 2.8vw, 40px) 0 0', padding: 0, color: '#FAF8F4', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.6vw, 22px)' } },
          slide.points.map((pt, i) => (
            <li
              key={i}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 'clamp(12px, 1.4vw, 20px)',
                background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid #C9D9A6', borderRadius: 8,
                padding: 'clamp(12px, 1.5vw, 20px) clamp(14px, 1.8vw, 24px)',
              }}
            >
              {slide.ordered ? (
                <span aria-hidden="true" style={{ flexShrink: 0, minWidth: '1.3em', color: '#C9D9A6', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', fontSize: 'clamp(15px, 1.8vw, 26px)' }}>{i + 1}</span>
              ) : (
                <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '0.5em', width: 'clamp(9px, 1vw, 15px)', height: 'clamp(9px, 1vw, 15px)', borderRadius: '50%', background: '#C9D9A6' }} />
              )}
              <span style={{ fontSize: 'clamp(16px, 2vw, 30px)', lineHeight: 1.3 }}>{pt}</span>
            </li>
          )),
        )
      )}

      {(slide.detail || slide.inApp) && (
        <p style={{ fontSize: 'clamp(16px, 2vw, 30px)', lineHeight: 1.35, marginTop: 'clamp(18px, 2.4vw, 32px)', color: '#CFC9BD' }}>
          <span style={{ color: '#C9D9A6', fontWeight: 600 }}>{slide.detailLabel || 'In the app'}: </span>{slide.detail || slide.inApp}
        </p>
      )}

      {slide.anchorRef && (
        <p style={{ fontSize: 'clamp(15px, 1.8vw, 26px)', lineHeight: 1.35, marginTop: 'clamp(20px, 3vw, 40px)', color: '#C9D9A6' }}>
          <strong>{slide.anchorRef}</strong>{slide.anchorTheme ? ` — ${slide.anchorTheme}` : ''}
        </p>
      )}

      {/* Verbatim Scripture the room reads — each line is one reference + its KJV
          text (built from the fetched public-domain KJV; DR-0076). */}
      {slide.scripture && (
        <div style={{ marginTop: 'clamp(20px, 3vw, 40px)', borderLeft: '3px solid #4A453D', paddingLeft: 'clamp(14px, 1.6vw, 22px)' }}>
          {String(slide.scripture).split('\n').filter(Boolean).map((line, i) => (
            <p key={i} style={{ fontSize: 'clamp(15px, 1.9vw, 28px)', lineHeight: 1.4, margin: i === 0 ? 0 : 'clamp(10px, 1.4vw, 18px) 0 0', color: '#FAF8F4', fontStyle: 'italic' }}>{line}</p>
          ))}
        </div>
      )}

      {/* The Scriptures this slide CITES, shown VERBATIM so the room reads the Word
          directly, in context (Darrell 2026-07-19). Reference labelled, verse italic;
          resolved from the sovereign KJV corpus, dropped if it doesn't resolve. */}
      {cited.length > 0 && (
        <div style={{ marginTop: 'clamp(20px, 3vw, 40px)', borderLeft: '3px solid #C9D9A6', paddingLeft: 'clamp(14px, 1.6vw, 22px)' }}>
          {cited.map((row, i) => (
            <p key={row.ref} style={{ fontSize: 'clamp(15px, 1.85vw, 27px)', lineHeight: 1.4, margin: i === 0 ? 0 : 'clamp(12px, 1.6vw, 20px) 0 0', color: '#FAF8F4' }}>
              <span style={{ color: '#C9D9A6', fontWeight: 700 }}>{row.ref} — </span>
              <span style={{ fontStyle: 'italic' }}>&ldquo;{row.text}&rdquo;</span>
            </p>
          ))}
        </div>
      )}
      </div>

      {/* The running Scripture index — its OWN space to the side, the list of every
          reference cited so far + the lesson total, growing to the end. The current
          slide's references glow; the rest are the trail behind them. */}
      {soFar.length > 0 && (
        <aside style={{ flex: '0 0 clamp(150px, 20vw, 300px)', alignSelf: 'stretch', borderLeft: '2px solid #4A453D', paddingLeft: 'clamp(14px, 1.4vw, 22px)' }}>
          <div style={{ fontSize: 'clamp(11px, 1.1vw, 15px)', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#EBA77E', marginBottom: 'clamp(10px, 1.2vw, 16px)' }}>
            Scriptures · {soFar.length}{scriptureTotal > soFar.length ? ` of ${scriptureTotal}` : ''}
          </div>
          {railHidden > 0 && (
            <div style={{ fontSize: 'clamp(11px, 1.1vw, 15px)', color: '#CFC9BD', fontFamily: '"JetBrains Mono", monospace', marginBottom: 'clamp(6px, 0.8vw, 10px)' }}>+{railHidden} earlier</div>
          )}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 0.8vw, 11px)' }}>
            {railShown.map((r, i) => (
              <li key={`${r}-${i}`} style={{ fontSize: 'clamp(13px, 1.3vw, 19px)', lineHeight: 1.25, fontFamily: '"JetBrains Mono", monospace', color: currentRefs.has(r) ? '#C9D9A6' : '#CFC9BD', fontWeight: currentRefs.has(r) ? 700 : 400 }}>{r}</li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}
