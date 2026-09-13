// @vitest-environment node
// L37 (One Blood) — the homicide figures, and the discipline that cuts BOTH ways.
// =============================================================================
// Darrell supplied this data 2026-09-13. L37 already refused the "crime gene"
// and taught that crime tracks conditions rather than race — but it carried NO
// statistics at all, which left its argument resting on assertion.
//
// WHY THIS FILE IS STRICT, AND WHY IT PINS IN TWO DIRECTIONS. This material can
// be abused from either side. Drop the disparity and you gaslight real grief;
// drop the intraracial pattern and you hand over a slander. The lesson must
// hold both at once, and each half is pinned here against the edit that would
// quietly remove it.
//
// The verification-doctrine trap this closes: L37 argues (correctly) that ARREST
// data overstates disparity where policing falls harder on one community. That
// caveat is true, and it is NOT valid for victimization data, which is built
// from the dead. A true caveat borrowed to escape an inconvenient number is the
// both-sides sleight the lesson exists to remove, so the lesson says so itself.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, chapter, num) =>
  JSON.parse(readFileSync(join(KJV_DIR, `${book.replace(/\s+/g, '')}.json`), 'utf8')).chapters[chapter - 1][num - 1];

const mod = () => LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll37-one-blood'));
const text = () => mod().lesson;

describe('L37 — the disparity is stated plainly and never rounded off (DR-0100 tier one)', () => {
  it('carries the real victimization rates, attributed to the source', () => {
    const l = text();
    expect(l).toMatch(/21\.3/);
    expect(l).toMatch(/3\.2/);
    expect(l).toMatch(/Bureau of Justice Statistics/);
    // Under-claiming a documented harm is as much a failure as over-claiming.
    expect(l).toMatch(/will not round them off|unhedged/i);
  });
  it('keeps what the figure costs in human terms', () => {
    const l = text();
    expect(l).toMatch(/LEADING cause of death for Black males/i);
    expect(l).toMatch(/Centers for Disease Control/);
  });
  it('refuses to hide behind its own true caveat about arrest data', () => {
    // This is the important one. The over-policing caveat is valid and is NOT
    // valid here, and the lesson must say which is which rather than let a
    // reader use the first to dismiss the second.
    const l = text();
    expect(l).toMatch(/does NOT apply here|not from who an officer chose to stop/i);
    expect(l).toMatch(/borrowed to escape a number/i);
  });
});

describe('L37 — the phrase is dismantled, and the dismantling does not become its own dodge', () => {
  it('gives both intraracial figures, not only the one that suits', () => {
    const l = text();
    expect(l).toMatch(/eighty-eight to eighty-nine per cent/);
    expect(l).toMatch(/eighty to eighty-one per cent/);
    expect(l).toMatch(/FBI Supplementary Homicide Report/);
  });
  it('names the asymmetry that is the actual tell', () => {
    expect(text()).toMatch(/Nobody says white-on-white crime/i);
    expect(text()).toMatch(/condition can be made to sound like a trait/i);
  });
  it('explicitly refuses to use the intraracial fact to wave the disparity away', () => {
    // Both true at once. A lesson that used either number to silence the other
    // would be running the ratings-trick in the opposite direction.
    const l = text();
    expect(l).toMatch(/cuts BOTH ways/i);
    expect(l).toMatch(/Both numbers are true at once/i);
    expect(l).toMatch(/The first fact kills the slander. The second keeps the grief honest/);
  });
});

describe('L37 — the Word put both halves on its first pages', () => {
  it('the first homicide is a man and his brother, before there were races to blame', () => {
    expect(verse('Genesis', 4, 8)).toContain('Cain rose up against Abel his brother, and slew him');
    expect(text()).toContain('Cain rose up against Abel his brother, and slew him');
    expect(text()).toMatch(/before there were any races to blame it on/i);
  });
  it('Yahweh answers with a question about a person, and the refusal of responsibility', () => {
    expect(verse('Genesis', 4, 9)).toContain('Am I my brother’s keeper?');
    expect(text()).toContain('Am I my brother’s keeper?');
  });
  it('the ground testifies, and the lesson ties it to made conditions', () => {
    expect(verse('Genesis', 4, 10)).toContain('the voice of thy brother’s blood crieth unto me from the ground');
    expect(text()).toContain('the voice of thy brother’s blood crieth unto me from the ground');
    expect(text()).toMatch(/redlined, disinvested and emptied of work/);
  });
  it('answers Cain’s evasion rather than leaving it rhetorical', () => {
    // He asked it to get out of it. The lesson does not let the question hang.
    expect(text()).toMatch(/the only answer the church has ever had: yes\. You are\./);
  });
  it('binds this lesson to the lending lesson by the same verse', () => {
    expect(verse('Proverbs', 13, 23)).toContain('destroyed for want of judgment');
    expect(text()).toContain('Much food is in the tillage of the poor');
    expect(text()).toMatch(/Conditions are not weather/i);
  });
});
