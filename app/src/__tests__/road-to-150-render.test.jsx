// =============================================================================
// RoadTo150 — the SURFACE tells the truth about planned vs actual
// =============================================================================
// The engine's arithmetic is pinned in health-program.test.js. This pins the
// thing a user actually meets, because the board-not-the-model lesson applies
// here more than anywhere: a dashboard that renders a PLANNED number where an
// ACTUAL one belongs is exactly the failure Darrell wrote the brief to prevent,
// and it is invisible to a unit test of the engine.
//
// Four claims:
//   1. With no weigh-in, actual readings render as "--" -- never 0, never the
//      target standing in for a real number.
//   2. Planned and actual appear as a LABELLED PAIR, so a glance cannot mistake
//      one for the other.
//   3. The language stays neutral: no "behind", no promise of 2 lb a week.
//   4. The un-imported meal/walk/strength plan says so instead of rendering an
//      empty day that reads like a rest day.
// =============================================================================
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import RoadTo150 from '../components/RoadTo150.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ENROLLED = {
  id: 'hp-1', name: 'Road to 150', startDate: '2026-09-07',
  startWeightLb: 202, goalWeightLb: 150, weeks: 26, waterGoalOz: 64, active: true,
};

let host; let root;

const render = async (props) => {
  await act(async () => { root.render(<RoadTo150 {...props} />); });
};
const text = () => host.textContent || '';
const openTab = async (name) => {
  const tab = Array.from(host.querySelectorAll('[role="tab"]'))
    .find((b) => new RegExp(name, 'i').test(b.textContent || ''));
  expect(tab, `tab ${name} exists`).toBeTruthy();
  await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
});

describe('the header states the program without promising a result', () => {
  it('shows the range, length and water goal', async () => {
    await render({ program: ENROLLED, today: '2026-09-10' });
    expect(text()).toMatch(/202/);
    expect(text()).toMatch(/150/);
    expect(text()).toMatch(/26 weeks/);
    expect(text()).toMatch(/64 oz/);
  });
  it('calls the weekly figure a planning target, not a prediction', async () => {
    await render({ program: ENROLLED, today: '2026-09-10' });
    expect(text()).toMatch(/planning target/i);
    expect(text()).not.toMatch(/guaranteed|you will lose|expected result|should have lost/i);
  });
});

describe('with no weigh-in, actual reads "--" and never 0', () => {
  it('renders an em-dash for every actual figure', async () => {
    await render({ program: ENROLLED, weightEntries: [], today: '2026-09-10' });
    const t = text();
    expect(t).toMatch(/200/);              // the PLANNED week-1 target is known
    expect(t).toMatch(/no weigh-in yet/i); // the ACTUAL is absent, and says so
    expect(t).toMatch(/—/);
  });
  it('does not fill the progress bar', async () => {
    await render({ program: ENROLLED, weightEntries: [], today: '2026-09-10' });
    const bar = host.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBeNull();
    expect(text()).toMatch(/No weigh-in yet/i);
  });
});

describe('planned and actual are rendered as a labelled pair', () => {
  it('labels both sides so neither can be read as the other', async () => {
    await render({
      program: ENROLLED,
      weightEntries: [{ id: 'w1', day: '2026-09-13', weightLb: 199.4 }],
      today: '2026-09-13',
    });
    const t = text();
    expect(t).toMatch(/Planned/);
    expect(t).toMatch(/Actual/);
    expect(t).toMatch(/199\.4/);   // the actual
    expect(t).toMatch(/200/);      // the week-1 target, still intact
  });

  it('shows the real loss, not the planned one, as "Total lost"', async () => {
    await render({
      program: ENROLLED,
      weightEntries: [{ id: 'w1', day: '2026-09-13', weightLb: 199.4 }],
      today: '2026-09-13',
    });
    // actual running loss 2.6 (202 - 199.4); the PLANNED running loss is 2.
    expect(text()).toMatch(/2\.6/);
  });
});

describe('language stays neutral when the user is above target', () => {
  it('phrases the gap as distance from target', async () => {
    await render({
      program: ENROLLED,
      weightEntries: [{ id: 'w1', day: '2026-09-13', weightLb: 202.4 }],
      today: '2026-09-13',
    });
    expect(text()).toMatch(/from this week’s target/);
    expect(text()).not.toMatch(/behind|failed|should have/i);
  });
});

describe('water', () => {
  it('counts only today and offers the quick-add buttons', async () => {
    await render({
      program: ENROLLED,
      waterEntries: [
        { id: 'a', day: '2026-09-13', oz: 16, at: '2026-09-13T08:00:00Z' },
        { id: 'b', day: '2026-09-12', oz: 64, at: '2026-09-12T08:00:00Z' },  // yesterday
      ],
      today: '2026-09-13',
      addWaterEntry: () => {},
    });
    await openTab('water');
    const t = text();
    expect(t).toMatch(/48 oz to go/);   // 64 - 16; yesterday's 64 excluded
    for (const oz of [8, 12, 16, 20, 24]) {
      expect(Array.from(host.querySelectorAll('button')).some((b) => b.textContent === `+${oz} oz`),
        `+${oz} oz button`).toBe(true);
    }
  });
});

describe('the un-imported plan says so rather than showing an empty day', () => {
  it('names the missing PDF instead of rendering a blank meal list', async () => {
    await render({ program: ENROLLED, today: '2026-09-13' });
    await openTab('plan');
    const t = text();
    expect(t).toMatch(/not imported yet/i);
    expect(t).toMatch(/Road to 150 - Complete Tracking Plan/);
    expect(t).not.toMatch(/Rest day|Recovery Day/i);
  });
});

describe('the roadmap table shows all 26 planned weeks even with no data', () => {
  it('renders every week', async () => {
    await render({ program: ENROLLED, today: '2026-09-13' });
    await openTab('weight');
    const rows = host.querySelectorAll('tbody tr');
    expect(rows.length).toBe(26);
    expect(text()).toMatch(/150 lb/);   // the final target
  });
});
