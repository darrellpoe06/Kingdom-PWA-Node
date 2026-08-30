// =============================================================================
// Admin -> Systems carries Loop Health, wired to the REAL data
// =============================================================================
// The Systems panel is "the operations view that used to live scattered across
// other tabs -- now one place the steward reaches from Admin." It gathered the
// delivery lane, the database, Ari's brain, the pipelines and the network, but
// NOT the one panel that answers "is the app still looping?" -- LoopHealth was
// mounted only under Projects, a tab the steward may never open.
//
// Two things are pinned here, and the second is the one that matters (DR-0076):
//
//   1. THE PANEL IS THERE. Opening Admin -> Systems renders Loop Health.
//
//   2. IT READS REAL DATA, NOT AN EMPTY OBJECT. LoopHealth defaults `data` to
//      {}, and an empty object makes EVERY loop report "never updated from real
//      data" -- a painted PROBLEM state that is a lie when the loops are in fact
//      fresh. The shell already handed AdminConsole `data` and the console threw
//      it away; mounting the panel without threading it would have shipped that
//      lie. This test fails if the wiring regresses to the default.
//
// Sibling panels are stubbed: each self-fetches live state at runtime and none
// of them is what this test is about. LoopHealth itself is the real component.
// =============================================================================
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

vi.mock('../components/OpsBoard.jsx', () => ({ default: () => <div data-stub="ops" /> }));
vi.mock('../components/DbHealth.jsx', () => ({ default: () => <div data-stub="db" /> }));
vi.mock('../components/LlmHealth.jsx', () => ({ default: () => <div data-stub="llm" /> }));
vi.mock('../components/WorkflowStatus.jsx', () => ({ default: () => <div data-stub="workflow" /> }));
vi.mock('../components/NetworkStatus.jsx', () => ({ default: () => <div data-stub="network" /> }));

import AdminConsole from '../components/AdminConsole.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A ledger transaction dated today makes the 'Transaction ledger' loop FRESH
// (staleDays 45). With the wiring broken it reads "never updated" instead.
const today = new Date().toISOString().slice(0, 10);
const DATA = { transactions: [{ date: today, amount: 10 }], loopDecisions: {} };

let host; let root;

const openSystems = async (props) => {
  await act(async () => {
    root.render(<AdminConsole isGovernor email="darrellpoe06@gmail.com" {...props} />);
  });
  const tab = Array.from(host.querySelectorAll('[role="tab"]'))
    .find((b) => /systems/i.test(b.textContent || ''));
  expect(tab, 'Admin has a Systems section tab').toBeTruthy();
  await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  return host.textContent || '';
};

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.clearAllMocks();
});

describe('Admin -> Systems shows whether the app is still looping', () => {
  it('renders the Loop Health panel', async () => {
    const text = await openSystems({ data: DATA });
    expect(text).toMatch(/Loop Health/i);
    expect(text).toMatch(/Is the app actually looping\?/i);
  });

  it('assesses the REAL loops, not an empty-data default', async () => {
    const text = await openSystems({ data: DATA });
    // The ledger loop has a transaction dated today -> it is updating.
    expect(text).toMatch(/Transaction ledger/i);
    expect(text).toMatch(/updating/i);
  });

  it('PROVEN-TO-CATCH: unthreaded data paints every loop as never-updated', async () => {
    // This is exactly what mounting <LoopHealth /> without the data prop does.
    // If someone drops the wiring, the panel reports a false problem state.
    const text = await openSystems({ data: {} });
    expect(text).toMatch(/never updated from real data/i);
  });
});
