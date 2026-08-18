// =============================================================================
// lesson-quote-guard — the verbatim gate applied to ALL audience-facing prose
// =============================================================================
// THE GAP THIS CLOSES. `living-lessons-l68-verses.test.js` proves every quoted
// Scripture is KJV-verbatim — and reads exactly ONE field to do it: `mod.lesson`.
// Meanwhile `bigIdea`, `inApp`, `benefits[]`, `anchor.theme`, `levels.child`,
// `levels.teen`, `levels.senior`, every quiz question / option / explanation, and
// the whole facilitator block are audience-facing prose full of quoted Scripture,
// and NOTHING has ever checked them. A gate whose stated claim is "every quoted
// Scripture is KJV-VERBATIM" was checking a quarter of the surface.
//
// Found 2026-08-15 while building L79, by asking what the existing gate actually
// reads rather than what its header says it does (DR-0219: SHOULD, then ARE).
// Measured immediately rather than estimated (DR-0076 §4): 3363 referenced quotes
// live outside `mod.lesson`, and 576 of them do not match the corpus.
//
// THE FOUR CLASSES, counted so nobody has to guess at the shape of the debt:
//   352  case-only — a mid-verse word capitalized because our sentence started
//        there ("A just man falleth..." for the KJV's "For a just man...").
//   109  ALL-CAPS emphasis applied INSIDE the quotation marks ("I GIVE unto you
//        power"). Our emphasis, wearing the Word's quotation marks.
//   104  substantive — wording differs. Many are deliberate reader-aids, e.g. a
//        bracketed gloss ("charity [love]", "the outward man perish[es]") or a
//        child-band paraphrase carrying a reference ("I'm coming back!"). Others
//        are real slips ("declares the end from the beginning" for "Declaring";
//        "perfect love casts out fear" for "casteth"). The classes need separate
//        remedies, so they are NOT lumped together here.
//    11  a reference the corpus cannot resolve at all.
//
// WHY A RATCHET AND NOT A SWEEP. Failing 576 at once blocks every lesson change
// in the repo and hands Darrell a wall instead of a decision — and a blind
// find-replace across quoted Scripture is precisely the forbidden move (DR-0210's
// bright line runs the same direction: do not machine-edit the inside of a
// quote). So today's set is frozen as a grandfathered baseline, exactly the shape
// of scripts/unbounded-select-baseline.json and monolith-budget.json, and the
// guard fails only on a NEW defect. Repairing an old one shrinks the baseline; it
// can only improve. The bracketed-gloss convention is a real editorial question
// for the SME, not something a script decides — it is recorded, not swept.
//
// PROVEN-TO-CATCH (DR-0076 §3): `--selftest` injects a fresh defect of each class
// into real prose and asserts the guard fails on it, then asserts clean prose
// passes. A gate that always passes is itself a lie.
//
// Usage:
//   node scripts/lesson-quote-guard.mjs
//   node scripts/lesson-quote-guard.mjs --list      # every current defect
//   node scripts/lesson-quote-guard.mjs --classes   # counts by class
//   node scripts/lesson-quote-guard.mjs --write     # re-freeze the baseline
//   node scripts/lesson-quote-guard.mjs --selftest
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BASELINE = join(HERE, 'lesson-quote-baseline.json');
const KJV = join(ROOT, 'app/public/bible/kjv');

const IDX = JSON.parse(readFileSync(join(ROOT, 'app/src/lib/bible-kjv-index.json'), 'utf8'));
const byName = new Map(IDX.map((b) => [b.name.toLowerCase(), b.file]));
// Short-name aliases our prose uses, matching the existing verbatim test.
const ALIASES = { psalm: 'psalms', ps: 'psalms', matt: 'matthew', gen: 'genesis', gal: 'galatians', rom: 'romans', phil: 'philippians', hab: 'habakkuk', jas: 'james', eph: 'ephesians', prov: 'proverbs', isa: 'isaiah', ecc: 'ecclesiastes' };

