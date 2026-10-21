// =============================================================================
// The Big Picture is the family's years in pictures (DR-1145)
// =============================================================================
// Darrell, 2026-10-21, from the Life Hub: "Clicking Big Picture should show the
// family photos... over time or stories like Google stories of pictures of
// family times over the years... make sense?" And: "Right now it goes
// nowhere...."
//
// It did go nowhere: the tile pointed at `overview`, and since the Hub became
// the home (DR-1046) `overview` IS the Hub. These checks pin the four things
// that make the new tile honest:
//   1. the tile and the "Add a photo" action open a panel INSIDE the Hub and
//      never call the host's setView;
//   2. the model turns real month pages into chapters and a this-week strip
//      (year wrap included), and says the date in words;
//   3. the component says each of its three honest states in words and
//      recovers from an unreachable NAS with Retry;
//   4. the story moves on by itself, and Close returns to the Hub.
// The NAS is never touched: every dependency is injected.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LifeHub from '../components/LifeHub.jsx';
import FamilyStories from '../components/FamilyStories.jsx';
import { HUB_TILES, HUB_ACTIONS } from '../lib/life-hub.js';
import {
  dateInWords, yearsAgo, monthsToProbe, monthsFromYears, chaptersFrom, nearToday,
  thisWeekAcrossYears, chapterTitle, frameCaption, FRAME_MS, nextIndex,
} from '../lib/family-stories.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TODAY = new Date(2026, 9, 21); // 2026-10-21, a Wednesday
const PX = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z';
const photo = (name, text = '') => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(name);
  return { id: name, name, date: `${m[1]}-${m[2]}-${m[3]}`, text, thumb: PX };
};

// A library: pictures near 21 October in 2023, 2024 and 2025; one in January 2024.
const LIBRARY = {
  '2025-10': { total: 2, photos: [photo('20251020_101010.jpg'), photo('20251018_090000.jpg', 'Fall walk')] },
  '2024-10': { total: 1, photos: [photo('20241022_120000.jpg')] },
  '2024-01': { total: 1, photos: [photo('20240123_144917.jpg')] },
  '2023-10': { total: 1, photos: [photo('20231021_180000.jpg')] },
};
const YEARS = {
  years: [
    { year: '2025', count: 2, months: [{ month: '2025-10', count: 2 }] },
    { year: '2024', count: 2, months: [{ month: '2024-01', count: 1 }, { month: '2024-10', count: 1 }] },
    { year: '2023', count: 1, months: [{ month: '2023-10', count: 1 }] },
  ],
};
const fakeDeps = (over = {}) => ({
  hasBridgeToken: () => true,
  fetchLibraryYears: vi.fn(async () => YEARS),
  fetchLibrary: vi.fn(async ({ month, limit = 24, offset = 0 }) => {
    const pg = LIBRARY[month];
    if (!pg) return { photos: [], total: 0, month };
    return { photos: pg.photos.slice(offset, offset + limit), total: pg.total, month };
  }),
  fetchLibraryPhoto: vi.fn(async (name) => ({ ok: true, image: PX, name })),
  uploadPhoto: vi.fn(async () => ({ ok: true })),
  compressImageFile: vi.fn(async () => PX),
  now: () => TODAY,
  ...over,
});

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); });
const render = (el) => act(() => root.render(el));
const settle = async (n = 4) => { for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); }); };
const text = () => container.textContent || '';
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const byTestId = (id) => container.querySelector(`[data-testid="${id}"]`);

describe('the tile opens the family\'s years, inside the Hub (1)', () => {
  it('Big Picture and Add a photo name the stories panel and NO host view', () => {
    const tile = HUB_TILES.find((t) => t.key === 'bigPicture');
    expect(tile.hub).toBe('stories');
    expect(tile.view).toBeNull();
    expect(tile.sub).toMatch(/pictures/i);
    const action = HUB_ACTIONS.find((a) => a.key === 'photo');
    expect(action.hub).toBe('stories');
    expect(action.view).toBeNull();
  });

  it('clicking Big Picture does not call setView and shows the panel; Back returns to the Hub', async () => {
    const setView = vi.fn();
    render(createElement(LifeHub, { data: { inflows: { rentals: [] }, projects: [] }, setData: () => {}, setView, setChurchView: () => {} }));
    const tile = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Big Picture'));
    expect(tile).toBeTruthy();
    click(tile);
    await settle();
    expect(setView).not.toHaveBeenCalled();
    expect(byTestId('family-stories'), 'the stories panel did not open').toBeTruthy();
    expect(text()).toContain('Our years in pictures');
    // The Hub's own body steps aside while the panel is open, and comes back.
    expect(text()).not.toContain("Today's Focus");
    click(byTestId('stories-close'));
    expect(byTestId('family-stories')).toBeNull();
    expect(text()).toContain("Today's Focus");
  });

  it('the Add a photo action opens the same panel', async () => {
    const setView = vi.fn();
    render(createElement(LifeHub, { data: { inflows: { rentals: [] }, projects: [] }, setData: () => {}, setView, setChurchView: () => {} }));
    // 'photo' is the eighth action; the densest look shows it.
    const { setHubDensity } = await import('../lib/home-view-prefs.js');
    act(() => setHubDensity('photo'));
    const btn = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Add a photo');
    expect(btn, 'the Add a photo action did not render').toBeTruthy();
    click(btn);
    await settle();
    expect(setView).not.toHaveBeenCalled();
    expect(byTestId('family-stories')).toBeTruthy();
  });
});

