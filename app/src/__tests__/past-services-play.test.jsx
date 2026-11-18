// =============================================================================
// Past services play (DR-1506) — the Worship tab's "Past sermons" row lists the
// channel's own recordings and a tap plays one. Darrell, 2026-11-13, from the
// live door: "Past services don't have any.... fix it". Before this record the
// row was prose about a pipeline and listed nothing (proven to catch: the list
// assertion fails on that render).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { serviceDate } from '../components/ChurchHome.jsx';

vi.mock('../lib/floating-player.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, openFloating: vi.fn() };
});
import { openFloating } from '../lib/floating-player.js';
import { ChurchHome } from '../components/ChurchHome.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const FEED = `<?xml version="1.0"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <entry><yt:videoId>AAAAAAAAAAA</yt:videoId><title>Sunday Worship 11/9/2026</title><published>2026-11-09T17:00:00+00:00</published></entry>
  <entry><yt:videoId>BBBBBBBBBBB</yt:videoId><title>Wednesday Bible Study</title><published>2026-11-05T01:00:00+00:00</published></entry>
  <entry><yt:videoId>CCCCCCCCCCC</yt:videoId><title>Sunday Worship 11/2/2026</title><published>2026-11-02T17:00:00+00:00</published></entry>
</feed>`;

let container, root, fetchSpy;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  openFloating.mockClear();
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (fetchSpy) fetchSpy.mockRestore();
});

const noop = () => {};
const baseProps = {
  church: COLG_DEFAULT_CHURCH,
  prayerRequests: [],
  addPrayerRequest: noop,
  markPrayerRequestSent: noop,
  deletePrayerRequest: noop,
  addEvent: noop,
  conference: null,
  updateConference: noop,
  churchVoice: [],
  addChurchVoice: noop,
  sendToPoeTech: noop,
  addIncident: noop,
  addInquiry: noop,
};
const feedOf = (xml) => {
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    if (String(url).startsWith('/api/church-recent')) return Promise.resolve({ ok: true, text: () => Promise.resolve(xml) });
    return Promise.resolve({ ok: false, text: () => Promise.resolve('') });
  });
};
const mount = async (props = {}) => {
  await act(async () => root.render(createElement(ChurchHome, { ...baseProps, ...props })));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};
const clickTab = (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('Past services play (DR-1506)', () => {
  it('lists every recording the channel feed carries, newest first, with its date', async () => {
    feedOf(FEED);
    await mount();
    clickTab('Past sermons');
    const items = [...container.querySelectorAll('[data-testid="past-services-list"] li')];
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Sunday Worship 11/9/2026');
    expect(items[0].textContent).toContain('Nov 9, 2026');
    expect(items[2].textContent).toContain('Sunday Worship 11/2/2026');
    // each row also opens on YouTube, in a new tab
    const yt = items[1].querySelector('a[href="https://www.youtube.com/watch?v=BBBBBBBBBBB"]');
    expect(yt).toBeTruthy();
    expect(yt.getAttribute('target')).toBe('_blank');
    expect(container.querySelector('[data-testid="past-services-empty"]')).toBeNull();
  });

  it('a tap plays that service: the mini-player opens on it and the Live now player switches to it', async () => {
    feedOf(FEED);
    await mount();
    clickTab('Past sermons');
    const play = container.querySelector('[data-testid="past-service-BBBBBBBBBBB"]');
    expect(play).toBeTruthy();
    act(() => play.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(openFloating).toHaveBeenCalledTimes(1);
    const arg = openFloating.mock.calls[0][0];
    expect(arg.src).toContain('/embed/BBBBBBBBBBB');
    expect(arg.title).toBe('Wednesday Bible Study');
    clickTab('Live now');
    const frame = container.querySelector('iframe');
    expect(frame).toBeTruthy();
    expect(frame.getAttribute('src')).toContain('/embed/BBBBBBBBBBB');
  });

  it('an empty feed says so plainly and names the channel; nothing is painted', async () => {
    feedOf('');
    await mount();
    clickTab('Past sermons');
    expect(container.querySelector('[data-testid="past-services-list"]')).toBeNull();
    const empty = container.querySelector('[data-testid="past-services-empty"]');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toMatch(/did not come back/);
    expect(empty.querySelector('a[target="_blank"]')).toBeTruthy();
  });

  it('the door to the full library opens The Word — Migdal', async () => {
    feedOf(FEED);
    const setChurchView = vi.fn();
    await mount({ setChurchView });
    clickTab('Past sermons');
    act(() => container.querySelector('[data-testid="past-services-library"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(setChurchView).toHaveBeenCalledWith('pulpit');
  });

  it('serviceDate reads an ISO date and stays empty on garbage', () => {
    expect(serviceDate('2026-11-09T17:00:00+00:00')).toBe('Nov 9, 2026');
    expect(serviceDate('')).toBe('');
    expect(serviceDate('not a date')).toBe('');
  });
});