const cache = new Map();
export function corpusText(book, ch, v1, v2) {
  const key = ALIASES[book.toLowerCase()] || book.toLowerCase();
  const file = byName.get(key);
  if (!file) return null;
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')));
  const c = cache.get(file).chapters[ch - 1];
  if (!c) return null;
  const out = [];
  for (let v = v1; v <= v2; v += 1) { if (c[v - 1] == null) return null; out.push(c[v - 1]); }
  return out.join(' ');
}

// Typographic apostrophes/quotes normalized so a straight-quoted lesson string
// matches the corpus's curly ones without weakening word-level fidelity.
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const RE = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\)/g;

/**
 * Every audience-facing prose field EXCEPT `lesson`, which the existing
 * verbatim test already owns. Returns [label, text] pairs.
 */
export function proseFields(m) {
  const out = [];
  for (const k of ['bigIdea', 'inApp']) if (typeof m[k] === 'string') out.push([k, m[k]]);
  (m.benefits || []).forEach((b, i) => out.push([`benefits[${i}]`, b]));
  if (m.anchor?.theme) out.push(['anchor.theme', m.anchor.theme]);
  for (const k of ['child', 'teen', 'senior']) if (m.levels?.[k]) out.push([`levels.${k}`, m.levels[k]]);
  (m.quiz?.questions || []).forEach((q, i) => {
    if (q.q) out.push([`quiz[${i}].q`, q.q]);
    (q.options || []).forEach((o, j) => out.push([`quiz[${i}].opt${j}`, o]));
    if (q.explain) out.push([`quiz[${i}].explain`, q.explain]);
  });
  if (m.facilitator) {
    (m.facilitator.talkingPoints || []).forEach((t, i) => out.push([`fac.talk[${i}]`, t]));
    if (m.facilitator.howToRun) out.push(['fac.howToRun', m.facilitator.howToRun]);
    (m.facilitator.discussionPrompts || []).forEach((t, i) => out.push([`fac.prompt[${i}]`, t]));
  }
  return out;
}

/** Classify one mismatch so the four remedies stay distinguishable. */
function classify(quoted, verse) {
  if (verse == null) return 'unresolved-reference';
  if (norm(verse).toLowerCase().includes(quoted.toLowerCase())) {
    return /[A-Z]{3,}/.test(quoted) ? 'emphasis-inside-quote' : 'case-only';
  }
  return 'wording-differs';
}

/**
 * Scan modules for quotes that do not match the corpus.
 * @returns {{key,id,label,ref,quoted,cls}[]}
 */
export function findDefects(modules) {
  const hits = [];
  for (const m of modules) {
    for (const [label, text] of proseFields(m)) {
      for (const match of String(text).matchAll(RE)) {
        const [, quote, book, ch, v1, v2] = match;
        const ref = `${book} ${ch}:${v1}${v2 ? `-${v2}` : ''}`;
        const verse = corpusText(book, +ch, +v1, +(v2 || v1));
        for (const part of quote.split('...')) {
          const p = norm(part);
          if (!p) continue;
          if (verse != null && norm(verse).includes(p)) continue;
          hits.push({
            // The key omits the quoted text on purpose: re-wording a defective
            // quote to a DIFFERENT wrong wording must not read as "healed one,
            // added one" — it stays the same outstanding defect at that site.
            key: `${m.id}|${label}|${ref}`,
            id: m.id, label, ref, quoted: p, cls: classify(p, verse),
          });
        }
      }
    }
  }
  return hits;
}

async function loadModules() {
  const mod = await import(join(ROOT, 'app/src/lib/living-lessons-class.js'));
  return mod.LIVING_LESSONS_MODULES;
}

