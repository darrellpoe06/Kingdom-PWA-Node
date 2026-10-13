// @vitest-environment node
// =============================================================================
// Development — slice 1, gated against the repository it is taught from
// =============================================================================
// Darrell 2026-09-17: "and also uh, development, those sorts of courses. I want
// to make sure that I have those. And I want all these things done like as soon
// as possible so there can be context and content all at the same time SO ALL
// QUESTIONS CAN BE ANSWERED WITHOUT EVEN HAVING TO HAVE A CONVERSATION WITH ME."
//
// That last clause is what this gate protects. The way a platform answers
// questions without its builder present is to document its OWN construction --
// so the course claims, in its own header, that nothing in it is illustrative.
// A claim like that is worthless unless something checks it, and the check has
// to be sharper than "does the prose mention a file":
//
//   1. EVERY CITED PATH MUST EXIST IN THIS REPOSITORY. A lesson that sends a
//      learner to a file that is not there is worse than a vague lesson.
//   2. EVERY CITED SYMBOL MUST BE IN THE FILE THE LESSON NAMES. This is the one
//      that already caught a real error: lesson 6 was first written using the
//      names from the pull request that DIAGNOSED the service-worker outage
//      (SCOPE_SHELLS), and that pull request is still open -- those names are
//      not on main. The equivalent fix IS on main under different names. Had
//      this check not existed, a course about verifying things would have told
//      learners to look for code that does not exist.
//   3. THE VERSES MUST BE VERBATIM, like every other surface in this house.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEVELOPMENT_MODULES, DEVELOPMENT_META, DEVELOPMENT_SESSION_FLOW,
  buildDevelopmentSchedule, exportDevelopmentCurriculumMarkdown,
} from '../lib/development-class.js';
import { LEARN_CATALOG, catalogCategory } from '../lib/learn-catalog.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all.replace(/’/g, "'");
})();

const FLAT = (() => {
  const out = [];
  const walk = (path, v) => {
    if (typeof v === 'string') out.push([path, v]);
    else if (Array.isArray(v)) v.forEach((e, i) => walk(`${path}[${i}]`, e));
    else if (v && typeof v === 'object') for (const [k, e] of Object.entries(v)) walk(path ? `${path}.${k}` : k, e);
  };
  for (const m of DEVELOPMENT_MODULES) walk(m.id, m);
  walk('META', DEVELOPMENT_META);
  return out;
})();
const ALL_TEXT = FLAT.map(([, t]) => t).join('\n').replace(/’/g, "'");

