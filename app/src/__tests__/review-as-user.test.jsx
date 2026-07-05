// review-as-user — the admin "see it exactly as a user" lens (Darrell 2026-07-05:
// "give us a users view that mimics the users identically so we can test like a
// review after pushing to production"). Pins the three properties that make the
// lens safe and honest:
//   1. the effective gate math — reviewing forces the family/governor flag FALSE,
//      and only for someone who really holds it (a stranger can't "review" into it);
//   2. the exit is always reachable — the banner renders whenever the lens is on,
//      and Exit review really clears it;
//   3. the shell wiring — the monolith gates through useReviewGate and mounts the
//      banner OUTSIDE the gated chrome, and Admin carries the entry card.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isReviewingAsUser, setReviewAsUser, useReviewGate, ReviewAsUserBanner, ReviewAsUserAction,
} from '../components/ReviewAsUser.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function Probe({ real }) {
  const [effective, reviewing] = useReviewGate(real);
  return createElement('div', { id: 'probe', 'data-effective': String(effective), 'data-reviewing': String(reviewing) });
}

let container, root;
beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  setReviewAsUser(false);
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(el));
}
const probe = () => container.querySelector('#probe');

describe('the review lens flag', () => {
  it('toggles and persists on the device', () => {
    expect(isReviewingAsUser()).toBe(false);
    setReviewAsUser(true);
    expect(isReviewingAsUser()).toBe(true);
    setReviewAsUser(false);
    expect(isReviewingAsUser()).toBe(false);
  });

  it('forces the EFFECTIVE family flag false while reviewing — and back, live', () => {
    mount(createElement(Probe, { real: true }));
    expect(probe().getAttribute('data-effective')).toBe('true');
    expect(probe().getAttribute('data-reviewing')).toBe('false');
    act(() => setReviewAsUser(true));   // fires the change event → the hook re-renders
    expect(probe().getAttribute('data-effective')).toBe('false');
    expect(probe().getAttribute('data-reviewing')).toBe('true');
    act(() => setReviewAsUser(false));
    expect(probe().getAttribute('data-effective')).toBe('true');
  });

  it('never grants anything: a non-family user stays false either way', () => {
    setReviewAsUser(true);
    mount(createElement(Probe, { real: false }));
    expect(probe().getAttribute('data-effective')).toBe('false');
    // reviewing reports false for a stranger — the banner is a governor tool.
    expect(probe().getAttribute('data-reviewing')).toBe('false');
  });
});

describe('the exit is always reachable', () => {
  it('renders the pinned banner with an Exit review control when active', () => {
    const html = renderToStaticMarkup(createElement(ReviewAsUserBanner, { active: true }));
    expect(html).toMatch(/Review mode/i);
    expect(html).toMatch(/Exit review/i);
    expect(renderToStaticMarkup(createElement(ReviewAsUserBanner, { active: false }))).toBe('');
  });

  it('Exit review actually clears the lens', () => {
    setReviewAsUser(true);
    mount(createElement(ReviewAsUserBanner, { active: true }));
    const btn = [...container.querySelectorAll('button')].find((b) => /exit review/i.test(b.textContent));
    act(() => btn.click());
    expect(isReviewingAsUser()).toBe(false);
  });

  it('the entry card enters review mode on tap', () => {
    mount(createElement(ReviewAsUserAction));
    const btn = [...container.querySelectorAll('button')].find((b) => /enter review mode/i.test(b.textContent));
    act(() => btn.click());
    expect(isReviewingAsUser()).toBe(true);
  });
});

describe('shell + Admin wiring (static pins)', () => {
  const mono = read('poe-financial-mvp-v28.jsx');

  it('the monolith derives the family flag THROUGH the lens', () => {
    expect(mono).toMatch(/const \[isFamilyMember, reviewingAsUser\] = useReviewGate\(isFamilyEmail\(authSession\?\.user\?\.email\)\)/);
    // No second, un-lensed assignment may exist (a bypass would leak governor chrome).
    expect(mono.match(/const isFamilyMember\s*=/g)).toBeNull();
  });

  it('the banner mounts OUTSIDE the gated chrome (before the header)', () => {
    expect(mono).toMatch(/<ReviewAsUserBanner active=\{reviewingAsUser\} \/>/);
    expect(mono.indexOf('<ReviewAsUserBanner')).toBeLessThan(mono.indexOf('<header'));
  });

  it('Admin > Actions carries the entry card', () => {
    const admin = read('components/AdminConsole.jsx');
    expect(admin).toMatch(/<ReviewAsUserAction \/>/);
  });
});