// -----------------------------------------------------------------------------
// SELFTEST — inject one fresh defect of each class into real prose and require
// the guard to report it; then require clean prose to report nothing.
// -----------------------------------------------------------------------------
async function selftest() {
  let failures = 0;
  const check = (name, pass, detail) => {
    if (!pass) failures += 1;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const clean = { id: 'selftest', benefits: ['He said "In the beginning God created the heaven and the earth" (Genesis 1:1) plainly.'] };
  check('clean verbatim prose reports no defect', findDefects([clean]).length === 0);

  const caseOnly = { id: 'selftest', benefits: ['"A just man falleth seven times" (Proverbs 24:16) is the promise.'] };
  const a = findDefects([caseOnly]);
  check('a mid-verse capitalization is caught', a.length === 1 && a[0].cls === 'case-only', a[0]?.cls);

  const caps = { id: 'selftest', levels: { child: 'He says "I GIVE unto you power" (Luke 10:19) to us.' } };
  const b = findDefects([caps]);
  check('ALL-CAPS emphasis inside a quote is caught', b.length === 1 && b[0].cls === 'emphasis-inside-quote', b[0]?.cls);

  const reworded = { id: 'selftest', quiz: { questions: [{ q: 'Is "perfect love casts out fear" (1 John 4:18) right?' }] } };
  const c = findDefects([reworded]);
  check('a re-worded quote is caught', c.length === 1 && c[0].cls === 'wording-differs', c[0]?.cls);

  const badref = { id: 'selftest', facilitator: { talkingPoints: ['See "nothing here" (Genesis 99:1).'] } };
  const d = findDefects([badref]);
  check('an unresolvable reference is caught', d.length === 1 && d[0].cls === 'unresolved-reference', d[0]?.cls);

  // The gate must READ every audience-facing field, not just one.
  const fields = proseFields({
    bigIdea: 'x', inApp: 'x', benefits: ['x'], anchor: { theme: 'x' },
    levels: { child: 'x', teen: 'x', senior: 'x' },
    quiz: { questions: [{ q: 'x', options: ['x'], explain: 'x' }] },
    facilitator: { talkingPoints: ['x'], howToRun: 'x', discussionPrompts: ['x'] },
  }).map(([l]) => l);
  for (const need of ['bigIdea', 'inApp', 'benefits[0]', 'anchor.theme', 'levels.child', 'levels.teen', 'levels.senior', 'quiz[0].q', 'quiz[0].opt0', 'quiz[0].explain', 'fac.talk[0]', 'fac.howToRun', 'fac.prompt[0]']) {
    check(`field is read: ${need}`, fields.includes(need));
  }

  console.log(`\n${failures === 0 ? 'SELFTEST OK' : 'SELFTEST FAILED'} — ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest();

  const modules = await loadModules();
  const hits = findDefects(modules);
  const keys = [...new Set(hits.map((h) => h.key))].sort();

  if (process.argv.includes('--classes')) {
    const by = {};
    for (const h of hits) by[h.cls] = (by[h.cls] || 0) + 1;
    for (const [k, v] of Object.entries(by).sort((x, y) => y[1] - x[1])) console.log(`${String(v).padStart(4)}  ${k}`);
    return process.exit(0);
  }
  if (process.argv.includes('--list')) {
    for (const h of hits) console.log(`${h.cls.padEnd(22)} ${h.id} | ${h.label} | ${h.ref} | "${h.quoted.slice(0, 70)}"`);
    return process.exit(0);
  }
  if (process.argv.includes('--write')) {
    writeFileSync(BASELINE, `${JSON.stringify(keys, null, 2)}\n`);
    console.log(`lesson-quote-guard: froze ${keys.length} grandfathered defect sites.`);
    return process.exit(0);
  }

  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];
  const known = new Set(baseline);
  const fresh = keys.filter((k) => !known.has(k));
  const healed = baseline.filter((k) => !keys.includes(k));

  console.log(`lesson-quote-guard: ${keys.length} defective quote sites outside mod.lesson; ${baseline.length} grandfathered.`);

  const problems = [];
  for (const k of fresh) {
    const h = hits.find((x) => x.key === k);
    problems.push(`NEW altered quote (${h.cls}) — ${k}\n       "${h.quoted.slice(0, 80)}"\n       Fetch the verse verbatim; put emphasis and glosses OUTSIDE the quotation marks.`);
  }
  for (const k of healed) problems.push(`${k} now matches the corpus — remove it from scripts/lesson-quote-baseline.json (shrink-only).`);

  if (problems.length === 0) {
    console.log('OK — no new altered quote; the baseline holds (shrink-only).');
    return process.exit(0);
  }
  console.error('\nlesson-quote-guard: FAIL —');
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nQuoted Scripture is reproduced exactly; our emphasis never wears the Word’s quotation marks (DR-0076, DR-0210).');
  return process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('lesson-quote-guard.mjs')) main();
