// =============================================================================
// The outcome on the screen (DR-0625): what the sender reads for each category,
// the reply that re-enters intake, and the steward's categorized queue with
// each note's basis. Rendered, not read from source.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import IntakeOutcomeList, { senderFixOf, tallyText } from '../components/IntakeOutcomeList.jsx';
import { FeedbackModal, FeedbackPromotePanel, mergeMine } from '../components/FeedbackCenter.jsx';
import { receiptCode } from '../lib/feedback-receipt.js';
import { shotsHeading } from '../components/FeedbackScreenshots.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const LEDGER = { ok: true, items: [
  ...['choir schedule rehearsal', 'bus ministry routes drivers', 'books ledger accounts', 'harvest transcripts captions', 'voice studio consent', 'rentals leases tenants', 'giving statements deposits', 'kitchen inventory counts', 'scripture library themes', 'site health uptime', 'tax ingest documents', 'forecast scenarios cash']
    .map((t, i) => ({ id: `DR-07${String(i).padStart(2, '0')}`, title: `The ${t} decision`, status: 'accepted', decision: `The ${t} work is kept as decided.` })),
  { id: 'DR-0900', title: 'Feedback receipts stay in the app, no email transport for feedback', status: 'accepted', decision: 'The app does not send email about feedback. The receipt code is the reference.' },
] };
const merges = [0.2, 0.4, 0.5, 0.6, 1].map((h, i) => ({ number: i, branch: 'claude/x', createdAt: '2026-09-24T00:00:00Z', mergedAt: new Date(Date.parse('2026-09-24T00:00:00Z') + h * 3600000).toISOString() }));

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (el) => act(() => root.render(el));
const text = () => container.textContent;
const byTestId = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('the sender reads each outcome', () => {
  const notes = [
    { id: 'a', createdAt: '2026-09-24T05:00:00Z', text: 'Not working: typo on the bus page title', triageStatus: 'fixed', outcomeNote: 'The bus page title is spelled right.', outcomeRef: '#1800' },
    { id: 'b', createdAt: '2026-09-24T04:00:00Z', text: 'Missing: please send an email receipt for my feedback through a mail transport' },
    { id: 'c', createdAt: '2026-09-24T03:00:00Z', text: 'Not working: my transactions disappeared after reload', which_tab: 'books' },
    { id: 'd', createdAt: '2026-09-24T02:00:00Z', text: 'Not working: hmm' },
    { id: 'e', createdAt: '2026-09-24T01:00:00Z', text: '[Learn engagement] band=adult signal=started' },
  ];
  it('fixed with what changed, already decided with the reason and the record, on the board with owner and measured window, asked for one thing', () => {
    render(createElement(IntakeOutcomeList, { notes, ledger: LEDGER, delivery: { merges } }));
    const labels = byTestId('intake-outcome-label').map((n) => n.textContent);
    expect(labels).toEqual(['Fixed', 'Already decided', 'On the board', 'We need one thing from you']);
    expect(text()).toContain('What changed: The bus page title is spelled right.');
    expect(byTestId('receipt-reason')[0].textContent).toBe('Reason: The app does not send email about feedback.');
    expect(byTestId('intake-outcome-cite')[0].textContent).toMatch(/DR-0900/);
    expect(text()).toMatch(/Carried by: The PoeTech stewards/);
    expect(byTestId('intake-outcome-window')[0].textContent).toMatch(/measured over the last 5 merged/);
    expect(text()).toContain('A little more: where in the app, and what happened?');
  });
  it('telemetry is never shown to a person as their note', () => {
    render(createElement(IntakeOutcomeList, { notes: [notes[4]], ledger: LEDGER }));
    expect(container.innerHTML).toBe('');
  });
  it('without a delivery record the window says it has none, never a painted one', () => {
    render(createElement(IntakeOutcomeList, { notes: [notes[2]], ledger: LEDGER }));
    expect(byTestId('intake-outcome-window')[0].textContent).toMatch(/No timeline yet/);
  });
  it('the sender’s fix state is read from their own note', () => {
    expect(senderFixOf({ triageStatus: 'in-progress', outcomeRef: '#12' })).toEqual({ status: 'opened', prNumber: 12 });
    expect(senderFixOf({ intakeBasis: { kind: 'fix-failed' } })).toEqual({ status: 'failed' });
    expect(senderFixOf({ triageStatus: 'new' })).toBeNull();
  });
});

