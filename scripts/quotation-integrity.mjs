// =============================================================================
// quotation-integrity — is every quotation in a lesson actually His words, whole?
// =============================================================================
// Found 2026-09-18, mid-way through the full-levels pass (task #21 / DR-0418).
// Two lessons in a row — L89 and L88 — turned out to be shipping the same two
// defects, so the series was measured instead of the pair being patched:
//
//   ELIDED QUOTATIONS: measured by THIS module's own scope (the reader-facing
//   fields listed below), 745 quoted spans across 113 of 172 lessons carry an
//   ellipsis. 704 are genuine elisions of HIS WORDS — both sides found verbatim
//   in the local KJV corpus — and for 679 of those a CONTIGUOUS verbatim span
//   covering the whole quotation is available, which is to say DR-0459's own
//   remedy ("always a shorter genuinely-verbatim span, never an elision") is
//   mechanically reachable for the overwhelming majority, usually by quoting a
//   little MORE of the verse rather than a little less. 14 are our own words
//   wearing quotation marks, which is a different defect in the same family.
//   (A first ad-hoc probe reported 736/696/671 across 53 lessons; it counted
//   `benefits` and skipped `anchor.theme`. The numbers here are the gate's own
//   scope and are the ones that govern — recorded because a measurement is only
//   as good as the scope stated with it.)
//
//   RECITED DECISION RECORDS: 44 of 172 lessons print a DR-nnnn identifier into
//   text a READER sees — most often a senior band opening with a rule and its
//   internal citation, e.g. "(DR-0098: let the Word explain the Word)". The rule
//   is right every time. The citation is ours, not theirs: a reader has no idea
//   what DR-0098 is, and a lesson showing its own bookkeeping has stopped
//   speaking to the person in front of it.
//
// WHY THIS IS A RATCHET AND NOT A SWEEP. The same reason title-in-narrative.mjs
// gives for its 471, and the reason this repo forbids a blind God->Yahweh sweep:
// Each needs the right contiguous
// span chosen by reading the verse AND the surrounding sentence re-read so the
// prose still works — a mechanical substitution would corrupt good writing at
// scale to satisfy a counter, and on quotations of Scripture that is the worst
// possible trade. 745 replacements are 745 judgement calls. So today's counts
// freeze as debt: a NEW offender fails the
// build, recorded entries may only be removed, and the full-levels pass drains
// them lesson by lesson as it reaches each one.
//
// WHAT IS MEASURED, NAMED HONESTLY. An ellipsis inside a double-quoted span in
// reader-facing text. That is exact and needs no proxy. Whether the ellipsis
// elides SCRIPTURE (rather than our own quoted phrase) is decided by looking
// both sides up in the corpus, which can misjudge a fragment under three words
// — those are counted separately and never asserted either way.
//
// Pure + deterministic: every function takes its data as an argument.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const QUOTATION_BASELINE_PATH = join(HERE, '..', 'app', 'src', 'lib', 'quotation-integrity-baseline.json');
const KJV_DIR = join(HERE, '..', 'app', 'public', 'bible', 'kjv');

export const QUOTE_BANDS = ['child', 'youth', 'teen', 'senior'];
// The fields a reader actually reads. Facilitator notes and quiz explanations
// are deliberately out of scope for the DR-id check in this first cut: the
// facilitator is a steward of the house and a record id is not noise to him.
export const READER_FIELDS = ['lesson', 'bigIdea', 'inApp'];

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const ELLIPSIS = /\.\.\.|…/;

/**
 * Every place a QUOTATION can appear, which is wider than readerTexts.
 *
 * WHY TWO SETS (2026-09-19, DR-0545). READER_FIELDS above is scoped for the
 * DR-id check, and the reason is written right there: a record id is not noise
 * to a facilitator, so his notes are out of that check's scope. The quotation
 * gate then reused readerTexts and silently inherited a scope that has nothing
 * to do with record ids — so benefits, the quiz and the facilitator's talking
 * points were never checked against the KJV at all.
 *
 * MEASURED the day this was added: 2,942 quoted spans live in those three
 * surfaces. 2,906 resolved verbatim — the authoring had been faithful — and 36
 * did not: eight quotations that were not the verse, one that shouted a word
 * His text does not, and twenty-seven references abbreviated past the point a
 * resolver could check them. All 36 were repaired before this shipped.
 *
 * His words are His words wherever they are printed, and the facilitator reads
 * the talking points ALOUD to a room. There is no surface where the verse may
 * be approximate.
 */
