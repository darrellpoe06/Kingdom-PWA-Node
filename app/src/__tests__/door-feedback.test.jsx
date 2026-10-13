// =============================================================================
// A customer who cannot sign in can still say "this is broken"
// =============================================================================
// DR-0376, out of DR-0374. Sterling Moore's order inquiry failed on every
// attempt for the entire life of the Moore Divahs door, and the only reason
// anyone ever found out is that he told Shay and she told Darrell. Her door
// had no feedback affordance at all.
//
// The property that decides the whole design, and the one these tests exist to
// hold: THE PERSON WHO MEETS A BROKEN DOOR IS THE LEAST LIKELY TO BE SIGNED IN.
// Both existing channels fail that test and neither is reused --
// feedback-sync.js requires sign-in and enrols the writer into 'poe-family';
// send_business_message opens with `IF auth.uid() IS NULL THEN RAISE
// EXCEPTION 'not authenticated'`. So this path must never touch the session.
//
// Proven-to-catch: gating the form on a session, and dropping the steward's
// read side, each fail this suite.
// =============================================================================
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const calls = [];
const rpcResult = { data: 'fb-1', error: null };

// NO session, ever. If anything in this path consults auth, it gets nothing —
// which is exactly the customer we are building for.
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    rpc: async (fn, args) => { calls.push([fn, args]); return rpcResult; },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}));

import DoorFeedback from '../components/DoorFeedback.jsx';
import { DOOR_FEEDBACK_AREAS, isValidArea, triageOrder, unhandledCount, submitDoorFeedback } from '../lib/door-feedback-sync.js';

let container, root;
beforeEach(() => { calls.length = 0; rpcResult.data = 'fb-1'; rpcResult.error = null; });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(DoorFeedback, { doorSlug: 'moore-divahs', instanceSlug: 'moore-divahs', brandLabel: 'Moore Divahs', ...props }));
  });
  await act(async () => { await Promise.resolve(); });
}

const setVal = (el, v) => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype
    : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype
    : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};

