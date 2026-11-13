// @vitest-environment node
// L317 — Who Judges Greatness (DR-1499). The second teaching from the Big Think
// essay Darrell forwarded with one word above it, Lessons (Gmail thread
// 1a1c68295f781bbb); the first is L314, Will My Work Live On (DR-1492). The
// shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477) runs on the
// spine below; what is particular to this lesson is its dangers, each proven to
// catch:
//  (1) THE ESSAY'S CLAIM DRESSED AS OUR VERDICT. Every text that repeats the
//      public knowing best, voting with its dollars, or the ranking by what
//      resonates also says whose reading it is (DR-0100 / DR-0076).
//  (2) DRIFT INTO ANTI-ART. The point is who JUDGES, not that skill or an
//      audience is bad: the adult lesson carries the three verses that honour
//      them, and every band names skill.
//  (3) THE APP'S NUMBERS INVENTED OR STALE. Each fact the lesson states about
//      PoeTech is cited by file and line, and the line still says it. If the
//      code changes under the lesson, this fails and the lesson is corrected.
//  (4) THE PROVENANCE LOST. The file names the Gmail thread and the first
//      lesson from it; UNCHECKED names the host that refused the read-back.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll317-who-judges-greatness.js';
import { livingLessonGate, stringsOf, ourVoice, BANDS } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll317-who-judges-greatness',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 317,
  added: '2026-11-13',
  spine: [
    ['Luke 16:15', 'that which is highly esteemed among men is abomination in the sight of God'],
    ['1 Samuel 16:7', 'man looketh on the outward appearance, but the LORD looketh on the heart'],
    ['Exodus 23:2', 'Thou shalt not follow a multitude to do evil'],
    ['Matthew 21:9', 'Hosanna to the Son of David'],
    ['Matthew 27:22', 'They all say unto him, Let him be crucified.'],
    ['Psalms 118:22', 'The stone which the builders refused is become the head stone of the corner'],
    ['John 12:43', 'For they loved the praise of men more than the praise of God'],
    ['Mark 10:43', 'whosoever will be great among you, shall be your minister'],
    ['Mark 10:45', 'For even the Son of man came not to be ministered unto, but to minister'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const CLAIM = /\bknows best\b|\bvoting with its dollars\b|\bvote with (?:its|their) (?:feet|money|wallets)\b|\bresonate/i;
const HERS = /\bessay\b|\bthe writer\b|\bshe (?:says|credits|closes|judges)\b|\bher (?:reading|opinion|judgments?)\b|\bBig Think\b/i;
export function claimsAsOurs(L) {
  return stringsOf(L)
    .filter((t) => CLAIM.test(ourVoice(t)) && !HERS.test(t))
    .map((t) => t.slice(0, 70));
}

const HONOURED = ['Psalms 33:3', 'Exodus 31:6', 'Mark 12:37'];
export function antiArtDrift(L) {
  const out = [];
  for (const ref of HONOURED) if (!String(L.lesson).includes(`(${ref})`)) out.push(`adult drops ${ref}`);
  for (const b of BANDS) if (!/\bskil/i.test(String(L.levels[b]))) out.push(`${b} never names skill`);
  return out;
}

// What the lesson says about PoeTech, where it says it, and the words that
// line must still hold. Paths are relative to app/.
export const CODE_CLAIMS = [
  { cite: 'app/src/lib/lessons-walked.js, lines 14 and 15', file: 'src/lib/lessons-walked.js', line: 14, says: 'opens are not' },
  { cite: 'app/src/lib/lessons-walked.js, lines 14 and 15', file: 'src/lib/lessons-walked.js', line: 15, says: 'usage_events records the tab, not the lesson' },
  { cite: 'app/src/lib/learn-organize.js, lines 196 to 221', file: 'src/lib/learn-organize.js', line: 196, says: 'export function sortCourses' },
  { cite: 'app/src/lib/youth-zone.js, line 22', file: 'src/lib/youth-zone.js', line: 22, says: 'there is no leaderboard, by design' },
  { cite: 'app/src/components/Pulpit.jsx, lines 351 and 356', file: 'src/components/Pulpit.jsx', line: 351, says: "['viewed', 'Most viewed']" },
  { cite: 'app/src/components/Pulpit.jsx, lines 351 and 356', file: 'src/components/Pulpit.jsx', line: 356, says: "useState('newest')" },
  { cite: 'app/src/lib/lesson-share-record.js, lines 5 to 21', file: 'src/lib/lesson-share-record.js', line: 14, says: 'lesson_share_opens' },
  { cite: 'app/src/lib/lesson-share-record.js, lines 5 to 21', file: 'src/lib/lesson-share-record.js', line: 21, says: 'with their open counts' },
];
const readLineFromApp = (file, n) => readFileSync(join(process.cwd(), file), 'utf8').split('\n')[n - 1] || '';
export function staleCodeClaims(L, claims = CODE_CLAIMS, readLine = readLineFromApp) {
  const out = [];
  for (const c of claims) {
    if (!String(L.lesson).includes(c.cite)) out.push(`the lesson no longer cites ${c.cite}`);
    if (!readLine(c.file, c.line).includes(c.says)) out.push(`${c.file}:${c.line} no longer says ${c.says}`);
  }
  return out;
}
// The opposite failure: the lesson names a file the claims table does not pin.
export function unpinnedCitations(L, claims = CODE_CLAIMS) {
  const pinned = new Set(claims.map((c) => c.cite));
  return (String(L.lesson).match(/app\/src\/[\w/.-]+\.jsx?, lines? [\d a-z]+/g) || []).filter((c) => !pinned.has(c));
}

describe('L317 — the dangers particular to this lesson', () => {
  it('every text repeating the essay’s claim says it is the writer’s reading', () => {
    expect(claimsAsOurs(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => CLAIM.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('the lesson honours skill and an audience: the point is the judge', () => {
    expect(antiArtDrift(lesson)).toEqual([]);
  });
  it('every fact about PoeTech is cited by file and line, and the line still says it', () => {
    expect(staleCodeClaims(lesson)).toEqual([]);
    expect(unpinnedCitations(lesson)).toEqual([]);
  });
  it('the file cites the Gmail thread and the first lesson from it, and UNCHECKED names the refused host', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll317-who-judges-greatness.js'), 'utf8');
    expect(src).toContain('1a1c68295f781bbb');
    expect(src).toContain('ll314-will-my-work-live-on');
    expect(lesson.lesson).toContain('Will My Work Live On');
    expect(UNCHECKED).toMatch(/bigthink\.com/);
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child) => ({ ...lesson, levels: { ...lesson.levels, child } });
    expect(claimsAsOurs(plant('The crowd knows best, so the crowd decides.'))).toHaveLength(1);
    expect(antiArtDrift(plant('Popular things are bad.'))).toEqual(['child never names skill']);
    expect(antiArtDrift({ ...lesson, lesson: lesson.lesson.replace('(Mark 12:37)', '') })).toEqual(['adult drops Mark 12:37']);
    expect(staleCodeClaims(lesson, CODE_CLAIMS.slice(0, 1), () => 'the code changed')).toEqual(['src/lib/lessons-walked.js:14 no longer says opens are not']);
    expect(staleCodeClaims({ ...lesson, lesson: 'nothing cited' }, CODE_CLAIMS.slice(3, 4))).toEqual([
      'the lesson no longer cites app/src/lib/youth-zone.js, line 22',
    ]);
    expect(unpinnedCitations({ ...lesson, lesson: 'see app/src/lib/made-up.js, line 9' })).toEqual(['app/src/lib/made-up.js, line 9']);
  });
});
