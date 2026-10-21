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

import { useCallback, useEffect, useState } from 'react';
export const THEME_CSS = `

/* ===================================================================
   FORM CONTROLS — every theme paints them, or the browser will
   ===================================================================
   THE BUG (Darrell, screenshot 2026-08-28, rose theme): the Properties
   edit form rendered dark charcoal boxes with dark text — NAME, ADDRESS,
   UNIT, CITY, STATE all illegible.

   THE CAUSE, and it was never in the component. index.css declares
   "color-scheme: light dark" at :root, which tells the browser the app
   handles both — so on a phone whose OS is in dark mode the browser
   paints every UNSTYLED form control with its DARK user-agent
   background, while the app's own dark ink is inherited on top. Dark on
   dark. Until now MIDNIGHT was the only theme that painted inputs at
   all; cream, white, slate, sapphire and rose painted none of them, so
   all five broke the same way on the same phone.

   MEASURED: 27 form controls across the app carry a border and no
   background token — 8 in the properties module, 19 elsewhere. Patching
   each className would fix today's 27 and leave the 28th broken.

   SO THE THEME PAINTS THEM. Two layers:

   1. "color-scheme" is stated per theme instead of "light dark", which
      removes the guesswork at the source — the UA default now matches
      the theme the app is actually showing. (Declaring ANY value still
      opts out of Android's Force Dark, which is why index.css set it.)

   2. The controls are painted explicitly from custom properties, so the
      result does not depend on a UA default at all.

   WHY CUSTOM PROPERTIES AND NOT "[data-theme="x"] input". That selector
   scores (0,1,1) and would beat a plain "bg-white" utility (0,1,0) —
   silently overriding every control that DOES choose its own color. A
   bare element selector scores (0,0,1), so any explicit Tailwind class
   still wins, and the theme only swaps what the variable holds. The
   default is the floor, never the ceiling.

   Checkboxes, radios, ranges, color swatches, file pickers and button
   inputs are excluded: painting their background is what breaks their
   native appearance (BooksAccounts.jsx:223 is a styled range). */
:root{
  --form-surface:#FAF8F4; --form-ink:#1A1815; --form-line:#E8E4DC; --form-hint:#6B665E;
  color-scheme:light;
}
[data-theme="white"]{--form-surface:#FFFFFF;--form-ink:#1D1D1F;--form-line:#C6C6C8;--form-hint:#636366;color-scheme:light}
[data-theme="slate"]{--form-surface:#FFFFFF;--form-ink:#1B1D1F;--form-line:#DDE3EC;--form-hint:#4A5260;color-scheme:light}
[data-theme="sapphire"]{--form-surface:#FFFFFF;--form-ink:#1E3A8A;--form-line:#BFDBFE;--form-hint:#1D4ED8;color-scheme:light}
[data-theme="rose"]{--form-surface:#FFFFFF;--form-ink:#831843;--form-line:#FBCFE8;--form-hint:#9D174D;color-scheme:light}
[data-theme="heritage"]{--form-surface:#FFFDF9;--form-ink:#1A1D1B;--form-line:#DED5C3;--form-hint:#5E5A52;color-scheme:light}
[data-theme="lovecorner"]{--form-surface:#FFFFFF;--form-ink:#1A1012;--form-line:#F2D9D5;--form-hint:#6B4440;color-scheme:light}
[data-theme="anchor"]{--form-surface:#FFFFFF;--form-ink:#1B1F24;--form-line:#D3D7DD;--form-hint:#555D66;color-scheme:light}
[data-theme="bedrock"]{--form-surface:#FDFBF7;--form-ink:#211C16;--form-line:#DBD2C2;--form-hint:#5D5346;color-scheme:light}
[data-theme="midnight"]{--form-surface:#0A0A0A;--form-ink:#E5E5E5;--form-line:#2A2A2A;--form-hint:#7C7C7C;color-scheme:dark}

input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]),
select,
textarea{
  background-color:var(--form-surface);
  color:var(--form-ink);
  border-color:var(--form-line);
}
input::placeholder,textarea::placeholder{color:var(--form-hint)}
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
   THEME: THE LOVE CORNER — the church's own red, white and black
   (2026-10-16, DR-1060). Darrell: "keep the Love Corner signature
   colors of red and white and some black... however mostly red and
   white... make that the default color when it shows initially."

   THE RED IS MEASURED, NOT INVENTED. No brand color was declared
   anywhere for this door (manifest-lovecorner.webmanifest ships the
   generic #1A1815), so the church's own emblem was decoded
   (public/lovecorner-icon-512.png) and its heart sampled: #E43C28.
   That emblem is the brief in one picture — a black ring, a white
   field, a red heart over the cross.

   #E43C28 CANNOT CARRY TEXT: 4.22:1 on white, 3.98:1 under white.
   Both fail AA, so the emblem red is a FILL and a mark only, and a
   deeper sibling of the SAME hue carries every word: #C03222, which
   holds the emblem's ratios (G/R 0.260 vs 0.263, B/R 0.177 vs 0.175)
   and is deliberately 25.9 away in RGB from the Scripture palette's
   Blood marker #B01E1E, so the church's brand red can never be
   mistaken for the one red DR-0099 reserves inside Scripture.

   MEASURED with the guard's own math before a line was written:
   ink 17.77 / 18.64, muted 7.93 / 8.31, white on red 5.32,
   red text 5.38 / 5.64, green 5.36 / 5.63, blue 6.78 / 7.11.
   =================================================================== */
[data-theme="lovecorner"]{background-color:#FFF8F7;color:#1A1012;letter-spacing:0}
[data-theme="lovecorner"] .bg-\\[\\#FAF8F4\\]{background-color:#FFF8F7!important}
[data-theme="lovecorner"] .bg-white{background-color:#FFFFFF!important;box-shadow:0 1px 2px rgba(192,50,34,0.06)}
[data-theme="lovecorner"] .bg-\\[\\#E8E4DC\\]{background-color:#F8E7E4!important}
[data-theme="lovecorner"] .border-\\[\\#E8E4DC\\]{border-color:#F2D9D5!important}
[data-theme="lovecorner"] .text-\\[\\#1A1815\\]{color:#1A1012!important}
[data-theme="lovecorner"] .text-\\[\\#5A5751\\]{color:#6B4440!important}
[data-theme="lovecorner"] .text-\\[\\#B85838\\]{color:#C03222!important}
[data-theme="lovecorner"] .text-\\[\\#5A6E3D\\]{color:#5A6E3D!important}
/* The black of the ring: strong rules stay black, the FILLS go red, which
   is what "mostly red and white, some black" asks for. */
[data-theme="lovecorner"] .border-\\[\\#1A1815\\]{border-color:#1A1012!important}
[data-theme="lovecorner"] .bg-\\[\\#1A1815\\]{background-color:#C03222!important}

/* ===================================================================
   THEME: ANCHOR — meek strength under control (2026-10-16, DR-1060)
   Darrell asked for options that are "sound and solid... modern and
   elegant". Anchor is the restrained one: a cool stone field, pure
   white cards, deep ink, and a single controlled accent. Nothing
   raises its voice; the strength is in the weight of the type and the
   quiet of the surface. MEASURED: ink 14.26 / 16.56, muted 5.75 /
   6.68, white on the dark fill 11.64, rust 5.53 / 6.43, green 5.17 /
   6.01, blue 6.13 / 7.11.
   =================================================================== */
[data-theme="anchor"]{background-color:#EDEEF0;color:#1B1F24;letter-spacing:-0.003em}
[data-theme="anchor"] .bg-\\[\\#FAF8F4\\]{background-color:#EDEEF0!important}
[data-theme="anchor"] .bg-white{background-color:#FFFFFF!important;border-radius:10px;box-shadow:0 1px 2px rgba(27,31,36,0.07)}
[data-theme="anchor"] .bg-\\[\\#E8E4DC\\]{background-color:#E0E3E7!important}
[data-theme="anchor"] .border-\\[\\#E8E4DC\\]{border-color:#D3D7DD!important}
[data-theme="anchor"] .text-\\[\\#1A1815\\]{color:#1B1F24!important}
[data-theme="anchor"] .text-\\[\\#5A5751\\]{color:#555D66!important}
[data-theme="anchor"] .text-\\[\\#B85838\\]{color:#9C4426!important}
[data-theme="anchor"] .text-\\[\\#5A6E3D\\]{color:#4F6B3A!important}
[data-theme="anchor"] .border-\\[\\#1A1815\\]{border-color:#2B3440!important;border-radius:10px}
[data-theme="anchor"] .bg-\\[\\#1A1815\\]{background-color:#2B3440!important;border-radius:8px}

/* ===================================================================
   THEME: BEDROCK — sound, solid, perpetual (2026-10-16, DR-1060)
   The enduring one: warm stone, paper cards, a deep earth ink and a
   bronze accent. Where Anchor is cool and precise, Bedrock is warm
   and settled — the same discipline, a different temperature, so the
   two are a real choice rather than one palette twice. MEASURED: ink
   14.50 / 16.35, muted 6.45 / 7.28, white on the dark fill 11.88,
   bronze 5.33 / 6.01, green 5.25 / 5.92, blue 6.10 / 6.88.
   =================================================================== */
[data-theme="bedrock"]{background-color:#F2EDE4;color:#211C16;letter-spacing:0}
[data-theme="bedrock"] .bg-\\[\\#FAF8F4\\]{background-color:#F2EDE4!important}
[data-theme="bedrock"] .bg-white{background-color:#FDFBF7!important;box-shadow:0 1px 2px rgba(33,28,22,0.06)}
[data-theme="bedrock"] .bg-\\[\\#E8E4DC\\]{background-color:#E6DFD2!important}
[data-theme="bedrock"] .border-\\[\\#E8E4DC\\]{border-color:#DBD2C2!important}
[data-theme="bedrock"] .text-\\[\\#1A1815\\]{color:#211C16!important}
[data-theme="bedrock"] .text-\\[\\#5A5751\\]{color:#5D5346!important}
[data-theme="bedrock"] .text-\\[\\#B85838\\]{color:#9A4A24!important}
[data-theme="bedrock"] .text-\\[\\#5A6E3D\\]{color:#55683B!important}
[data-theme="bedrock"] .border-\\[\\#1A1815\\]{border-color:#3A3228!important}
[data-theme="bedrock"] .bg-\\[\\#1A1815\\]{background-color:#3A3228!important}


/* ===================================================================
   THEME: HERITAGE — forest & gold (2026-10-15, DR-1046 Phase 1)
   The Heritage redesign's finish: forest green for navigation and the
   dark fill, navy for the selected state, ivory rooms, paper cards with
   one soft shadow, terracotta where the house rust was, a healthy green
   where the olive was. Every pairing below was MEASURED with
   scripts/contrast-guard.mjs's own math before it was written: ink on
   ivory 15.10, muted on ivory 6.10, terracotta on ivory 5.38 (the old
   rust needed an allowlist at 4.41; this one does not), healthy green
   on ivory 5.59, white on forest 12.33, white on navy 14.22. Gold
   (#C9A227) is a FILL and a rule only — as text on ivory it is 2.07:1 —
   so its text form is #8A6510 (4.72 on ivory). True red marks nothing
   (DR-0099). Same mechanism as the five themes above: the base literals
   are remapped, so all 725 components inherit the finish and nothing
   they key on changes.
   =================================================================== */
[data-theme="heritage"]{background-color:#F6F1E7;color:#1A1D1B;letter-spacing:0}
[data-theme="heritage"] .bg-\\[\\#FAF8F4\\]{background-color:#F6F1E7!important}
[data-theme="heritage"] .bg-white{background-color:#FFFDF9!important;border-radius:14px;box-shadow:0 1px 2px rgba(26,29,27,0.04),0 8px 24px rgba(26,29,27,0.05)}
[data-theme="heritage"] .bg-\\[\\#E8E4DC\\]{background-color:#EDE5D5!important}
[data-theme="heritage"] .bg-\\[\\#F0EDE6\\]{background-color:#EDE5D5!important}
[data-theme="heritage"] .bg-\\[\\#F2EFE9\\]{background-color:#EDE5D5!important}
[data-theme="heritage"] .border-\\[\\#E8E4DC\\]{border-color:#DED5C3!important}
[data-theme="heritage"] .border-\\[\\#1A1815\\]{border-color:#1F3A2E!important;border-radius:10px}
[data-theme="heritage"] .border-2{border-radius:14px}
[data-theme="heritage"] .text-\\[\\#1A1815\\]{color:#1A1D1B!important}
[data-theme="heritage"] .text-\\[\\#FAF8F4\\]{color:#F6F1E7!important}
[data-theme="heritage"] .text-\\[\\#5A5751\\]{color:#5E5A52!important}
[data-theme="heritage"] .text-\\[\\#6B665E\\]{color:#5E5A52!important}
[data-theme="heritage"] .bg-\\[\\#1A1815\\]{background-color:#1F3A2E!important;border-radius:10px}
[data-theme="heritage"] .bg-\\[\\#5A5751\\]{background-color:#5E5A52!important}
[data-theme="heritage"] .border-\\[\\#5A5751\\]{border-color:#5E5A52!important}
[data-theme="heritage"] .hover\\:bg-\\[\\#1A1815\\]:hover{background-color:#1B2A4A!important;color:#FFFFFF!important}
[data-theme="heritage"] .hover\\:bg-\\[\\#FAF8F4\\]:hover{background-color:#EDE5D5!important}
[data-theme="heritage"] .hover\\:bg-\\[\\#E8E4DC\\]:hover{background-color:#DED5C3!important}
/* the house rust -> terracotta */
[data-theme="heritage"] .text-\\[\\#B85838\\]{color:#9E4A2A!important}
[data-theme="heritage"] .border-\\[\\#B85838\\]{border-color:#9E4A2A!important}
[data-theme="heritage"] .bg-\\[\\#B85838\\]{background-color:#9E4A2A!important;border-radius:10px}
[data-theme="heritage"] .hover\\:bg-\\[\\#B85838\\]:hover{background-color:#7E3A20!important}
/* the olive -> healthy green */
[data-theme="heritage"] .text-\\[\\#5A6E3D\\]{color:#2F6B4F!important}
[data-theme="heritage"] .border-\\[\\#5A6E3D\\]{border-color:#2F6B4F!important}
[data-theme="heritage"] .bg-\\[\\#5A6E3D\\]{background-color:#2F6B4F!important}
[data-theme="heritage"] .text-\\[\\#2F5D50\\]{color:#2F6B4F!important}
/* the blue -> navy */
[data-theme="heritage"] .text-\\[\\#2A5A8E\\]{color:#1B2A4A!important}
[data-theme="heritage"] .border-\\[\\#2A5A8E\\]{border-color:#1B2A4A!important}
[data-theme="heritage"] .bg-\\[\\#2A5A8E\\]{background-color:#1B2A4A!important}
/* THE SELECTED CHIP wears navy: navy on paper is 14:1 apart from an unselected
   chip, and its white label reads at 14.22 (checkSelectedState, DR-0713). */
[data-theme="heritage"] .poe-selected{background-color:#1B2A4A!important;color:#FFFFFF!important;border-color:#1B2A4A!important}
/* THE FULL PALETTE ON EVERY SCREEN (Christina 2026-10-16: "What happened to
   the multi-faceted colors of the app?!"). Until now Heritage changed near-black
   to forest and left the rest, so on a phone the navy, gold and terracotta of
   the reference showed only on the home tiles. Now the chrome itself carries
   them: the bottom bar is the forest rail with ivory words and a GOLD active
   tab (ink on gold reads 8.6:1; every bar button but the More menu's own
   paper items, which keep the paper); the section row's selected pill is NAVY
   (.poe-selected above); the heading rule under every section title is gold;
   the top row's active underline is navy; the amber warning tokens read as
   antique gold ink. The lesson reader's bar is untouched (data-in-reader):
   DR-0716 / DR-0744 own that row. Gold is never text on paper (the
   foundation test forbids it); on forest it is an icon tint, 9:1 apart. */
[data-theme="heritage"] .section-title-wrapper{border-color:#C9A227!important}
[data-theme="heritage"] [data-testid="top-nav-tabs"] .border-\\[\\#B85838\\]{border-color:#1B2A4A!important}
[data-theme="heritage"] .text-\\[\\#D97706\\]{color:#8A6510!important}
[data-theme="heritage"] .text-\\[\\#8A6E1F\\]{color:#8A6510!important}
[data-theme="heritage"] .chrome-dock[data-in-reader="false"]{background-color:#1F3A2E!important}
[data-theme="heritage"] .chrome-dock[data-in-reader="false"] .poe-dock-btn:not(.poe-dock-menu *){background-color:transparent!important;border-color:transparent!important;color:#F6F1E7!important}
[data-theme="heritage"] .chrome-dock[data-in-reader="false"] .poe-dock-btn:not(.poe-dock-menu *):hover{border-color:#C9A227!important}
[data-theme="heritage"] .chrome-dock[data-in-reader="false"] .poe-dock-btn-on:not(.poe-dock-menu *){background-color:#C9A227!important;border-color:#C9A227!important;color:#1A1D1B!important}
[data-theme="heritage"] .chrome-dock[data-in-reader="false"] .poe-dock-btn:not(.poe-dock-menu *) .poe-dock-accent{color:#F0D58A!important}
/* soft corners on controls, as Snow does */
[data-theme="heritage"] button{border-radius:10px}
[data-theme="heritage"] input,[data-theme="heritage"] select,[data-theme="heritage"] textarea{border-radius:8px}
[data-theme="heritage"] p,[data-theme="heritage"] li{line-height:1.55}

/* ===================================================================
   THEME: TLC — ivory & forest (2026-10-21, DR-1156)
   TLC Therapy Solutions' own finish, from Darrell's reference: a warm
   ivory field, white cards with one soft shadow and rounded corners,
   deep forest green for every primary fill and the selected state, a
   sage tint where the house tray was, charcoal ink, and champagne only
   as a rule or a fill, never as text on paper. Calming without being
   soft-headed: every pairing below was MEASURED with
   scripts/contrast-guard.mjs's own math before it was written — ink on
   ivory 12.74 / on card 14.25, muted 5.48 / 6.14, white on forest 9.72,
   forest accent text 6.74 / 7.54, sage text 5.47 / 6.12, gold text
   5.19 / 5.81, ink on gold 6.84. True red marks nothing (DR-0099).
   The same mechanism as every theme above: the base literals are
   remapped, so every TLC screen (the door, the practice workspace, the
   Learn space, hiring, onboarding, the Assistant) inherits the finish
   and nothing it keys on changes. The TLC door opens in it by its own
   fallback (TLC_DEFAULT_THEME), exactly as the church door does.
   =================================================================== */
[data-theme="tlc"]{--form-surface:#FFFFFF;--form-ink:#2A2B27;--form-line:#CFCBC0;--form-hint:#6B6F67;color-scheme:light}
[data-theme="tlc"]{background-color:#F4F2ED;color:#2A2B27;letter-spacing:0}
[data-theme="tlc"] .bg-\\[\\#FAF8F4\\]{background-color:#F4F2ED!important}
[data-theme="tlc"] .bg-white{background-color:#FFFFFF!important;box-shadow:0 1px 2px rgba(42,43,39,0.04),0 8px 24px rgba(42,43,39,0.06)}
/* RADIUS ONLY WHERE THE COMPONENT SAID NOTHING. A rule on the token outranks a
   utility (0,2,0 over 0,1,0), so written plainly it flattened every rounded-full
   pill to 12px and rounded the sticky header — seen on the live door, not in
   the code. :not([class*="rounded"]) hands the shape back to any element that
   chose its own (rounded-none included). */
[data-theme="tlc"] .bg-white:not([class*="rounded"]){border-radius:16px}
[data-theme="tlc"] .bg-\\[\\#E8E4DC\\]{background-color:#E6EBE3!important}
[data-theme="tlc"] .bg-\\[\\#F0EDE6\\]{background-color:#EDEBE4!important}
[data-theme="tlc"] .bg-\\[\\#F2EFE9\\]{background-color:#EDEBE4!important}
[data-theme="tlc"] .bg-\\[\\#F0ECE4\\]{background-color:#EDEBE4!important}
[data-theme="tlc"] .bg-\\[\\#F0F4EA\\]{background-color:#E6EBE3!important}
[data-theme="tlc"] .bg-\\[\\#E4EED6\\]{background-color:#E6EBE3!important}
[data-theme="tlc"] .border-\\[\\#E8E4DC\\]{border-color:#E4E1D9!important}
[data-theme="tlc"] .border-\\[\\#C9C2B4\\]{border-color:#D6D2C8!important}
[data-theme="tlc"] .border-\\[\\#C9BFA8\\]{border-color:#D6D2C8!important}
[data-theme="tlc"] .border-\\[\\#E6E0D6\\]{border-color:#E4E1D9!important}
/* the strong ink line reads as a sage-forest outline: an input, an outlined
   button and a strong card all keep their edge, none shout */
[data-theme="tlc"] .border-\\[\\#1A1815\\]{border-color:#8E9F93!important}
[data-theme="tlc"] .border-\\[\\#1A1815\\]:not([class*="rounded"]){border-radius:14px}
[data-theme="tlc"] .border-2{border-radius:16px}
[data-theme="tlc"] .text-\\[\\#1A1815\\]{color:#2A2B27!important}
[data-theme="tlc"] .text-\\[\\#FAF8F4\\]{color:#F4F2ED!important}
[data-theme="tlc"] .text-\\[\\#5A5751\\]{color:#5F635B!important}
[data-theme="tlc"] .text-\\[\\#6B665E\\]{color:#5F635B!important}
[data-theme="tlc"] .text-\\[\\#8A857C\\]{color:#6B6F67!important}
[data-theme="tlc"] .text-\\[\\#3F5226\\]{color:#2E5A47!important}
[data-theme="tlc"] .text-\\[\\#2F5D50\\]{color:#2F5D4A!important}
/* the dark fill is the forest — the primary button of the reference */
[data-theme="tlc"] .bg-\\[\\#1A1815\\]{background-color:#2E4A3C!important}
[data-theme="tlc"] .bg-\\[\\#1A1815\\]:not([class*="rounded"]){border-radius:12px}
[data-theme="tlc"] .bg-\\[\\#5A5751\\]{background-color:#5F635B!important}
[data-theme="tlc"] .border-\\[\\#5A5751\\]{border-color:#5F635B!important}
[data-theme="tlc"] .hover\\:bg-\\[\\#1A1815\\]:hover{background-color:#243B30!important;color:#FFFFFF!important}
[data-theme="tlc"] .hover\\:bg-\\[\\#FAF8F4\\]:hover{background-color:#EDEBE4!important}
[data-theme="tlc"] .hover\\:bg-\\[\\#E8E4DC\\]:hover{background-color:#DCE3D9!important}
/* the house rust -> forest accent (links, eyebrows, the Book pill) */
[data-theme="tlc"] .text-\\[\\#B85838\\]{color:#2F5D4A!important}
[data-theme="tlc"] .border-\\[\\#B85838\\]{border-color:#2E4A3C!important}
[data-theme="tlc"] .bg-\\[\\#B85838\\]{background-color:#2E4A3C!important}
[data-theme="tlc"] .bg-\\[\\#B85838\\]:not([class*="rounded"]){border-radius:12px}
[data-theme="tlc"] .hover\\:bg-\\[\\#B85838\\]:hover{background-color:#243B30!important}
[data-theme="tlc"] .hover\\:text-\\[\\#B85838\\]:hover{color:#2E4A3C!important}
[data-theme="tlc"] .hover\\:border-\\[\\#B85838\\]:hover{border-color:#2E4A3C!important}
/* the olive -> sage green (the healthy state, the done mark) */
[data-theme="tlc"] .text-\\[\\#5A6E3D\\]{color:#3F6B50!important}
[data-theme="tlc"] .border-\\[\\#5A6E3D\\]{border-color:#3F6B50!important}
[data-theme="tlc"] .bg-\\[\\#5A6E3D\\]{background-color:#3F6B50!important}
/* the blue stays a calm navy-blue; it already clears AA on ivory (6.36) */
/* THE SELECTED CHIP wears the forest: 9.72 apart from an unselected card,
   its white label 9.72 (checkSelectedState, DR-0713). */
[data-theme="tlc"] .poe-selected{background-color:#2E4A3C!important;color:#FFFFFF!important;border-color:#2E4A3C!important}
/* champagne is a rule and a fill, never text on paper: the heading rule,
   the active tab on the forest rail; its text form is #7A6230 (5.19) */
[data-theme="tlc"] .section-title-wrapper{border-color:#C7B27A!important}
[data-theme="tlc"] [data-testid="top-nav-tabs"] .border-\\[\\#B85838\\]{border-color:#2E4A3C!important}
[data-theme="tlc"] .text-\\[\\#D97706\\]{color:#7A6230!important}
[data-theme="tlc"] .text-\\[\\#8A6E1F\\]{color:#7A6230!important}
[data-theme="tlc"] .chrome-dock[data-in-reader="false"]{background-color:#2E4A3C!important}
[data-theme="tlc"] .chrome-dock[data-in-reader="false"] .poe-dock-btn:not(.poe-dock-menu *){background-color:transparent!important;border-color:transparent!important;color:#F4F2ED!important}
[data-theme="tlc"] .chrome-dock[data-in-reader="false"] .poe-dock-btn:not(.poe-dock-menu *):hover{border-color:#C7B27A!important}
[data-theme="tlc"] .chrome-dock[data-in-reader="false"] .poe-dock-btn-on:not(.poe-dock-menu *){background-color:#C7B27A!important;border-color:#C7B27A!important;color:#2A2B27!important}
[data-theme="tlc"] .chrome-dock[data-in-reader="false"] .poe-dock-btn:not(.poe-dock-menu *) .poe-dock-accent{color:#E9DDB8!important}
/* the focus ring and the picker's selected ring wear the forest too — seen on
   the live door as the one rust-orange left on an otherwise forest page */
[data-theme="tlc"] .focus\\:outline-\\[\\#B85838\\]:focus{outline-color:#2E4A3C!important}
[data-theme="tlc"] .ring-\\[\\#B85838\\]{--tw-ring-color:#2E4A3C!important}
/* soft corners on every control, roomy prose — the reference's feel */
[data-theme="tlc"] button{border-radius:12px}
[data-theme="tlc"] input,[data-theme="tlc"] select,[data-theme="tlc"] textarea{border-radius:10px}
[data-theme="tlc"] p,[data-theme="tlc"] li{line-height:1.55}

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
/* THE PROPERTIES MODULE'S OWN PALETTE, THEMED (2026-10-10). Darrell, on the
   Guest Ready panel at night: "Can't see in dark mode...". These five hexes
   are the Properties module's constants (ACCENT / MUTED and its three status
   colors). They had NO midnight rule because the legibility guard never
   scanned app/src/modules at all, so nobody had ever measured them on a dark
   surface — #1A1815 lands at 1.04:1 there, which is black on black. Measured
   ratios on midnight/card before this: 2.43 to 3.46, all under the 4.5 AA
   bar. Light themes are untouched; only the dark one remaps. */
[data-theme="midnight"] .text-\\[\\#6B665E\\]{color:#A3A3A3!important}
[data-theme="midnight"] .text-\\[\\#2F5D50\\]{color:#6EE7B7!important}
[data-theme="midnight"] .text-\\[\\#9B2C1E\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#B23A2E\\]{color:#FCA5A5!important}
[data-theme="midnight"] .text-\\[\\#8A6510\\]{color:#FCD34D!important}
/* The last three the widened scan turned up: two light SURFACES that stayed
   light under midnight (so dark ink on them was fine in light mode and the
   card beneath them is dark), and one dark red that never had a dark-mode
   twin. Measured: #8C2F2F 2.25:1. */
[data-theme="midnight"] .text-\\[\\#8C2F2F\\]{color:#FCA5A5!important}
[data-theme="midnight"] .bg-\\[\\#F2EFE9\\]{background-color:#232323!important}
[data-theme="midnight"] .bg-\\[\\#E4EED6\\]{background-color:#1F2A1F!important}
/* #F0EDE6 AS A FILL, not only as a hover (DR-0873 widening). The legibility
   guard reads hover:bg-[#F0EDE6] as the bg-#f0ede6 token and asks for the
   base remap too, which is the right reading: a light fill should be dark on
   midnight whether a finger is resting on it or not. The hover rule below
   covers the tap; this covers the token wherever else it lands. */
[data-theme="midnight"] .bg-\\[\\#F0EDE6\\]{background-color:#2A2A2A!important}
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
/* LIGHT HOVER FILLS: the white bar on Books -> Imported (Darrell, screenshot
   2026-09-30, black theme: "it looks bad on black view"). The "KPI's . Standard
   reports" header carried hover:bg-white, and midnight had no hover remap for
   it. A phone keeps :hover on whatever was last tapped, so after one tap the
   bar painted pure white under the midnight ink #E5E5E5: measured 1.26:1.
   Fifty-eight controls app-wide carry hover:bg-white, and five other light
   hover fills had the same hole. They all hover DARK here now, and
   contrast-guard.mjs (checkHoverCoverage) fails the build if a used hover
   fill ever renders light in midnight again. DR-0713. */
[data-theme="midnight"] .hover\\:bg-white:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#E8E4DC\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#F0ECE4\\]:hover{background-color:#2A2A2A!important}
/* #F0EDE6 is ONE HEX DIGIT from #F0ECE4 above, which is exactly why it slipped
   in unremapped on 2026-10-10 with the full-screen photo controls (the gallery
   prev/next and "See all N photos"). The eye cannot tell those two apart in a
   diff; checkHoverCoverage measured it at 0.85 luminance and failed the build.
   The gate is doing its job — DR-0713. */
[data-theme="midnight"] .hover\\:bg-\\[\\#F0EDE6\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#F2F4EC\\]:hover{background-color:#16211A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#E4EED6\\]:hover{background-color:#16211A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#FAF1EC\\]:hover{background-color:#231614!important}
/* THE SELECTED CHIP. A selected chip is filled bg-[#1A1815], which midnight
   remaps to #1F1F1F, and an unselected chip is bg-white, remapped to #141414:
   1.12:1 apart, so on black nothing looked selected. poe-selected inverts the
   fill in midnight (#0A0A0A on #E5E5E5). The light themes keep their own dark
   fill. Checked per theme by checkSelectedState in contrast-guard.mjs. DR-0713. */
/* THE HERITAGE CHROME TOKENS, ON MIDNIGHT (DR-1046). The redesign's shell
   (sidebar, bottom navigation, hero, tiles) needs colors the six base
   literals cannot express — forest, navy, gold, terracotta, healthy green,
   ivory, paper, hairline — so they are literal classes like every other
   token, and each gets its midnight twin here BEFORE a component uses it, so
   contrast-guard's token coverage and the legibility guard police them from
   the first commit. Measured on #141414: #86EFAC 12.4, #93C5FD 10.6,
   #FB923C 8.2, #FCD34D 12.0, #A3A3A3 6.4. The two bright fills take dark
   ink (the #B85838 / #5A6E3D pattern above). */
[data-theme="midnight"] .text-\\[\\#1A1D1B\\]{color:#E5E5E5!important}
[data-theme="midnight"] .text-\\[\\#5E5A52\\]{color:#A3A3A3!important}
[data-theme="midnight"] .text-\\[\\#1F3A2E\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#1B2A4A\\]{color:#93C5FD!important}
[data-theme="midnight"] .text-\\[\\#9E4A2A\\]{color:#FB923C!important}
[data-theme="midnight"] .text-\\[\\#2F6B4F\\]{color:#86EFAC!important}
[data-theme="midnight"] .text-\\[\\#8A6510\\]{color:#FCD34D!important}
[data-theme="midnight"] .text-\\[\\#F6F1E7\\]{color:#E5E5E5!important}
[data-theme="midnight"] .bg-\\[\\#F6F1E7\\]{background-color:#000000!important}
[data-theme="midnight"] .bg-\\[\\#FFFDF9\\]{background-color:#141414!important}
[data-theme="midnight"] .bg-\\[\\#EDE5D5\\]{background-color:#1A1A1A!important}
[data-theme="midnight"] .bg-\\[\\#1F3A2E\\]{background-color:#0F1A14!important}
[data-theme="midnight"] .bg-\\[\\#1B2A4A\\]{background-color:#16213A!important}
[data-theme="midnight"] .bg-\\[\\#2B2F2D\\]{background-color:#1F1F1F!important}
[data-theme="midnight"] .bg-\\[\\#9E4A2A\\]{background-color:#FB923C!important}
[data-theme="midnight"] .bg-\\[\\#9E4A2A\\].text-white{color:#1A1815!important}
[data-theme="midnight"] .bg-\\[\\#2F6B4F\\]{background-color:#86EFAC!important}
[data-theme="midnight"] .bg-\\[\\#2F6B4F\\].text-white{color:#1A1815!important}
[data-theme="midnight"] .bg-\\[\\#C9A227\\]{background-color:#FCD34D!important}
[data-theme="midnight"] .bg-\\[\\#1C3F38\\]{background-color:#0F1A14!important}
[data-theme="midnight"] .bg-\\[\\#8A6510\\]{background-color:#3A2E0E!important}
[data-theme="midnight"] .text-\\[\\#F0D58A\\]{color:#FCD34D!important}
[data-theme="midnight"] .bg-\\[\\#1A1D1B\\]{background-color:#000000!important}
[data-theme="midnight"] .text-\\[\\#C9A227\\]{color:#FCD34D!important}
[data-theme="midnight"] .border-\\[\\#DED5C3\\]{border-color:#2A2A2A!important}
[data-theme="midnight"] .border-\\[\\#1F3A2E\\]{border-color:#86EFAC!important}
[data-theme="midnight"] .border-\\[\\#1B2A4A\\]{border-color:#93C5FD!important}
[data-theme="midnight"] .border-\\[\\#9E4A2A\\]{border-color:#FB923C!important}
[data-theme="midnight"] .border-\\[\\#C9A227\\]{border-color:#FCD34D!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#EDE5D5\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#FFFDF9\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#DED5C3\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .poe-selected{background-color:#E5E5E5!important;color:#0A0A0A!important;border-color:#E5E5E5!important}
[data-theme="midnight"] input,[data-theme="midnight"] textarea,[data-theme="midnight"] select{color:#E5E5E5;background-color:#0A0A0A!important;border-color:#2A2A2A!important}
/* #666666 measured 3.45:1 on the #0A0A0A field — below AA. #7C7C7C is 4.74:1
   and still reads as a hint rather than as typed text (2026-08-28). */
[data-theme="midnight"] input::placeholder,[data-theme="midnight"] textarea::placeholder{color:#7C7C7C}
`;

