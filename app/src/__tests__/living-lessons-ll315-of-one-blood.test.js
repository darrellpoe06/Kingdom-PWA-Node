// @vitest-environment node
// L315 — Of One Blood (DR-1493). Darrell sent a video with one word above it,
// Lesson: Eternal Citizens on the Spanish Inquisition, the purity-of-blood laws
// against Judah and modern racism. The shared Living Lesson gate
// (helpers/living-lesson-gate.js, DR-1477) runs on the spine below; what is
// particular to this lesson is its dangers, each proven to catch:
//  (1) THE VIDEO'S CLAIM STATED AS FACT. Wherever a text says the Sephardic
//      Jews or the Moors were Black, or gives the 128 categories, or calls 1449
//      the first racial exclusion law, the same text marks it as the video's
//      claim (DR-0100 tier 2, DR-0076).
//  (2) A PRESENT-DAY POLITICAL CLAIM CARRIED IN. The video's claim about
//      present-day policy in one country is left out entirely: no text names
//      Israel's present policies or the modern state.
//  (3) RED FOR THE WRONG BLOOD. No color word that marks red appears anywhere
//      (Color Theology, DR-0099): true red belongs to His Blood only, and this
//      lesson marks nothing in color at all.
//  (4) GRAPHIC CONTENT FOR A CHILD. The child band carries one blood and no
//      ranking, without the Inquisition's violence: no burning, torture,
//      execution or killing.
//  (5) THE RECORD WITHOUT ITS SOURCE. Every place that teaches the documented
//      history names where it is recorded.
//  (6) THE ECONOMICS LESSON REPEATED INSTEAD OF LINKED. The adult lesson and
//      the senior band point to Kingdom Economics, The engine and the reserve,
//      and the lesson carries none of its figures.
//  (7) THE PROVENANCE LOST. The file names the video and the day it was sent.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll315-of-one-blood.js';
import { livingLessonGate, stringsOf, textsOf } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll315-of-one-blood',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 315,
  added: '2026-11-13',
  spine: [
    ['Acts 17:26', 'hath made of one blood all nations of men'],
    ['Acts 10:34', 'God is no respecter of persons'],
    ['Galatians 3:28', 'for ye are all one in Christ Jesus'],
    ['Ephesians 2:14', 'hath broken down the middle wall of partition between us'],
    ['Numbers 12:1', 'because of the Ethiopian woman whom he had married'],
    ['1 John 1:7', 'the blood of Jesus Christ his Son cleanseth us from all sin'],
    ['Revelation 7:9', 'of all nations, and kindreds, and people, and tongues'],
    ['Mark 3:25', 'if a house be divided against itself, that house cannot stand'],
  ],
});

// --- the dangers, as pure checks ------------------------------------------
const placesOf = (L) => Object.entries(textsOf(L));
const CLAIMED =
  /\bthe video(?:’s)? (?:says|asserts|claims|calls|gives|cites)|\bthat is (?:the video’s|its) (?:assertion|claim)|\bvideo’s claim|\bwe found no source|\bno source (?:for|was)|\bcould not (?:find|prove)/i;

export function claimsAsFact(L) {
  const out = [];
  for (const t of stringsOf(L)) {
    for (const s of String(t).split(/(?<=[.!?])\s+/)) {
      const risky = /\b(?:were|was) Black\b|\b128\b|\bfirst (?:legali[sz]ed )?racial exclusion law\b/i.test(s);
      if (risky && !CLAIMED.test(s)) out.push(s.slice(0, 80));
    }
  }
  return out;
}

export function presentDayPolitics(L) {
  return stringsOf(L)
    .filter((t) => /\bIsrael(?:i|’s) (?:polic|government)|\bmodern-day Israel\b|\bstate of Israel\b|\bZionis/i.test(t))
    .map((t) => t.slice(0, 70));
}

