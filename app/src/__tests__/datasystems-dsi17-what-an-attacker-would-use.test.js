// @vitest-environment node
// =============================================================================
// dsi17 — What an attacker would use: the four elements, reported before any fix
// =============================================================================
// Darrell, 2026-11-10, forwarding the Gartner research on exposure
// prioritization: research it, make a lesson, and build workflows that keep us
// secure without undermining our processes, reporting the conditions before any
// fix, inside the app (DR-1408).
//
// THIS LESSON'S PARTICULAR DANGER is that it teaches our own security workflow,
// so a sentence that drifts from the workflow is a false lesson. The
// reality-trace block reads the real workflow, the real ranking script, the real
// allowlist and the real strip, and requires the lesson's facts to be theirs:
// Wednesday, ten minutes, December 5, 2026, the strip's own title, report only.
// Each is proven to catch.
//
// Quote pairing is done by splitting on the quote character, and the verbatim
// sweep asserts its own count so an empty scan cannot read as a pass.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DATASYSTEMS_MODULES, DATASYSTEMS_META } from '../lib/datasystems-course.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';

const ID = 'dsi17-what-an-attacker-would-use';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = DATASYSTEMS_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);
const ROOT = join(process.cwd(), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) yield* strings(v);
  }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// THE SPINE, pinned by literal text read out of the corpus before it was written.
const SPINE = [
  ['Proverbs 14:15', 'The simple believeth every word: but the prudent man looketh well to his going'],
  ['Proverbs 18:13', 'He that answereth a matter before he heareth it, it is folly and shame unto him'],
  ['Luke 14:28', 'which of you, intending to build a tower, sitteth not down first, and counteth the cost'],
  ['2 Corinthians 2:11', 'we are not ignorant of his devices'],
  ['Nehemiah 4:13', 'in the lower places behind the wall'],
  [
    'Matthew 24:43',
    'if the goodman of the house had known in what watch the thief would come, he would have watched, and would not have suffered his house to be broken up',
  ],
  ['Nehemiah 7:3', 'let them shut the doors, and bar them: and appoint watches of the inhabitants of Jerusalem'],
  ['Nehemiah 4:9', 'made our prayer unto our God, and set a watch against them day and night'],
  ['Mark 13:37', 'And what I say unto you I say unto all, Watch'],
  ['Psalms 121:4', 'Behold, he that keepeth Israel shall neither slumber nor sleep'],
  ['Deuteronomy 6:7', 'teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way'],
  ['Malachi 4:6', 'he shall turn the heart of the fathers to the children, and the heart of the children to their fathers'],
  ['Proverbs 27:17', 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];

describe('dsi17 is in the course, numbered, and whole', () => {
  it('exists exactly once as the seventeenth module with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(DATASYSTEMS_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(DATASYSTEMS_MODULES[16].id).toBe(ID);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('the course numbers stay contiguous and the meta counts every module', () => {
    const numbers = DATASYSTEMS_MODULES.map((m) => Number(/^dsi(\d+)-/.exec(m.id)[1])).sort((a, b) => a - b);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
    expect(DATASYSTEMS_META.weeks).toBe(DATASYSTEMS_MODULES.length);
    expect(DATASYSTEMS_META.weeks).toBeGreaterThanOrEqual(17);
  });

  it('carries a quiz whose answers are in range, and an anchor whose every reference resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(5);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = anchorRefs(L);
    expect(refs.length).toBe(13);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      expect(L.lesson.includes(`(${r})`), `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });
});

describe('the four elements, the order of work, and the honest reading — each said', () => {
  it('the lesson names each of the four elements, the order of work and the limits, by its own heading', () => {
    for (const h of [
      'THREAT INTELLIGENCE.',
      'ASSET CONTEXT.',
      'HOW IT COULD BE REACHED.',
      'WHAT ALREADY HOLDS IT.',
      'WHERE IT FITS.',
      'WITHOUT UNDERMINING THE WORK.',
      'WHAT WE DID NOT CHECK.',
    ]) {
      expect(L.lesson, h).toContain(h);
    }
  });

  it('every band asks the four questions: used now, reaches people, can be reached, what holds it', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: used now`).toMatch(/(?:using|used|exploited)[^.?]{0,40}(?:right )?now/);
      expect(TEXTS[k], `${k}: reaches people`).toMatch(/phone|reach(?:es)? (?:people|every person)|ships/);
      expect(TEXTS[k], `${k}: can be reached`).toMatch(/reach(?:ed)?/);
      expect(TEXTS[k], `${k}: what holds it`).toMatch(/lock|holds it|control/);
    }
  });

  it('every band but the child one holds the forecast as a forecast, and names the seller', () => {
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: forecast`).toMatch(/forecast|prediction|predicts/);
      expect(TEXTS[k], `${k}: by 2028`).toMatch(/2028/);
      expect(TEXTS[k], `${k}: the seller`).toMatch(/sells security|selling the remedy|sells security (?:testing|validation)/);
      expect(TEXTS[k], `${k}: Gartner`).toMatch(/Gartner/);
    }
  });

  it('says in every band that the job reports and never fixes, and that unknown is never safe', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: report before fix`).toMatch(
        /before (?:anything|anybody|any item|we fix|it is fixed|anything is (?:fixed|touched|changed))|report(?:s|ing)? (?:the conditions )?first|tell(?:s us)? (?:what it sees )?first|Tell first/
      );
      expect(TEXTS[k], `${k}: never safe on unknown`).toMatch(
        /never (?:says safe|shown as safe|ranked as (?:Watch|safe)|moved down|call(?:s)? anything safe)|not call anything safe|does not call anything safe|no item is presented as safe|never says safe/
      );
    }
  });

  it('names Darrell and the date in every band', () => {
    for (const k of PLACES) expect(TEXTS[k], `${k}: the date`).toMatch(/November 10, 2026/);
    for (const k of ['adult', 'youth', 'teen', 'senior']) expect(TEXTS[k], `${k}: names Darrell`).toMatch(/Darrell/);
  });
});

