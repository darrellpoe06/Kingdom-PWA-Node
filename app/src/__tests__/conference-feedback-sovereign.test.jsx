// =============================================================================
// ConferenceModule feedback — SOVEREIGN write proof (DR-0218 zero-n8n / DR-0076).
// =============================================================================
// The Bishop's-feedback box used to POST /n8n/webhook/family-feedback. It now
// writes straight to the Supabase `feedback` table via the tested uploadFeedback
// sync path (RLS-gated). These prove, by mounting the REAL component in jsdom:
//   1. submitting calls uploadFeedback with the typed message (NOT fetch/n8n);
//   2. a successful upload shows the "Received" confirmation;
//   3. a signed-out no-op ({skipped}) degrades to the honest "offline" line,
//      matching this surface's own saveConference posture — never a crash.
// Proven-to-catch: it FAILS if the feedback path regresses back to an n8n fetch
// (fetch is stubbed to throw) or stops routing through uploadFeedback.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({ upload: vi.fn(() => Promise.resolve({ uploaded: true })) }));

vi.mock('../lib/feedback-sync.js', () => ({ uploadFeedback: h.upload }));
vi.mock('../lib/conference-sync.js', () => ({
  getConferenceAccess: () => Promise.resolve({ signedIn: false, canSee: false, canEdit: false }),
  subscribeConferences: () => () => {},
  saveConference: () => Promise.resolve({ skipped: true }),
}));

import { ConferenceModule } from '../components/ConferenceModule.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ConferenceModule));
  });
}
function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  h.upload.mockReset();
  h.upload.mockResolvedValue({ uploaded: true });
  // Any accidental n8n fetch must fail the test loudly, not pass silently.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('n8n fetch is forbidden here'))));
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  vi.unstubAllGlobals();
});

async function submitFeedback(text) {
  const ta = container.querySelector('textarea[aria-label="Feedback for the build team"]');
  expect(ta).toBeTruthy();
  await act(async () => { type(ta, text); });
  const btn = [...container.querySelectorAll('button')].find((b) => /Send feedback/i.test(b.textContent));
  expect(btn).toBeTruthy();
  await act(async () => { btn.click(); });
}

describe('conference feedback writes to Supabase, not n8n', () => {
  it('routes the typed message through uploadFeedback and confirms', async () => {
    await mount();
    await submitFeedback('We need a printable program');
    expect(h.upload).toHaveBeenCalledTimes(1);
    expect(h.upload.mock.calls[0][0].text).toBe('We need a printable program');
    expect(fetch).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/Received/i);
  });

  it('signed-out upload no-op degrades to the honest offline line (no crash)', async () => {
    h.upload.mockResolvedValue({ skipped: 'signed-out' });
    await mount();
    await submitFeedback('Add a kids track');
    expect(h.upload).toHaveBeenCalledTimes(1);
    expect(container.textContent).toMatch(/Couldn’t reach PoeTech|please mention it to Darrell/i);
  });
});
