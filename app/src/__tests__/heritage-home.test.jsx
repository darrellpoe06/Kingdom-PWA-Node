// =============================================================================
// The Heritage redesign, Phase 3: the home reads records, the verse is the
// Word as the app ships it (DR-1046; DR-0061; DR-0076)
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recentActivity, lifecycleEntries, agoLabel } from '../lib/home-activity.js';
import HomeHero, { HERO_VERSE } from '../components/shell/HomeHero.jsx';
import LifeHub from '../components/LifeHub.jsx';
import { DM_UNREAD_EVENT } from '../lib/notify-readiness.js';
import { __resetHomePrefs } from '../lib/home-view-prefs.js';
import { THEME_CSS } from '../lib/theme-css.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

describe('home-activity: Recent Activity is read from records, never painted', () => {
  it('is empty for an empty world, and says nothing else', () => {
    expect(recentActivity({})).toEqual([]);
    expect(recentActivity({ incidents: [], projects: [], notes: [], lifePhotos: [], goals: [], dailyFocus: [] })).toEqual([]);
  });

  it('merges incidents, projects, notes, photos, goals and finished focus items, newest first, capped', () => {
    const world = {
      incidents: [{ id: 'i1', title: 'Kitchen plumbing', status: 'open', createdAt: '2026-10-10T10:00:00Z', lifecycle: { log: [{ at: '2026-10-12T10:00:00Z', toPhase: 'in-progress', note: 'crew assigned' }] } }],
      projects: [{ id: 'p1', title: 'Schema v2', status: 'active', lifecycle: { log: [{ at: '2026-10-11T10:00:00Z', toPhase: 'active', note: 'created' }] } }],
      notes: [{ id: 'n1', text: 'Call the roofer about the estimate', createdAt: '2026-10-14T08:00:00Z' }],
      lifePhotos: [{ id: 'ph1', caption: 'Sunday after service', category: 'Family', date: '2026-10-13' }],
      goals: [{ id: 'g1', title: 'Finish the lesson series', status: 'active', createdAt: '2026-10-09T10:00:00Z' }],
      dailyFocus: [{ id: 'f1', label: 'Move my body', done: true, day: '2026-10-15' }, { id: 'f2', label: 'Not done', done: false, day: '2026-10-15' }],
    };
    const rows = recentActivity(world, { limit: 10 });
    expect(rows.map((r) => r.kind)).toEqual(['focus', 'note', 'photo', 'incident', 'project', 'goal']);
    expect(rows[3]).toMatchObject({ title: 'Kitchen plumbing', sub: 'in-progress · crew assigned', view: 'overview' });
    expect(rows[4].sub).toBe('active'); // 'created' is not repeated as news
    expect(rows.find((r) => r.kind === 'focus').title).toBe('Move my body');
    expect(recentActivity(world, { limit: 2 })).toHaveLength(2);
    expect(recentActivity(world, { limit: 0 })).toHaveLength(6);
  });

  it('never invents a time: a record with no date is left out', () => {
    expect(lifecycleEntries([{ id: 'x', title: 'no dates' }], { kind: 'incident', view: 'overview' })).toEqual([]);
    expect(recentActivity({ notes: [{ id: 'n', text: 'undated' }] })).toEqual([]);
  });

  it('labels age honestly, including date-only stamps', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    expect(agoLabel('2026-10-15T11:58:00Z', now)).toBe('2m ago');
    expect(agoLabel('2026-10-15T09:00:00Z', now)).toBe('3h ago');
    expect(agoLabel('2026-10-13T09:00:00Z', now)).toBe('2d ago');
    expect(agoLabel('2026-10-14', now)).toBe('yesterday');
    expect(agoLabel('', now)).toBe('');
  });
});