describe('the model: chapters, this week across the years, words (2)', () => {
  it('says the date in words and how long ago', () => {
    expect(dateInWords('2024-01-23')).toBe('January 23, 2024');
    expect(dateInWords('nonsense')).toBe('');
    expect(yearsAgo('2024-01-23', TODAY)).toBe('2 years ago');
    expect(yearsAgo('2025-10-20', TODAY)).toBe('last year');
    expect(yearsAgo('2026-03-01', TODAY)).toBe('this year');
    expect(frameCaption(photo('20240123_144917.jpg'), TODAY)).toBe('January 23, 2024 · 2 years ago');
    expect(frameCaption(photo('20251018_090000.jpg', 'Fall walk'), TODAY)).toBe('October 18, 2025 · last year — Fall walk');
  });

  it('turns month pages into chapters, newest year first, frames oldest first, with the server\'s totals', () => {
    const pages = Object.values(LIBRARY).map((pg, i) => ({ ...pg, month: Object.keys(LIBRARY)[i] }));
    const ch = chaptersFrom(pages);
    expect(ch.map((c) => c.year)).toEqual(['2025', '2024', '2023']);
    expect(ch[1].count).toBe(2);
    expect(ch[1].frames.map((f) => f.date)).toEqual(['2024-01-23', '2024-10-22']);
    expect(ch[1].months.map((m) => m.month)).toEqual(['2024-01', '2024-10']);
    expect(ch[0].cover.name).toBe('20251020_101010.jpg');
    expect(chapterTitle(ch[2])).toBe('2023 · 1 picture');
    expect(chapterTitle(ch[0])).toBe('2025 · 2 pictures');
    // A month with a total but no frames yet still counts (it is a real file count).
    expect(chaptersFrom([{ month: '2022-05', photos: [], total: 40 }])[0]).toMatchObject({ year: '2022', count: 40, loaded: 0 });
    // A page with nothing in it is not a chapter.
    expect(chaptersFrom([{ month: '2022-06', photos: [], total: 0 }])).toEqual([]);
  });

  it('picks this week across the years, oldest year first, and wraps the year end', () => {
    const pages = Object.keys(LIBRARY).map((month) => ({ ...LIBRARY[month], month }));
    const week = thisWeekAcrossYears(chaptersFrom(pages), TODAY);
    expect(week.map((f) => f.date)).toEqual(['2023-10-21', '2024-10-22', '2025-10-18', '2025-10-20']);
    expect(nearToday('2024-01-23', TODAY)).toBe(false);
    // New Year's Eve is within a week of January 3, across the wrap.
    expect(nearToday('2020-12-31', new Date(2026, 0, 3))).toBe(true);
    expect(nearToday('2020-01-05', new Date(2026, 11, 30))).toBe(true);
    expect(nearToday('2020-01-10', new Date(2026, 11, 30))).toBe(false);
  });

  it('knows which months to ask an older server about, and which months a years listing names', () => {
    const probe = monthsToProbe(TODAY, 14);
    expect(probe[0]).toBe('2026-10');
    expect(probe[9]).toBe('2026-01');
    expect(probe[10]).toBe('2025-12');
    expect(probe).toHaveLength(14);
    expect(monthsFromYears(YEARS.years)).toEqual(['2025-10', '2024-10', '2024-01', '2023-10']);
  });

  it('a story ends rather than looping by itself', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBeNull();
    expect(nextIndex(0, 0)).toBeNull();
    expect(FRAME_MS).toBe(5000);
  });
});