describe('REALITY-TRACE: the lesson’s facts are the workflow’s, not memory', () => {
  const wf = read('.github/workflows/exposure-report.yml');
  const script = read('scripts/exposure-report.mjs');
  const strip = read('app/src/components/ExposureStrip.jsx');
  const allow = JSON.parse(read('scripts/dependency-audit-allowlist.json')).entries;

  it('Wednesday is the workflow’s own schedule', () => {
    const cron = /cron: '([^']+)'/.exec(wf)[1].split(' ');
    expect(cron[4]).toBe('3');
    expect(L.lesson).toMatch(/every Wednesday/);
  });

  it('ten minutes is the workflow’s own ceiling, and one run at a time its own lock', () => {
    expect(wf).toMatch(/timeout-minutes: 10\n/);
    expect(wf).toMatch(/cancel-in-progress: false/);
    for (const k of ['adult', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/ten minutes/);
  });

  it('December 5, 2026 is the shipped library’s own dated decision in the allowlist', () => {
    const xlsx = allow.find((e) => e.name === 'xlsx');
    expect(xlsx.scope).toBe('prod');
    expect(xlsx.reReview).toBe('2026-12-05');
    for (const k of ['adult', 'teen', 'senior']) expect(TEXTS[k], k).toMatch(/December 5, 2026/);
  });

  it('Act now, Plan and Watch are the script’s own tiers, and an unknown is never Watch', () => {
    expect(script).toContain("export const TIERS = ['act-now', 'plan', 'watch'];");
    expect(script).toMatch(/scope === 'dev' && \(exploited \|\| intelUnknown\)/);
    expect(L.lesson).toMatch(/An unknown is never ranked as Watch/);
  });

  it('the job is report only, as the lesson says: no fix, no PR, nothing running touched', () => {
    expect(wf).not.toMatch(/npm audit fix|gh pr |git push/);
    expect(L.lesson).toMatch(/applies no fix, changes no code, opens no pull request, and touches nothing that is running/);
  });

  it('the strip the in-app step names is the one the admin surface renders', () => {
    expect(L.inApp).toMatch(/Admin, then Systems/);
    expect(L.inApp).toContain("'Exposure — what an attacker would use, ranked before any fix'");
    expect(strip).toContain('Exposure — what an attacker would use, ranked before any fix');
    expect(strip).toContain('Report only: this check changes nothing.');
    expect(read('app/src/components/OpsBoard.jsx')).toContain('<ExposureStrip />');
    expect(read('app/src/components/AdminConsole.jsx')).toContain('<OpsBoard />');
  });

  it('PROVEN TO CATCH: a lesson that says every Thursday no longer matches the schedule', () => {
    const wrong = L.lesson.replace('every Wednesday', 'every Thursday');
    expect(wrong).not.toBe(L.lesson);
    expect(/every Wednesday/.test(wrong)).toBe(false);
    expect(/cron: '([^']+)'/.exec(wf)[1].split(' ')[4]).not.toBe('4');
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count, so an empty scan cannot read as a pass', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(30);
  });

  it('every double-quoted span carries a reference: nothing of ours is dressed as Scripture', () => {
    const bare = [];
    for (const t of EVERY_STRING) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('the prudent man looketh well to his going', 'the prudent man looketh well to his way');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: a word of ours in double quotes is seen as dressed-up Scripture', () => {
    const title = 'Prioritize What Attackers Will Exploit: 4 Elements of Strong Exposure Prioritization';
    const broken = L.lesson.replace(`'${title}'`, `"${title}"`);
    expect(broken).not.toBe(L.lesson);
    const bare = quotedPairs(broken).filter((p) => !p.ref);
    expect(bare.map((p) => p.inside)).toEqual([title]);
  });
});