describe('HomeHero: the name is the profile\'s and the verse is the Word the app ships', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('the verse text is byte-identical to public/bible/kjv (never from memory, DR-0076)', () => {
    const prov = JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', 'Proverbs.json'), 'utf8'));
    const flat = JSON.stringify(prov);
    expect(flat).toContain(JSON.stringify(HERO_VERSE.text).slice(1, -1));
    expect(HERO_VERSE.ref).toBe('Proverbs 4:23');
    expect(HERO_VERSE.translation).toBe('KJV');
  });

  it('greets by first name, and without a name greets the home rather than a blank', () => {
    act(() => root.render(createElement(HomeHero, { name: 'Christina Poe' })));
    expect(container.querySelector('[data-testid="home-hero-name"]').textContent).toBe('Christina');
    expect(container.textContent).toContain('Welcome back,');
    act(() => root.render(createElement(HomeHero, { name: '' })));
    expect(container.querySelector('[data-testid="home-hero-name"]')).toBeNull();
    expect(container.textContent).toContain('Welcome home.');
    expect(container.querySelector('[data-testid="home-hero-verse"]').textContent).toContain(HERO_VERSE.text);
  });

  it('carries no inline hex on text and no stock image', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'shell', 'HomeHero.jsx'), 'utf8');
    expect(src).not.toMatch(/style=\{\{[^}]*color:\s*'#/);
    expect(src).not.toMatch(/<img/);
    expect(src).not.toMatch(/unsplash|pexels|http/i);
  });
});

describe('LifeHub wears the finish and still reads only records', () => {
  let container, root;
  const world = { incidents: [], projects: [], notes: [], lifePhotos: [], goals: [], dailyFocus: [], inflows: { rentals: [{ id: 'r1' }, { id: 'r2' }] } };
  beforeEach(() => { __resetHomePrefs(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  const render = (props = {}) => act(() => root.render(createElement(LifeHub, { data: world, setData: () => {}, setView: () => {}, setChurchView: () => {}, welcomeName: 'Christina', ...props })));

  it('shows the banner, the six tiles, Focus, Goals, Quick Actions, Recent Messages and Recent Activity', () => {
    render();
    expect(container.querySelector('[data-testid="home-hero"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="home-hero-name"]').textContent).toBe('Christina');
    const nav = container.querySelector('nav[aria-label="Life Hub"]');
    expect(nav.querySelectorAll('button')).toHaveLength(6);
    for (const h of ["Today's Focus", 'My Goals', 'Quick Actions', 'Recent Messages', 'Recent Activity']) expect(container.textContent).toContain(h);
  });

  it('paints no number: the only count is the real door count, and Recent Messages waits for the watcher', () => {
    render();
    // Real Estate reads 2 doors from the record; Projects reads 0 open projects
    // (a real zero from a real list, lib/life-hub.js); the other four have no
    // record to read and draw nothing.
    const badges = [...container.querySelectorAll('nav[aria-label="Life Hub"] [aria-label$="on record"]')];
    expect(badges.map((b) => b.textContent)).toEqual(['2', '0']);
    expect(container.querySelector('[data-testid="hub-messages-body"]').textContent).toMatch(/Nothing unread/);
    expect(container.querySelector('[data-testid="hub-activity"]').textContent).toMatch(/Nothing recorded yet/);
    act(() => { window.dispatchEvent(new CustomEvent(DM_UNREAD_EVENT, { detail: { prev: 0, next: 3, visible: true, newest: { senderName: 'Darrell', at: new Date().toISOString() } } })); });
    const body = container.querySelector('[data-testid="hub-messages-body"]').textContent;
    expect(body).toContain('Darrell');
    expect(body).toContain('3 unread messages');
  });

  it('Recent Activity rows open the surface the record lives on', () => {
    const calls = [];
    render({ data: { ...world, notes: [{ id: 'n1', text: 'Roofer estimate', createdAt: '2026-10-14T08:00:00Z' }] }, setView: (v) => calls.push(v) });
    const row = [...container.querySelectorAll('[data-testid="hub-activity"] button')].find((b) => b.textContent.includes('Roofer estimate'));
    expect(row).toBeTruthy();
    act(() => { row.click(); });
    expect(calls).toEqual(['notes']);
  });

  it('every tile fill and action fill is a class token with a midnight twin (no inline hex)', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'LifeHub.jsx'), 'utf8');
    const css = THEME_CSS;
    expect(src).not.toMatch(/backgroundColor:\s*'#/);
    const fills = [...new Set([...src.matchAll(/bg-\[#([0-9A-F]{6})\]/g)].map((m) => m[1]))];
    for (const hex of fills) {
      if (hex === 'E8E4DC' || hex === 'FAF8F4') continue; // base literals, remapped by every theme already
      expect(css, `midnight twin for bg-#${hex}`).toContain(`[data-theme="midnight"] .bg-\\[\\#${hex}\\]`);
    }
  });
});