const spansOf = (text) => {
  const s = text.replace(/’/g, "'");
  const at = [...s.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(s.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// Our own quoted phrases. Not one is Scripture, and the honesty check proves it.
const OUR_OWN_QUOTED = [
  // NOTE ON WHAT IS NOT HERE. 'it is done' sat in this list until the honesty
  // assertion below rejected it: "It is done" IS corpus text (Revelation 21:6),
  // so it passes the verbatim check on its own and must never be allowlisted.
  // The honesty check caught that, which is the entire reason for having it -
  // an allowlist that can absorb real Scripture is a hole, not a list.
  // Same for 'better', removed for the same reason: it is corpus text too
  // ("better than the mighty"), so it needs no allowance. Three entries were
  // rejected by that assertion while this gate was being written - a useful
  // reminder that short phrases are corpus text far more often than they look.
  'it works', 'It works', 'it passes', 'it is accessible', 'it is secure',
  'does my code work',      // the weaker question the habit replaces
  'somebody will notice',   // the non-answer that means the cost was not counted
  'UP and FRESH',           // what the dashboard said while phones were dark
  'it is only additive',    // the argument that is not a safety argument
  'production',             // scare-quoted elsewhere in this house
  'I did not verify this',  // the required, valid output
  'WHAT WOULD MAKE THIS CHECK FAIL, AND CAN I DO IT', // the better question the habit produces
  'additive',               // the word that is not a safety argument
  'carries the full message', // the property a machine cannot read, named as a proxy
];

describe('the course exists with its full shape and is registered', () => {
  it('eight lessons, each carrying the fields the Learn surface reads', () => {
    expect(DEVELOPMENT_MODULES.length).toBe(8);
    for (const m of DEVELOPMENT_MODULES) {
      for (const k of ['id', 'title', 'bigIdea', 'anchor', 'lesson', 'inApp', 'benefits', 'quiz', 'facilitator']) {
        expect(m[k], `${m.id} missing ${k}`).toBeTruthy();
      }
      expect(m.anchor.ref, `${m.id} needs a ref`).toBeTruthy();
      expect(m.quiz.questions.length, `${m.id} needs real questions`).toBeGreaterThanOrEqual(3);
      expect(m.benefits.length, `${m.id} needs real benefits`).toBeGreaterThanOrEqual(4);
      expect(m.lesson.length, `${m.id} lesson is a stub`).toBeGreaterThan(2500);
    }
  });

  it('every quiz answer points at a real option and every question explains itself', () => {
    for (const m of DEVELOPMENT_MODULES) {
      for (const [i, q] of m.quiz.questions.entries()) {
        expect(q.options.length, `${m.id} q${i}`).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.explain, `${m.id} q${i} has no explanation`).toBeTruthy();
      }
    }
  });

  it('it is REGISTERED, in the Development department', () => {
    const entry = LEARN_CATALOG.find((c) => c.key === 'development');
    expect(entry, 'a course not in the registry cannot be reached').toBeTruthy();
    expect(catalogCategory('development')).toBe('Development');
    expect(entry.buildScheduleRows().length).toBe(8);
  });

  it('the schedule numbers the lessons and the curriculum exports', () => {
    expect(buildDevelopmentSchedule().map((r) => r.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(exportDevelopmentCurriculumMarkdown().length).toBeGreaterThan(2000);
    expect(DEVELOPMENT_SESSION_FLOW.length).toBeGreaterThanOrEqual(3);
  });
});

describe('NOTHING IN IT IS ILLUSTRATIVE — every cited artifact is real', () => {
  // The paths the course sends a learner to, taken from the prose itself.
  const CITED_PATHS = [
    'app/public/sw.js',
    'app/src/main.jsx',
    'app/src/lib/full-levels-baseline.json',
    'app/src/lib/reading-level-baseline.json',
    'app/src/lib/title-in-narrative-baseline.json',
  ];

  it('every path the course names EXISTS in this repository', () => {
    const missing = CITED_PATHS.filter((p) => !existsSync(join(REPO, p)));
    expect(missing, `the course sends learners to files that are not here:\n${missing.join('\n')}`).toEqual([]);
  });

  it('and the course actually names each of them, so this list cannot drift from the prose', () => {
    const unnamed = CITED_PATHS.filter((p) => !ALL_TEXT.includes(p));
    expect(unnamed, `paths checked above but no longer cited — update one or the other:\n${unnamed.join('\n')}`).toEqual([]);
  });

  it('EVERY SYMBOL lesson 6 names is really in the running service worker — the error this caught', () => {
    // Written first with PR #1405's names (SCOPE_SHELLS), which are NOT on main.
    // Read out of the file instead.
    //
    // AND IT SWEEPS RATHER THAN SPOT-CHECKS. The first version listed the four
    // expected identifiers and asserted each appeared SOMEWHERE in the course -
    // which stayed GREEN when one was renamed in the lesson body, because the
    // benefits list still carried the original. So every identifier-shaped word
    // in the outage lesson's own field is now extracted and audited against the
    // worker. A rename anywhere fails here instead of sending a learner to look
    // for code that is gone.
    const sw = readFileSync(join(REPO, 'app', 'public', 'sw.js'), 'utf8');
    const lesson6 = DEVELOPMENT_MODULES.find((m) => m.id.includes('front-door'));
    const fields = [lesson6.lesson, lesson6.benefits.join(' '), lesson6.facilitator.talkingPoints.join(' ')].join(' ');
    // Identifier-shaped: UPPER_SNAKE with an underscore, or camelCase.
    const ids = [...new Set([
      ...(fields.match(/\b[A-Z][A-Z0-9]+_[A-Z0-9_]+\b/g) || []),
      ...(fields.match(/\b[a-z]+[A-Z][A-Za-z]+\b/g) || []),
    ])].filter((w) => !['startUrl', 'dataTestid'].includes(w));
    expect(ids.length, 'the outage lesson should name real code identifiers').toBeGreaterThanOrEqual(4);
    const notInWorker = ids.filter((sym) => !sw.includes(sym));
    expect(
      notInWorker,
      `the lesson names identifiers the running worker does not define:\n${notInWorker.join('\n')}`,
    ).toEqual([]);
    for (const sym of ['DOOR_PATHS', 'FACE_SHELLS', 'shellPathFor', 'offlineShellFor']) {
      expect(fields, `lesson 6 should name ${sym}`).toContain(sym);
    }
    // And the name it must NOT use, because that one is not on this branch.
    expect(ALL_TEXT, 'SCOPE_SHELLS is from an unmerged pull request').not.toContain('SCOPE_SHELLS');
  });

  it('the guarantee lesson 6 teaches is the guarantee the code actually makes', () => {
    const sw = readFileSync(join(REPO, 'app', 'public', 'sw.js'), 'utf8');
    expect(sw, 'the worker should state its never-undefined guarantee').toMatch(/never undefined/i);
    // Scoped to the lesson BODY. Course-wide, the benefits list repeated the
    // rule and held this green when the body lost it - the third time today
    // that a corpus-wide match proved a phrase exists while proving nothing
    // about where it stands.
    const lesson6 = DEVELOPMENT_MODULES.find((m) => m.id.includes('front-door'));
    expect(lesson6.lesson).toMatch(/A FALLBACK THAT CAN RESOLVE TO NOTHING IS NOT A FALLBACK/);
  });

  it('the registration scope the lesson describes is the registration that exists', () => {
    const main = readFileSync(join(REPO, 'app', 'src', 'main.jsx'), 'utf8');
    // The lesson says the root registration was RETIRED for the door's scope
    // (2026-09-23, lib/sw-door-scope.js); main.jsx must agree.
    expect(main, 'the lesson says the worker now registers at the door').toMatch(/registerDoorWorker\(/);
    expect(main, 'the bare root registration the lesson calls retired must be gone').not.toContain("register('/sw.js')");
    const lesson6 = DEVELOPMENT_MODULES.find((m) => m.id.includes('front-door'));
    expect(lesson6.lesson).toMatch(/sw-door-scope\.js/);
  });

  it('the three baselines it points at are really shrink-only debt with real entries', () => {
    for (const p of ['full-levels-baseline.json', 'reading-level-baseline.json', 'title-in-narrative-baseline.json']) {
      const j = JSON.parse(readFileSync(join(REPO, 'app', 'src', 'lib', p), 'utf8'));
      expect(j.note, `${p} should carry its own shrink-only note`).toMatch(/shrink-only/i);
    }
  });

  it('the decision-record conventions it teaches are the conventions in use', () => {
    const idx = readFileSync(join(REPO, 'docs', 'decisions', 'INDEX.md'), 'utf8');
    expect(idx, 'the index should carry a Next ID pointer as the lesson implies').toMatch(/\*\*Next ID:\*\*/);
    const files = readdirSync(join(REPO, 'docs', 'decisions')).filter((f) => /^DR-\d{4}.*\.md$/.test(f));
    expect(files.length, 'one decision per file is the convention taught').toBeGreaterThan(100);
  });
});

describe('the Word is quoted verbatim', () => {
  it('quotes are balanced in every field', () => {
    const bad = FLAT.filter(([, t]) => !spansOf(t).balanced).map(([p]) => p);
    expect(bad, `unbalanced: ${bad.join(', ')}`).toEqual([]);
  });

  it('EVERY quoted span is verbatim KJV, or a listed non-Scripture phrase', () => {
    const altered = [];
    let count = 0;
    for (const [path, text] of FLAT) {
      for (const span of spansOf(text).spans) {
        count += 1;
        for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
          if (OUR_OWN_QUOTED.includes(part)) continue;
          if (!KJV_FLOW.includes(part)) altered.push(`${path} :: ${JSON.stringify(part)}`);
        }
      }
    }
    expect(count, 'a Word-first course should carry real quoted Scripture').toBeGreaterThan(50);
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.join('\n')}`).toEqual([]);
  });

  it('a verse can never hide behind the allowlist', () => {
    for (const q of OUR_OWN_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  it('the frame verse leads the whole course, in both its halves', () => {
    // Psalms 127:1 is the course's own measure, and the WATCHING half is the
    // one builders skip - so the course must carry both clauses.
    expect(ALL_TEXT).toContain('Except the LORD build the house, they labour in vain that build it');
    expect(ALL_TEXT).toContain('the watchman waketh but in vain');
    expect(ALL_TEXT, 'the lesson must say the watching half is not optional').toMatch(/IT IS NOT ONLY THE BUILDING/);
  });
});

describe('our own voice names Him by His covenant name (DR-0210)', () => {
  it('no generic "God" in our authored prose — only inside quoted Scripture', () => {
    let ours = ALL_TEXT;
    for (const [, text] of FLAT) for (const span of spansOf(text).spans) ours = ours.split(`"${span}"`).join(' ');
    // CASE-INSENSITIVE, and that is not pedantry: this course writes its
    // headings in capitals, so a generic GOD in a heading of OURS slipped
    // straight past a /\bGod\b/ check. Godhead stays allowed (it is a proper
    // term, not the generic substitute the rule is about).
    const generic = (ours.match(/\bGOD\b|\bGod\b/g) || []);
    expect(generic.length, 'generic "God"/"GOD" in our authored voice').toBe(0);
    expect(ours, 'a capitalised GOD in our own heading is the same violation').not.toMatch(/\bGOD\b/);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(1);
  });
});

describe('each lesson carries a rule that outlives its example', () => {
  const byId = (frag) => DEVELOPMENT_MODULES.find((m) => m.id.includes(frag));

  it('the cost is three ANSWERABLE questions, not an estimate', () => {
    const l = byId('counting-the-cost').lesson;
    expect(l).toMatch(/WHO MAINTAINS THIS WHEN I AM BUSY/);
    expect(l).toMatch(/WHAT TELLS US WHEN IT BREAKS/);
    expect(l).toMatch(/WHAT DOES THIS COST TO KEEP RUNNING/);
  });

  it('the trace names the real data AND requires observing the real screen', () => {
    const l = byId('name-the-real-record').lesson;
    expect(l).toMatch(/NAME THE REAL DATA/);
    expect(l).toMatch(/BY OBSERVING IT/);
    expect(l, 'the gap between a surface and its data IS the work').toMatch(/THAT GAP IS THE WORK/);
  });

  it('the plumbline lesson keeps BOTH commands of 1 Thessalonians 5:21', () => {
    const l = byId('no-claim-without-evidence').lesson;
    expect(l).toContain('Prove all things; hold fast that which is good.');
    expect(l).toMatch(/Proving without holding fast is cynicism/);
    expect(l).toMatch(/Holding fast without proving is credulity/);
  });

  it('the proven-to-catch lesson names the no-op break as the deceptive one', () => {
    const l = byId('always-passes').lesson;
    expect(l).toMatch(/ASSERT THE BREAK LANDED/);
    expect(l).toMatch(/reads most exactly like success/);
    expect(l, 'and the too-broad check, which is the leak found twice today').toMatch(/A CHECK THAT SPANS TOO MUCH PROVES TOO LITTLE/);
  });

  it('the guards lesson keeps all three brakes AND the never-a-stall clause', () => {
    const l = byId('battlement').lesson;
    expect(l).toMatch(/A BUDGET/);
    expect(l).toMatch(/A CONCURRENCY LOCK/);
    expect(l).toMatch(/A STOP-PATH/);
    expect(l, 'brakes gate what ships RUNNING, never what gets BUILT').toMatch(/They gate what ships RUNNING/);
    expect(l).toContain('The owner of the pit shall make it good');
  });

  it('the outage lesson keeps the four durable takings', () => {
    const l = byId('front-door').lesson;
    expect(l).toMatch(/A HEALTHY PIPELINE IS NOT A HEALTHY PRODUCT/);
    expect(l).toMatch(/CANNOT REPRODUCE THE STATE CANNOT SEE THE BUG/);
    expect(l).toMatch(/WATCH EVERY DOOR/);
    expect(l).toMatch(/UNKNOWN MUST NEVER READ AS HEALTHY/);
  });

  it('the debt lesson says the measurement reports DIFFERENCE, not absence', () => {
    const l = byId('shrink-only').lesson;
    expect(l).toMatch(/DIFFERENCE, not absence/);
    expect(l, 'and a pin moves with its reason attached').toMatch(/IT MOVES WITH ITS REASON ATTACHED/);
    expect(l, 'and it must never become a comfortable place to keep a problem').toMatch(/comfortable place to keep a problem/);
  });

  it('the record lesson keeps the never-rewrite rule and the purpose of writing', () => {
    const l = byId('make-it-plain').lesson;
    expect(l).toMatch(/A NEW DIRECTIVE IS A NEW RECORD, NEVER A REWRITE/);
    expect(l).toContain('that he may run that readeth it');
    expect(l, 'the purpose is speed, not archiving').toMatch(/the purpose is not archival, it is SPEED/);
    expect(l, 'and limits are the part people skip').toMatch(/A record with no limits is an advertisement/);
  });
});
