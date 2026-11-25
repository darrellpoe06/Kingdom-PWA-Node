// DR-1660: the WCAG 2.1 AA statement every app carries, and its honesty.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import AccessibilityStatement from '../components/shell/AccessibilityStatement.jsx';
import { WCAG, STATEMENT, barrierReportText, sendBarrierReport } from '../lib/accessibility-statement.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('the accessibility statement (DR-1660)', () => {
  it('names WCAG 2.1 AA, links the W3C standard, and says what is not yet proven', () => {
    act(() => root.render(<AccessibilityStatement send={async () => ({ ok: true })} />));
    expect(container.textContent).toContain('WCAG 2.1 Level AA');
    expect(container.querySelector(`a[href="${WCAG.url}"]`)).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="a11y-not-yet"] li').length).toBeGreaterThan(0);
  });
  it('never claims full compliance', () => {
    const all = [STATEMENT.goal, ...STATEMENT.measured, ...STATEMENT.notYet].join(' ').toLowerCase();
    expect(all).not.toMatch(/fully (compliant|accessible)|100%|meets all/);
  });
  it('its page count is the legibility guard’s own measured count', () => {
    const h = JSON.parse(readFileSync(resolve(__dirname, '../lib/legibility-health.json'), 'utf8'));
    const { pages, passing } = h.summary;
    expect(STATEMENT.measured.join(' ')).toContain(`${passing} of ${pages} pages pass`);
    if (pages > passing) expect(STATEMENT.notYet.join(' ')).toContain(`${pages - passing} pages`);
  });
  it('a barrier report rides the feedback pipe and reports what really happened', async () => {
    const sent = [];
    expect(await sendBarrierReport('Cannot read the gold text', { where: 'x', upload: async (i) => (sent.push(i), { uploaded: true }) })).toEqual({ ok: true });
    expect(sent[0].text).toBe(barrierReportText('Cannot read the gold text', 'x'));
    expect(await sendBarrierReport('a', { upload: async () => ({ skipped: 'signed-out' }) })).toEqual({ ok: false, why: 'sign-in' });
    expect(await sendBarrierReport('a', { upload: async () => ({ skipped: 'insert-error' }) })).toEqual({ ok: false, why: 'failed' });
  });
});
