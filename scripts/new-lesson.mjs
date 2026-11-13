#!/usr/bin/env node
// =============================================================================
// new-lesson — scaffold one Living Lesson as its own file, on its own number
// (DR-1468)
// =============================================================================
// Darrell, 2026-11-13: "Build 1, 2 and 3, and allow parallel branches." One
// lesson = one file under app/src/lib/living-lessons/ + one test + one branch
// (claude/lesson-llNNN) + one PR + one decision record reserved on origin.
//
//   node scripts/new-lesson.mjs --title "Your Old Men Shall Dream Dreams" \
//        --anchor "Joel 2:28" [--id ll302] [--added 2026-11-13] [--no-reserve]
//
// 1. THE NUMBER. The lowest lesson number above everything taken: the catalog
//    file and the per-file directory on disk AND on origin/main, every lesson an
//    unmerged branch adds (in either place), and every reserve/ll-* on origin.
//    Then it is RESERVED the way decision numbers are (scripts/lib/reserve-ref.mjs):
//    an empty commit pushed to refs/heads/reserve/ll-NNN with an empty lease, so
//    two sessions scaffolding at once cannot both get it. --id names a number
//    instead; it is refused if taken, and reserved like any other.
// 0. PREFLIGHT (DR-1477, scripts/lib/lesson-preflight.mjs): a shallow clone is
//    refused with `git fetch --unshallow origin`; a worktree with no
//    app/node_modules is linked to the main checkout's, and says so.
// 2. THE FILES. app/src/lib/living-lessons/<id>.js in the newest lessons' full
//    shape (four age bands, the adult lesson, two parables, a ten-question
//    quiz, the facilitator's notes, and a commented UNCHECKED slot to fill or
//    delete), with {{kjv:...}} where Scripture is quoted and {{write:...}}
//    where prose is owed; and its test, which mounts the shared gate
//    (app/src/__tests__/helpers/living-lesson-gate.js) on a spine you name.
//    Both are Prettier-formatted as written (format-guard passes with no hand
//    step), and fill-verses.mjs formats what it fills. unfilled-verse-token-
//    guard fails the build while any token is left, so a skeleton cannot ship.
// 3. THE RECORD. claim-decision-number --reserve, so the lesson's DR number is
//    held on origin before a word of the record is written. Its ledger line
//    (ai-usage-ledger.mjs --add) needs no PR number: --prs is optional.
//
// A new lesson needs NO per-lesson verse test: quoted-verse-is-the-verse.test.js
// reads every quotation of every lesson in LIVING_LESSONS_MODULES against the
// verse it names, and the per-file lessons are in that list.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claimOnRemote, reserveNext, reservedNumbers, RESERVE_NS } from './lib/reserve-ref.mjs';
import { LIVING_LESSONS_DIR_REL, lessonFileNames } from './lib/living-lesson-files.mjs';
import { flagValue, main as claimDecision } from './claim-decision-number.mjs';
import { formatFiles } from './lib/prettier-write.mjs';
import { preflight as runPreflight } from './lib/lesson-preflight.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = 'app/src/lib/living-lessons-class.js';
const SCAN_LIMIT = 60;

