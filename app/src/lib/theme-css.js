// =============================================================================
// theme-css — the ONE theme source every shell shares (extracted 2026-07-07)
// =============================================================================
// Darrell: "her app [must] change colors and resize the text like the PoeTech
// App does." The five [data-theme] palettes lived inside the monolith's inline
// <style> block, invisible to the standalone business doors. Extracted here so
// the monolith, the Moore Divahs door, and every future client door render the
// SAME themes from one source (and the monolith shrinks under its budget
// ratchet). scripts/contrast-guard.mjs reads THIS file (plus the monolith) as
// the single source of truth for per-theme WCAG contrast — every rule below
// stays guard-policed exactly as before the move.
// =============================================================================

export const THEME_CSS = `
/* ===================================================================
   THEME: WHITE · "Snow" — iOS-feel light surface (no brand affiliation)
   Design DNA borrowed from iOS / macOS conventions:
     · systemGroupedBackground (#F2F2F7) base, pure-white cards on top
     · iOS separator gray (#C6C6C8) for hairlines
     · Near-black text (#1D1D1F), iOS secondary (#8E8E93) for muted
     · Generous corner rounding (12-16px) on cards
     · Subtle stacked shadows on raised surfaces (cards + buttons)
     · Tighter letter-spacing on body for SF-feel
   All combinations exceed WCAG 2.1 AA (≥4.5:1 body, ≥3:1 UI).
   =================================================================== */
[data-theme="white"]{background-color:#F2F2F7;letter-spacing:-0.005em}
[data-theme="white"] .bg-\\[\\#FAF8F4\\]{background-color:#F2F2F7!important}
[data-theme="white"] .bg-white{background-color:#FFFFFF!important;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)}
[data-theme="white"] .bg-\\[\\#E8E4DC\\]{background-color:#E5E5EA!important}
[data-theme="white"] .border-\\[\\#E8E4DC\\]{border-color:#C6C6C8!important}
[data-theme="white"] .border-\\[\\#1A1815\\]{border-color:#1D1D1F!important;border-radius:12px}
[data-theme="white"] .border-2{border-radius:14px}
[data-theme="white"] .text-\\[\\#1A1815\\]{color:#1D1D1F!important}
[data-theme="white"] .text-\\[\\#5A5751\\]{color:#636366!important}
[data-theme="white"] .bg-\\[\\#1A1815\\]{background-color:#1D1D1F!important;border-radius:10px}
/* iOS-style breathing room on body prose */
[data-theme="white"] p,[data-theme="white"] li{line-height:1.55}
/* iOS-style soft button feel — slightly raised, subtly rounded */
[data-theme="white"] button{border-radius:10px}
[data-theme="white"] input,[data-theme="white"] select,[data-theme="white"] textarea{border-radius:8px}

/* ===================================================================
   THEME: SLATE · "Glacier" — One UI-feel surface (no brand affiliation)
   Design DNA borrowed from One UI conventions:
     · Cool blue-tinted background (#F1F3F8) with extra-rounded cards
     · Larger corner rounding (20-24px) for the soft, friendly feel
     · Deeper card shadows (more elevation)
     · Cool blue accent (#1F6FEB) where the brand accent would normally land
     · More generous padding via inset adjustments
     · Default body line-height for One UI's roomier feel
   All combinations exceed WCAG 2.1 AA.
   =================================================================== */
[data-theme="slate"]{background-color:#F1F3F8;letter-spacing:0}
[data-theme="slate"] .bg-\\[\\#FAF8F4\\]{background-color:#F1F3F8!important}
[data-theme="slate"] .bg-white{background-color:#FFFFFF!important;border-radius:22px;box-shadow:0 4px 16px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)}
[data-theme="slate"] .bg-\\[\\#E8E4DC\\]{background-color:#E1E6EF!important}
[data-theme="slate"] .border-\\[\\#E8E4DC\\]{border-color:#DDE3EC!important}
[data-theme="slate"] .text-\\[\\#1A1815\\]{color:#1B1D1F!important}
[data-theme="slate"] .text-\\[\\#5A5751\\]{color:#4A5260!important}
[data-theme="slate"] .border-\\[\\#1A1815\\]{border-color:#1B1D1F!important;border-radius:22px}
[data-theme="slate"] .border-2{border-radius:24px}
[data-theme="slate"] .bg-\\[\\#1A1815\\]{background-color:#1B5FCC!important;border-radius:18px}
[data-theme="slate"] .hover\\:bg-\\[\\#1A1815\\]:hover{background-color:#1850B0!important;color:#FFFFFF!important}
/* Roomy body prose, One UI-style */
[data-theme="slate"] p,[data-theme="slate"] li{line-height:1.6}
/* Pill-shaped buttons + extra-rounded inputs */
[data-theme="slate"] button{border-radius:18px}
[data-theme="slate"] input,[data-theme="slate"] select,[data-theme="slate"] textarea{border-radius:14px}

/* ===================================================================
   THEME: SAPPHIRE — premium blue, refined
   =================================================================== */
[data-theme="sapphire"] .bg-\\[\\#FAF8F4\\]{background-color:#EFF6FF!important}
[data-theme="sapphire"] .border-\\[\\#E8E4DC\\]{border-color:#BFDBFE!important}
[data-theme="sapphire"] .bg-\\[\\#E8E4DC\\]{background-color:#BFDBFE!important}
[data-theme="sapphire"] .text-\\[\\#1A1815\\]{color:#1E3A8A!important}
[data-theme="sapphire"] .text-\\[\\#5A5751\\]{color:#1D4ED8!important}
[data-theme="sapphire"] .border-\\[\\#1A1815\\]{border-color:#1E3A8A!important}
[data-theme="sapphire"] .bg-\\[\\#1A1815\\]{background-color:#1E3A8A!important}

/* ===================================================================
   THEME: ROSE — soft warm pink garden
   =================================================================== */
[data-theme="rose"] .bg-\\[\\#FAF8F4\\]{background-color:#FDF2F8!important}
[data-theme="rose"] .border-\\[\\#E8E4DC\\]{border-color:#FBCFE8!important}
[data-theme="rose"] .bg-\\[\\#E8E4DC\\]{background-color:#FBCFE8!important}
[data-theme="rose"] .text-\\[\\#1A1815\\]{color:#831843!important}
[data-theme="rose"] .text-\\[\\#5A5751\\]{color:#9D174D!important}
[data-theme="rose"] .border-\\[\\#1A1815\\]{border-color:#831843!important}
[data-theme="rose"] .bg-\\[\\#1A1815\\]{background-color:#831843!important}

/* ===================================================================
   THEME: MIDNIGHT — OLED-friendly true black + smooth grey gradient
   Battery-saving on OLED screens · soft greys merge into the deep
   =================================================================== */
[data-theme="midnight"]{color:#E5E5E5;background-color:#000000}
[data-theme="midnight"] .bg-\\[\\#FAF8F4\\]{background-color:#000000!important}
[data-theme="midnight"] .bg-white{background-color:#141414!important}
[data-theme="midnight"] .bg-\\[\\#1A1815\\]{background-color:#1F1F1F!important}
[data-theme="midnight"] .bg-\\[\\#E8E4DC\\]{background-color:#1A1A1A!important}
[data-theme="midnight"] .text-\\[\\#1A1815\\]{color:#E5E5E5!important}
[data-theme="midnight"] .text-\\[\\#FAF8F4\\]{color:#E5E5E5!important}
[data-theme="midnight"] .text-\\[\\#5A5751\\]{color:#888888!important}
[data-theme="midnight"] .text-\\[\\#B85838\\]{color:#FB923C!important}
[data-theme="midnight"] .text-\\[\\#5A6E3D\\]{color:#86EFAC!important}
[data-theme="midnight"] .border-\\[\\#1A1815\\]{border-color:#3A3A3A!important}
[data-theme="midnight"] .border-\\[\\#E8E4DC\\]{border-color:#2A2A2A!important}
[data-theme="midnight"] .border-\\[\\#B85838\\]{border-color:#FB923C!important}
[data-theme="midnight"] .border-\\[\\#5A6E3D\\]{border-color:#86EFAC!important}
[data-theme="midnight"] .bg-\\[\\#B85838\\]{background-color:#FB923C!important}
[data-theme="midnight"] .bg-\\[\\#5A6E3D\\]{background-color:#86EFAC!important}
/* WCAG 2.1 AA fix (2026-06-17): the #2A5A8E blue accent (Build board "Next"
   status, links) had NO midnight remap, so it stayed dark blue on black =
   2.84:1 — unreadable. The contrast guard never caught it because it only
   evaluated body-text tokens, not accents. Remap to light blue #7FB3F0 (text
   9.6:1 on #000, 8.4:1 on the #141414 card) and a brighter fill for the active
   filled badge (white on #2563EB = 5.2:1). The accent contrast check added to
   contrast-guard.mjs now fails the build if this drifts. */
[data-theme="midnight"] .text-\\[\\#2A5A8E\\]{color:#7FB3F0!important}
[data-theme="midnight"] .border-\\[\\#2A5A8E\\]{border-color:#7FB3F0!important}
[data-theme="midnight"] .bg-\\[\\#2A5A8E\\]{background-color:#2563EB!important}
/* #5A5751 already remaps as TEXT to #888888 (6.0:1); give its border/fill a
   midnight value too so the "Gated" tab reads on black (was dark-gray-on-black).
   White on the #3A3A3A fill = 11.3:1. */
[data-theme="midnight"] .border-\\[\\#5A5751\\]{border-color:#888888!important}
[data-theme="midnight"] .bg-\\[\\#5A5751\\]{background-color:#3A3A3A!important}
/* WCAG 2.1 AA fix (2026-06-10): #5A6E3D remaps to bright mint #86EFAC under
   midnight, which is readable as a text color on black but fails as a FILLED
   badge background with white text (1.4:1). Force near-black text on the
   mint for the filled green badges so they hit ~14:1. Other themes keep
   #5A6E3D dark green where white text already passes (~5.6:1). */
[data-theme="midnight"] .bg-\\[\\#5A6E3D\\].text-white{color:#1A1815!important}
/* Same fix for the #B85838 rust accent, which remaps to bright #FB923C under
   midnight: white text on it is only 2.26:1 (e.g. the "Drop your bank file"
   CTA). Near-black text -> ~9.3:1. On hover these buttons go dark (the rule
   below) and flip back to light text, so no conflict. */
[data-theme="midnight"] .bg-\\[\\#B85838\\].text-white{color:#1A1815!important}
/* WCAG 2.1 AA fix (2026-06-17, consolidated) — semantic color tokens that had
   NO midnight remap. Body text flips light under midnight, but these dark text
   tokens did NOT, so they rendered dark-on-dark (e.g. #7A1F1F error text 32x);
   and these near-white tint BANDS did NOT, so light-flipped text sat on them
   light-on-light (the Eternal Algorithms OUTCOME band, #F2F4EC). Both directions
   are now covered: every semantic TEXT token remaps BRIGHT (>=9.7:1 on the
   #141414 card), every tint BACKGROUND remaps DARK (light text >=13:1, secondary
   #888888 >=4.68:1). The background-coverage check in contrast-guard.mjs now
   fails the build if any used text token renders dark or any used bg token
   renders light in midnight. */
/* error / red text -> bright red */
[data-theme="midnight"] .text-\\[\\#7A1F1F\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#7F1D1D\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#991B1B\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#9A3412\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#DC2626\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#9B2C2C\\]{color:#FCA5A5!important}
/* success / green text -> bright mint (matches the #5A6E3D accent remap) */
[data-theme="midnight"] .text-\\[\\#15803D\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#166534\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#3F5226\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#3F5A2A\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#216E39\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#2F6B3A\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#16A34A\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#3F7A4F\\]{color:#86EFAC!important}
/* gold / amber / brown text -> bright amber */
[data-theme="midnight"] .text-\\[\\#8A6E1F\\]{color:#FCD34D!important}
[data-theme="midnight"] .text-\\[\\#8B6F47\\]{color:#FCD34D!important}
[data-theme="midnight"] .text-\\[\\#B45309\\]{color:#FCD34D!important}
[data-theme="midnight"] .text-\\[\\#5A4A2E\\]{color:#FCD34D!important}
[data-theme="midnight"] .text-\\[\\#946A00\\]{color:#FCD34D!important}
/* blue text -> bright blue */
[data-theme="midnight"] .text-\\[\\#1F6FEB\\]{color:#93C5FD!important}
/* purple text -> bright lavender */
[data-theme="midnight"] .text-\\[\\#7A5A8E\\]{color:#C4B5FD!important}
/* near-white tint BANDS -> dark, faintly hued so the band still reads as a band
   on the #141414 card (its colored left border already carries the semantics) */
[data-theme="midnight"] .bg-\\[\\#F2F4EC\\]{background-color:#16211A!important}
[data-theme="midnight"] .bg-\\[\\#F2F5EC\\]{background-color:#16211A!important}
[data-theme="midnight"] .bg-\\[\\#F0F4EA\\]{background-color:#16211A!important}
[data-theme="midnight"] .bg-\\[\\#FDE7DC\\]{background-color:#231614!important}
[data-theme="midnight"] .bg-\\[\\#FBEFEA\\]{background-color:#231614!important}
[data-theme="midnight"] .bg-\\[\\#FEE2E2\\]{background-color:#231614!important}
[data-theme="midnight"] .bg-\\[\\#FBF2F2\\]{background-color:#231614!important}
[data-theme="midnight"] .bg-\\[\\#FAF1EC\\]{background-color:#231614!important}
[data-theme="midnight"] .bg-\\[\\#FBF7EC\\]{background-color:#211D13!important}
[data-theme="midnight"] .bg-\\[\\#EFE9DF\\]{background-color:#1B1916!important}
[data-theme="midnight"] .bg-\\[\\#F0ECE4\\]{background-color:#1B1916!important}
[data-theme="midnight"] .bg-\\[\\#F4F2EE\\]{background-color:#1B1916!important}
[data-theme="midnight"] .bg-\\[\\#FCFBF8\\]{background-color:#1B1916!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#1A1815\\]:hover{background-color:#2A2A2A!important;color:#E5E5E5!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#FAF8F4\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:text-\\[\\#1A1815\\]:hover{color:#E5E5E5!important}
[data-theme="midnight"] input,[data-theme="midnight"] textarea,[data-theme="midnight"] select{color:#E5E5E5;background-color:#0A0A0A!important;border-color:#2A2A2A!important}
[data-theme="midnight"] input::placeholder,[data-theme="midnight"] textarea::placeholder{color:#666666}
`;

