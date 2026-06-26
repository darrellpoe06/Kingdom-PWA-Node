// =============================================================================
// UiIcon — bundled inline-SVG UI icons (device-independent, no emoji-font dep)
// =============================================================================
// Why this exists (Darrell 2026-06-17): nav-tab and primary-button icons were
// unicode EMOJI (📓 Study, 📓 Workspace, 🕊 Notes, 🎛 Center, ...). An emoji
// renders only if the DEVICE has that glyph in its emoji font — on Darrell's
// phone several fell back to a tofu box (□) while rendering fine on his laptop.
// A "nice app" cannot depend on the viewer's OS emoji font for its chrome.
//
// Inline SVG renders IDENTICALLY on every device because the glyph ships in the
// bundle, not in the OS. Three properties make these drop-in replacements for the
// emoji they replace, with no regressions:
//   - size  : width/height are 1em, so an icon is exactly as tall as its text and
//             scales with the global LARGE-PRINT text-size primitive (lib/text-
//             size.js scales the root font-size; 1em tracks it for free).
//   - color : stroke/fill = currentColor, so the icon inherits the surrounding
//             text color — it is automatically contrast-correct in EVERY theme
//             (light / midnight / etc.) with no per-theme color to maintain.
//   - a11y  : decorative (the visible text label carries the meaning), so the
//             svg is aria-hidden + focusable="false".
//
// Dependency-free by design (no icon library added): a small registry of simple
// hand-authored paths, drawn on a 24x24 grid. Add an entry here, reference it by
// name; never reach back to a device emoji for load-bearing UI chrome.
// =============================================================================
import React from 'react';

const VIEWBOX = '0 0 24 24';

// name -> inner SVG geometry. Stroked with currentColor unless a node opts into
// fill. Keep shapes simple and unmistakable; they read at ~16-32px.
const ICONS = {
  // closed ruled notebook (spine + lines) — Study tab + Workspace button (was 📓)
  book: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
      <line x1="9" y1="3.5" x2="9" y2="20.5" />
      <line x1="12" y1="8" x2="16.5" y2="8" />
      <line x1="12" y1="11.5" x2="16.5" y2="11.5" />
    </>
  ),
  // open book — The Word / scripture (was 📖)
  bookOpen: (
    <>
      <path d="M12 6.5v13" />
      <path d="M12 6.5C10 5 7 5 4 5.5v12c3-.5 6-.5 8 1" />
      <path d="M12 6.5c2-1.5 5-1.5 8-1v12c-3-.5-6-.5-8 1" />
    </>
  ),
  // artist palette — Create (was 🎨)
  palette: (
    <>
      <path d="M12 3.2a8.8 8.8 0 0 0-.2 17.6c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a4.8 4.8 0 0 0 4.8-4.8C20.8 6.4 16.9 3.2 12 3.2Z" />
      <circle cx="7.6" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="8.6" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // phone handset — Inbound (was 📞)
  phone: (
    <path d="M6.6 3.5h3l1.4 3.8-2 1.4a11 11 0 0 0 4.9 4.9l1.4-2 3.8 1.4v3a2 2 0 0 1-2.1 2A15.8 15.8 0 0 1 4.4 5.6 2 2 0 0 1 6.6 3.5Z" />
  ),
  // control knobs / sliders — Command & Serve Center (was 🎛)
  sliders: (
    <>
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="9" cy="8" r="2.3" />
      <circle cx="15" cy="16" r="2.3" />
    </>
  ),
  // two people — CRM / contacts / leads
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6" />
      <path d="M17.5 14.2c2 .6 3.5 2.4 3.5 4.8" />
    </>
  ),
  // padlock — Admin / Legal / Observation (was 🔒)
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  // monitor / screen on a stand — Video Wall (was 📺)
  monitor: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <line x1="9" y1="20.5" x2="15" y2="20.5" />
      <line x1="12" y1="17" x2="12" y2="20.5" />
    </>
  ),
  // dove in flight — Notes + Reflection room (the Holy Spirit symbol; was 🕊)
  dove: (
    <>
      <path d="M3 13.4c3.6.5 6-1 7.8-3.6C12 8 13.6 7 15.7 7c1.6 0 2.7.7 2.7.7s-.8.9-.8 2.4c0 4-3.5 7.4-8 7.4-2.3 0-3.9-.9-3.9-.9l3.1-1.3Z" />
      <path d="M18.4 7.7 21 6" />
      <circle cx="16.7" cy="9" r=".55" fill="currentColor" stroke="none" />
    </>
  ),
  // hammer & chisel — Processing / build scratch (was ⚒)
  tools: (
    <>
      <path d="M14.5 6.5 18 3l3 3-3.5 3.5-3-3Z" />
      <path d="M15.5 8.5 7 17l-3 3-1-1 3-3 8.5-8.5" />
      <path d="M3 7l4-4 3 3-4 4-3-3Z" />
    </>
  ),
  // globe — Cultural research (all things to all men; was 🌍)
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z" />
    </>
  ),
  // four-point sparkle — Eternal Algorithms (was ✦)
  sparkle: (
    <path d="M12 3.5c.6 3.4 1.1 3.9 4.5 4.5-3.4.6-3.9 1.1-4.5 4.5-.6-3.4-1.1-3.9-4.5-4.5 3.4-.6 3.9-1.1 4.5-4.5Z" fill="currentColor" stroke="none" />
  ),
  // pushpin — pinned-entry marker (was 📌)
  pin: (
    <>
      <path d="M9 3h6l-1 5 3 3v2H7v-2l3-3-1-5Z" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </>
  ),
  // speaker with sound waves — Voice / read-aloud (was 🔊)
  volume: (
    <>
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  // checkmark — finalized / teaching-ready (Finalize tab; was ✓)
  check: (
    <path d="M5 12.5l4.5 4.5L19 6.5" />
  ),
  // upward trend line over an axis — Forecast tab (financial projection)
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M7.5 14.5l3.5-4 3 2.5 4.5-6" />
    </>
  ),
};

export const UI_ICON_NAMES = Object.keys(ICONS);

export default function UiIcon({ name, className = '', strokeWidth = 1.9, title }) {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox={VIEWBOX}
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      focusable="false"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: '-0.125em' }}
    >
      {title ? <title>{title}</title> : null}
      {inner}
    </svg>
  );
}