// The theme swatch registry (was inline in the monolith header). Key order is
// display order; 'cream' is the no-attribute default (the base palette).
// White and Slate take their look from the two phone ecosystems most users come
// from, so the app feels familiar on whichever phone opens it (no brand names
// used) -- the reasoning moved here 2026-09-19 when the app header stopped
// carrying its own copy of this list (DR-0524). CREAM IS IN THIS LIST AND MUST
// STAY: it is the first-run default, and the header's inline copy had omitted
// it, so a reader who chose any other palette could never return to it.
export const THEMES = [
  // HERITAGE STAYS FIRST. It is the family app's first-run theme by DR-1046 —
  // Darrell's own approval, one day before DR-1060 — and a test encodes that
  // position. The church's palette rides second: the Love Corner door opens in
  // it by its own fallback (CHURCH_DEFAULT_THEME), which is what "make that the
  // default when it shows initially" asked for, without moving the family's.
  { key: 'heritage', color: '#F6F1E7', border: '#1F3A2E', label: 'Heritage · forest & gold' },
  { key: 'lovecorner', color: '#FFF8F7', border: '#C03222', label: 'The Love Corner · red & white' },
  // TLC Therapy Solutions' own finish rides third (DR-1156): the TLC door
  // opens in it by its own fallback (TLC_DEFAULT_THEME), the same shape as the
  // church's; the family app's first-run theme is untouched.
  { key: 'tlc',      color: '#F4F2ED', border: '#2E4A3C', label: 'TLC · ivory & forest' },
  { key: 'anchor',   color: '#EDEEF0', border: '#2B3440', label: 'Anchor · meek strength' },
  { key: 'bedrock',  color: '#F2EDE4', border: '#3A3228', label: 'Bedrock · sound & solid' },
  { key: 'cream',    color: '#FAF8F4', border: '#1A1815', label: 'Cream · warm light' },
  { key: 'white',    color: '#F5F5F7', border: '#1D1D1F', label: 'Snow · clean light' },
  { key: 'slate',    color: '#F2F4F7', border: '#1F6FEB', label: 'Glacier · cool light' },
  { key: 'sapphire', color: '#EFF6FF', border: '#1E3A8A', label: 'Sapphire' },
  { key: 'rose',     color: '#FDF2F8', border: '#831843', label: 'Rose' },
  { key: 'midnight', color: '#000000', border: '#888888', label: 'Midnight · OLED black' },
];
const THEME_KEYS = new Set(THEMES.map((t) => t.key));
// THE FIRST-RUN THEME OF THE FAMILY APP (DR-1046; Darrell's approval, relayed by
// Christina 2026-10-15). Heritage is what a device with no saved choice gets;
// a device that chose a palette keeps it (DR-0524), and Cream stays in the
// picker one tap away. The business doors pass their own fallback ('cream'):
// they carry their own brands and were not part of the approval.
export const DEFAULT_THEME = 'heritage';

