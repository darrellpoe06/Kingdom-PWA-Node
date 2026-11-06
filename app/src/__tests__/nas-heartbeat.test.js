// @vitest-environment node
// =============================================================================
// The house's own witness: the NAS heartbeat the app shows (DR-1354)
// =============================================================================
// The runner's probes of the NAS all died with the runner's tailnet key on
// 2026-11-04 and nobody knew for two days. This witness is a row the NAS writes
// itself; these cases pin how the app reads it and PROVE a dead clock shows.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEARTBEAT_TAG, CLOCK_MIN, LATE_AFTER_MIN, SILENT_AFTER_MIN, stampOf, heartbeatStatus, fetchNasHeartbeat } from '../lib/nas-heartbeat.js';

const NOW = Date.parse('2026-11-06T15:00:00Z');
const row = (minutesAgo, extra = {}) => ({
  id: 'r1',
  body: JSON.stringify({ at: new Date(NOW - minutesAgo * 60000).toISOString(), host: 'poetech', services: 29, cycle: 'services-sync', ...extra }),
  tags: [HEARTBEAT_TAG],
  created_at: new Date(NOW - minutesAgo * 60000 - 5000).toISOString(),
});

describe('the heartbeat is judged by its own stamp against the clock', () => {
  it('alive within two cycles, late within four, silent after', () => {
    expect(LATE_AFTER_MIN).toBe(CLOCK_MIN * 2);
    expect(SILENT_AFTER_MIN).toBe(CLOCK_MIN * 4);
    expect(heartbeatStatus(row(3), { now: NOW })).toMatchObject({ state: 'alive', ageMin: 3, kpi: 'good' });
    expect(heartbeatStatus(row(29), { now: NOW })).toMatchObject({ state: 'alive', ageMin: 29 });
    expect(heartbeatStatus(row(31), { now: NOW })).toMatchObject({ state: 'late', ageMin: 31, kpi: 'attention' });
    expect(heartbeatStatus(row(61), { now: NOW })).toMatchObject({ state: 'silent', ageMin: 61, kpi: 'problem' });
  });

  it('PROVEN TO CATCH: a NAS that stopped two days ago reads silent, in days, not as a fresh green', () => {
    const s = heartbeatStatus(row(2 * 24 * 60 + 7), { now: NOW });
    expect(s.state).toBe('silent');
    expect(s.label).toBe('NAS silent: last seen 2 days ago');
    expect(s.kpi).toBe('problem');
  });

  it('never seen is said as never, and an unreadable table is said as unreadable', () => {
    expect(heartbeatStatus(null, { now: NOW })).toMatchObject({ state: 'never', kpi: 'attention' });
    expect(heartbeatStatus(row(1), { now: NOW, reason: 'permission denied' })).toMatchObject({
      state: 'unreadable',
      label: 'NAS heartbeat unreadable: permission denied',
    });
  });

  it('reads the stamp from the body, and falls back to created_at when the body is not JSON', () => {
    expect(stampOf(row(10)).host).toBe('poetech');
    expect(stampOf(row(10)).services).toBe(29);
    const plain = { body: 'not json', created_at: new Date(NOW - 12 * 60000).toISOString() };
    expect(heartbeatStatus(plain, { now: NOW })).toMatchObject({ state: 'alive', ageMin: 12 });
    expect(stampOf({ body: 'x', created_at: 'garbage' })).toBeNull();
  });
});

describe('the read is the newest tagged row, and a failed read is a reason, never a throw', () => {
  const client = (reply) => ({
    from: () => ({
      select: () => ({
        contains: (col, v) => {
          client.lastFilter = [col, v];
          return { order: () => ({ limit: async () => reply }) };
        },
      }),
    }),
  });

  it('asks for the newest nas-heartbeat row with the JSON tag filter the table needs', async () => {
    const c = client({ data: [row(2)], error: null });
    const r = await fetchNasHeartbeat({ supabase: c });
    expect(r.row.id).toBe('r1');
    expect(client.lastFilter).toEqual(['tags', JSON.stringify([HEARTBEAT_TAG])]);
  });

  it('an empty table is row null with no reason; an error is its message; no client is said plainly', async () => {
    expect(await fetchNasHeartbeat({ supabase: client({ data: [], error: null }) })).toEqual({ row: null, reason: '' });
    expect(await fetchNasHeartbeat({ supabase: client({ data: null, error: { message: 'RLS' } }) })).toEqual({ row: null, reason: 'RLS' });
    expect(await fetchNasHeartbeat({})).toEqual({ row: null, reason: 'no database client' });
  });
});

describe('the writer on the NAS and the reader in the app agree on the row', () => {
  it('heartbeat.py writes the tag and the body shape the reader parses, on the services-sync clock', () => {
    const py = readFileSync(join(process.cwd(), '..', 'infra', 'nas-loops', 'heartbeat.py'), 'utf8');
    expect(py).toContain('"nas-heartbeat"');
    for (const k of ['"at"', '"host"', '"services"', '"cycle"']) expect(py).toContain(k);
    const services = JSON.parse(readFileSync(join(process.cwd(), '..', 'infra', 'nas-loops', 'services.json'), 'utf8'));
    const list = Array.isArray(services) ? services : services.services;
    const entry = list.find((s) => s.name === 'nas-heartbeat');
    expect(entry).toBeTruthy();
    expect(entry.enabled).toBe(true);
    expect(entry.install).toBe('infra/nas-loops/heartbeat-install.sh');
  });

  it('the OpsBoard shows it beside the site witness and never blank', () => {
    const jsx = readFileSync(join(process.cwd(), 'src', 'components', 'OpsBoard.jsx'), 'utf8');
    expect(jsx).toContain('fetchNasHeartbeat');
    expect(jsx).toContain('heartbeatStatus');
    expect(jsx).toContain('data-testid="nas-heartbeat"');
  });
});
