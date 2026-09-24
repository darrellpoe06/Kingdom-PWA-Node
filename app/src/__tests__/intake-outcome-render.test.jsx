// =============================================================================
// The outcome on the screen (DR-0622): what the sender reads for each category,
// the reply that re-enters intake, and the steward's categorized queue with
// each note's basis. Rendered, not read from source.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import IntakeOutcomeList, { senderFixOf } from '../components/IntakeOutcomeList.jsx';
import { FeedbackModal, FeedbackPromotePanel, mergeMine } from '../components/FeedbackCenter.jsx';
import { receiptCode } from '../lib/feedback-receipt.js';

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
