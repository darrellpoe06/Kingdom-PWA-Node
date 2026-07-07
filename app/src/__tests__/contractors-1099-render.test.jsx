// =============================================================================
// Contractors1099 — render proof for the worker-manager + worker-voice additions
// (2026-07-05 mandate: "we need the system to be our 1099 workers managers and
// also hear their perspectives on operations"). Mounts the REAL component in
// jsdom and pins the honesty rules (DR-0076 / Reality-Trace):
//   - no incidents prop (the shell's k1099 mount today) -> the honest note, and
//     NO painted "Open work orders" state;
//   - incidents provided -> the real open orders per worker, resolved excluded;
//   - worker-voice draft is never swallowed: a signed-out submit keeps the words
//     and says why (the Engagement MessageThread rule).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/supabase.js', () => ({
  default: {},
  // Fire signed-out immediately, like the real onAuthChange does with no session.
  onAuthChange: (cb) => { cb(null); return () => {}; },
}));

const uploadFeedback = vi.fn(async () => ({ skipped: 'signed-out' }));
const subscribeFeedback = vi.fn(() => () => {});
vi.mock('../lib/feedback-sync.js', () => ({
  uploadFeedback: (...a) => uploadFeedback(...a),
  subscribeFeedback: (...a) => subscribeFeedback(...a),
}));

import Contractors1099 from '../components/Contractors1099.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Contractors1099, props));
  });
}

// The 1099 surface now flows as SectionTabs ("sliding tabs instead of a long
// scroll", Darrell 2026-07-04): only the ACTIVE panel is mounted, so a section
// that lives on another tab is reached by clicking its tab first. This helper
// clicks a tab in the strip by its visible label (the ChurchHome pattern).
const clickTab = (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  return act(async () => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  uploadFeedback.mockClear();
});

const isaiah = { id: 'k1', direction: 'outbound', type: 'contractor', name: 'Isaiah Ramos', role: 'plumber', phone: '217-555-0142', email: 'isaiah@example.com', ytdPaid: 4200, status: 'active' };
const baseProps = {
  contractors: [isaiah],
  entities: [{ id: 'e-personal', name: 'Personal' }],
  addContractor: () => {}, updateContractor: () => {}, deleteContractor: () => {},
};

describe('Contractors1099 — worker manager honesty', () => {
  it('without an incidents prop: honest note, no painted open-order state, real YTD still shown', async () => {
    await mount(baseProps);
    expect(container.textContent).toContain("Open work orders per worker aren't shown here yet");
    expect(container.textContent).not.toContain('Open work orders ·');
    expect(container.textContent).toContain('$4,200'); // real ytdPaid
    // one-tap follow-up affordances from the real contact
    expect(container.querySelector('a[href^="sms:"]')).toBeTruthy();
    expect(container.querySelector('a[href^="tel:"]')).toBeTruthy();
    expect(container.querySelector('a[href^="mailto:"]')).toBeTruthy();
  });

  it('with incidents provided: shows this worker\'s real open orders, excludes resolved', async () => {
    const incidents = [
      { id: 'in1', status: 'open', description: 'Furnace blowing cold air', dueDate: '2026-07-08', dispatch: { assignments: [{ id: 'a1', contractorId: 'k1', name: 'Isaiah Ramos', status: 'assigned', dispatchedAt: '2026-07-01T10:00:00Z' }] } },
      { id: 'in2', status: 'resolved', description: 'Old resolved leak', dispatch: { assignments: [{ id: 'a2', contractorId: 'k1', name: 'Isaiah Ramos', status: 'done' }] } },
    ];
    await mount({ ...baseProps, incidents });
    expect(container.textContent).toContain('Open work orders · 1');
    expect(container.textContent).toContain('Furnace blowing cold air');
    expect(container.textContent).not.toContain('Old resolved leak');
    // one-tap follow-up about the specific job
    const followUp = [...container.querySelectorAll('a')].find(a => /Text about this job/i.test(a.textContent));
    expect(followUp).toBeTruthy();
    expect(followUp.getAttribute('href')).toContain('sms:2175550142');
    expect(decodeURIComponent(followUp.getAttribute('href'))).toContain('Furnace blowing cold air');
  });
});

describe('Contractors1099 — worker voice never swallows the words', () => {
  it('renders the capture + honest empty state, and a signed-out submit keeps the draft with the reason', async () => {
    await mount(baseProps);
    await clickTab('Worker voice');
    expect(container.textContent).toContain('Worker voice · operations');
    expect(container.textContent).toContain('No worker perspectives on this device');

    const select = container.querySelector('#wv-worker');
    const textarea = container.querySelector('#wv-said');
    const button = [...container.querySelectorAll('button')].find(b => /Record worker voice/i.test(b.textContent));
    expect(select && textarea && button).toBeTruthy();

    const setValue = async (el, value) => act(async () => {
      const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLTextAreaElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await setValue(select, 'k1');
    await setValue(textarea, 'The lockbox codes keep changing on us');
    await act(async () => { button.click(); });

    expect(uploadFeedback).toHaveBeenCalledTimes(1);
    const [record, meta] = uploadFeedback.mock.calls[0];
    expect(record.area).toBe('worker-ops');
    expect(record.text).toContain('Isaiah Ramos (plumber)');
    expect(record.text).toContain('The lockbox codes keep changing on us');
    expect(meta.activeTab).toBe('worker-ops');

    // signed-out: draft retained, reason shown, nothing appended to the list
    expect(textarea.value).toBe('The lockbox codes keep changing on us');
    expect(container.textContent).toContain('Sign in (top of the page) to record this');
    expect(container.textContent).toContain('No worker perspectives on this device');
  });

  it('refuses to fabricate: submit with nothing said shows validation, no upload', async () => {
    await mount(baseProps);
    await clickTab('Worker voice');
    const button = [...container.querySelectorAll('button')].find(b => /Record worker voice/i.test(b.textContent));
    await act(async () => { button.click(); });
    expect(uploadFeedback).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Pick the worker and write what they said.');
  });
});