describe('the modal: the sender’s notes come back live, and a reply re-enters intake', () => {
  const remote = [{ id: 'r1', mine: true, createdAt: '2026-09-24T05:00:00Z', text: 'Not working: typo on the bus page title', triageStatus: 'fixed', outcomeNote: 'Spelled right.' }];
  const deps = { fetchMine: async () => ({ ok: true, items: remote }), fetchDelivery: async () => ({ ok: true, merges }) };
  it('merges live notes with local ones not yet stored, newest first', () => {
    const m = mergeMine(remote, [{ id: 'r1', createdAt: 'x' }, { id: 'l1', createdAt: '2026-09-24T06:00:00Z' }]);
    expect(m.map((n) => n.id)).toEqual(['l1', 'r1']);
  });
  it('shows the earlier notes with outcomes on the form, and Reply carries replyTo into the next note', async () => {
    let sent = null;
    await act(async () => { root.render(createElement(FeedbackModal, { onClose() {}, onSubmit: (x) => { sent = x; return { id: 'n2' }; }, currentView: 'church', myFeedback: [], outcomeDeps: deps })); });
    expect(text()).toMatch(/Your earlier feedback \(1\): where each one stands/);
    expect(text()).toContain('What changed: Spelled right.');
    act(() => button(/Reply to this/).click());
    expect(byTestId('feedback-replying')[0].textContent).toContain(receiptCode('r1'));
    act(() => button(/Love it/).click());
    act(() => button(/Submit Feedback/).click());
    expect(sent.replyTo).toBe('r1');
  });
  it('a plain note carries no replyTo', async () => {
    let sent = null;
    await act(async () => { root.render(createElement(FeedbackModal, { onClose() {}, onSubmit: (x) => { sent = x; return { id: 'n3' }; }, currentView: 'church', myFeedback: [], outcomeDeps: deps })); });
    act(() => button(/Love it/).click());
    act(() => button(/Submit Feedback/).click());
    expect(sent.replyTo).toBeUndefined();
  });
});