// THE CHURCH DOOR OPENS IN THE CHURCH'S OWN COLORS (DR-1060). Darrell,
// 2026-10-16: "keep the Love Corner signature colors of red and white and some
// black... make that the default color when it shows initially", then "Make
// sure you taking care of the Love Corner App".
//
// This is a DOOR fallback, not a new global default, and that is deliberate:
// DEFAULT_THEME above is Heritage by DR-1046 — HIS OWN approval, relayed by
// Christina on 2026-10-15, for the family app. Overturning a decision one day
// old, silently, to satisfy a sentence about the CHURCH's colors would be the
// wrong reading of both. The family app keeps Heritage; the Love Corner door
// opens in the Love Corner's red; every palette stays one tap away on both
// (DR-0524 — a device that chose keeps its choice).
export const CHURCH_DEFAULT_THEME = 'lovecorner';

// THE TLC DOOR OPENS IN TLC'S OWN COLORS (DR-1156). Darrell, 2026-10-21, with
// the reference on screen: warm ivory and cream, deep forest green for the
// primary buttons and navigation, soft sage, warm taupe, a subtle champagne,
// charcoal text — "calming without appearing overly feminine... trustworthy
// and appropriate for a professional therapy practice". A DOOR fallback, as
// the church's is: the family app keeps Heritage (DR-1046), every palette
// stays one tap away on the door, and a device that chose keeps its choice
// (DR-0524).
//
// THE SHELL ASKS FOR IT BY THE DOOR TOO (`tlcDoorOnly ? TLC_DEFAULT_THEME`),
// not only TlcPublicDoor: the shell's own useThemePref paints the phone's bars
// on mount AFTER the door's (a parent's effect runs last), so with the door
// alone the TLC status bar wore Heritage's ivory — seen on the live door, not
// in the code. The comment lives here and not in the shell by DR-0291's trim.
export const TLC_DEFAULT_THEME = 'tlc';