// The theme swatch registry (was inline in the monolith header). Key order is
// display order; 'cream' is the no-attribute default (the base palette).
export const THEMES = [
  { key: 'cream',    color: '#FAF8F4', border: '#1A1815', label: 'Cream · warm light' },
  { key: 'white',    color: '#F5F5F7', border: '#1D1D1F', label: 'Snow · clean light' },
  { key: 'slate',    color: '#F2F4F7', border: '#1F6FEB', label: 'Glacier · cool light' },
  { key: 'sapphire', color: '#EFF6FF', border: '#1E3A8A', label: 'Sapphire' },
  { key: 'rose',     color: '#FDF2F8', border: '#831843', label: 'Rose' },
  { key: 'midnight', color: '#000000', border: '#888888', label: 'Midnight · OLED black' },
];
const THEME_KEYS = new Set(THEMES.map((t) => t.key));

// Per-device theme preference — the same fail-soft localStorage pattern as
// text-size. Shared by every shell so the user's choice follows them between
// the app and the business doors on this device. First-run default is the
// LIGHT (cream) theme; dark (Midnight) is a user choice, and once a theme is
// picked this returns THAT — so the default follows the last chosen color
// (Darrell 2026-07-19).
const THEME_PREF_KEY = 'poe-theme-pref';
export function readThemePref(fallback = 'cream') {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_PREF_KEY) : null;
    return v && THEME_KEYS.has(v) ? v : fallback;
  } catch { return fallback; }
}
export function saveThemePref(theme) {
  try {
    if (typeof localStorage !== 'undefined' && THEME_KEYS.has(theme)) localStorage.setItem(THEME_PREF_KEY, theme);
  } catch { /* private mode */ }
}