describe('your earlier feedback is easy to find: the fold says tap to open, tallies where each stands, and every note is reachable (DR-0740)', () => {
  // Darrell, 2026-10-01, on the box that showed only a heading: "Can users see
  // their feedback logs... can I see them?!!! Where are they and what's what?"
  const many = Array.from({ length: 11 }, (_, i) => ({
    id: `m${i}`, mine: true, createdAt: `2026-09-2${i % 9}T0${i % 9}:00:00Z`, text: `Not working: typo number ${i} on the bus page title`,
    triageStatus: i < 3 ? 'fixed' : 'new', outcomeNote: i < 3 ? 'Spelled right.' : '',
  }));
  const deps = { fetchMine: async () => ({ ok: true, items: many }), fetchDelivery: async () => ({ ok: true, merges }) };
  const openFold = () => {
    const d = byTestId('feedback-earlier')[0];
    act(() => { d.open = true; d.dispatchEvent(new Event('toggle', { bubbles: false })); });
  };
  it('closed, the fold carries the arrow, "tap to open", and the tally of where every note stands', async () => {
    await act(async () => { root.render(createElement(FeedbackModal, { onClose() {}, onSubmit: () => ({ id: 'x' }), currentView: 'church', myFeedback: [], outcomeDeps: deps })); });
    const fold = byTestId('feedback-earlier-fold')[0];
    expect(fold.textContent).toContain('▸');
    expect(fold.textContent).toContain('Your earlier feedback (11): where each one stands');
    expect(fold.textContent).toContain('tap to open');
    expect(fold.getAttribute('aria-expanded')).toBe('false');
    // A typo note is the system's own small fix (lib/intake-outcome), so the eight new ones read as being fixed.
    expect(byTestId('feedback-earlier-tally')[0].textContent).toBe('8 being fixed by the system · 3 fixed');
  });
  it('opened, it says tap to close, shows the first eight, and Show more brings the rest', async () => {
    await act(async () => { root.render(createElement(FeedbackModal, { onClose() {}, onSubmit: () => ({ id: 'x' }), currentView: 'church', myFeedback: [], outcomeDeps: deps })); });
    openFold();
    const fold = byTestId('feedback-earlier-fold')[0];
    expect(fold.textContent).toContain('▾');
    expect(fold.textContent).toContain('tap to close');
    expect(fold.getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('intake-outcome').length).toBe(8);
    expect(byTestId('intake-outcomes-count')[0].textContent).toContain('Showing 8 of 11');
    const more = byTestId('intake-outcomes-more')[0];
    expect(more.textContent).toContain('Show 3 more');
    act(() => more.click());
    expect(byTestId('intake-outcome').length).toBe(11);
    expect(byTestId('intake-outcomes-count')[0].textContent).toContain('Showing 11 of 11');
    expect(byTestId('intake-outcomes-more').length).toBe(0);
  });
  it('PROVEN-TO-CATCH: with eight notes or fewer there is no Show more, and the tally reads only what the notes say', () => {
    render(createElement(IntakeOutcomeList, { notes: many.slice(0, 8), ledger: LEDGER }));
    expect(byTestId('intake-outcomes-more').length).toBe(0);
    expect(byTestId('intake-outcomes-count').length).toBe(0);
    expect(tallyText(many.slice(0, 2), { ledger: LEDGER })).toBe('2 fixed');
    expect(tallyText([], { ledger: LEDGER })).toBe('');
  });
});

describe('the steward sees the categorized queue with each note’s basis', () => {
  const feedback = [
    { id: 'f1', createdAt: '2026-09-24T05:00:00Z', whatsNot: 'typo on the bus page title', area: 'church-bus' },
    { id: 'f2', createdAt: '2026-09-24T04:00:00Z', whatsNot: 'please send an email receipt for my feedback through a mail transport' },
    { id: 'f3', createdAt: '2026-09-24T03:00:00Z', text: '[Learn engagement] band=adult signal=started' },
    { id: 'f4', createdAt: '2026-09-24T02:00:00Z', whatsNot: 'my transactions disappeared after reload' },
  ];
  const panel = () => render(createElement(FeedbackPromotePanel, { feedback, ledger: LEDGER, addProject() {}, addIncident() {}, deleteFeedback() {} }));
  it('counts every category, telemetry kept apart from people’s notes', () => {
    panel();
    expect(byTestId('intake-filter-people')[0].textContent).toMatch(/All from people · 3/);
    expect(byTestId('intake-filter-fix')[0].textContent).toMatch(/· 1$/);
    expect(byTestId('intake-filter-decided')[0].textContent).toMatch(/· 1$/);
    expect(byTestId('intake-filter-work')[0].textContent).toMatch(/· 1$/);
    expect(byTestId('intake-filter-signal')[0].textContent).toMatch(/· 1$/);
  });
  it('the focused note shows its category, its basis, and what the sender reads', () => {
    panel();
    const basis = byTestId('intake-basis')[0].textContent;
    expect(basis).toMatch(/Low-hanging fruit/);
    expect(basis).toMatch(/Basis: Fix rule "wording"/);
    expect(basis).toMatch(/The sender reads: Being fixed by the system/);
  });
  it('a category filter shows only its notes, and the already-decided note names its record', () => {
    panel();
    act(() => byTestId('intake-filter-decided')[0].click());
    expect(byTestId('intake-basis')[0].textContent).toMatch(/Matches DR-0900/);
    expect(byTestId('intake-basis')[0].textContent).toMatch(/The app does not send email about feedback/);
  });
});

