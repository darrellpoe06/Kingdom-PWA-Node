// =============================================================================
// feedback-area-guard — deterministic "the feedback form covers every tab" gate
// =============================================================================
// The SME-review feedback form ("Tell us what you think") has a "Which area?"
// dropdown driven by FEEDBACK_AREAS. Twice the list silently went stale: whole
// tabs (Inbound, Notes) and a pile of Church/Choir sub-tabs were missing, so a
// reviewer literally could not file feedback against them — and only a human
// reading the screen caught it.
//
// This is the "should have been caught" gate (Verification Doctrine, DR-0076):
// the NAV is the source of truth for what surfaces exist; this scans the nav
// (top-level tabs + Church sub-tabs + Choir sub-tabs) and FAILS the build if any
// of them has no matching FEEDBACK_AREAS entry. So the class can't recur.
//
// Scope note (honest): only the three dimensions whose nav-id -> area-key mapping
// is CLEAN and stable are gated here. The Projects sub-tabs (Build / Decisions /
// Review / Loops) use aliased keys (build -> build-board, loops -> loop-health)
// and are intentionally left to manual maintenance rather than ship a brittle
// gate that false-fails. Adding a tab in a gated dimension WITHOUT a feedback
// area turns the build red; that's the recurrence we are stopping.
//
// Deterministic, $0, no browser. Importable for vitest; CLI:
//   node scripts/feedback-area-guard.mjs
// =============================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MONOLITH = join(ROOT, 'app/src/poe-financial-mvp-v28.jsx');
// FEEDBACK_AREAS moved out of the monolith with the FeedbackCenter extraction.
const FEEDBACK_CENTER = join(ROOT, 'app/src/components/FeedbackCenter.jsx');
const CHOIR = join(ROOT, 'app/src/components/Choir.jsx');

// Pull the first quoted string of every `['id', ...]` pair in a slice. The outer
// array bracket is followed by a newline/`[`, not a quote, so it isn't matched —
// only the inner pairs are, i.e. exactly the ids/keys.
export function pairIds(slice) {
  const out = [];
  const re = /\[\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(slice)) !== null) out.push(m[1]);
  return out;
}

// Walk back from the `]` that sits immediately before a `.map(` whose callback
// body contains `bodyMarker`, to its matching `[`, and return that array slice.
// This targets ONE specific nav array without a whole-file regex sweep.
export function mappedArraySlice(src, bodyMarker) {
  const bodyIdx = src.indexOf(bodyMarker);
  if (bodyIdx === -1) throw new Error(`feedback-area-guard: body marker not found: ${bodyMarker}`);
  const mapIdx = src.lastIndexOf('.map(', bodyIdx);
  if (mapIdx === -1) throw new Error(`feedback-area-guard: no .map( before ${bodyMarker}`);
  const closeIdx = src.lastIndexOf(']', mapIdx);
  if (closeIdx === -1) throw new Error(`feedback-area-guard: no ] before .map( for ${bodyMarker}`);
  let depth = 0;
  for (let i = closeIdx; i >= 0; i--) {
    const c = src[i];
    if (c === ']') depth++;
    else if (c === '[') { depth--; if (depth === 0) return src.slice(i, closeIdx + 1); }
  }
  throw new Error(`feedback-area-guard: unbalanced brackets before ${bodyMarker}`);
}

// The FEEDBACK_AREAS keys (the first string of each `['key', 'label']` item).
export function feedbackKeys(src) {
  const start = src.indexOf('FEEDBACK_AREAS = [');
  if (start === -1) throw new Error('feedback-area-guard: FEEDBACK_AREAS not found');
  const end = src.indexOf('\n];', start);
  if (end === -1) throw new Error('feedback-area-guard: end of FEEDBACK_AREAS not found');
  return pairIds(src.slice(start, end));
}

// Coverage rules per dimension. Each returns the area-key(s) that would satisfy a
// nav id; the gate passes if at least one is present in the feedback keys.
const RULES = {
  // Top-level tab: an exact key, or any sub-feature key prefixed `id-`.
  topNav: (id, keys) => keys.some(k => k === id || k.startsWith(id + '-')),
  // Church sub-tab: home is the Church landing (`church`); others are `church-<id>`.
  churchSub: (id, keys) => keys.includes(id === 'home' ? 'church' : `church-${id}`),
  // Choir sub-tab: always `choir-<id>`.
  choirTab: (id, keys) => keys.includes(`choir-${id}`),
};

// Given the scraped ids + feedback keys, return the list of uncovered surfaces.
export function coverageGaps({ topNav, churchSub, choirTabs, keys }) {
  const gaps = [];
  for (const id of topNav) if (id !== '__sep__' && !RULES.topNav(id, keys)) gaps.push(`top-level tab "${id}" has no feedback area`);
  for (const id of churchSub) if (!RULES.churchSub(id, keys)) gaps.push(`Church sub-tab "${id}" has no feedback area (expected key "church-${id}")`);
  for (const id of choirTabs) if (!RULES.choirTab(id, keys)) gaps.push(`Choir sub-tab "${id}" has no feedback area (expected key "choir-${id}")`);
  return gaps;
}

// Read the real source and compute everything.
export function scan() {
  const mono = readFileSync(MONOLITH, 'utf8');
  const choir = readFileSync(CHOIR, 'utf8');
  const topNav = pairIds(mappedArraySlice(mono, 'setView(id)'));
  const churchSub = pairIds(mappedArraySlice(mono, 'setChurchView(id)'));
  const choirStart = choir.indexOf('const TABS = [');
  const choirTabs = pairIds(choir.slice(choirStart, choir.indexOf('];', choirStart)));
  const keys = feedbackKeys(readFileSync(FEEDBACK_CENTER, 'utf8'));
  const gaps = coverageGaps({ topNav, churchSub, choirTabs, keys });
  return { topNav, churchSub, choirTabs, keys, gaps };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('feedback-area-guard.mjs')) {
  const { topNav, churchSub, choirTabs, keys, gaps } = scan();
  console.log(`feedback-area-guard: ${topNav.length} top-level tabs, ${churchSub.length} Church sub-tabs, ${choirTabs.length} Choir sub-tabs vs ${keys.length} feedback areas`);
  if (gaps.length) {
    console.error('FAIL — surfaces with no feedback area:\n  - ' + gaps.join('\n  - '));
    process.exit(1);
  }
  console.log('OK — every gated nav surface is selectable in the feedback form.');
}
