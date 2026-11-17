// @vitest-environment node
// L310 — The Hidden Life and the Empty Chair (DR-1480). The newsletters Darrell
// forwarded with one word above each, Lesson, make one lesson (DR-0610). The
// shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477) runs on the
// spine below; what is particular to this lesson is its dangers, each proven to
// catch:
//  (1) A REPORT DRESSED AS A FINDING. Every text that names an affair carries
//      the word reported (DR-0100 / DR-0076: tiered, never our own finding).
//  (2) SPYING STATED AS FACT. Every text that touches spying or a foreign
//      intelligence service says it is suspected or unproven, in that text.
//  (3) GOSSIP. No one but the public man is named: no name from the reports of
//      the women or the customer company, nor the analyst, his firm or the
//      network he spoke to (2026-11-10 forward, DR-1487), appears anywhere.
//  (4) ADULT CONTENT FOR A CHILD. The child band never says affair, infidelity
//      or spying; it carries the transferable truth only.
//  (5) A CAUSE CLAIMED FOR THE COLLAPSE. Wherever Brooklyn appears, the same
//      text says the cause is still being investigated.
//  (6) THE PROVENANCE LOST. The file names all three Gmail threads, and since
//      DR-1487 all three are read: no line may still say the 2026-11-10
//      forward was not read or that nothing is drawn from it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll310-the-hidden-life-and-the-empty-chair.js';
import { livingLessonGate, stringsOf, textsOf } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll310-the-hidden-life-and-the-empty-chair',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 310,
  added: '2026-11-13',
  spine: [
    ['Luke 12:2', 'For there is nothing covered, that shall not be revealed'],
    ['Numbers 32:23', 'be sure your sin will find you out'],
    ['Genesis 39:12', 'and fled, and got him out'],
    ['Galatians 6:1', 'restore such an one in the spirit of meekness'],
    ['Exodus 18:18', 'thou art not able to perform it thyself alone'],
    ['Numbers 27:17', 'be not as sheep which have no shepherd'],
    ['2 Timothy 2:2', 'commit thou to faithful men, who shall be able to teach others also'],
    ['Proverbs 28:13', 'whoso confesseth and forsaketh them shall have mercy'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const placesOf = (L) => Object.entries(textsOf(L));

export function unreportedAffairs(L) {
  return placesOf(L)
    .filter(([, t]) => /\baffairs?\b|\binfidelity\b|\bunfaithful\b/i.test(t) && !/\breport/i.test(t))
    .map(([p]) => p);
}

export function spyingAsFact(L) {
  return stringsOf(L)
    .filter((t) => /\bspy|\bspying\b|\bintelligence service\b|\bforeign (?:country|power)\b/i.test(t))
    .filter((t) => !/\bsuspect|\bunproven\b|\bno finding\b|\bnobody has proven\b|\bnothing we read proves\b|\bnot proven\b/i.test(t))
    .map((t) => t.slice(0, 70));
}

const OTHERS = /\bAlice\b|\bMegaspeed\b|\bIves\b|\bYorkville\b|\bCNBC\b/;
export function othersNamed(L) {
  return stringsOf(L)
    .filter((t) => OTHERS.test(t))
    .map((t) => t.slice(0, 70));
}

export function childAdultWords(L) {
  return String(L.levels.child).match(/\baffairs?\b|\binfidelity\b|\bunfaithful\b|\bspy|\bespionage\b/gi) || [];
}

export function collapseCauseClaimed(L) {
  return stringsOf(L)
    .filter((t) => /\bBrooklyn\b/.test(t) && !/\binvestigat/i.test(t))
    .map((t) => t.slice(0, 70));
}

const THREADS = ['1a1c5c35c2357a0f', '1a1d4fa73bc93705', '1a1d4fb3c21f7744'];
const NOT_READ =
  /\bnot read in this build\b|\bnot yet read\b|nothing (?:in the lesson )?is drawn from it|\btwo newsletters only\b|2026-11-10\)?[^.]{0,60}\bwas not read\b/i;
/** Faults in the file's provenance: a thread missing, or the 2026-11-10 forward still called unread. */
export function provenanceFaults(src) {
  const out = THREADS.filter((t) => !src.includes(t)).map((t) => `thread ${t} missing`);
  const m = NOT_READ.exec(src);
  if (m) out.push(`still says unread: ${m[0].slice(0, 70)}`);
  return out;
}

describe('L310 — the dangers particular to this lesson', () => {
  it('every text naming an affair says it is reported', () => {
    expect(unreportedAffairs(lesson)).toEqual([]);
  });
  it('spying is never stated as fact', () => {
    expect(spyingAsFact(lesson)).toEqual([]);
  });
  it('no one but the public man is named from the reports', () => {
    expect(othersNamed(lesson)).toEqual([]);
  });
  it('the child band carries the truth without the adult content', () => {
    expect(childAdultWords(lesson)).toEqual([]);
  });
  it('the Brooklyn collapse is never given a cause', () => {
    expect(collapseCauseClaimed(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => /\bBrooklyn\b/.test(t)),
      'an empty scan cannot pass'
    ).toBe(true);
  });
  it('the file cites all three Gmail threads Darrell forwarded, and calls none of them unread', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll310-the-hidden-life-and-the-empty-chair.js'), 'utf8');
    expect(provenanceFaults(src)).toEqual([]);
    expect(src).toMatch(/Proverbs 16:18/);
    expect(UNCHECKED).toMatch(/re-review: 2026-12-13/);
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child, adult = lesson.lesson) => ({ ...lesson, lesson: adult, levels: { ...lesson.levels, child } });
    expect(unreportedAffairs(plant('He had an affair.'))).toEqual(['child']);
    expect(spyingAsFact(plant('He was a spy.'))).toHaveLength(1);
    expect(othersNamed(plant('Alice did it.'))).toHaveLength(1);
    expect(childAdultWords(plant('There was an affair.'))).toEqual(['affair']);
    expect(collapseCauseClaimed(plant('The Brooklyn building fell because of the violations.'))).toHaveLength(1);
    expect(othersNamed(plant('An analyst at Yorkville told CNBC.'))).toHaveLength(1);
    expect(provenanceFaults('1a1d4fa73bc93705 1a1d4fb3c21f7744')).toEqual(['thread 1a1c5c35c2357a0f missing']);
    expect(provenanceFaults(`${THREADS.join(' ')} An earlier forward (Morning Brew, 2026-11-10) was not read in this build.`)).toHaveLength(1);
    expect(provenanceFaults(`${THREADS.join(' ')} The 2026-11-10 forward belongs here; nothing is drawn from it.`)).toHaveLength(1);
    expect(provenanceFaults(`${THREADS.join(' ')} The 2026-11-10 forward was not read.`)).toHaveLength(1);
    expect(provenanceFaults(`${THREADS.join(' ')} The Times reports were not read from here.`)).toEqual([]);
  });
});