describe('the steward sees the pictures inside the app (DR-0742)', () => {
  // Darrell 2026-10-01, on a focused note that read "5 SCREENSHOTS ATTACHED
  // (OPEN ON THE SUBMITTER'S DEVICE OR IN SUPABASE)": "Can't see the
  // information submitted?!!! Make it work so we can see inside the app!!!"
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const withShots = [{ id: 'f9', createdAt: '2026-09-24T05:00:00Z', whatsNot: 'the give button is under the bar', area: 'church', hasScreenshot: true, screenshotCount: 2, screenshots: [] }];
  const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  it('a focused note with pictures the list did not carry fetches them once and shows each one, a tap from full size', async () => {
    const fetchImages = vi.fn(async () => ({ screenshots: [PNG, PNG] }));
    render(createElement(FeedbackPromotePanel, { feedback: withShots, ledger: LEDGER, addProject() {}, addIncident() {}, deleteFeedback() {}, fetchImages }));
    await flush();
    expect(fetchImages).toHaveBeenCalledTimes(1);
    expect(fetchImages).toHaveBeenCalledWith('f9');
    expect(byTestId('feedback-shots')[0].getAttribute('data-state')).toBe('ready');
    expect(text()).not.toMatch(/submitter's device|in Supabase/i);
    const thumbs = byTestId('feedback-shot');
    expect(thumbs.length).toBe(2);
    act(() => thumbs[1].click());
    const open = document.querySelector('[data-testid="feedback-shot-open"]');
    expect(open.textContent).toContain('Screenshot 2 of 2');
    expect(open.querySelector('img').getAttribute('src')).toBe(PNG);
    expect(document.querySelector('[data-testid="feedback-shot-save"]').getAttribute('download')).toBe('feedback-f9-2.jpg');
  });
  it('a failed fetch says so and Try again fetches again; it never reads as "no pictures"', async () => {
    let calls = 0;
    const fetchImages = vi.fn(async () => { calls += 1; return calls === 1 ? { screenshots: [] } : { screenshots: [PNG] }; });
    render(createElement(FeedbackPromotePanel, { feedback: withShots, ledger: LEDGER, addProject() {}, addIncident() {}, deleteFeedback() {}, fetchImages }));
    await flush();
    expect(byTestId('feedback-shots-failed').length).toBe(1);
    expect(byTestId('feedback-shots')[0].textContent).toContain('2 screenshots');
    act(() => byTestId('feedback-shots-retry')[0].click());
    await flush();
    expect(fetchImages).toHaveBeenCalledTimes(2);
    expect(byTestId('feedback-shot').length).toBe(1);
  });
  it('PROVEN-TO-CATCH: a note without pictures fetches nothing and draws nothing; a local row with bytes needs no fetch', async () => {
    const fetchImages = vi.fn(async () => ({ screenshots: [PNG] }));
    render(createElement(FeedbackPromotePanel, { feedback: [{ id: 'f1', createdAt: '2026-09-24T05:00:00Z', whatsNot: 'typo on the bus page title' }], ledger: LEDGER, addProject() {}, addIncident() {}, deleteFeedback() {}, fetchImages }));
    await flush();
    expect(fetchImages).not.toHaveBeenCalled();
    expect(byTestId('feedback-shots').length).toBe(0);
    render(createElement(FeedbackPromotePanel, { feedback: [{ id: 'f2', createdAt: '2026-09-24T05:00:00Z', whatsNot: 'the give button is under the bar', screenshots: [PNG] }], ledger: LEDGER, addProject() {}, addIncident() {}, deleteFeedback() {}, fetchImages }));
    await flush();
    expect(fetchImages).not.toHaveBeenCalled();
    expect(byTestId('feedback-shot').length).toBe(1);
    expect(shotsHeading(1)).toBe('Screenshot');
    expect(shotsHeading(5)).toBe('5 screenshots');
  });
});