describe('the component says its states in words (3)', () => {
  it('with no key on this device it says how the device connects itself, and never fetches', async () => {
    const deps = fakeDeps({ hasBridgeToken: () => false });
    render(createElement(FamilyStories, { deps }));
    await settle();
    expect(byTestId('stories-no-key')).toBeTruthy();
    expect(text()).toMatch(/Life Gallery/);
    expect(text()).toMatch(/no password/i);
    expect(deps.fetchLibraryYears).not.toHaveBeenCalled();
  });

  it('when the NAS does not answer it says so and Retry asks again', async () => {
    let answers = 0;
    const deps = fakeDeps({ fetchLibraryYears: vi.fn(async () => { answers += 1; return answers === 1 ? null : YEARS; }) });
    render(createElement(FamilyStories, { deps }));
    await settle();
    expect(byTestId('stories-unreachable')).toBeTruthy();
    expect(text()).toMatch(/did not answer/);
    click(byTestId('stories-retry'));
    await settle(8);
    expect(byTestId('stories-unreachable')).toBeNull();
    expect(byTestId('stories-chapters')).toBeTruthy();
  });

  it('with an empty library it says so and offers Add a photo', async () => {
    const deps = fakeDeps({ fetchLibraryYears: vi.fn(async () => ({ years: [] })) });
    render(createElement(FamilyStories, { deps }));
    await settle();
    expect(byTestId('stories-empty')).toBeTruthy();
    expect(byTestId('stories-add-photo')).toBeTruthy();
  });

  it('renders a chapter per year with the server\'s counts, and the this-week strip from the loaded months', async () => {
    const deps = fakeDeps();
    render(createElement(FamilyStories, { deps }));
    await settle(10);
    expect(byTestId('stories-chapter-2025')).toBeTruthy();
    expect(byTestId('stories-chapter-2024')).toBeTruthy();
    expect(byTestId('stories-chapter-2023')).toBeTruthy();
    expect(byTestId('stories-chapter-2024').textContent).toContain('2 pictures');
    expect(text()).toContain('5 pictures across 3 years');
    // The strip loaded October of every year (near 21 October), not January.
    const asked = deps.fetchLibrary.mock.calls.map((c) => c[0].month);
    expect(asked).toEqual(expect.arrayContaining(['2025-10', '2024-10', '2023-10']));
    expect(byTestId('stories-week')).toBeTruthy();
    expect(byTestId('stories-week').textContent).toContain('4 pictures');
  });

  it('falls back to probing months when the server has no years route', async () => {
    const deps = fakeDeps({ fetchLibraryYears: vi.fn(async () => ({ years: null, legacy: true })) });
    render(createElement(FamilyStories, { deps }));
    await settle(30);
    expect(byTestId('stories-chapter-2025')).toBeTruthy();
    expect(byTestId('stories-chapter-2024')).toBeTruthy();
    // The probe reaches back 36 months (to November 2023), so an older server
    // shows the last three years honestly and October 2023 is not invented.
    expect(byTestId('stories-chapter-2023')).toBeNull();
    const asked = deps.fetchLibrary.mock.calls.map((c) => c[0].month);
    expect(asked).toContain('2026-10');
    expect(asked).toContain('2023-11');
    expect(asked).not.toContain('2023-10');
  });
});

describe('pictures are added in the plural', () => {
  it('the picker takes many; each is shrunk and sent in turn, and the note counts what landed', async () => {
    const deps = fakeDeps({ uploadPhoto: vi.fn(async (_u, { filename }) => (filename === 'bad.jpg' ? null : { ok: true })) });
    render(createElement(FamilyStories, { deps }));
    await settle(10);
    const input = byTestId('stories-add-photo');
    expect(input.multiple, 'a picker for pictures takes more than one').toBe(true);
    const files = [new File(['a'], 'one.jpg', { type: 'image/jpeg' }), new File(['b'], 'bad.jpg', { type: 'image/jpeg' }), new File(['c'], 'three.jpg', { type: 'image/jpeg' })];
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
    await settle(12);
    expect(deps.compressImageFile).toHaveBeenCalledTimes(3);
    expect(deps.uploadPhoto.mock.calls.map((c) => c[1].filename)).toEqual(['one.jpg', 'bad.jpg', 'three.jpg']);
    expect(deps.uploadPhoto.mock.calls[0][1].dest).toBe('family');
    expect(byTestId('stories-upload-note').textContent).toMatch(/2 pictures saved to the family library; 1 did not reach it/);
  });
});

describe('the story plays and comes back (4)', () => {
  it('advances by itself every FRAME_MS, pauses on request, and Close returns to the chapters', async () => {
    vi.useFakeTimers();
    const deps = fakeDeps();
    render(createElement(FamilyStories, { deps }));
    await settle(10);
    click(byTestId('stories-play-week'));
    await settle();
    expect(byTestId('story-player')).toBeTruthy();
    expect(byTestId('story-caption').textContent).toBe('October 21, 2023 · 3 years ago');
    await act(async () => { vi.advanceTimersByTime(FRAME_MS + 10); });
    expect(byTestId('story-caption').textContent).toBe('October 22, 2024 · 2 years ago');
    click(byTestId('story-pause'));
    await act(async () => { vi.advanceTimersByTime(FRAME_MS * 3); });
    expect(byTestId('story-caption').textContent).toBe('October 22, 2024 · 2 years ago');
    // The listing-size picture was asked for by name, once per frame on screen.
    expect(deps.fetchLibraryPhoto.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['20231021_180000.jpg', '20241022_120000.jpg']));
    click(byTestId('story-close'));
    expect(byTestId('story-player')).toBeNull();
    expect(byTestId('stories-chapters')).toBeTruthy();
  });

  it('a chapter opens to its months, and Play walks the year oldest first', async () => {
    const deps = fakeDeps();
    render(createElement(FamilyStories, { deps }));
    await settle(10);
    click(byTestId('stories-chapter-2024'));
    await settle(10);
    expect(byTestId('stories-year')).toBeTruthy();
    expect(text()).toContain('January, 2024');
    expect(text()).toContain('October, 2024');
    click(byTestId('stories-play-year'));
    await settle();
    expect(byTestId('story-caption').textContent).toBe('January 23, 2024 · 2 years ago');
  });
});
