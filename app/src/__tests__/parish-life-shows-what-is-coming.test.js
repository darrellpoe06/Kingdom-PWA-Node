// DR-1595: Parish Life lists only what has not ended, read from the calendar.
import { describe, it, expect } from 'vitest';
import { parishLifeEvents, PARISH_LIFE_LIMIT } from '../lib/parish-life.js';
import { fromAnnounced, mergeEvents } from '../lib/church-calendar.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const assembly = { id: 'a', name: 'Assembly', date: '2026-07-14', endDate: '2026-07-16' };
const fest = { id: 'f', name: 'Gospel Fest', date: '2026-08-29', endDate: null };
const advent = { id: 'v', name: 'Advent service', date: '2026-12-06', endDate: null };

describe('Parish Life shows what is coming (DR-1595)', () => {
  it('the screen Darrell saw: on 2026-11-19 July and August are gone', () => {
    const events = mergeEvents(fromAnnounced(COLG_DEFAULT_CHURCH.announcedEvents));
    expect(events.length).toBeGreaterThan(0);
    expect(parishLifeEvents(events, '2026-11-19')).toEqual([]);
  });

  it('PROVEN TO CATCH: the old rule (every announced event) would still list them', () => {
    const everything = fromAnnounced(COLG_DEFAULT_CHURCH.announcedEvents);
    expect(everything.map((e) => e.name)).toContain('Gospel Fest');
    expect(parishLifeEvents(everything, '2026-11-19').map((e) => e.name)).not.toContain('Gospel Fest');
  });

  it('an event stays through its last day, and goes the day after', () => {
    expect(parishLifeEvents([assembly], '2026-07-15').map((e) => e.id)).toEqual(['a']);
    expect(parishLifeEvents([assembly], '2026-07-16').map((e) => e.id)).toEqual(['a']);
    expect(parishLifeEvents([assembly], '2026-07-17')).toEqual([]);
  });

  it('an event the office added is listed, soonest first', () => {
    expect(parishLifeEvents([advent, fest, assembly], '2026-08-01').map((e) => e.id)).toEqual(['f', 'v']);
  });

  it('caps the list and reads nothing from an unreadable today', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `e${i}`, name: `E${i}`, date: `2026-12-${String(10 + i).padStart(2, '0')}`, endDate: null }));
    expect(parishLifeEvents(many, '2026-12-01')).toHaveLength(PARISH_LIFE_LIMIT);
    expect(parishLifeEvents(many, 'not a day')).toEqual([]);
    expect(parishLifeEvents(null, '2026-12-01')).toEqual([]);
  });
});
