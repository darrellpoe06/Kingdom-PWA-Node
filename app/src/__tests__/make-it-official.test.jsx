// =============================================================================
// make-it-official — proven-to-catch (DR-0076 §3), DR-1076
// =============================================================================
// The failure that matters is a step reading DONE with no paper behind it. So
// every rule is fed the case that would break it:
//   • an empty shelf reads 0 done, and the three "this week" steps read READY
//   • paper of the wrong type, on the wrong shelf, or dated before the plan
//     started proves nothing (a 2018 annual report is history, not step 2)
//   • a later step WAITS, naming the step it waits on, until that step's paper
//     exists — and the screen changes when it does
//   • every evidence type is a real option in the Business picker, or the step
//     could never be completed
//   • the entity's status is never painted (the IpRegisterPanel rule, kept)
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { OfficialStepsPanel } from '../components/Legal.jsx';
import {
  EVIDENCE, OFFICIAL_STEPS, PHASES, PLAN_STARTED, officialProgress, officialSteps, proofFor, stepById,
} from '../lib/make-it-official.js';
import { categoryById, documentShape } from '../lib/legal-documents.js';

const paper = (docType, over = {}) => documentShape({
  category: 'business', docType, label: `${docType} paper`, privileged: true, whereFiled: 'fire safe', dateOf: '2026-10-20', ...over,
});

describe('the steps', () => {
  it('every evidence type is an option the Business picker actually offers', () => {
    const offered = categoryById('business').docTypes;
    for (const s of OFFICIAL_STEPS) expect(offered, s.id).toContain(s.evidence);
    expect(Object.values(EVIDENCE).every((e) => offered.includes(e))).toBe(true);
  });

  it('every step names who, why and how, sits in a known phase, and requires only earlier steps', () => {
    const phaseIds = PHASES.map((p) => p.id);
    OFFICIAL_STEPS.forEach((s, i) => {
      expect(s.who && s.why && s.how, s.id).toBeTruthy();
      expect(phaseIds).toContain(s.phase);
      for (const r of s.requires) {
        expect(stepById(r), `${s.id} requires ${r}`).toBeTruthy();
        expect(OFFICIAL_STEPS.findIndex((x) => x.id === r)).toBeLessThan(i);
      }
    });
  });

  it('an empty shelf: nothing done, the three this-week steps ready, everything else waiting', () => {
    const p = officialProgress([]);
    expect(p.done).toBe(0);
    expect(p.ready.map((r) => r.id)).toEqual(['standing', 'agent', 'counsel']);
    expect(p.rows.filter((r) => r.state === 'waiting').length).toBe(OFFICIAL_STEPS.length - 3);
  });
});

describe('only real paper proves a step', () => {
  it('REFUSES the wrong type, the wrong shelf, and paper older than the plan', () => {
    expect(proofFor(EVIDENCE.agent, [paper('Operating agreement')])).toBeNull();
    expect(proofFor(EVIDENCE.agent, [paper(EVIDENCE.agent, { category: 'personal' })])).toBeNull();
    // The 2018 annual report is history, not "registered agent chosen".
    expect(proofFor(EVIDENCE.agent, [paper(EVIDENCE.agent, { dateOf: '2018-05-01' })])).toBeNull();
    expect(proofFor(EVIDENCE.agent, [paper(EVIDENCE.agent, { dateOf: PLAN_STARTED })])).toBeTruthy();
  });

  it('a later step waits on the step it requires, and moves the moment that paper lands', () => {
    const before = officialSteps([paper(EVIDENCE.standing)]);
    const reinstate = before.find((r) => r.id === 'reinstated');
    expect(reinstate.state).toBe('waiting');
    expect(reinstate.waitingOn.map((w) => w.id)).toEqual(['agent']);
    const after = officialSteps([paper(EVIDENCE.standing), paper(EVIDENCE.agent)]);
    expect(after.find((r) => r.id === 'reinstated').state).toBe('ready');
    expect(after.find((r) => r.id === 'assignment').state).toBe('waiting');
  });

  it('done is done even if the step it waits on is not (the paper is the fact)', () => {
    const rows = officialSteps([paper(EVIDENCE.assignment)]);
    expect(rows.find((r) => r.id === 'assignment').state).toBe('done');
  });
});

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(OfficialStepsPanel, props)); });
}
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (container) container.remove();
  root = null; container = null;
});
const text = () => document.body.textContent || '';
const btn = (re) => [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent || ''));

describe('OfficialStepsPanel renders the derived truth', () => {
  it('an empty shelf reads 0 of 10 and names step 1 as next', async () => {
    await mount({ docs: [] });
    expect(text()).toMatch(new RegExp(`0 of ${OFFICIAL_STEPS.length} steps have their paper on the shelf`));
    expect(text()).toMatch(/Next to work: step 1/);
  });

  it('DERIVES the headline: three papers move it to 3 and the next step to 4', async () => {
    await mount({ docs: [paper(EVIDENCE.standing), paper(EVIDENCE.agent), paper(EVIDENCE.counsel)] });
    expect(text()).toMatch(/3 of 10 steps have their paper on the shelf/);
    expect(text()).toMatch(/Next to work: step 4/);
    await act(async () => { btn(/show all 10 steps/i).click(); });
    expect(text()).toMatch(/Proof on the shelf: “Engagement letter — counsel paper”, dated 2026-10-20/);
    expect(text()).toMatch(/Waits on step 4/);
  });

  it('says whose shelf it reads, and never paints the entity status', async () => {
    await mount({ docs: [] });
    expect(text()).toMatch(/This reads your shelf/i);
    expect(text()).toMatch(/never claims to know it/i);
    expect(text()).not.toMatch(/involuntary dissolution/i);
    expect(text()).not.toMatch(/05947103/);
  });
});
