// @vitest-environment node
// =============================================================================
// When it happened, when it was recorded, and which one you may correct (DR-1063)
// =============================================================================
// Darrell, 2026-10-16, over Choir → Resources showing a row with no date at all:
// **"We need to have dates and time stamps... so we can sort out the dates and
// events over time historical accuracy... make sense?... even system logs... to
// make sure it can be corrected... make sense?"**
//
// The cases below are weighted at the three things that make a history
// untrustworthy rather than merely untidy:
//   1. A STAMP WITHOUT A YEAR. "Sep 6" cannot be placed, so a list carrying it
//      cannot be sorted over time. On a record older than a year it is not a
//      shorter stamp — it is a WRONG one.
//   2. THE LOG BEING EDITABLE. Correcting when a thing happened is right;
//      correcting the system's record of when it was written down destroys the
//      only independent account, and with it the point of correcting anything.
//   3. A BARE DATE DRIFTING A DAY. "2026-10-12" parsed as UTC midnight renders
//      as Oct 11 for a church in Texas.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  toDate, isDayOnly, stamp, exactStamp, relativeStamp,
  happenedOn, recordedAt, correctedAt, whenOf, sortKeyOf, sortByWhen,
  validateCorrection, CORRECTION_HELP,
} from '../lib/record-stamp.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(HERE, '..', p), 'utf8');

describe('a stamp always carries the year', () => {
  it('EVERY stamp this module produces names a year', () => {
    // This is the whole request in one assertion. A stamp without a year is
    // what Choir → Songs shipped ("Added by mrspoe06 · Sep 6") and is why the
    // pool could not be read over time.
    for (const v of ['2026-10-12', '2026-10-12T14:30:00Z', '1999-01-01', new Date('2001-06-05T00:00:00Z')]) {
      expect(stamp(v), `no year in the stamp for ${v}`).toMatch(/\d{4}/);
    }
  });

  it('a bare calendar day does not invent a time; an instant keeps one', () => {
    expect(stamp('2026-10-12')).not.toMatch(/:/);
    expect(stamp('2026-10-12T14:30:00Z')).toMatch(/:/);
    // ...and a caller can still ask for either.
    expect(stamp('2026-10-12T14:30:00Z', { withTime: false })).not.toMatch(/:/);
  });

  it('A BARE DATE DOES NOT DRIFT A DAY', () => {
    // new Date('2026-10-12') is UTC midnight, which is Oct 11 in Texas. The
    // church is in Texas.
    const d = toDate('2026-10-12');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate(), 'a bare date drifted across the date line').toBe(12);
    expect(stamp('2026-10-12')).toMatch(/12/);
  });

  it('garbage is empty, never "Invalid Date" on a church wall', () => {
    for (const v of ['', null, undefined, 'not a date', {}, new Date('x')]) {
      expect(stamp(v)).toBe('');
      expect(exactStamp(v)).toBe('');
    }
  });

  it('isDayOnly knows a calendar day from an instant', () => {
    expect(isDayOnly('2026-10-12')).toBe(true);
    expect(isDayOnly('2026-10-12T00:00:00Z')).toBe(false);
    expect(isDayOnly(new Date())).toBe(false);
  });

  it('the exact instant is available for a title, unambiguously', () => {
    expect(exactStamp('2026-10-12T14:30:00Z')).toBe('2026-10-12T14:30:00.000Z');
  });

  it('a relative stamp is companionable, and silent when it would be useless', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    expect(relativeStamp('2026-10-16T09:00:00Z', now)).toBe('today');
    expect(relativeStamp('2026-10-13T12:00:00Z', now)).toBe('3 days ago');
    expect(relativeStamp('2026-10-18T12:00:00Z', now)).toBe('in 2 days');
    expect(relativeStamp('2024-01-01T12:00:00Z', now), 'a vague "ages ago" is worse than the stamp').toBe('');
  });
});

describe('the two kinds of when are kept apart', () => {
  const row = { docDate: '2026-10-12', createdAt: '2026-10-14T18:05:00Z', id: 'a' };

  it('the claim and the witness are read from different fields', () => {
    expect(happenedOn(row)).toBe('2026-10-12');
    expect(recordedAt(row)).toBe('2026-10-14T18:05:00Z');
    expect(correctedAt(row)).toBe(null);
  });

  it('it reads every name the app already uses for each', () => {
    expect(happenedOn({ serviceDate: '2026-01-01' })).toBe('2026-01-01');
    expect(happenedOn({ dateOf: '2026-01-01' })).toBe('2026-01-01');
    expect(recordedAt({ created_at: 'x' })).toBe('x');
  });

  it('BOTH are shown, always — never collapsed into one', () => {
    const w = whenOf(row);
    expect(w.line).toContain('dated');
    expect(w.line).toContain('logged');
    expect(w.happened).toMatch(/2026/);
    expect(w.recorded).toMatch(/2026/);
  });

  it('the log is shown even when it AGREES with the event date', () => {
    // A stamp that appears only when something is off teaches people to read
    // its presence as an accusation. It is always there, so it means nothing
    // in particular.
    const same = { docDate: '2026-10-14', createdAt: '2026-10-14T18:05:00Z' };
    expect(whenOf(same).line).toContain('logged');
  });

  it('a correction is SAID, with all three stamps standing', () => {
    const w = whenOf({ ...row, dateCorrectedAt: '2026-10-16T09:00:00Z' });
    expect(w.line).toMatch(/dated .*· corrected .*· logged/);
  });

  it('a record with only a log still reads', () => {
    expect(whenOf({ createdAt: '2026-10-14T18:05:00Z' }).line).toMatch(/^logged /);
  });

  it('a record with nothing says nothing rather than something false', () => {
    expect(whenOf({ id: 'x' }).line).toBe('');
  });
});