// THE PHONE'S OWN BARS WEAR THE THEME (DR-0744; Darrell 2026-10-01, Midnight
// on his phone in the installed app, a white strip above the page and a white
// strip below it: "why have the white bar at the top and another one at the
// bottom so 3?!"). An installed app's status bar and, on Android, its
// navigation bar take their color from <meta name="theme-color">; index.html
// ships it cream for the first paint (the first-run theme) and nothing ever
// moved it, so on Midnight the page went black and the two strips stayed
// cream. The theme now writes its own color there, and on the document
// element too, so the edge under the navigation bar and any overscroll are
// the page's color, not the browser's.
/** The page color of a theme key (cream for an unknown key). Pure. */
export function themeColorFor(theme) {
  const t = THEMES.find((x) => x.key === theme) || THEMES.find((x) => x.key === DEFAULT_THEME);
  return (t || THEMES[0]).color;
}
/**
 * Paint the browser's own chrome in the theme: the theme-color meta (the
 * status bar, and the navigation bar in an installed app) and the document
 * element's background. Returns the color written, or '' with no document.
 */
export function syncThemeChrome(theme, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc || typeof doc.querySelector !== 'function') return '';
  const color = themeColorFor(theme);
  try {
    let meta = doc.querySelector('meta[name="theme-color"]');
    if (!meta && doc.head && typeof doc.createElement === 'function') {
      meta = doc.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      doc.head.appendChild(meta);
    }
    if (meta) meta.setAttribute('content', color);
  } catch { /* a document without a head */ }
  try { if (doc.documentElement && doc.documentElement.style) doc.documentElement.style.backgroundColor = color; } catch { /* ignore */ }
  return color;
}

