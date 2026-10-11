// =============================================================================
// An application is answered, and the person is verified without an ID
// (DR-0903 + DR-0945)
// =============================================================================
// WRITTEN THE WAY DARRELL DEMANDED ON 2026-10-10: "Testing needs to be
// respected!!! Undermining ways!!!" He was right, and the lesson behind that
// sentence governs this whole file.
//
// The gate I first wrote for the Apply button was
// `expect(source).toMatch(/onClick=\{\(\) => onApply\(/)` — grepping my own
// diff back at myself. It asserts I typed some characters. It would have
// passed with the handler wired to the wrong record, with the form never
// opening, with the button disabled. Worse, an OLDER suite had covered that
// very screen and passed for years because two controls shared one label and
// it kept finding the working one. A label is not an identity, and a source
// string is not a behaviour.
//
// So: EVERY case here mounts the surface and clicks it. Controls are addressed
// by data-testid, never by shared label text. The supabase client is a fake
// that behaves like the real tables — including 0272's refusals — so the cases
// exercise the actual rules rather than a mock that agrees with me.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

import {
  CORROBORATION_ITEM_IDS, corroborationLeft, corroborationByItem,
  decisionReadyWithChecks, decisionReady,
} from '../modules/properties/model.js';

// ---------------------------------------------------------------------------
// A fake that ENFORCES, so a case can fail for the right reason.
// ---------------------------------------------------------------------------
const db = { applications: [], checks: [] };
let nextId = 1;
const uid = 'user-owner-944';

/** 0272's trigger, in JavaScript: a decision needs every item attempted. */
function corroborationTriggerRefuses(applicationId, status, reason) {
  if (status !== 'approved' && status !== 'declined') return null;
  if (!reason || reason.trim().length < 10) return null; // 0152 speaks first
  const mine = db.checks.filter((c) => c.application_id === applicationId);
  const left = CORROBORATION_ITEM_IDS.filter((i) => !mine.some((c) => c.item === i));
  return left.length ? { message: `this application has not been checked yet — still to do: ${left.join(', ')}` } : null;
}

function table(name) {
  const api = {
    _rows: name === 'rental_applications' ? db.applications : db.checks,
    _filters: [],
    select() { return api; },
    eq(col, val) { api._filters.push([col, val]); return api; },
    order() {
      const rows = api._rows.filter((r) => api._filters.every(([c, v]) => r[c] === v));
      return Promise.resolve({ data: rows, error: null });
    },
    insert(row) {
      const built = { id: `row-${nextId++}`, checked_at: new Date().toISOString(), ...row };
      if (name === 'application_checks') {
        // 0272's CHECK on free text.
        if (built.heard && /[0-9]{3}-[0-9]{2}-[0-9]{4}/.test(built.heard)) {
          return { select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'check violation' } }) }) };
        }
        db.checks.push(built);
      }
      return { select: () => ({ single: () => Promise.resolve({ data: built, error: null }) }) };
    },
    update(patch) {
      return {
        eq(_col, id) {
          const row = db.applications.find((a) => a.id === id);
          if (!row) return Promise.resolve({ error: { message: 'no row' } });
          const refusal = corroborationTriggerRefuses(id, patch.status, patch.decision_reason);
          if (refusal) return Promise.resolve({ error: refusal });
          Object.assign(row, patch);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return api;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: (name) => table(name),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: uid } } }) },
  },
  phoneLoginEmail: () => '',
}));

const { default: ApplicationsTab } = await import('../modules/properties/ApplicationsTab.jsx');

// ---------------------------------------------------------------------------
// The repo's own mounting idiom — createRoot + act, addressing by data-testid.
// No testing-library here; 342 suites in this app use exactly this.
// ---------------------------------------------------------------------------
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;

async function settle(n = 10) {
  for (let i = 0; i < n; i += 1) await act(async () => { await Promise.resolve(); });
}

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ApplicationsTab, { rentalId: 'door-1', doorName: '805 Apt 2' }));
  });
  await settle();
}