export function quotedTexts(module) {
  const out = readerTexts(module);
  (module.benefits || []).forEach((x, i) => {
    if (typeof x === 'string') out.push([`benefits[${i}]`, x]);
  });
  const questions = (module.quiz && module.quiz.questions) || [];
  questions.forEach((q, i) => {
    if (typeof q.q === 'string') out.push([`quiz[${i}].q`, q.q]);
    if (typeof q.explain === 'string') out.push([`quiz[${i}].explain`, q.explain]);
    (q.options || []).forEach((o, j) => {
      if (typeof o === 'string') out.push([`quiz[${i}].options[${j}]`, o]);
    });
  });
  ((module.facilitator && module.facilitator.talkingPoints) || []).forEach((x, i) => {
    if (typeof x === 'string') out.push([`talkingPoints[${i}]`, x]);
  });
  return out;
}

/** Every reader-facing string of a module, as [where, text] pairs. */
export function readerTexts(module) {
  const out = [];
  for (const f of READER_FIELDS) {
    if (typeof module[f] === 'string') out.push([f, module[f]]);
  }
  for (const b of QUOTE_BANDS) {
    const t = module.levels && module.levels[b];
    if (typeof t === 'string') out.push([`levels.${b}`, t]);
  }
  if (module.anchor && typeof module.anchor.theme === 'string') out.push(['anchor.theme', module.anchor.theme]);
  return out;
}

let corpusCache = null;
/**
 * The whole KJV corpus as one normalised string, with a sentinel between
 * chapters so a "contiguous span" can never be claimed across a chapter break.
 */
export function corpusText() {
  if (corpusCache !== null) return corpusCache;
  let all = '';
  for (const f of readdirSync(KJV_DIR)) {
    if (!f.endsWith('.json') || f === 'index.json') continue;
    const bk = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8'));
    if (!Array.isArray(bk.chapters)) continue;
    for (const ch of bk.chapters) all += ` § ${ch.join(' ')}`;
  }
  corpusCache = norm(all);
  return corpusCache;
}

/**
 * Classify one ellipsis-bearing quotation.
 *  'scripture'   — every side of the elision is verbatim in the corpus
 *  'ours'        — no side is, so our own words are wearing quotation marks
 *  'undecidable' — only short fragments to go on; never asserted either way
 * `contiguous` says whether one unbroken verbatim span covers the whole thing,
 * which is the remedy DR-0459 asks for.
 */
export function classifyElision(quoted, corpus = corpusText()) {
  const parts = String(quoted)
    .split(/\s*(?:\.\.\.|…)\s*/)
    .map((p) => norm(p).replace(/^[,;:]+|[,;:]+$/g, ''))
    .filter((p) => p.split(/\s+/).filter(Boolean).length >= 3);
  if (!parts.length) return { kind: 'undecidable', contiguous: false };
  const found = parts.filter((p) => corpus.includes(p));
  if (found.length !== parts.length) {
    return { kind: found.length ? 'undecidable' : 'ours', contiguous: false };
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  const i = corpus.indexOf(first);
  let contiguous = false;
  if (i >= 0) {
    const j = corpus.indexOf(last, i);
    if (j >= 0) contiguous = !corpus.slice(i, j + last.length).includes('§');
  }
  return { kind: 'scripture', contiguous };
}

/** Every ellipsis-bearing quotation in a lesson, by field. */
export function elidedQuotations(module, corpus = corpusText()) {
  const out = [];
  for (const [where, text] of readerTexts(module)) {
    for (const m of String(text).matchAll(/"([^"]*)"/g)) {
      if (!ELLIPSIS.test(m[1])) continue;
      out.push({ where, quoted: m[1], ...classifyElision(m[1], corpus) });
    }
  }
  return out;
}