// Per-device theme preference — the same fail-soft localStorage pattern as
// text-size. Shared by every shell so the user's choice follows them between
// the app and the business doors on this device. First-run default is the
// LIGHT (cream) theme; dark (Midnight) is a user choice, and once a theme is
// picked this returns THAT — so the default follows the last chosen color
// (Darrell 2026-07-19).
const THEME_PREF_KEY = 'poe-theme-pref';
export function readThemePref(fallback = DEFAULT_THEME) {
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

// -----------------------------------------------------------------------------
// ONE THEME, EVERY CONTROL — the store (added 2026-09-19, DR-0524)
// -----------------------------------------------------------------------------
// Darrell, reading a lesson on his phone: "Can't change the text side nor etc
// on o cellphone reader fix it." Text size and THEME both lived only in the
// header's comfort row, which the header hideaway unmounts -- measured at 360px
// mid-lesson with the top bar tucked away, there were ZERO of either in the
// DOM. Reading at night is exactly when a person reaches for Midnight.
//
// The theme was the monolith's own useState, so a second picker (the reader
// panel) could not move it. It is published from here instead, the same plain
// subscriber set text-size.js uses and for the same reason: the two pickers sit
// in unrelated trees, and a provider that must wrap both is what this avoids.
// The DOM application does NOT move -- the monolith still owns `data-theme` on
// its wrapper, so nothing about how a palette is applied changes.
const themeListeners = new Set();
/** Subscribe to theme changes. Returns the unsubscribe function. */
export function subscribeThemePref(fn) {
  if (typeof fn !== 'function') return () => {};
  themeListeners.add(fn);
  return () => { themeListeners.delete(fn); };
}
/** Set + persist + publish in one call. Returns the key actually used. */
export function setThemePref(theme) {
  if (!THEME_KEYS.has(theme)) return readThemePref();
  saveThemePref(theme);
  syncThemeChrome(theme);
  for (const fn of [...themeListeners]) { try { fn(theme); } catch (e) { /* a dead subscriber never blocks the rest */ } }
  return theme;
}
/**
 * React glue: [activeKey, setTheme]. Drop-in for the useState the monolith
 * carried, so every existing setTheme(...) call site is unchanged.
 */
export function useThemePref(fallback = DEFAULT_THEME) {
  const [theme, setTheme] = useState(() => readThemePref(fallback));
  useEffect(() => subscribeThemePref(setTheme), []);
  // VALUE ONLY, deliberately. A functional updater would have to run
  // setThemePref inside React's updater, which is a side effect React may
  // invoke twice -- so it would double-publish. Every call site in the app
  // passes a key, and a function here would be a silent no-op rather than a
  // wrong color, which is the safer way to be wrong.
  const update = useCallback((next) => {
    if (typeof next === 'function') return;
    setTheme(setThemePref(next));
  }, []);
  // The first paint too: the chosen theme is on this device before React
  // runs, and the browser's bars should wear it from the first frame the app
  // owns, not from the first time the person changes it.
  useEffect(() => { syncThemeChrome(readThemePref(fallback)); }, [fallback]);
  return [theme, update];
}