/** Pure. A lesson slug from a title: lowercase kebab, at most ~60 characters, on a word. */
export function slugify(title) {
  const words = String(title || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  for (const w of words) {
    if ([...out, w].join('-').length > 60) break;
    out.push(w);
  }
  return out.join('-');
}

/** Pure. Every lesson number named in catalog text and in lesson file names. */
export function lessonNumbersIn(text = '', names = []) {
  const nums = new Set();
  for (const m of String(text).matchAll(/\bid["']?\s*:\s*["']ll(\d+)-/g)) nums.add(Number(m[1]));
  for (const f of names) {
    const m = /(?:^|\/)ll(\d+)-[^/]*\.js$/.exec(f);
    if (m) nums.add(Number(m[1]));
  }
  return nums;
}

const gitIn = (cwd) => (args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024, timeout: 120_000 });
  } catch {
    return '';
  }
};

/** Every lesson number landed, in flight, or reserved, as { landed, inFlight, reserved }. */
export function lessonNumbersTaken({ cwd = ROOT, base = 'origin/main' } = {}) {
  const git = gitIn(cwd);
  const landed = new Set([
    ...lessonNumbersIn(existsSync(join(cwd, CATALOG)) ? readFileSync(join(cwd, CATALOG), 'utf8') : '', lessonFileNames(cwd)),
    ...lessonNumbersIn(git(['show', `${base}:${CATALOG}`]), git(['ls-tree', '--name-only', base, `${LIVING_LESSONS_DIR_REL}/`]).split('\n')),
  ]);
  const inFlight = new Map();
  const refs = git(['for-each-ref', '--sort=-committerdate', '--format=%(refname)', 'refs/remotes/origin/'])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((r) => !r.startsWith(`refs/remotes/origin/${RESERVE_NS}/`) && !r.endsWith('/HEAD') && r !== `refs/remotes/${base}`)
    .slice(0, SCAN_LIMIT);
  for (const ref of refs) {
    const added = git(['diff', '--name-only', '--diff-filter=A', `${base}...${ref}`, '--', `${LIVING_LESSONS_DIR_REL}/`]).split('\n');
    const plus = git(['diff', '--unified=0', `${base}...${ref}`, '--', CATALOG])
      .split('\n')
      .filter((l) => l.startsWith('+'))
      .join('\n');
    for (const n of lessonNumbersIn(plus, added)) {
      if (landed.has(n)) continue;
      inFlight.set(n, [...(inFlight.get(n) || []), ref.replace('refs/remotes/', '')]);
    }
  }
  return { landed, inFlight, reserved: reservedNumbers({ kind: 'll', cwd }) };
}

const W = (what) => `{{write: ${what}}}`;

/** Pure. The lesson file, in the newest lessons' full shape. */
export function lessonSkeleton({ id, n, title, anchor, added, dr }) {
  const k = anchor ? `{{kjv:${anchor}}}` : '{{kjv:Book C:V}}';
  const ref = anchor || W('the anchor reference, e.g. Joel 2:28');
  const q = (i) => `        {
          q: '${W(`question ${i}, answered from the Word`)}',
          options: ['${W('a wrong answer')}', '${W('the right answer')}', '${W('a wrong answer')}'],
          answer: 1,
          explain: '${k} ${W('why the answer is right, from the verse')}',
        },`;
  return `// L${n} — ${title} (${dr || 'DR-NNNN'}). ${W('who sent it, when, and the one word above it (provenance, DR-0076)')}
// Scaffolded by scripts/new-lesson.mjs. Every quotation began as a kjv token that
// scripts/fill-verses.mjs filled from app/public/bible/kjv, and the catalog-wide
// verse gate (quoted-verse-is-the-verse.test.js) reads each one against its verse.
export const ORDER = ${n};
export const ADDED = '${added}';

// UNCHECKED: fill this in, or DELETE these lines if every claim was read back
// from its source. Name what was not checked, the hosts that refused you, and
// a date to look again, e.g. 'www.example.gov refused (proxy 403); re-review: 2026-12-01'.
export const UNCHECKED = '${W('what was not read back, which hosts refused, and re-review: YYYY-MM-DD; or delete this export')}';

export default {
  id: '${id}',
  title: '${title.replace(/'/g, '’')} — ${W('the subtitle')}',
  bigIdea: '${title.toUpperCase().replace(/'/g, '’')}. ${W('the hook in two or three sentences')} ${k}',
  inApp: 'This week, do four things. ${W('four concrete actions')} Provenance, stated plainly: ${W('who sent it and what was and was not read')}',
  anchor: {
    ref: '${ref}',
    theme: '${W('the movement of the lesson, each step with its references')}',
  },
  benefits: [
    'You learn ${W('benefit one, with its reference')}',
    'You learn ${W('benefit two, with its reference')}',
    'You learn ${W('benefit three, with its reference')}',
    'You leave with ${W('a practice for the week')}',
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      title: '${W('parable title')}',
      body: '${W('an openly illustrative story with invented people, no real names (DR-0811)')} ${k}',
      verse: '${ref}',
    },
    {
      kind: 'parable',
      tone: 'solemn',
      title: '${W('parable title')}',
      body: '${W('a second parable from another culture, with dignity (DR-0257)')}',
      verse: '${ref}',
    },
  ],
  lesson: '${title.toUpperCase().replace(/'/g, '’')}. ${W('the adult lesson: sections in CAPITALS, each taught from the Word')} ${k}',
  levels: {
    child: '${title.toUpperCase().replace(/'/g, '’')}. ${W('the child band: short sentences, under grade 5')} ${k}',
    youth: '${title.toUpperCase().replace(/'/g, '’')}. ${W('the youth band')} ${k}',
    teen: '${title.toUpperCase().replace(/'/g, '’')}. ${W('the teen band, under grade 6')} ${k}',
    senior: '${title.toUpperCase().replace(/'/g, '’')}. ${W('the senior band')} ${k}',
  },
  quiz: {
    questions: [
${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q).join('\n')}
    ],
  },
  facilitator: {
    talkingPoints: [
      '${W('talking point with references')}',
      '${W('talking point with references')}',
      '${W('talking point with references')}',
    ],
    howToRun: '${W('minutes per movement')}',
    discussionPrompts: [
      '${W('a question for the room')}',
      '${W('a question for the room')}',
      '${W('a question for the room')}',
    ],
  },
};
`;
}

/** Pure. The lesson's test: the shared gate on a spine you name, plus what is particular to it. */
export function testSkeleton({ id, n, added, anchor = '' }) {
  return `// L${n} — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/${id}.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: '${id}',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: ${n},
  added: '${added}',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [['${anchor || 'Book C:V'}', '${W('a span of this verse that every band quotes')}']],
});
`;
}

export function run(
  argv = process.argv.slice(2),
  { cwd = ROOT, log = console.log, err = console.error, reserve = true, preflight = true, format = formatFiles } = {}
) {
  const title = flagValue(argv, '--title');
  if (!title) {
    err('usage: node scripts/new-lesson.mjs --title "..." [--anchor "Book C:V"] [--id llNNN] [--added YYYY-MM-DD] [--no-reserve]');
    return 2;
  }
  const anchor = flagValue(argv, '--anchor');
  const added = flagValue(argv, '--added') || new Date().toISOString().slice(0, 10);
  const wantId = flagValue(argv, '--id');
  const doReserve = reserve && !argv.includes('--no-reserve');
  if (preflight && runPreflight({ cwd, log, err }) !== 0) return 1;

  if (doReserve) gitIn(cwd)(['fetch', '--quiet', '--prune', '--no-tags', 'origin', '+refs/heads/*:refs/remotes/origin/*']);
  const { landed, inFlight, reserved } = lessonNumbersTaken({ cwd });
  const taken = new Set([...landed, ...inFlight.keys(), ...reserved]);
  const start = wantId ? Number(/^ll(\d+)$/.exec(wantId)?.[1]) : Math.max(0, ...landed) + 1;
  if (!start) {
    err(`new-lesson: --id must look like ll302, not '${wantId}'`);
    return 2;
  }
  if (wantId && taken.has(start)) {
    err(`new-lesson: ${wantId} is taken (${inFlight.get(start)?.join(', ') || 'landed or reserved'})`);
    return 1;
  }

  let n = start;
  if (doReserve) {
    const got = reserveNext({
      start,
      taken,
      maxTries: wantId ? 1 : 25,
      tryClaim: (k) => claimOnRemote({ kind: 'll', n: k, cwd, message: `reserve L${k} (${title}) for claude/lesson-ll${k}` }),
    });
    if (!got.ok) {
      err(`new-lesson: L${got.n} NOT RESERVED — ${got.reason}`);
      return 1;
    }
    n = got.n;
    log(`RESERVED L${n} on origin as refs/heads/${got.branch}`);
  } else {
    while (taken.has(n)) n += 1;
  }

  let dr = '';
  if (doReserve) {
    const lines = [];
    const code = claimDecision({
      reserve: true,
      branch: `claude/lesson-ll${n}`,
      log: (l) => {
        lines.push(l);
        log(l);
      },
      err,
    });
    const hit = lines.map((l) => /^RESERVED (DR-\d{4})/.exec(l)).find(Boolean);
    if (code !== 0 || !hit) {
      err('new-lesson: the lesson number is held, but no decision number was reserved; run claim-decision-number --reserve by hand');
    }
    dr = hit ? hit[1] : '';
  }

  const id = `ll${n}-${slugify(title)}`;
  const lessonPath = join(cwd, LIVING_LESSONS_DIR_REL, `${id}.js`);
  const testPath = join(cwd, 'app', 'src', '__tests__', `living-lessons-${id}.test.js`);
  if (existsSync(lessonPath)) {
    err(`new-lesson: ${lessonPath} already exists`);
    return 1;
  }
  mkdirSync(dirname(lessonPath), { recursive: true });
  writeFileSync(lessonPath, lessonSkeleton({ id, n, title, anchor, added, dr }));
  writeFileSync(testPath, testSkeleton({ id, n, added, anchor }));
  log(`wrote ${LIVING_LESSONS_DIR_REL}/${id}.js and app/src/__tests__/living-lessons-${id}.test.js`);
  // Both files are new, so they are formatted whatever the base says (DR-1343's
  // ratchet reads files ADDED since main, which these are).
  const fmt = format([lessonPath, testPath], { force: true });
  if (fmt.ok) log('formatted both with the repo Prettier (format-guard will read them clean)');
  else err(`new-lesson: the files are written but NOT formatted — ${fmt.reason}`);
  log(
    `next: git switch -c claude/lesson-ll${n} origin/main · write the {{write:}} prose · node scripts/fill-verses.mjs ${LIVING_LESSONS_DIR_REL}/${id}.js${dr ? ` · record ${dr}` : ''}`
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(run());
