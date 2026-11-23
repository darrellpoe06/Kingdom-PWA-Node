// L341 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll341-whoso-removeth-stones.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll341-whoso-removeth-stones',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 341,
  added: '2026-11-23',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Ecclesiastes 10:9', 'Whoso removeth stones shall be hurt therewith'],
    ['James 3:5', 'how great a matter a little fire kindleth'],
    ['Deuteronomy 19:15', 'at the mouth of two witnesses'],
    ['1 Thessalonians 5:21', 'Prove all things'],
    ['Proverbs 22:3', 'A prudent man foreseeth the evil'],
  ],
});

// ---------------------------------------------------------------------------
// What is particular to L341: one newsletter's report kept at its weight, the
// denied A.I. link held as not established, no official named, the earlier
// lessons on the same outage and the same chapter named, and the house's own
// outage read back from its own records (DR-1616).
// ---------------------------------------------------------------------------

const ROOT = join(__dirname, '..', '..', '..');
const PLACES = { adult: lesson.lesson, ...lesson.levels };

/** Pure. The tier faults of one teaching place: the report named as reported, the A.I. link as denied and unsettled. */
function tierFaults(text) {
  const out = [];
  if (!/\breported\b|did not check/i.test(text)) out.push('the outage is not marked as reported');
  if (!/\bdenied\b|said no|no connection/i.test(text)) out.push('the officials’ denial is missing');
  if (!/not established|either way|we do not know/i.test(text)) out.push('the A.I. link is not held as unsettled');
  return out;
}

/** Pure. A named official or the newsletter's own brand in our voice. */
function namedFaults(text) {
  return String(text).match(/\b(Duffy|Sean|IT Brew|Gartner|DE-CIX|NPR)\b/g) || [];
}

describe('L341 — the report at its weight, the house from its records', () => {
  it('every teaching place marks the report as reported, the A.I. link as denied and not established', () => {
    for (const [place, text] of Object.entries(PLACES)) expect(tierFaults(text), place).toEqual([]);
  });

  it('no official, newsletter brand or thread id is printed anywhere in the lesson', () => {
    const all = JSON.stringify(lesson);
    expect(namedFaults(all)).toEqual([]);
    expect(all).not.toMatch(/1a208fb97b576d51/);
  });

  it('names the earlier lessons it does not reteach: the broken reed (same outage) and the blunt iron (next verse)', () => {
    expect(lesson.lesson).toMatch(/The Staff of This Broken Reed/);
    expect(lesson.lesson).toMatch(/Maintenance and Trades/);
    expect(lesson.levels.senior).toMatch(/The Staff of This Broken Reed/);
  });

  it('the house claims read back from the records: the nine-hour stale site and the outside witness', () => {
    const lessons = readFileSync(join(ROOT, 'docs/00-foundations/_root/LESSONS-LEARNED.md'), 'utf8');
    expect(lessons).toMatch(/P26[\s\S]{0,400}2026-07-06[\s\S]{0,200}~9 hours/);
    const probe = readFileSync(join(ROOT, '.github/workflows/site-health.yml'), 'utf8');
    expect(probe).toMatch(/STALE: dispatches deploy-cloudflare-pages\.yml/);
    expect(existsSync(join(ROOT, 'app/src/lib/site-health.js'))).toBe(true);
    for (const [place, text] of Object.entries(PLACES)) expect(text, place).toMatch(/nine hours/);
  });

  it('proven to catch: an unreported account, a dropped denial and a named official each fail', () => {
    const stripped = lesson.lesson
      .replace(/reported/gi, 'said')
      .replace(/denied/gi, 'said')
      .replace(/not established/gi, 'open')
      .replace(/either way/gi, '');
    expect(tierFaults(stripped).length).toBe(3);
    expect(namedFaults(`${lesson.lesson} Secretary Sean Duffy said so.`)).toEqual(['Sean', 'Duffy']);
  });
});
