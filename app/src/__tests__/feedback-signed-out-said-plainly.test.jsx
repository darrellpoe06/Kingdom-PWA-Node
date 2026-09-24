// =============================================================================
// Feedback, signed out, said plainly (DR-0625). Signed out, a feedback note is
// kept on this device only — no steward can read it — so the receipt must say
// that, not "your note is in" with a status that will never move.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const session = { current: null };
vi.mock('../lib/supabase.js', () => {
  const client = { auth: { getSession: () => Promise.resolve({ data: { session: session.current } }) } };
  return { default: client, supabase: client };
});

const { FeedbackModal } = await import('../components/FeedbackCenter.jsx');
const { receiptCode } = await import('../lib/feedback-receipt.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the Feedback receipt tells a signed-out sender the truth', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const send = async () => {
    act(() => root.render(createElement(FeedbackModal, {
      onClose() {}, onSubmit: () => ({ id: 'fb-901', mine: true, createdAt: '2026-09-24' }), currentView: 'church', myFeedback: [],
    })));
    act(() => Array.from(container.querySelectorAll('button')).find((b) => /Love it/.test(b.textContent)).click());
    await act(async () => {
      Array.from(container.querySelectorAll('button')).find((b) => /Submit Feedback/.test(b.textContent)).click();
      await Promise.resolve(); await Promise.resolve();
    });
  };

  it('signed out: kept on this device only, and says how to reach a steward', async () => {
    session.current = null;
    await send();
    expect(container.textContent).toContain('Kept on this device only.');
    expect(container.textContent).toMatch(/no one has read it yet/);
    expect(container.textContent).not.toContain('your note is in');
    expect(container.textContent).toContain(receiptCode('fb-901'));
  });

  it('signed in: the ordinary receipt, unchanged', async () => {
    session.current = { user: { id: 'u1' } };
    await send();
    expect(container.textContent).toContain('your note is in');
    expect(container.textContent).not.toContain('Kept on this device only.');
  });
});
