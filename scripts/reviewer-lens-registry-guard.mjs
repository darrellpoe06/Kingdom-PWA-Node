#!/usr/bin/env node
// =============================================================================
// reviewer-lens-registry-guard — the banner cannot promise more than the code
// =============================================================================
// Darrell, 2026-11-12, reviewing as a new user from his phone, looking at his
// own work-order board: "I can see all this as a new person with no record?!
// They can see our businesses?!"
//
// WHAT HE HAD FOUND. The stranger banner reads "A person with no invite sees
// this: your own doors, vault, contacts and research are hidden." The headline
// before the colon is a GLOBAL claim about the whole screen; the list after it
// was PARTIAL; and they are one sentence. Four nouns were typed into the copy,
// four surfaces honoured the lens, and the sentence and the code agreed with
// each other perfectly -- while both under-described the app. Anything in the
// gap read straight through under a global promise that it would not: his
// work-order board (which is his doors' own work) and the live payments ledger
// (which is money) both did.
//
// A lens that under-hides is worse than no lens. It is the one instrument the
// steward has for "what am I exposing?", and it answered wrongly, with
// confidence, in his own hand, on his own phone.
//
// WHAT THIS GATE HOLDS. lib/reviewer-lens.js's STRANGER_HIDES is the single
// source of both the banner's wording and this check, so the two cannot drift:
//
//   1. Every entry's `module` exists and actually reads the lens. A name in the
//      sentence with no surface behind it is the original defect, inverted.
//   2. Every surface that reads isReviewerStranger is named in the registry.
//      Wiring one silently is how the sentence fell behind the app in the first
//      place: the fix for the work-order board would itself have gone unnamed.
//   3. The banner's copy is GENERATED from the list, never typed. A hand-typed
//      noun is a promise nothing holds.
//
// It is PROVEN TO CATCH in reviewer-lens-registry.test.js (DR-0076 section 3):
// a gate that cannot fail is itself a lie. Run by CI beside the other guards.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'app', 'src');
const LENS = join(SRC, 'lib', 'reviewer-lens.js');
const COPY = join(SRC, 'lib', 'reviewer-mode.jsx');
const ADMIN = join(SRC, 'lib', 'admin-console.js');

// Files that read the flag WITHOUT being a surface that hides rows, each for a
// stated reason. This is deliberately tiny and every line says why; a long list
// here would be the gate quietly turning itself off.
const NOT_A_SURFACE = new Map([
  // The shell derives the flag once and hands `stranger` to the surfaces.
  ['poe-financial-mvp-v28.jsx', 'the shell: derives the flag and passes it down'],
  // The banner and the re-export barrel ARE the lens, not a surface under it.
  ['lib/reviewer-mode.jsx', 'the banner + re-export barrel: it IS the lens'],
  ['lib/reviewer-lens.js', 'the flag itself'],
]);

const findings = [];
const fail = (m) => findings.push(m);

if (!existsSync(LENS)) {
  console.error('reviewer-lens-registry-guard: app/src/lib/reviewer-lens.js is missing');
  process.exit(1);
}
const lensSrc = readFileSync(LENS, 'utf8');

// Read the registry out of the source rather than importing it: this guard is
// plain node with no bundler, and the file is ESM with no side effects to run.
const block = lensSrc.slice(lensSrc.indexOf('export const STRANGER_HIDES'));
const entries = [...block.slice(0, block.indexOf(']')).matchAll(
  /what:\s*'([^']+)'\s*,\s*module:\s*'([^']+)'/g,
)].map((m) => ({ what: m[1], module: m[2] }));

if (entries.length === 0) fail('STRANGER_HIDES is empty or unreadable — the banner would promise nothing, or everything');

// --- 1. every named row has a surface that really reads the lens -------------
for (const e of entries) {
  const p = join(SRC, e.module);
  if (!existsSync(p)) {
    fail(`STRANGER_HIDES names "${e.what}" at ${e.module}, which does not exist — the banner would promise rows no surface hides`);
    continue;
  }
  const s = readFileSync(p, 'utf8');
  // A CALL, not a mention. Checking only that the name appears would pass a
  // file that imports the lens and never asks it -- which is precisely the
  // shape of "we wired it" that is not wiring at all. (Caught by this guard's
  // own proven-to-catch suite, which broke a surface and watched nothing
  // happen because the import line alone still satisfied a mention check.)
  if (!/isReviewerStranger\s*\(/.test(s)) {
    fail(`STRANGER_HIDES names "${e.what}" at ${e.module}, but that file never CALLS isReviewerStranger — the sentence promises it is hidden and nothing hides it`);
  }
}

// --- 2. every surface that reads the lens is named ---------------------------
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p); }
    else if (/\.(js|jsx)$/.test(e)) files.push(p);
  }
})(SRC);

const named = new Set(entries.map((e) => e.module));
for (const p of files) {
  const rel = p.slice(SRC.length + 1).split('\\').join('/');
  if (named.has(rel) || NOT_A_SURFACE.has(rel)) continue;
  if (/isReviewerStranger/.test(readFileSync(p, 'utf8'))) {
    fail(`${rel} honours the stranger lens but is not in STRANGER_HIDES — the steward is never told these rows are hidden, so the banner under-describes what it does`);
  }
}

// --- 3. every place that DESCRIBES the lens is generated, not typed ----------
// Two files tell the steward what the lens hides: the pinned banner he reads
// while reviewing, and the Admin cards he reads before entering. Both had the
// four nouns typed in, and both stayed four. Either one left hand-written is
// the same defect waiting to happen again, so both are held to the registry.
for (const [file, least] of [[COPY, 2], [ADMIN, 4]]) {
  const rel = file.slice(SRC.length + 1);
  if (!existsSync(file)) {
    fail(`app/src/${rel} is missing — nothing holds the words that describe the lens`);
    continue;
  }
  const copy = readFileSync(file, 'utf8');
  const uses = (copy.match(/strangerHidesList\(\)/g) || []).length;
  if (uses < least) {
    fail(`${rel} must build every lens description from strangerHidesList() (found ${uses}, expected at least ${least}) — a hand-typed list is a promise nothing holds`);
  }
  for (const e of entries) {
    if (new RegExp(`['\`][^'\`]*\\b${e.what}\\b[^'\`]*(hidden|still show|of yours)`).test(copy)) {
      fail(`${rel} appears to type "${e.what}" into a lens description by hand; the nouns come from the registry`);
    }
  }
}

if (findings.length) {
  console.error('reviewer-lens-registry-guard: the banner and the lens disagree\n');
  for (const f of findings) console.error(`  - ${f}`);
  console.error('\nThe fix is one of two things: wire the surface, or stop promising the rows.');
  console.error('Registry: app/src/lib/reviewer-lens.js (STRANGER_HIDES)');
  process.exit(1);
}

console.log(
  `reviewer-lens-registry-guard: OK — ${entries.length} named rows, every one honoured, `
  + 'every honouring surface named, both banner lines generated.',
);