describe('sorting a history', () => {
  it('newest first, by the event date where there is one', () => {
    const rows = [
      { id: 'a', docDate: '2026-01-05' },
      { id: 'b', docDate: '2026-10-12' },
      { id: 'c', docDate: '2026-06-01' },
    ];
    expect(sortByWhen(rows).map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(sortByWhen(rows, { oldestFirst: true }).map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('a DATELESS record sorts LAST, never first', () => {
    // Read as 0, a missing date becomes 1970 and puts the unknown at the head
    // of the history — the loudest possible wrong answer.
    const rows = [{ id: 'none' }, { id: 'old', docDate: '1990-01-01' }];
    expect(sortByWhen(rows).map((r) => r.id)).toEqual(['old', 'none']);
  });

  it('two records on the same day never swap between renders', () => {
    const rows = [
      { id: 'b', docDate: '2026-10-12', createdAt: '2026-10-12T10:00:00Z' },
      { id: 'a', docDate: '2026-10-12', createdAt: '2026-10-12T08:00:00Z' },
    ];
    const once = sortByWhen(rows).map((r) => r.id);
    expect(once).toEqual(['b', 'a']);                    // later log wins
    expect(sortByWhen([...rows].reverse()).map((r) => r.id)).toEqual(once);
  });

  it('it does not mutate what it is handed', () => {
    const rows = [{ id: 'a', docDate: '2026-01-01' }, { id: 'b', docDate: '2026-05-01' }];
    sortByWhen(rows);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('the sort key prefers the event date and falls back to the log', () => {
    expect(sortKeyOf({ docDate: '2026-10-12' })).toBe(toDate('2026-10-12').getTime());
    expect(sortKeyOf({ createdAt: '2026-10-12T00:00:00Z' })).toBe(Date.parse('2026-10-12T00:00:00Z'));
    expect(sortKeyOf({})).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe('a correction is checked, and the log is never one', () => {
  const row = { docDate: '2026-10-12', createdAt: '2026-10-14T18:05:00Z' };

  it('a real correction is accepted and normalized to a calendar day', () => {
    const r = validateCorrection(row, '2026-10-11');
    expect(r).toEqual({ ok: true, value: '2026-10-11' });
  });

  it('A THING CANNOT HAVE HAPPENED AFTER IT WAS WRITTEN DOWN', () => {
    // The one rule here that is not taste. Accepting this silently would put
    // the history out of order in a way nothing downstream could detect.
    const r = validateCorrection(row, '2026-11-01');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('after-the-log');
    expect(r.message).toMatch(/written down on/);
    expect(r.message).toMatch(/2026/);
  });

  it('the same day as the log is fine — a thing filed the day it happened', () => {
    expect(validateCorrection(row, '2026-10-14').ok).toBe(true);
  });

  it('an empty, unreadable or implausible date is refused WITH WORDS', () => {
    for (const [v, reason] of [['', 'empty'], ['  ', 'empty'], ['tuesday-ish', 'unreadable'], ['1066-10-14', 'implausible']]) {
      const r = validateCorrection(row, v);
      expect(r.ok, `${v} was accepted`).toBe(false);
      expect(r.reason).toBe(reason);
      expect(r.message.length).toBeGreaterThan(10);
    }
  });

  it('a record with no log can still be corrected', () => {
    expect(validateCorrection({ docDate: '2026-01-01' }, '2026-02-01').ok).toBe(true);
  });

  it('THERE IS NO FUNCTION HERE THAT CORRECTS THE LOG, and the help says so', () => {
    // The absence is the design. If one is ever added, this is the case that
    // has to be deliberately deleted to do it.
    const mod = src('lib/record-stamp.js').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
    expect(/export\s+(?:async\s+)?function\s+\w*(?:setRecorded|correctRecorded|editLog|setCreated)/i.test(mod)).toBe(false);
    expect(mod, 'the stripper blanked the file').toContain('validateCorrection');
    expect(CORRECTION_HELP).toMatch(/never changes/i);
  });
});

describe('the surfaces he photographed carry a stamp', () => {
  it('Choir Resources shows one — it showed NOTHING before', () => {
    const text = src('components/Choir.jsx');
    expect(text).toContain("from '../lib/record-stamp.js'");
    expect(text).toMatch(/whenOf\(r\)/);
  });

  it('Choir Team Docs shows the document date AND the log', () => {
    expect(src('components/Choir.jsx')).toMatch(/whenOf\(d\)/);
  });

  it('the song pool no longer drops the year', () => {
    const text = src('components/ChoirSongWorkshop.jsx');
    // The exact shipped formatter that produced "Sep 6".
    expect(/toLocaleDateString\(undefined,\s*\{\s*month:\s*'short',\s*day:\s*'numeric'\s*\}\)/.test(text),
      'the year-less formatter is back').toBe(false);
    expect(text).toContain("from '../lib/record-stamp.js'");
  });
});