export function redMarking(L) {
  return (
    stringsOf(L)
      .join(' ')
      .match(/\b(?:red|crimson|scarlet)\b/gi) || []
  );
}

export function childGraphic(L) {
  return String(L.levels.child).match(/\b(?:burn(?:ed|ing|t)?|tortur\w*|execut\w*|kill\w*|Inquisition|stake)\b/gi) || [];
}

const HISTORY = /\b1449\b|\b1492\b|\bCode Noir\b|\bapartheid\b|\bJim Crow\b/;
const SOURCE = /\bBritannica\b|\bLos Angeles County Museum of Art\b|\bEncyclopedia\.com\b|\bscholars who have read\b|\bdocumented\b|\bthe record\b/i;
export function historyWithoutSource(L) {
  return placesOf(L)
    .filter(([p, t]) => p !== 'child' && HISTORY.test(t) && !SOURCE.test(t))
    .map(([p]) => p);
}

const ECON_FIGURES = /\bthree billion\b|\btrillion\b|\b61,000\b|\bFreedman’s\b/i;
export function economicsRepeated(L) {
  const out = [];
  for (const place of ['adult', 'senior']) {
    const t = textsOf(L)[place];
    if (!/The engine and the reserve/.test(t)) out.push(`${place} does not link the economics session`);
  }
  if (stringsOf(L).some((t) => ECON_FIGURES.test(t))) out.push('a figure from the economics session is repeated here');
  return out;
}

describe('L315 — the dangers particular to this lesson', () => {
  it('the video’s unconfirmed claims are never stated as fact', () => {
    expect(claimsAsFact(lesson)).toEqual([]);
    expect(
      stringsOf(lesson).some((t) => /\b128\b/.test(t)),
      'an empty scan cannot pass: the lesson does name the figure as a claim'
    ).toBe(true);
  });
  it('the present-day political claim is left out entirely', () => {
    expect(presentDayPolitics(lesson)).toEqual([]);
  });
  it('no red marks anything: true red is His Blood’s only', () => {
    expect(redMarking(lesson)).toEqual([]);
  });
  it('the child band carries the truth without graphic content', () => {
    expect(childGraphic(lesson)).toEqual([]);
  });
  it('every band that teaches the history names where it is recorded', () => {
    expect(historyWithoutSource(lesson)).toEqual([]);
  });
  it('the economics lesson is linked, not repeated', () => {
    expect(economicsRepeated(lesson)).toEqual([]);
  });
  it('the file names the video and the day it was sent', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons', 'll315-of-one-blood.js'), 'utf8');
    expect(src).toContain('https://youtu.be/y5_FOrhrDnA');
    expect(src).toContain('2026-11-13');
    expect(src).toContain('Eternal Citizens');
  });

  it('PROVEN TO CATCH: each check names a planted defect', () => {
    const plant = (child, adult = lesson.lesson) => ({ ...lesson, lesson: adult, levels: { ...lesson.levels, child } });
    expect(claimsAsFact(plant('The Moors were Black.'))).toHaveLength(1);
    expect(claimsAsFact(plant('Portugal had 128 official categories.'))).toHaveLength(1);
    expect(claimsAsFact(plant('It was the first legalized racial exclusion law in modern history.'))).toHaveLength(1);
    expect(claimsAsFact(plant('The video says the Moors were Black.'))).toEqual([]);
    expect(presentDayPolitics(plant('The same is true of modern-day Israel.'))).toHaveLength(1);
    expect(redMarking(plant('The laws are marked in red.'))).toEqual(['red']);
    expect(childGraphic(plant('People were burned at the stake.'))).toEqual(['burned', 'stake']);
    expect(historyWithoutSource({ ...lesson, levels: { ...lesson.levels, teen: 'In 1449 Toledo passed a law.' } })).toEqual(['teen']);
    expect(economicsRepeated({ ...lesson, levels: { ...lesson.levels, senior: 'Slaves were worth three billion dollars.' } })).toHaveLength(2);
  });
});
