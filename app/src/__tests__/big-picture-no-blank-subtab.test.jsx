// =============================================================================
// No Big Picture subtab is ever blank (DR-0697; COMPREHENSIVE-REVIEW-STANDARD
// dimension 9, the hollow surface; DR-0691)
// =============================================================================
// Darrell 2026-09-30, over a phone screenshot of an EMPTY Capacity tab:
// "Capacity workflows work?" The panel rendered nothing when no skill profile
// had hours (fixed in PR #1874, DR-0691). DR-0691 pinned Capacity; this pins
// the CLASS: mount Big Picture with an empty household (the state a new family
// meets first), walk every tab and every subtab, and require each innermost
// panel to say something. A panel that renders nothing is a surface that tells
// its user nothing, which is worse than a missing tab because it looks broken.
//
// PROVEN-TO-CATCH (DR-0076 §3): the walker is run against a SectionTabs whose
// one tab renders null and must report exactly that tab.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BigPictureDashboard } from '../components/BigPictureDashboard.jsx';
import SectionTabs from '../components/SectionTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const noop = () => {};
// The empty household: no rows anywhere, the welcome panel dismissed.
const EMPTY = {
  data: { debts: [], accounts: [], transactions: [] },
  totals: { netCashFlow: 0, totalDebt: 0, collectionRate: 0, monthlyIn: 0, monthlyOut: 0 },
  pressure: 0, setPressure: noop, pressureCalc: { extraToDebt: 0 },
  projection: { debtFreeDate: '', debtFreeYears: 0, interestSaved: 0, monthsSaved: 0 },
  rentalSnowball: { allClearedDate: '', allClearedYears: 0, order: [] },
  flaggedRentals: [], flaggedOpportunities: [], entityRollups: [],
  reserves: { recurringMonthly: 0, taxMonthly: 0, incidentMonthly: 0, totalMonthly: 0 },
  upcomingEvents: [], welcomeDismissed: true, dismissWelcome: noop, setView: noop,
  setFeedbackOpen: noop, snowballExtra: 0, bufferTarget: 0, bufferCurrent: 0,
  capexItems: [], watchlist: [], rentals: [], incidents: [], projects: [],
  resolveIncident: noop, skillProfiles: [], addIncident: noop, addProject: noop,
  entities: [], ingestData: null, setBooksView: null, contractors: [], workerOps: {},
  lifePhotos: [], addLifePhotos: noop, updateLifePhoto: noop, deleteLifePhoto: noop,
};

// The words a panel shows of its own, not counting any tab strip inside it.
function ownText(panel) {
  const clone = panel.cloneNode(true);
  clone.querySelectorAll('[role="tablist"]').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

// Visit every tab, deepest first (a subtab strip sits after its parent's strip
// in the DOM, so scanning from the end reaches a parent's subtabs while the
// parent is open). Report every tab whose own panel says nothing.
export function blankTabs(host) {
  const seen = new Set(); const blanks = []; const visited = [];
  for (let guard = 0; guard < 500; guard += 1) {
    const tabs = [...host.querySelectorAll('[role="tab"]')].reverse();
    const next = tabs.find((t) => !seen.has(t.id || t.textContent));
    if (!next) break;
    seen.add(next.id || next.textContent);
    act(() => next.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const label = next.textContent.trim();
    visited.push(label);
    const panelId = next.getAttribute('aria-controls');
    const panel = panelId ? host.ownerDocument.getElementById(panelId) : null;
    if (!panel || ownText(panel).length < 12) blanks.push(label);
  }
  return { visited, blanks };
}

describe('Big Picture: every tab and subtab says something with an empty household', () => {
  it('walks every tab and finds none blank', () => {
    act(() => root.render(createElement(BigPictureDashboard, EMPTY)));
    const { visited, blanks } = blankTabs(container);
    expect(visited.length, 'the walk found the tabs').toBeGreaterThan(3);
    expect(visited).toContain('Capacity');
    expect(blanks, `blank panels: ${blanks.join(', ')}`).toEqual([]);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('reports a tab whose panel renders nothing', () => {
    const sections = [
      { id: 'a', label: 'Says something', render: () => createElement('p', null, 'Here is what this tab measures.') },
      { id: 'b', label: 'Blank one', render: () => null },
    ];
    act(() => root.render(createElement(SectionTabs, { sections, idBase: 'probe' })));
    const { blanks } = blankTabs(container);
    expect(blanks).toEqual(['Blank one']);
  });
});
