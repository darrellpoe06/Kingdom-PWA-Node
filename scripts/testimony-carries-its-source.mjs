#!/usr/bin/env node
// =============================================================================
// testimony-carries-its-source — "A true story" names whose life it was
// =============================================================================
// THE LABEL IS A PROMISE ABOUT TRUTH, and it is made on screen in words.
// story-truth.js renders a `kind: 'testimony'` block as
//
//   heading:  A true story, lived — [title] · [source]
//   footnote: A true story: this happened, told with [source]'s consent.
//
// and when the block carries NO source the footnote still says it, with "the
// person's" standing in for a name nobody wrote down. So the page tells the
// reader a real person lived this and consented to its telling, while the data
// records neither who nor that they did.
//
// PARABLE-AND-TESTIMONY-METHOD.md is not ambiguous about it. A testimony is "a
// REAL, lived, attributed account" and "Requires: it actually happened (no
// embellishment), explicit consent, privacy / minor protection, and pastoral
// care." Its rule for this exact case: "What a real person actually said or
// lived is a testimony with its source, or it stays out."
//
// MEASURED 2026-10-20 on main 4ef997c44: 94 testimony blocks, and FIVE carry a
// source -- all five Darrell's, all in living-lessons-class.js. The other 89 sit
// across eleven courses, two stories to a lesson, one parable and one testimony
// from each course's first commit. 52 are first person ("I found out what a
// deposit was the hard way"; "My father ran money out to men in our
// neighbourhood for thirty years") and 37 report an unnamed person ("A man who
// had lent four thousand pounds to a friend for a van said...").
//
// WHY THIS IS A GATE WHEN DR-0550's OWN SWEEP IS NOT. DR-0550 asks for the
// checkable details of a lived account to go "in front of him rather than in
// front of a gate", because no test can know what day a rehearsal was. That
// stands. But whether a source EXISTS is structural, not a judgement about
// anyone's life -- the method doc already demands it, and a machine can see it.
// This gate stops the ninetieth; the eighty-nine are his to decide.
//
//   node scripts/testimony-carries-its-source.mjs           # report
//   node scripts/testimony-carries-its-source.mjs --details  # with what a reader could check
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(ROOT, 'app', 'src', 'lib');

const KIND = /\bkind["']?\s*:\s*(["'])(parable|testimony)\1/g;

/** One field of a story block, read out of the slice that block owns. */
function field(slice, name) {
  const re = new RegExp(`\\b${name}["']?\\s*:\\s*(["'])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`);
  const m = re.exec(slice);
  return m ? m[2].replace(/\\(["'\\])/g, '$1') : '';
}

/**
 * Every story block in a file's source, sliced from its own `kind` to the next
 * one -- the same way story-truth.js's storiesInSource() reads them, so the two
 * cannot disagree about where a block ends.
 */
export function storyBlocks(src) {
  const text = String(src || '');
  const marks = [];
  KIND.lastIndex = 0;
  for (let m = KIND.exec(text); m; m = KIND.exec(text)) marks.push({ at: m.index, kind: m[2] });
  return marks.map((mk, i) => {
    const slice = text.slice(mk.at, i + 1 < marks.length ? marks[i + 1].at : text.length);
    return {
      kind: mk.kind,
      at: mk.at,
      title: field(slice, 'title'),
      body: field(slice, 'body'),
      source: field(slice, 'source'),
    };
  });
}

/** Every lesson-data file that could hold a story, derived rather than listed. */
export function storySources() {
  if (!existsSync(LIB)) return [];
  return readdirSync(LIB).filter((f) => f.endsWith('.js')).sort();
}

/**
 * Is this a story a reader actually meets, rather than a shape in the code?
 *
 * `perspectiveDraftFor()` in story-library.js RETURNS `{ kind: 'testimony',
 * title: '', body: '', source: '', consent: false }` -- the empty form a member
 * fills in to add their own perspective. It is a default, not an account, and
 * counting it put my first measurement one too high (89, when the shipped number
 * is 88). A shipped story has words; the form has none. Worth noting for its own
 * sake: that draft shape carries BOTH a source and a `consent` flag, so the data
 * model already knows a true story owes a reader both.
 */
const isShipped = (b) => b.body.trim().length > 0;

/** Every testimony a reader meets, attributed or not. */
export function allTestimonies() {
  const out = [];
  for (const file of storySources()) {
    for (const b of storyBlocks(readFileSync(join(LIB, file), 'utf8'))) {
      if (b.kind === 'testimony' && isShipped(b)) out.push({ file, ...b });
    }
  }
  return out;
}

/** Testimony blocks with no source: the claim without the attribution. */
export function unattributedTestimonies() {
  return allTestimonies().filter((b) => !b.source.trim());
}

/**
 * What a reader could check in a lived account, and only the person who lived it
 * can confirm: a weekday, a count, a span of years, a sum of money, a place.
 * This is the DR-0550 class of detail -- the reason the list goes to him.
 */
export function checkableDetails(body) {
  const text = String(body || '');
  const found = { days: [], money: [], spans: [], counts: [], places: [] };
  const push = (k, v) => { if (v && !found[k].includes(v)) found[k].push(v); };
  for (const m of text.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g)) push('days', m[1]);
  for (const m of text.matchAll(/(?:[$£€]\s?[\d,]+(?:\.\d+)?|\b(?:[\w-]+\s){0,3}(?:dollars|pounds|euros|cents)\b)/gi)) push('money', m[0].trim());
  for (const m of text.matchAll(/\b((?:[\w-]+|\d+)\s+(?:years?|months?|weeks?|days?|minutes?|hours?))\b/gi)) push('spans', m[1]);
  for (const m of text.matchAll(/\b(\d{4})\b/g)) push('counts', m[1]);
  for (const m of text.matchAll(/\b((?:[\w-]+\s){0,2}(?:units?|miles?|acres?|storeys?|stories|apartments?|buildings?))\b/gi)) push('places', m[1].trim());
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const all = allTestimonies();
  const bare = unattributedTestimonies();
  const details = process.argv.includes('--details');
  console.log(`testimony blocks: ${all.length} — WITH a source: ${all.length - bare.length}, WITHOUT: ${bare.length}`);
  const byFile = {};
  for (const b of bare) (byFile[b.file] ||= []).push(b);
  for (const [file, blocks] of Object.entries(byFile)) {
    console.log(`\n${file} — ${blocks.length} unattributed`);
    for (const b of blocks) {
      console.log(`   ${b.title || '(untitled)'}`);
      if (!details) continue;
      const d = checkableDetails(b.body);
      for (const [k, v] of Object.entries(d)) if (v.length) console.log(`      ${k}: ${v.join(', ')}`);
    }
  }
  if (bare.length) {
    console.log(`\n${bare.length} block(s) tell a reader "this happened, told with the person's consent" while naming no person.`);
  }
}
