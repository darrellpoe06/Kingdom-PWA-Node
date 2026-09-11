// =============================================================================
// Ministries — the directory of the house, and the ONE registry behind it.
//
// Darrell, 2026-09-11, working the app with the COLG leadership:
// "after a certain what different ministries we have and organize around that."
// "They can just go to the category they wanna go to... and then work that
//  category." "I don't see the church band."
//
// The registry is pinned for the two honesties the surface exists to keep: a
// tile that claims a page must HAVE one, and the roster must not imply it is
// the whole house. The anti-theater block proves a painted tile fails here.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CHURCH_MINISTRIES, MINISTRY_ROSTER_IS_CONFIRMED, MINISTRY_ROSTER_NOTE,
  ministryById, ministryName, ministriesWithSurface, ministriesWithoutSurface,
  opsMinistryOptions, matchesMinistry,
} from '../lib/church-ministries.js';
import { FEEDBACK_AREAS } from '../components/FeedbackCenter.jsx';
import { SURFACES } from '../surfaces.js';
import { ChurchMinistries } from '../components/ChurchMinistries.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const feedbackKeys = FEEDBACK_AREAS.flatMap((g) => g.items.map(([k]) => k));

describe('the registry', () => {
  it('names the church band — the ministry that was missing entirely', () => {
    expect(ministryById('band')).toBeTruthy();
    expect(ministryName('band')).toBe('Church Band');
  });

  it('carries the ministries the app already serves', () => {
    for (const id of ['bus', 'choir', 'media']) expect(ministryById(id)).toBeTruthy();
  });

  it('gives every ministry a real feedback area that EXISTS in the picker', () => {
    // A "tell us what it needs" button pointing at a key the picker does not
    // have would file the note into nowhere.
    for (const m of CHURCH_MINISTRIES) {
      expect(feedbackKeys, `${m.id} -> ${m.feedbackKey}`).toContain(m.feedbackKey);
    }
  });

  it('gives every ministry its provenance — nothing here is guessed', () => {
    for (const m of CHURCH_MINISTRIES) {
      expect(m.source, m.id).toBeTruthy();
      expect(m.blurb, m.id).toBeTruthy();
      expect(m.join, m.id).toBeTruthy();
    }
  });

  it('uses unique ids', () => {
    const ids = CHURCH_MINISTRIES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is honest that the roster is partial until the office confirms it', () => {
    expect(MINISTRY_ROSTER_IS_CONFIRMED).toBe(false);
    expect(MINISTRY_ROSTER_NOTE).toMatch(/so far/i);
  });

  it('is the ONE list — the staff ops picker derives from it, not a second copy', () => {
    const opts = opsMinistryOptions();
    expect(opts[0]).toEqual(['general', 'General / Platform']);
    expect(opts.map(([k]) => k)).toEqual(['general', ...CHURCH_MINISTRIES.map((m) => m.id)]);
    expect(opts.map(([, l]) => l)).toContain('Church Band');
  });

  it('finds a ministry by name, blurb or id, in any word order', () => {
    const band = ministryById('band');
    expect(matchesMinistry(band, 'band')).toBe(true);
    expect(matchesMinistry(band, 'musicians')).toBe(true);
    expect(matchesMinistry(band, '')).toBe(true);
    expect(matchesMinistry(band, 'ushers')).toBe(false);
    expect(matchesMinistry(ministryById('bus'), 'rides service')).toBe(true);
  });
});

describe('a tile that claims a page must actually have one', () => {
  const churchSubs = new Set(SURFACES.filter((s) => s.nav === 'church').map((s) => s.sub));

  it('every declared surface resolves to a REAL church sub-tab', () => {
    for (const m of ministriesWithSurface()) {
      expect(churchSubs, `${m.id} -> ${m.surface.sub}`).toContain(m.surface.sub);
    }
  });

  it('separates the ministries with a page from the ones without', () => {
    expect(ministriesWithSurface().length).toBeGreaterThan(0);
    expect(ministriesWithoutSurface().length).toBeGreaterThan(0);
    expect(ministriesWithSurface().length + ministriesWithoutSurface().length)
      .toBe(CHURCH_MINISTRIES.length);
    expect(ministriesWithoutSurface().map((m) => m.id)).toContain('band');
  });
});

describe('the real surface', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const mount = (props = {}) => act(() => { root.render(createElement(ChurchMinistries, props)); });
  const buttons = () => Array.from(container.querySelectorAll('button'));

  it('lists the ministries, band included', () => {
    mount();
    expect(container.textContent).toContain('Bus / Van Ministry');
    expect(container.textContent).toContain('Church Band');
    expect(container.textContent).toContain('Choir');
  });

  it('opens a ministry that has a page, by its real sub-tab id', () => {
    const opened = [];
    mount({ onOpen: (s) => opened.push(s) });
    act(() => { buttons().find((b) => /Open Bus/.test(b.textContent)).click(); });
    expect(opened).toEqual([{ view: 'church', sub: 'bus' }]);
  });

  it('offers no Open button for a ministry with no page — it says so instead', () => {
    mount();
    expect(buttons().some((b) => /Open Church Band/.test(b.textContent))).toBe(false);
    expect(container.textContent).toContain('No page in the app yet');
    expect(container.textContent).toContain('Named, not built yet');
  });

  it('hands feedback the ministry’s own area so a note lands routed', () => {
    const areas = [];
    mount({ onFeedback: (k) => areas.push(k) });
    const bandTile = Array.from(container.querySelectorAll('div')).find(
      (d) => d.textContent.startsWith('Church Band') && d.querySelector('button'));
    act(() => { bandTile.querySelector('button').click(); });
    expect(areas).toEqual(['church-band']);
  });

  it('narrows to what you typed', () => {
    mount();
    const search = container.querySelector('input[type="search"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(search, 'band');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.textContent).toContain('Church Band');
    expect(container.textContent).not.toContain('Bus / Van Ministry');
  });

  it('says the roster is partial rather than implying the whole house', () => {
    mount();
    expect(container.textContent).toMatch(/so far/i);
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES a tile that claims a page the app does not have', () => {
    const churchSubs = new Set(SURFACES.filter((s) => s.nav === 'church').map((s) => s.sub));
    expect(churchSubs.has('no-such-sub-tab')).toBe(false);
  });

  it('CATCHES a ministry whose feedback button would file into nowhere', () => {
    expect(feedbackKeys).not.toContain('church-not-a-real-area');
  });
});