async function openForm() {
  const opener = [...container.querySelectorAll('button')].find((b) => /Something not working/i.test(b.textContent));
  expect(opener, 'the door offers no way to report anything').toBeTruthy();
  await act(async () => { opener.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

async function fileReport(text = 'The order form said try again but it never sends.') {
  await openForm();
  const body = container.querySelector('#df-body');
  await act(async () => { setVal(body, text); });
  await act(async () => { body.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
  await act(async () => { await Promise.resolve(); });
}

describe('a signed-out customer can file a report', () => {
  it('the affordance is on the page with no session at all', async () => {
    await mount();
    expect(container.textContent).toMatch(/Something not working on this page/i);
  });

  it('says out loud that no account is needed, because that is the whole point', async () => {
    await mount();
    await openForm();
    expect(container.textContent).toMatch(/do not need an account/i);
  });

  it('files it, with no session, through the anon-callable RPC', async () => {
    await mount();
    await fileReport();
    const rpc = calls.find(([fn]) => fn === 'door_feedback_submit');
    expect(rpc, 'the report never reached the database').toBeTruthy();
    expect(rpc[1].p_instance_slug).toBe('moore-divahs');
    expect(rpc[1].p_payload.body).toMatch(/never sends/);
  });

  it('NEVER consults the session on the write path', async () => {
    await mount();
    await fileReport();
    // Any auth gate would have to call getSession; this path must not.
    expect(calls.filter(([fn]) => fn === 'door_feedback_submit')).toHaveLength(1);
    expect(container.textContent).not.toMatch(/sign in/i);
  });

  it('confirms it reached the business, by name', async () => {
    await mount();
    await fileReport();
    expect(container.textContent).toMatch(/went straight to Moore Divahs/i);
  });
});

describe('the report survives a failure instead of vanishing', () => {
  it('a refused write renders a failure, not a thank-you', async () => {
    rpcResult.error = { message: 'nope' };
    rpcResult.data = null;
    await mount();
    await fileReport('the gallery is blank');
    const alert = container.querySelector('[role="alert"]');
    expect(alert, 'a failed report pretended to succeed').toBeTruthy();
    expect(container.textContent).not.toMatch(/went straight to/i);
  });

  it('keeps what the customer typed so nothing is retyped', async () => {
    rpcResult.error = { message: 'nope' };
    await mount();
    await fileReport('the gallery is blank');
    expect(container.querySelector('#df-body').value).toBe('the gallery is blank');
  });

  it('an empty report is never sent', async () => {
    await mount();
    await openForm();
    const body = container.querySelector('#df-body');
    await act(async () => { setVal(body, '   '); });
    await act(async () => { body.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(calls.find(([fn]) => fn === 'door_feedback_submit')).toBeFalsy();
  });
});

describe('contact is optional, and the form says so', () => {
  it('labels the contact field optional and files without one', async () => {
    await mount();
    await openForm();
    expect(container.querySelector('label[for="df-contact"]').textContent).toMatch(/optional/i);
    // The form is already open here, so submit it directly rather than
    // re-opening (the opener is gone once the form is showing).
    const body = container.querySelector('#df-body');
    await act(async () => { setVal(body, 'it will not send'); });
    await act(async () => { body.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await act(async () => { await Promise.resolve(); });
    const rpc = calls.find(([fn]) => fn === 'door_feedback_submit');
    expect(rpc[1].p_payload.contact).toBeNull();
  });
});

describe('every control is reachable by keyboard with a visible ring', () => {
  it('the opener, the fields and the buttons all carry a focus ring', async () => {
    await mount();
    const opener = container.querySelector('button');
    expect(opener.className).toMatch(/focus-visible:ring/);
    await openForm();
    for (const sel of ['#df-area', '#df-body', '#df-contact']) {
      expect(container.querySelector(sel).className, `${sel} has no focus ring`).toMatch(/focus-visible:ring/);
    }
    for (const b of container.querySelectorAll('form button')) {
      expect(b.className, `a form button has no focus ring`).toMatch(/focus-visible:ring/);
    }
  });

  it('cancel is type=button so it never submits the form by accident', async () => {
    await mount();
    await openForm();
    const cancel = [...container.querySelectorAll('button')].find((b) => /Cancel/.test(b.textContent));
    expect(cancel.getAttribute('type')).toBe('button');
  });
});

describe('the vocabulary lives in ONE place (the 0215 lesson)', () => {
  const sql = readFileSync(
    path.resolve(__dirname, '../../../infra/supabase/migrations-auto/0216-every-door-gets-a-way-to-say-this-is-broken.sql'),
    'utf8',
  );
  // Comments stripped, so the prose explaining the decision cannot satisfy it.
  const code = sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

  it('the migration does NOT allowlist area names — that is what 0215 cost us', () => {
    // 'other' is excluded: it is the server-side FALLBACK for a missing area,
    // not a member of an allowlist. Every real category must be absent.
    for (const a of DOOR_FEEDBACK_AREAS.filter((x) => x.id !== 'other')) {
      expect(code, `SQL hard-codes the area '${a.id}'; a second registry is the 0215 bug`).not.toContain(`'${a.id}'`);
    }
  });

  it('the migration does NOT allowlist door slugs either', () => {
    expect(code).not.toContain("'moore-divahs'");
  });

  it('it DOES pin the tenant by a real row lookup', () => {
    expect(code).toMatch(/SELECT id INTO v_instance FROM instances WHERE slug = p_instance_slug/);
    expect(code).toMatch(/unknown instance slug/);
  });

  it('status and author are forced server-side, never read from the payload', () => {
    expect(code).toMatch(/auth\.uid\(\)/);
    expect(code).not.toMatch(/p_payload ->> 'status'/);
    expect(code).not.toMatch(/p_payload ->> 'submittedBy'/);
  });

  it('anon can reach the seam, and the TABLE stays closed to it', () => {
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.door_feedback_submit\(text, text, jsonb\) TO anon, authenticated/);
    expect(code).toMatch(/REVOKE ALL ON public\.door_feedback FROM PUBLIC, anon/);
  });

  it('reads are office-only, with no member policy to widen later', () => {
    expect(code).toMatch(/IN \('owner','admin'\)/);
    expect(code).not.toMatch(/submitted_by = auth\.uid\(\)/); // no self-read policy
  });

  it('carries a flood brake, because an anon write path without one invites it', () => {
    expect(code).toMatch(/interval '1 minute'/);
    expect(code).toMatch(/too many reports/);
  });
});

describe('the pure helpers the steward board leans on', () => {
  it('triage puts what nobody has looked at first, oldest within that', () => {
    const rows = [
      { id: 'c', status: 'closed',  created_at: '2026-01-01' },
      { id: 'n2', status: 'new',    created_at: '2026-03-01' },
      { id: 'n1', status: 'new',    created_at: '2026-02-01' },
      { id: 'r', status: 'reading', created_at: '2026-01-15' },
    ];
    expect(triageOrder(rows).map((r) => r.id)).toEqual(['n1', 'n2', 'r', 'c']);
  });

  it('counts only what still needs a person', () => {
    expect(unhandledCount([
      { status: 'new' }, { status: 'reading' }, { status: 'answered' }, { status: 'closed' },
    ])).toBe(2);
  });

  it('an unknown area falls back rather than being rejected', async () => {
    await submitDoorFeedback('d', 'i', { area: 'not-a-real-area', body: 'x' });
    const rpc = calls.find(([fn]) => fn === 'door_feedback_submit');
    expect(rpc[1].p_payload.area).toBe('other');
    expect(isValidArea('not-a-real-area')).toBe(false);
  });

  it('submit never throws on a refusal — it returns the failure', async () => {
    rpcResult.error = { message: 'boom' };
    await expect(submitDoorFeedback('d', 'i', { body: 'x' })).resolves.toMatchObject({ ok: false });
  });
});
