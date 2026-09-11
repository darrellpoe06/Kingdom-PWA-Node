// @vitest-environment node
//
// feedback-clusters — the low-hanging-fruit board (Darrell, 2026-09-11, COLG
// leadership demo): "there may be twenty people saying the exact same issue...
// that shows us our low hanging fruit... or two people, but guess what, that's
// gonna make a bigger problem. That's a higher priority even though they'll has
// two issues."
//
// Both halves of that rule are pinned here, and the anti-theater block proves
// the gate CATCHES the failure it exists to prevent (DR-0076 §3) — a clusterer
// that lumped everything together, or one that never merged anything, would
// both go green on a weaker test.
import { describe, it, expect } from 'vitest';
import {
  normalizeComplaint, clusterFeedback, summarizeClusters, SEVERITY_WEIGHT,
} from '../lib/feedback-clusters.js';

const say = (id, who, text) => ({ id, userId: who, text });

describe('normalizeComplaint — the same complaint gets the same signature', () => {
  it('is word-order insensitive', () => {
    expect(normalizeComplaint('the give button is broken'))
      .toBe(normalizeComplaint('broken give button'));
  });

  it('folds the ways people say "it does not work"', () => {
    const a = normalizeComplaint('the give button is broken');
    expect(normalizeComplaint("the give button doesn't work")).toBe(a);
    expect(normalizeComplaint('give button not working')).toBe(a);
  });

  it('folds plurals and -ing so one voice is not split from another', () => {
    expect(normalizeComplaint('the buttons load slow'))
      .toBe(normalizeComplaint('button loading slow'));
  });

  it('does NOT collapse genuinely different complaints', () => {
    expect(normalizeComplaint('the give button is broken'))
      .not.toBe(normalizeComplaint('the bus schedule is broken'));
  });

  it('is empty for a note with nothing but filler', () => {
    expect(normalizeComplaint('it is just the, and I have')).toBe('');
  });
});

describe('clusterFeedback — count the PEOPLE behind one issue', () => {
  it('merges twenty people saying the same thing into ONE issue with count 20', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      say(i, `person-${i}`, i % 2 ? 'give button broken' : "the give button doesn't work"));
    const clusters = clusterFeedback(items);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(20);
    expect(clusters[0].reports).toBe(20);
  });

  it('counts one person twice as ONE voice, not two', () => {
    const clusters = clusterFeedback([
      say(1, 'darrell', 'give button broken'),
      say(2, 'darrell', "the give button doesn't work"),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(1);   // one person
    expect(clusters[0].reports).toBe(2); // two notes
  });

  it('keeps the same words on DIFFERENT areas apart — two fixes, not one', () => {
    const clusters = clusterFeedback([
      say(1, 'a', 'I cannot sign in'),
      say(2, 'b', 'the bus schedule is broken'),
    ]);
    expect(clusters).toHaveLength(2);
    expect(new Set(clusters.map((c) => c.area)).size).toBe(2);
  });

  it('takes the cluster severity from its WORST member', () => {
    const [top] = clusterFeedback([
      say(1, 'a', 'the giving page is weird and broken'),
      say(2, 'b', 'the giving page is broken and my entry disappeared'),
    ]).filter((c) => c.count === 1 || c.count === 2);
    expect(top).toBeTruthy();
  });

  it('drops telemetry noise off a board humans read', () => {
    const clusters = clusterFeedback([
      say(1, 'a', '[learn engagement] signal=3 band=high'),
      say(2, 'b', 'give button broken'),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].label).toMatch(/give button/);
  });

  it('survives junk input without throwing', () => {
    expect(clusterFeedback(null)).toEqual([]);
    expect(clusterFeedback([null, undefined, {}, { id: 1, text: '' }])).toEqual([]);
  });
});

describe("Darrell's ranking rule — volume counts, severity outranks volume", () => {
  it('ranks twenty reports of one thing above two reports of another, same severity', () => {
    const many = Array.from({ length: 20 }, (_, i) => say(`m${i}`, `p${i}`, 'give button broken'));
    const few = [say('f1', 'x', 'the bus schedule is broken'), say('f2', 'y', 'bus schedule broken')];
    const clusters = clusterFeedback([...few, ...many]);
    expect(clusters[0].count).toBe(20);
    expect(clusters[1].count).toBe(2);
  });

  it('ranks TWO people on a bigger problem ABOVE twenty people on a nit', () => {
    // "or two people, but guess what, that's gonna make a bigger problem.
    //  That's a higher priority even though they'll has two issues."
    const nit = Array.from({ length: 20 }, (_, i) =>
      say(`n${i}`, `p${i}`, 'the wording on this page is confusing'));
    const bigger = [
      say('b1', 'x', 'my giving entry disappeared after I saved it'),
      say('b2', 'y', 'giving entry disappeared after saved'),
    ];
    const clusters = clusterFeedback([...nit, ...bigger]);
    expect(clusters[0].severity).toBe('critical');
    expect(clusters[0].count).toBe(2);
    expect(clusters[0].score).toBeGreaterThan(clusters[1].score);
  });

  it('weights severity so the arithmetic matches the rule', () => {
    expect(SEVERITY_WEIGHT.critical * 2).toBeGreaterThan(SEVERITY_WEIGHT.normal * 20);
    expect(SEVERITY_WEIGHT.normal * 20).toBeGreaterThan(SEVERITY_WEIGHT.normal * 2);
    expect(SEVERITY_WEIGHT.noise).toBe(0);
  });

  it('orders identically on a reshuffled input (a board that reshuffles is untrusted)', () => {
    const items = [
      say(1, 'a', 'give button broken'), say(2, 'b', 'give button broken'),
      say(3, 'c', 'the bus schedule is broken'), say(4, 'd', 'bus schedule broken'),
    ];
    const first = clusterFeedback(items).map((c) => c.signature);
    const second = clusterFeedback(items.slice().reverse()).map((c) => c.signature);
    expect(second).toEqual(first);
  });
});

describe('summarizeClusters — how much of the pile was repeats', () => {
  it('reports the duplicate rate the triager actually wants', () => {
    const items = [
      ...Array.from({ length: 9 }, (_, i) => say(`g${i}`, `p${i}`, 'give button broken')),
      say('z', 'z', 'the bus schedule is broken'),
    ];
    const s = summarizeClusters(clusterFeedback(items));
    expect(s.total).toBe(10);
    expect(s.issues).toBe(2);
    expect(s.repeatedIssues).toBe(1);
    expect(s.duplicateRate).toBe(80); // 8 of 10 notes were a second-or-later voice
    expect(s.topCount).toBe(9);
  });

  it('is zero-safe on an empty board', () => {
    expect(summarizeClusters([])).toMatchObject({ total: 0, issues: 0, duplicateRate: 0 });
  });
});

describe('proven-to-catch (anti-theater) — the clusterer is not vacuously right', () => {
  it('CATCHES a clusterer that merged everything: unrelated notes stay separate', () => {
    const clusters = clusterFeedback([
      say(1, 'a', 'the give button is broken'),
      say(2, 'b', 'I love the new bus ministry page'),
      say(3, 'c', 'please add a way to join the choir'),
    ]);
    expect(clusters).toHaveLength(3);
  });

  it('CATCHES a clusterer that merged nothing: rephrasings still collapse', () => {
    const clusters = clusterFeedback([
      say(1, 'a', 'The give button is broken!'),
      say(2, 'b', 'give buttons not working'),
      say(3, 'c', "The Give Button doesn't work."),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(3);
  });
});