const at = (id) => container.querySelector(`[data-testid="${id}"]`);
const allAt = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const need = (id) => {
  const el = at(id);
  expect(el, `no element with data-testid="${id}"`).toBeTruthy();
  return el;
};

const tap = async (id) => {
  const el = need(id);
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle(6);
};

/** Set a controlled field's value the way React will actually observe it. */
const setValue = async (id, value) => {
  const el = need(id);
  const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype
    : el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  await act(async () => {
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
  await settle(4);
};

const text = () => container.textContent || '';

const APP_ID = 'app-1';
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});
beforeEach(() => {
  db.applications = [{
    id: APP_ID,
    instance_id: 'inst-1',
    rental_id: 'door-1',
    applicant_name: 'A Hopeful Neighbour',
    applicant_phone: '217-555-0172',
    answers: { 'applicant.firstName': 'Hope' },
    status: 'submitted',
    decision_reason: null,
    decided_at: null,
    created_at: '2026-10-09T15:00:00Z',
  }];
  db.checks = [];
  nextId = 1;
});


/** Work the whole list through the UI, the way a person actually would. */
async function workTheList(outcome = 'confirmed') {
  for (const id of CORROBORATION_ITEM_IDS) {
    await tap(`check-open-${id}`);
    await setValue(`check-outcome-${id}`, outcome);
    await tap(`check-save-${id}`);
  }
}

describe('the application that nobody could see', () => {
  it('shows the person who asked — the dead letter has a reader', async () => {
    await mount();
    expect(need('application-name').textContent).toContain('A Hopeful Neighbour');
  });

  it('says nobody applied only when nobody applied', async () => {
    db.applications = [];
    await mount();
    expect(at('applications-empty')).toBeTruthy();
  });
});

describe('a decision cannot be recorded on a blank list', () => {
  it('PROVEN-TO-CATCH: the save stays disabled while items are unchecked, and they are named', async () => {
    await mount();
    await setValue('decision-status', 'approved');
    await setValue('decision-reason', 'Income and references both looked fine to me.');

    expect(at('decision-blocked'), 'nothing told him what was left to check').toBeTruthy();
    expect(need('decision-save').disabled).toBe(true);
    // It names them rather than saying "incomplete".
    expect(need('decision-blocked').textContent).toMatch(/last landlord/i);
  });

  it('lets the decision through once every item has been ATTEMPTED', async () => {
    await mount();
    await workTheList('confirmed');

    await setValue('decision-status', 'approved');
    await setValue('decision-reason', 'Income shown and consistent; address and reference both confirmed.');
    expect(need('decision-save').disabled).toBe(false);

    await tap('decision-save');
    expect(at('decision-said'), `no confirmation. Saw: ${text().slice(0, 300)}`).toBeTruthy();
    expect(db.applications[0].status).toBe('approved');
  });

  it('ATTEMPTED, never PASSED — six "could not reach" is a complete list', async () => {
    // The case that keeps this from becoming a score. A landlord who rang
    // everybody and got nobody has done the work; he may decide, and the fact
    // that nobody answered is what is written down.
    await mount();
    await workTheList('could-not-reach');

    await setValue('decision-status', 'declined');
    await setValue('decision-reason', 'No reference or employer could be reached after repeated attempts.');
    expect(need('decision-save').disabled).toBe(false);

    await tap('decision-save');
    expect(db.applications[0].status).toBe('declined');
  });
});

describe('nobody is shut out by arithmetic', () => {
  it('accepts "does not apply" for a first-time renter with no prior landlord', async () => {
    await mount();
    expect(at('check-todo-prior-landlord')).toBeTruthy();

    await tap('check-open-prior-landlord');
    await setValue('check-outcome-prior-landlord', 'not-applicable');
    await setValue('check-heard-prior-landlord', 'Her first lease — she lived with family before this.');
    await tap('check-save-prior-landlord');

    expect(at('check-todo-prior-landlord'), 'a first lease still counted as unchecked').toBeFalsy();
    expect(corroborationLeft(db.checks)).not.toContain('prior-landlord');
  });
});