describe('no quotation is cut, and no bookkeeping reaches the reader', () => {
  it('no quoted span carries an ellipsis', () => {
    expect(elidedQuotations(L)).toEqual([]);
  });
  it('and no reader-facing field prints a decision-record identifier', () => {
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');
  it('no generic God, GOD or LORD in our authored voice', () => {
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
  });
  it('but the quotations keep God exactly as the corpus has it', () => {
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('made our prayer unto our God');
  });
  it('names Yahweh in our prose in every band', () => {
    for (const k of PLACES) expect(ourVoice(TEXTS[k]), k).toMatch(/\bYahweh\b/);
  });
  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });
  it('PROVEN TO CATCH: stripping the teen parent line names teen and only teen', () => {
    const teen = L.levels.teen;
    const line = /Parents, ask your son or daughter[^.]*\./.exec(teen);
    expect(line).toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, teen: teen.replace(line[0], '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'teen', missing: ['parents'] }]);
  });
  it('carries the skill and the rhythm in every band', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: listen to the end`).toMatch(/[Ll]isten (all the way )?to the end|[Ll]isten all the way/);
      expect(TEXTS[k], `${k}: retell`).toMatch(/in (their|your) own words/);
      expect(TEXTS[k], `${k}: the four places`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(TEXTS[k], `${k}: one friend this week`).toMatch(/one friend this week/);
      expect(TEXTS[k], `${k}: the aim`).toMatch(/until we see that Yahweh has been right/);
    }
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);
  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
  });
  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });
  it('no band is a reworded copy of another', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
  });
  it('every band opens on the whole title', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of BANDS) expect(TEXTS[k].startsWith('WHAT AN ATTACKER WOULD USE — the four elements, reported before any fix.'), k).toBe(true);
  });
});

describe('the reader meets numbered points, in order', () => {
  it('the lesson’s headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });
  it('no band opens a sentence with an ordinal the formatter would read as a marker', () => {
    for (const k of PLACES) expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.:]/);
  });
  it('carries no doubled word, no percentage and no money figure', () => {
    const doubled = [];
    for (const t of EVERY_STRING) for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    expect(doubled).toEqual([]);
    for (const k of PLACES) {
      expect(TEXTS[k]).not.toMatch(/\d+(\.\d+)?\s*(percent|%)/);
      expect(TEXTS[k]).not.toMatch(/\$[\d,]/);
    }
  });
});

describe('the two stories are the lesson’s own, on its own spine', () => {
  it('dsi17 carries two titled parables, each with a scene and a verse of this lesson’s anchor', async () => {
    const SIDE = (await import('../lib/lesson-stories.json')).default;
    const mine = SIDE.datasystems[ID];
    expect(mine).toHaveLength(2);
    const words = (s) =>
      String(s || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    const anchors = new Set(anchorRefs(L));
    for (const s of mine) {
      expect(s.kind).toBe('parable');
      expect(words(s.body)).toBeGreaterThanOrEqual(100);
      expect(anchors.has(s.verse), `${s.verse} is not in dsi17's anchor`).toBe(true);
      expect(s.body).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
    }
    expect(mine.map((s) => s.title)).toEqual(['Ten Cards on the Fellowship Table', 'The Note Before the Wrench']);
    expect(mine[0].body).toMatch(/the wall is guarded where it is low, not where the ink is darkest/);
    expect(mine[1].body).toMatch(/answering a matter before you hear it is folly and shame/);
  });
});
