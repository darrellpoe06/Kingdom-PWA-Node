// =============================================================================
// Admin → Endpoints & stores never goes blank (P15, DR-0691): the register
// renders from the generated file with the unwalled tables first; the sign-ins
// panel says sign in when signed out, says what it saw on an error, and counts
// the rows when it can read them. Copy and behavior asserted together.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import EndpointRegister, { SignIns, COPY } from '../components/EndpointRegister.jsx';
import register from '../lib/endpoint-register.json';
import workflows from '../lib/workflow-register.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const client = ({ session, rpc }) => ({
  auth: { getSession: async () => ({ data: { session } }) },
  rpc: async () => rpc,
});

async function mount(el) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(el);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return container;
}

describe('Endpoints & stores', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders every function, service and table from the generated register, the unwalled tables first', async () => {
    const c = await mount(createElement(EndpointRegister, { client: client({ session: null }) }));
    expect(c.querySelectorAll('[data-testid="register-functions"] tbody tr').length).toBe(register.functions.length);
    expect(c.querySelectorAll('[data-testid="register-nas"] tbody tr').length).toBe(register.nas.length);
    const tableRows = [...c.querySelectorAll('[data-testid="register-tables"] tbody tr')];
    expect(tableRows.length).toBe(register.tables.length);
    const firstRls = tableRows[0].children[1].textContent;
    if (register.counts.tablesWithoutRls > 0) expect(firstRls).toBe('NONE');
    expect(c.textContent).toContain(`${register.counts.functions} edge functions`);
    // DR-1342: every workflow, the ones missing a brake first.
    const wfRows = [...c.querySelectorAll('[data-testid="register-workflows"] tbody tr')];
    expect(wfRows.length).toBe(workflows.workflows.length);
    expect(c.querySelector('[data-testid="workflows-summary"]').textContent).toContain(`${workflows.counts.workflows} workflows`);
    const brakesOf = (tr) => (tr.children[2].textContent.match(/NO /g) || []).length;
    for (let i = 1; i < wfRows.length; i++) expect(brakesOf(wfRows[i - 1])).toBeGreaterThanOrEqual(brakesOf(wfRows[i]));
  });

  it('signed out, the sign-ins panel says so and what to do', async () => {
    const c = await mount(createElement(SignIns, { client: client({ session: null }) }));
    expect(c.querySelector('[data-testid="sign-ins"]').dataset.status).toBe('signed-out');
    expect(c.textContent).toContain(COPY.signedOut);
  });

  it('on an error it says what it saw and where the record still lives, never a blank', async () => {
    const c = await mount(
      createElement(SignIns, { client: client({ session: { user: {} }, rpc: { data: null, error: { code: '42501', message: 'permission denied' } } }) })
    );
    expect(c.querySelector('[data-testid="sign-ins"]').dataset.status).toBe('error');
    expect(c.textContent).toContain(`${COPY.errorLead} (42501)`);
    expect(c.textContent).toContain(COPY.errorTail);
  });

  it('counts sign-ins, failures and people from the rows it reads', async () => {
    const rows = [
      { action: 'login', user_id: 'a' },
      { action: 'failed-auth', user_id: 'a' },
      { action: 'failed-auth', user_id: 'b' },
    ];
    const c = await mount(createElement(SignIns, { client: client({ session: { user: {} }, rpc: { data: rows, error: null } }) }));
    expect(c.querySelector('[data-testid="sign-ins-summary"]').textContent).toContain('1 sign-in, 2 failed attempts, across 2 people');
  });
});