describe('the record keeps every attempt, not a verdict', () => {
  it('keeps "no answer Tuesday" alongside "reached her Thursday"', async () => {
    await mount();

    await tap('check-open-reference');
    await setValue('check-outcome-reference', 'could-not-reach');
    await setValue('check-heard-reference', 'No answer Tuesday, left a message.');
    await tap('check-save-reference');
    expect(allAt('attempt-reference')).toHaveLength(1);

    await tap('check-open-reference');
    await setValue('check-outcome-reference', 'confirmed');
    await setValue('check-heard-reference', 'She called back Thursday — vouches for her.');
    await tap('check-save-reference');

    expect(allAt('attempt-reference'), 'the second attempt replaced the first').toHaveLength(2);
    expect(text()).toContain('No answer Tuesday');
    expect(text()).toContain('called back Thursday');
  });
});

describe('the ID stays out, through every door including a call note', () => {
  it('refuses an SSN typed into what you were told, and writes nothing', async () => {
    await mount();
    await tap('check-open-employer');
    await setValue('check-heard-employer', 'HR confirmed and read me her SSN 123-45-6789.');
    await tap('check-save-employer');

    expect(need('check-error-employer').textContent).toMatch(/Social Security number/i);
    expect(db.checks, 'the note was stored anyway').toHaveLength(0);
  });
});

describe('the fair-housing guard runs on what he is typing', () => {
  it('refuses a decision recorded on a protected class, and names the term', async () => {
    await mount();
    await workTheList('confirmed');

    await setValue('decision-status', 'declined');
    await setValue('decision-reason', 'Declined because of their religion and the children.');

    expect(need('decision-fair-housing').textContent).toMatch(/Fair Housing Act/i);
    expect(need('decision-save').disabled).toBe(true);
    expect(db.applications[0].status).toBe('submitted');
  });
});

// ---------------------------------------------------------------------------
// The rule underneath. These are the ones a render cannot show: that the gate
// reads ATTEMPTS and never OUTCOMES, which is the single property keeping this
// from becoming an exclusion score.
// ---------------------------------------------------------------------------
describe('the rule underneath', () => {
  const all = (outcome) => CORROBORATION_ITEM_IDS.map((item, n) => ({
    id: `c${n}`, item, outcome, checked_at: `2026-10-0${n + 1}T10:00:00Z`,
  }));

  it('counts an attempt whatever it came back as', () => {
    for (const outcome of ['confirmed', 'could-not-reach', 'did-not-confirm', 'not-applicable']) {
      expect(corroborationLeft(all(outcome))).toEqual([]);
      expect(decisionReadyWithChecks('approved', 'A documented, consistent criterion.', all(outcome)).ok).toBe(true);
    }
  });

  it('still requires the reason 0152 requires', () => {
    expect(decisionReadyWithChecks('approved', 'short', all('confirmed')).ok).toBe(false);
    expect(decisionReady('approved', 'short').ok).toBe(false);
  });

  it('leaves a non-decision alone — reviewing needs no list', () => {
    expect(decisionReadyWithChecks('reviewing', '', []).ok).toBe(true);
  });

  it('groups attempts newest first', () => {
    const rows = [
      { id: 'a', item: 'reference', outcome: 'could-not-reach', checked_at: '2026-10-01T10:00:00Z' },
      { id: 'b', item: 'reference', outcome: 'confirmed', checked_at: '2026-10-03T10:00:00Z' },
    ];
    expect(corroborationByItem(rows).get('reference').map((r) => r.id)).toEqual(['b', 'a']);
  });
});
