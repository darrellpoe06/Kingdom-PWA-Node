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
import React from 'react';

export default function AudienceSlide({ slide = null, hold = null }) {
  const showHold = !!hold || !slide;
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
    <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
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
    </div>
  );
}
