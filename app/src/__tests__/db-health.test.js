import { describe, it, expect } from 'vitest';
import {
  summary,
  summaryTiles,
  healthKpiStatus,
  healthKpiLabel,
  failedList,
  migrations,
  fmtWhen,
} from '../lib/db-health.js';

const clean = {
  ledger_initialized: true,
  summary: { applied: 71, failed: 0, total: 71 },
  last_applied_at: '2026-07-01T12:12:00.961Z',
  failed: [],
  migrations: [
    { filename: '0060-schema-migrations-health.sql', status: 'applied', applied_at: '2026-07-01T12:12:00.961Z' },
    { filename: '0059-project-board-tasks.sql', status: 'applied', applied_at: '2026-07-01T12:06:00Z' },
  ],
};

const broken = {
  ledger_initialized: true,
  summary: { applied: 69, failed: 2, total: 71 },
  last_applied_at: '2026-07-01T12:06:00Z',
  failed: [
    { filename: '0045-service-actuals.sql', applied_at: '2026-07-01T12:05:37Z', last_error: 'ERROR: deadlock detected' },
    { filename: '0055-relationship-permissions.sql', applied_at: '2026-07-01T12:05:55Z', last_error: 'ERROR: deadlock detected' },
  ],
  migrations: [],
};

describe('db-health pure helpers', () => {
  it('summary reads counts, defaults missing to zero', () => {
    expect(summary(clean)).toEqual({ applied: 71, failed: 0, total: 71 });
    expect(summary({})).toEqual({ applied: 0, failed: 0, total: 0 });
    expect(summary({ summary: { applied: 3 } })).toEqual({ applied: 3, failed: 0, total: 3 });
  });

  it('summaryTiles surfaces applied / failed / last-applied', () => {
    const tiles = summaryTiles(clean);
    expect(tiles.map((t) => t.label)).toEqual(['Applied', 'Failed', 'Last applied']);
    expect(tiles[0].value).toBe('71');
    expect(tiles[1].value).toBe('0');
    expect(tiles[2].value).toBe('2026-07-01 12:12');
  });

  it('healthKpiStatus: good when nothing failed', () => {
    expect(healthKpiStatus(clean)).toBe('good');
    expect(healthKpiLabel(clean)).toBe('All applied');
  });

  it('healthKpiStatus: problem when any migration failed', () => {
    expect(healthKpiStatus(broken)).toBe('problem');
    expect(healthKpiLabel(broken)).toBe('2 failed');
  });

  it('healthKpiStatus: attention when ledger not initialized', () => {
    const uninit = { ledger_initialized: false, summary: { applied: 0, failed: 0, total: 0 } };
    expect(healthKpiStatus(uninit)).toBe('attention');
    expect(healthKpiLabel(uninit)).toBe('Ledger not initialized');
  });

  it('healthKpiStatus: idle when no data at all', () => {
    expect(healthKpiStatus(null)).toBe('idle');
  });

  it('failedList returns the failed rows with their real error', () => {
    expect(failedList(broken)).toHaveLength(2);
    expect(failedList(broken)[0].last_error).toContain('deadlock');
    expect(failedList(clean)).toEqual([]);
    expect(failedList(null)).toEqual([]);
  });

  it('migrations returns the applied list, tolerant of missing', () => {
    expect(migrations(clean)).toHaveLength(2);
    expect(migrations({})).toEqual([]);
  });

  it('fmtWhen formats ISO to short local-ish string, never invents', () => {
    expect(fmtWhen('2026-07-01T12:12:00.961Z')).toBe('2026-07-01 12:12');
    expect(fmtWhen('2026-07-01 12:06:00')).toBe('2026-07-01 12:06');
    expect(fmtWhen(null)).toBe('—');
    expect(fmtWhen(undefined)).toBe('—');
  });
});
