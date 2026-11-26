// The redesigned homepage's private-preview flag and its pure builders.
import { describe, it, expect } from 'vitest';
import { isHomeStudioOn, homeStudioAllowed, CHURCH_STUDIO_NAV, STUDIO_QUICK, EXPLORE_CARDS, MY_CORNER_DOORS, happeningItems, messageCards, continueLearning, sameEvent, HOME_STUDIO_FLAG_KEY } from '../lib/home-studio.js';
import { CHURCH_BOTTOM_NAV, CHURCH_TAB_ICONS } from '../lib/church-tabs.jsx';

const store = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
};
const PROD = 'poetech.us';

describe('the preview is private', () => {
  it('is off for everyone by default, on only for the owner device', () => {
    expect(isHomeStudioOn({ search: '', storage: store(), hostname: PROD })).toBe(false);
    expect(isHomeStudioOn({ search: '', storage: store(), hostname: PROD, ownerDevice: true })).toBe(true);
  });
  it('a stranger who types ?homeStudio=1 on the real site still gets the current homepage, and nothing is remembered', () => {
    const s = store();
    expect(isHomeStudioOn({ search: '?homeStudio=1', storage: s, hostname: PROD })).toBe(false);
    expect(s.getItem(HOME_STUDIO_FLAG_KEY)).toBeNull();
  });
  it('a remembered "on" does not carry to a second account on the real site', () => {
    expect(isHomeStudioOn({ search: '', storage: store({ [HOME_STUDIO_FLAG_KEY]: '1' }), hostname: PROD })).toBe(false);
  });
  it('?homeStudio=0 turns it off for the owner and is remembered', () => {
    const s = store();
    expect(isHomeStudioOn({ search: '?homeStudio=0', storage: s, hostname: PROD, ownerDevice: true })).toBe(false);
    expect(isHomeStudioOn({ search: '', storage: s, hostname: PROD, ownerDevice: true })).toBe(false);
  });
  it('?homeStudio=1 turns it back on for the owner', () => {
    const s = store({ [HOME_STUDIO_FLAG_KEY]: '0' });
    expect(isHomeStudioOn({ search: '?homeStudio=1', storage: s, hostname: PROD, ownerDevice: true })).toBe(true);
  });
  it('localhost, a LAN host and a preview build may open it by URL; the family site and the church door host may not', () => {
    for (const h of ['localhost', '127.0.0.1', '192.168.1.20', 'x.poetech-app.pages.dev', 'branch.vercel.app']) expect(homeStudioAllowed({ hostname: h }), h).toBe(true);
    for (const h of ['poetech.us', 'www.poetech.us', 'poetech-app.pages.dev', 'thelovecorner.example', '']) expect(homeStudioAllowed({ hostname: h }), h).toBe(false);
  });
});

describe('the five-tab bar and the doors name places that exist', () => {
  it('Home · Messages · Events · Learning · Institute · Ministries · Give, and the current seven-tab bar is untouched', () => {
    expect(CHURCH_STUDIO_NAV.map((t) => t.words)).toEqual(['Home', 'Messages', 'Events', 'Learning', 'Institute', 'Ministries', 'Give']);
    expect(CHURCH_BOTTOM_NAV.map((t) => t.words)).toEqual(['Home', 'Watch', 'Bible', 'Events', 'Give', 'Ministries', 'Institute']);
  });
  it('every church tab a door names is a real church tab', () => {
    const subs = [...STUDIO_QUICK.map((d) => d.sub), ...EXPLORE_CARDS.map((d) => d.sub), ...CHURCH_STUDIO_NAV.map((t) => t.churchView).filter(Boolean), ...MY_CORNER_DOORS.filter((d) => d.go).map((d) => d.go.sub)].filter((s) => s !== 'home');
    for (const s of subs) expect(CHURCH_TAB_ICONS[s], s).toBeTruthy();
  });
  it('every home section a door names exists in the home (worship, prayer, give, times, about, office, mycorner)', () => {
    const ok = new Set(['worship', 'speak', 'prayer', 'give', 'times', 'about', 'office', 'mycorner']);
    const secs = [...STUDIO_QUICK, ...CHURCH_STUDIO_NAV, ...EXPLORE_CARDS, ...MY_CORNER_DOORS.map((d) => d.go || {})].map((d) => d.section).filter(Boolean);
    for (const s of secs) expect(ok.has(s), s).toBe(true);
  });
  it('the quick doors are exactly the seven the brief names', () => {
    expect(STUDIO_QUICK.map((d) => d.words)).toEqual(['Worship', 'The Word', 'Institute', 'Ministries', 'Kids & Youth', 'Prayer', 'Give']);
  });
});

describe('happeningItems: real events only, a few at a time', () => {
  const NOW = new Date('2026-11-26T15:00:00Z');
  const announced = [
    { id: 'a', name: 'Old Gospel Fest', date: '2026-08-01' },
    { id: 'b', name: 'Battle Cry Sunday', date: '2026-12-06', detail: 'All day' },
    { id: 'c', name: 'Christmas Program', date: '2026-12-20' },
  ];
  const office = { events: { flyers: [{ path: '/u/battle-cry-sunday-veterans-flyer.jpg', src: '/api/x1', name: 'Battle Cry Sunday Veterans' }, { path: '/u/f2.jpg', src: '/api/x2', name: 'Watch Night' }, { path: '/u/f3.jpg', src: '/api/x3', name: 'Another' }, { path: '/u/f4.jpg', src: '/api/x4', name: 'Fourth' }] } };
  it('drops the past, gives an event its own flyer, lists the rest of the flyers, and says how many exist', () => {
    const r = happeningItems({ office, announcedEvents: announced, now: NOW, limit: 3 });
    expect(r.items.map((i) => i.name)).toEqual(['Battle Cry Sunday', 'Christmas Program', 'Watch Night']);
    expect(r.items[0].src).toBe('/api/x1');
    expect(r.items[0].when).toBe('Dec 6');
    expect(r.total).toBe(5);
  });
  it('nothing in, nothing out: no invented event', () => {
    expect(happeningItems({ office: null, announcedEvents: [], now: NOW })).toEqual({ items: [], total: 0 });
  });
  it('sameEvent matches by words, not by accident', () => {
    expect(sameEvent('Battle Cry Sunday', 'Battle Cry Sunday Veterans')).toBe(true);
    expect(sameEvent('Watch Night', 'Christmas Program')).toBe(false);
  });
});

describe('messageCards and continueLearning', () => {
  it('the newest is the latest and the next few swipe', () => {
    const v = Array.from({ length: 8 }, (_, i) => ({ videoId: `v${i}` }));
    const r = messageCards(v, { limit: 5 });
    expect(r.latest.videoId).toBe('v0');
    expect(r.more.map((x) => x.videoId)).toEqual(['v1', 'v2', 'v3', 'v4']);
    expect(messageCards([]).latest).toBeNull();
  });
  it('progress is real or absent', () => {
    const titleOf = (k) => (k === 'ai' ? 'Learning A.I. The Way' : '');
    const got = continueLearning({ places: [{ courseKey: 'gone', at: 2 }, { courseKey: 'ai', at: 1 }], finished: 3, titleOf, where: () => 'part 2', ago: () => 'yesterday' });
    expect(got).toMatchObject({ has: true, title: 'Learning A.I. The Way', where: 'part 2', finished: 3 });
    expect(continueLearning({ places: [], titleOf }).has).toBe(false);
  });
});