/** Every reader-facing field of a lesson that prints a DR-nnnn identifier. */
export function recitedRecords(module) {
  const out = [];
  for (const [where, text] of readerTexts(module)) {
    const ids = [...new Set((String(text).match(/DR-\d{4}/g) || []))];
    if (ids.length) out.push({ where, ids });
  }
  return out;
}

export function scanQuotationIntegrity(modules) {
  const elided = {};
  const recited = {};
  const totals = { spans: 0, scripture: 0, ours: 0, undecidable: 0, contiguousAvailable: 0 };
  const corpus = corpusText();
  for (const m of modules || []) {
    const e = elidedQuotations(m, corpus);
    if (e.length) {
      // Record per FIELD rather than per span: a field is what an author edits,
      // and a count of spans inside it would churn the baseline on any rewrite.
      const byField = {};
      for (const x of e) {
        byField[x.where] = (byField[x.where] || 0) + 1;
        totals.spans += 1;
        totals[x.kind] += 1;
        if (x.contiguous) totals.contiguousAvailable += 1;
      }
      elided[m.id] = byField;
    }
    const r = recitedRecords(m);
    if (r.length) recited[m.id] = r.map((x) => x.where).sort();
  }
  return {
    measuredLessons: (modules || []).length,
    lessonsElided: Object.keys(elided).length,
    lessonsReciting: Object.keys(recited).length,
    totals,
    elided,
    recited,
  };
}

export function loadQuotationBaseline() {
  try {
    return JSON.parse(readFileSync(QUOTATION_BASELINE_PATH, 'utf8'));
  } catch {
    return { measuredLessons: 0, lessonsElided: 0, lessonsReciting: 0, totals: {}, elided: {}, recited: {} };
  }
}

/**
 * Fresh offenders fail the build; healed entries are reported so the baseline
 * shrinks deliberately instead of drifting. A field that GAINS elided spans is
 * fresh too — otherwise a lesson could add ellipses wherever it already had one.
 */
export function ratchetQuotationIntegrity(scan, baseline = loadQuotationBaseline()) {
  const knownE = baseline.elided || {};
  const knownR = baseline.recited || {};
  const fresh = [];
  const healed = [];
  for (const [id, byField] of Object.entries(scan.elided)) {
    const before = knownE[id] || {};
    for (const [where, n] of Object.entries(byField)) {
      const was = before[where] || 0;
      if (n > was) fresh.push(`${id} :: ${where} :: elided quotations ${was} -> ${n}`);
    }
  }
  for (const [id, byField] of Object.entries(knownE)) {
    const now = scan.elided[id] || {};
    for (const [where, n] of Object.entries(byField)) {
      const isNow = now[where] || 0;
      if (isNow < n) healed.push(`${id} :: ${where} :: elided quotations ${n} -> ${isNow}`);
    }
  }
  for (const [id, fields] of Object.entries(scan.recited)) {
    const before = knownR[id] || [];
    for (const where of fields) if (!before.includes(where)) fresh.push(`${id} :: ${where} :: recites a decision record`);
  }
  for (const [id, fields] of Object.entries(knownR)) {
    const now = scan.recited[id] || [];
    for (const where of fields) if (!now.includes(where)) healed.push(`${id} :: ${where} :: recites a decision record`);
  }
  return { fresh, healed };
}

export function buildQuotationBaseline(scan) {
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  return {
    note: 'Shrink-only debt, measured 2026-09-18. TWO classes, both about whether a reader is given His words whole and our bookkeeping kept out of his way. (1) elided: fields carrying a quotation with an ellipsis in it — DR-0459 forbids the elision and asks for a shorter genuinely-verbatim span, and the totals beside this note say how many of the real ones have a contiguous span available. (2) recited: fields printing a DR-nnnn identifier at a reader. A NEW offender fails the build, and a field that gains elided spans counts as new; entries are removed as the full-levels pass reaches each lesson, never added. Never sweep this mechanically: each elision needs the right span chosen by reading the verse and the sentence re-read after.',
    measuredLessons: scan.measuredLessons,
    lessonsElided: scan.lessonsElided,
    lessonsReciting: scan.lessonsReciting,
    totals: scan.totals,
    elided: sorted(scan.elided),
    recited: sorted(scan.recited),
  };
}
