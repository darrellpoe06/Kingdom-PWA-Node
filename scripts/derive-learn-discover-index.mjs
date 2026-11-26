// =============================================================================
// derive-learn-discover-index — writes app/src/lib/learn-discover-index.json,
// the compact search index the Learning Zone discovery page reads
// =============================================================================
// WHY A FILE. The mounted catalog is ~44 MB of lesson text. A discovery page
// that imported it would put that on a phone's first paint. This reads the SAME
// mounted catalog Learn renders (learnInventory), keeps each lesson's id, titles,
// promotional record, anchor verse, big idea and the scripture it quotes, and
// reduces the body to its most distinctive stems. It never copies, edits or
// replaces a lesson: the lesson stays where it is, this only points at it.
//
//   cd app && npx vite-node ../scripts/derive-learn-discover-index.mjs           # write
//   cd app && npx vite-node ../scripts/derive-learn-discover-index.mjs --check   # fail on drift
//
// Zero recurring cost: plain JavaScript, no model, no service, no per-query call.
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { learnInventory } from '../app/src/lib/learn-presentation/integrity.js';
import { plainWordsFor } from '../app/src/lib/learn-plain-words.js';
import { stems, scriptureRefs } from '../app/src/lib/learn-discover-text.js';
import { CONCEPTS } from '../app/src/lib/learn-discover-concepts.js';
import { CATEGORIES } from '../app/src/lib/learn-discover-categories.js';
import RECORDS from '../app/src/lib/learn-presentation/presentation-records.json' with { type: 'json' };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'app/src/lib/learn-discover-index.json');
const CHECK = process.argv.includes('--check');
const TERMS_PER_LESSON = 70;
// Every word the search bridge and the categories know by name. A lesson that uses one twice keeps it
// even when it is not among the lesson's most distinctive words, so a subject a lesson TOUCHES is found.
const VOCAB = new Set([...CONCEPTS.flatMap((c) => stems(`${c.say} ${c.find}`)), ...CATEGORIES.flatMap((c) => c.terms)]);
const SKIP_KEYS = new Set(['id', 'quiz', 'levels', 'media', 'voices', 'sources', 'hardware', 'image', 'src', 'url', 'href']);

function bodyText(m) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') { out.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, key)); return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k)) walk(x, k);
  };
  walk(m, '');
  if (m.levels && typeof m.levels.adult === 'string') out.push(m.levels.adult);
  return out.join(' ');
}

const cut = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

export function buildIndex() {
  const inv = learnInventory();
  const recById = new Map();
  for (const r of RECORDS.records || []) if (r && r.lessonId) recById.set(r.lessonId, r);

  const flat = [];
  const df = new Map();
  inv.forEach((course, ci) => {
    for (const m of course.lessons) {
      const text = bodyText(m);
      const tf = new Map();
      for (const s of stems(text)) tf.set(s, (tf.get(s) || 0) + 1);
      for (const s of tf.keys()) df.set(s, (df.get(s) || 0) + 1);
      flat.push({ ci, m, text, tf });
    }
  });
  const N = flat.length;

  const lessons = flat.map(({ ci, m, text, tf }) => {
    const rec = recById.get(m.id);
    const scored = [];
    for (const [s, n] of tf) {
      const d = df.get(s) || 1;
      if (n < 2 || d > N * 0.5) continue; // a word said once, or in half the catalog, tells search nothing
      scored.push([s, (1 + Math.log(n)) * Math.log(1 + N / d)]);
    }
    scored.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    const row = {
      i: m.id,
      c: ci,
      t: String(m.title || ''),
      u: m.week == null ? '' : String(m.week),
      r: String(m.anchor?.ref || ''),
      th: cut(m.anchor?.theme, 260),
      b: cut(m.bigIdea, 320),
      s: scriptureRefs(`${m.anchor?.ref || ''} ${text}`).slice(0, 24),
      w: [...new Set([...scored.slice(0, TERMS_PER_LESSON).map((x) => x[0]), ...[...tf].filter(([s, n]) => n >= 2 && VOCAB.has(s)).map((x) => x[0])])],
    };
    if (Array.isArray(m.tags) && m.tags.length) row.tg = m.tags.map(String);
    if (rec && rec.displayTitle) {
      row.p = String(rec.displayTitle);
      if (rec.thumbHeadline) row.h = String(rec.thumbHeadline);
      if (rec.promoDescription) row.d = cut(rec.promoDescription, 240);
      if (rec.image && rec.image.src) row.im = String(rec.image.src);
      if (rec.originalTitleAtApproval && rec.originalTitleAtApproval !== row.t) row.stale = 1; // retitled since approval: show the original
    }
    return row;
  });

  const depts = new Set(inv.map((c) => c.department));
  return {
    schema: 'learn-discover-index/1',
    note: 'Derived by scripts/derive-learn-discover-index.mjs from the mounted catalog. Never hand-edit; run the script.',
    counts: { courses: inv.length, lessons: lessons.length, departments: depts.size },
    courses: inv.map((c) => ({ k: c.key, t: String((c.meta && c.meta.title) || c.key), d: c.department, p: plainWordsFor(c.key), n: c.lessons.length, deep: c.source === 'eternal-algorithms' ? 1 : 0 })),
    lessons,
  };
}

const next = `${JSON.stringify(buildIndex())}\n`;
if (CHECK) {
  const have = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (have !== next) { console.error('learn-discover-index.json is out of date. Run: cd app && npx vite-node ../scripts/derive-learn-discover-index.mjs'); process.exit(1); }
  console.log('learn-discover-index.json is current.');
} else {
  writeFileSync(OUT, next);
  const j = JSON.parse(next);
  console.log(`wrote ${OUT}: ${j.counts.lessons} lessons, ${j.counts.courses} courses, ${j.counts.departments} departments, ${(next.length / 1e6).toFixed(2)} MB`);
}
