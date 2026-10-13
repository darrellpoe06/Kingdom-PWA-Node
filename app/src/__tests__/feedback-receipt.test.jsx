// =============================================================================
// The receipt — what the person who SENT the feedback gets back.
//
// Darrell, 2026-09-11, mid-demo to the COLG leadership, after submitting a note
// with his email typed into a free-text box:
//   "I put my email in there as close to get a link back. I'm not getting the
//    link in my email... Can you screenshot and send it to text it to me?"
// And, on what he tells people once an issue is known:
//   "This is a known issue. We know about it. We are in the process of working
//    on it. Please be patient with us."
//
// There is no mail transport in this app. These pin the honest alternative: a
// stable reference code handed over immediately, a status the sender can read,
// and copy that never claims an email is coming.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  receiptCode, receiptStatus, receiptMessage, mineOnly, RECEIPT_STATES,
} from '../lib/feedback-receipt.js';
import { FeedbackModal } from '../components/FeedbackCenter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('receiptCode — a reference you can read aloud or photograph', () => {
  it('is stable for the same row, forever, with no server', () => {
    expect(receiptCode('fb-1757600000000')).toBe(receiptCode('fb-1757600000000'));
  });

  it('differs between rows', () => {
    const codes = new Set(Array.from({ length: 500 }, (_, i) => receiptCode(`fb-${1757600000000 + i}`)));
    expect(codes.size).toBeGreaterThan(480); // no meaningful collision at demo scale
  });

  it('avoids the characters people mis-read off a screenshot', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(receiptCode(`fb-${i}`)).not.toMatch(/[01OIL]/);
    }
  });

  it('reads as two short groups, not a wall of characters', () => {
    expect(receiptCode('fb-1')).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  });

  it('is empty (not "undefined") for a row with no id', () => {
    expect(receiptCode(null)).toBe('');
    expect(receiptCode('')).toBe('');
  });
});

describe('receiptStatus — the sender is told the truth about their note', () => {
  const give = (id, who) => ({ id, userId: who, text: 'the give button is broken' });

  it('says "we have it" and does not dress it up, when nothing has happened', () => {
    const s = receiptStatus({ id: 'a', text: 'something odd here' }, null);
    expect(s.key).toBe('received');
    expect(s.detail).toMatch(/not a brush-off/);
  });

  it('says KNOWN ISSUE, with the real number of other people, when it repeats', () => {
    const all = [give('a', 'u1'), give('b', 'u2'), give('c', 'u3')];
    const s = receiptStatus(all[0], all);
    expect(s.key).toBe('known');
    expect(s.othersCount).toBe(2);
    expect(s.detail).toMatch(/2 other people have reported this/);
    expect(s.detail).toMatch(/the ones the most people hit get fixed first/);
  });

  it('says "person has" for exactly one other, not "1 people have"', () => {
    const all = [give('a', 'u1'), give('b', 'u2')];
    expect(receiptStatus(all[0], all).detail).toMatch(/1 other person has reported this/);
  });

  it('never claims others reported it when nobody did', () => {
    const all = [give('a', 'u1'), { id: 'z', userId: 'u9', text: 'I love the bus page' }];
    const s = receiptStatus(all[1], all);
    expect(s.key).toBe('received');
    expect(s.othersCount).toBe(0);
  });

  it('reports in-progress and fixed off the real triage status', () => {
    expect(receiptStatus({ id: 'a', text: 'x', triageStatus: 'in-progress' }).key).toBe('working');
    expect(receiptStatus({ id: 'a', text: 'x', triageStatus: 'resolved' }).key).toBe('fixed');
    expect(receiptStatus({ id: 'a', text: 'x', triage_status: 'done' }).key).toBe('fixed');
  });

  it('invites a fixed-but-not-really note back instead of closing the door', () => {
    expect(RECEIPT_STATES.fixed.detail).toMatch(/still happening for you, send another note/);
  });

  it('survives junk without throwing', () => {
    expect(receiptStatus(null).key).toBe('received');
    expect(receiptStatus({ id: 'a', text: 'x' }, 'not-an-array').key).toBe('received');
  });
});

describe('receiptMessage — it says plainly that no email is coming', () => {
  const msg = receiptMessage('fb-123');
  it('carries the code', () => expect(msg.body).toContain(msg.code));
  it('states the absence of email rather than leaving it to be discovered', () => {
    expect(msg.body).toMatch(/do not send email/i);
  });
  it('says where the status actually lives', () => {
    expect(msg.body).toMatch(/Your feedback/);
  });
});

describe('mineOnly — the slice a sender is entitled to see', () => {
  it('takes their own rows, newest first', () => {
    const rows = [
      { id: 'a', mine: true, createdAt: '2026-09-01' },
      { id: 'b', mine: false, createdAt: '2026-09-05' },
      { id: 'c', userId: 'u1', createdAt: '2026-09-09' },
    ];
    expect(mineOnly(rows, 'u1').map((r) => r.id)).toEqual(['c', 'a']);
  });
  it('is empty, not broken, with nothing to show', () => {
    expect(mineOnly(null)).toEqual([]);
    expect(mineOnly([{ id: 'x', mine: false }])).toEqual([]);
  });
});

describe('the real modal hands over the receipt', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const fill = () => {
    const love = Array.from(container.querySelectorAll('button')).find((b) => /Love it/.test(b.textContent));
    act(() => love.click());
  };
  const submit = () => act(() => {
    Array.from(container.querySelectorAll('button')).find((b) => /Submit Feedback/.test(b.textContent)).click();
  });

  it('shows the code instead of vanishing, and never promises an email', () => {
    let closed = false;
    act(() => root.render(createElement(FeedbackModal, {
      onClose: () => { closed = true; },
      onSubmit: () => ({ id: 'fb-777', mine: true, createdAt: '2026-09-11' }),
      currentView: 'church', myFeedback: [],
    })));
    fill(); submit();
    expect(closed).toBe(false);
    expect(container.textContent).toContain('Your reference');
    expect(container.textContent).toContain(receiptCode('fb-777'));
    expect(container.textContent).toMatch(/do not send email/i);
  });

  it('tells the sender their note is a KNOWN issue when others hit it too', () => {
    const board = [
      { id: 'fb-777', mine: true, createdAt: '2026-09-11', text: 'the give button is broken' },
      { id: 'fb-778', userId: 'u2', createdAt: '2026-09-11', text: "give button doesn't work" },
      { id: 'fb-779', userId: 'u3', createdAt: '2026-09-11', text: 'give button broken' },
    ];
    act(() => root.render(createElement(FeedbackModal, {
      onClose() {}, onSubmit: () => board[0], currentView: 'church', myFeedback: board,
    })));
    fill(); submit();
    expect(container.textContent).toContain('Known issue');
    expect(container.textContent).toMatch(/2 other people have reported this/);
  });

  it('falls back to closing when the host gives back no stored row (no invented code)', () => {
    let closed = false;
    act(() => root.render(createElement(FeedbackModal, {
      onClose: () => { closed = true; }, onSubmit: () => undefined, currentView: 'church', myFeedback: [],
    })));
    fill(); submit();
    expect(closed).toBe(true);
    expect(container.textContent).not.toContain('Your reference');
  });

  it('the form itself no longer implies a reply is coming', () => {
    act(() => root.render(createElement(FeedbackModal, {
      onClose() {}, onSubmit() {}, currentView: 'church', myFeedback: [],
    })));
    expect(container.textContent).toMatch(/reference code to keep/);
    expect(container.textContent).toMatch(/don.t send email about feedback/);
  });
});
