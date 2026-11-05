// =============================================================================
// EndpointRegister — every door and every store, as the code declares them,
// and the sign-ins of the last day (DR-1337 + DR-1336; DR-1330 D7 + D6)
// =============================================================================
// The register (lib/endpoint-register.json) is GENERATED from the code by
// scripts/endpoint-register.mjs and the build fails when it is stale, so this
// page is never a painted list (DR-0061). Three sections: the Pages Functions
// with what each requires, the NAS services with whether they gate, and the
// tables with whether a wall stands on them — the unwalled first, because that
// is the question a steward asks. Then the sign-ins and failures of the last
// 24 hours, read live through auth_events_recent (migration 0315), which
// answers only for the instances the caller owns or administers. The surface
// never goes blank (P15): signed out, it says so and what to do; on an error it
// says what it saw and where the record still lives; both are pinned by
// endpoint-register-surface.test.jsx beside the copy they assert (DR-0691).
import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import register from '../lib/endpoint-register.json';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
export const AUTH_WORDS = {
  'user-jwt': 'a signed-in person',
  'machine-token': 'a machine token',
  'hmac-signature': 'an HMAC signature',
  'proxy-passthrough': 'hands the caller\'s own headers to the NAS',
  open: 'open',
  bearer: 'a bearer token',
};
export const COPY = {
  signedOut: 'Sign in to read the sign-ins of the spaces you own or administer.',
  errorLead: 'The record could not be read',
  errorTail: 'The auth server writes it either way; a steward reads it on the NAS (nas-health) until this answers.',
};

function Table({ caption, head, rows, testid }) {
  return (
    <div className="overflow-x-auto" data-testid={testid}>
      <table className="w-full text-xs border-collapse">
        <caption className="text-left text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} className="text-left border-b border-[#1A1815] py-1 pr-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#E8E4DC] align-top">{r.map((c, j) => <td key={j} className="py-1 pr-3" style={j === 0 ? mono : undefined}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function SignIns({ client = supabase, hours = 24 }) {
  const [state, setState] = useState({ status: 'loading', rows: [] });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { session } = {} } = await client.auth.getSession();
        if (!session) { if (alive) setState({ status: 'signed-out', rows: [] }); return; }
        const { data, error } = await client.rpc('auth_events_recent', { p_hours: hours });
        if (!alive) return;
        if (error) setState({ status: 'error', rows: [], ref: String(error.code || error.message || 'rpc').slice(0, 40) });
        else setState({ status: 'ok', rows: Array.isArray(data) ? data : [] });
      } catch (e) { if (alive) setState({ status: 'error', rows: [], ref: String(e && e.message).slice(0, 40) }); }
    })();
    return () => { alive = false; };
  }, [client, hours]);
  const logins = state.rows.filter((r) => r.action === 'login').length;
  const failed = state.rows.filter((r) => r.action === 'failed-auth').length;
  const people = new Set(state.rows.map((r) => r.user_id)).size;
  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5" data-testid="sign-ins" data-status={state.status}>
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">Sign-ins, last {hours} hours</div>
      {state.status === 'loading' && <p className="text-sm" style={serif}>Reading the record…</p>}
      {state.status === 'signed-out' && <p className="text-sm" style={serif}>{COPY.signedOut}</p>}
      {state.status === 'error' && <p className="text-sm" style={serif}>{COPY.errorLead} ({state.ref}). {COPY.errorTail}</p>}
      {state.status === 'ok' && (
        <p className="text-sm" style={serif} data-testid="sign-ins-summary">
          {logins} sign-in{logins === 1 ? '' : 's'}, {failed} failed attempt{failed === 1 ? '' : 's'}, across {people} {people === 1 ? 'person' : 'people'} in the spaces you own or administer. A row for every password attempt is written by the auth server itself (migration 0315).
        </p>
      )}
    </section>
  );
}

export default function EndpointRegister({ client = supabase }) {
  const { counts, functions, nas, tables } = register;
  return (
    <div className="space-y-5" data-testid="endpoint-register">
      <p className="text-sm text-[#1A1815]" style={serif}>
        Every door and every store, read from the code by the build, never typed by hand: {counts.functions} edge functions, {counts.nasServices} NAS services with {counts.nasRoutes} routes, {counts.tables} tables, of which {counts.tablesWithoutRls} carr{counts.tablesWithoutRls === 1 ? 'ies' : 'y'} no row-level wall. A stale copy of this page fails the build.
      </p>
      <SignIns client={client} />
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-semibold">Edge functions (Cloudflare Pages)</div>
        <Table testid="register-functions" caption="route · methods · what it requires · the secrets it names" head={['Route', 'Methods', 'Requires', 'Secrets']}
          rows={functions.map((f) => [f.route, f.methods.join(' '), f.auth.map((a) => AUTH_WORDS[a] || a).join('; '), f.secrets.join(' ') || '—'])} />
      </section>
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-semibold">NAS services (reached over the tailnet or a Funnel path)</div>
        <Table testid="register-nas" caption="service · gate · routes" head={['Service', 'Gate', 'Routes']}
          rows={nas.map((n) => [n.service, AUTH_WORDS[n.auth] || n.auth, n.routes.map((r) => `${r.method} ${r.route}`).join(', ')])} />
      </section>
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-semibold">Data stores (PostgreSQL) — the unwalled first</div>
        <Table testid="register-tables" caption="table · row-level security · policies · first created in" head={['Table', 'RLS', 'Policies', 'Created in']}
          rows={tables.map((t) => [t.table, t.rls ? 'on' : 'NONE', String(t.policies), t.definedIn.replace(/^infra\/supabase\//, '')])} />
      </section>
    </div>
  );
}
