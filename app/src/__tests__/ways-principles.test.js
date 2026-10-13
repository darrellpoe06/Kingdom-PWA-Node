// ways-principles — the binding-principle registry surfaced live (DR-0219 / the
// safe build-time Ways snapshot). Proves normalization is honest (no invented
// rows), sorted + de-duped, and the search/lookup helpers work.
import { describe, it, expect } from 'vitest';
import { normalizeWaysPrinciples, filterWaysPrinciples, findWaysPrinciple } from '../lib/ways-principles.js';

const INJECTED = {
  ok: true,
  count: 3,
  items: [
    { id: 'THREE-BRAKES', summary: 'No timer-driven automation ships active without budget + lock + kill-switch.', source: 'CLAUDE.md' },
    { id: 'TLC-FIREWALL', summary: 'TLC clinical / PHI never routes to any vendor; sovereign-only, fail-closed.', source: 'CLAUDE-TOOL-ROUTING.md' },
    { id: 'THREE-BRAKES', summary: 'dup — should be dropped', source: 'x' },
  ],
};

describe('normalizeWaysPrinciples', () => {
  it('normalizes, de-dupes by id, and sorts by id', () => {
    const out = normalizeWaysPrinciples(INJECTED);
    expect(out.ok).toBe(true);
    expect(out.count).toBe(2); // dup THREE-BRAKES dropped
    expect(out.items.map((p) => p.id)).toEqual(['THREE-BRAKES', 'TLC-FIREWALL']); // sorted
    expect(out.items[0].summary).toContain('kill-switch'); // first-seen wins
  });

  it('is honest on a missing / garbled global (no invented principles)', () => {
    expect(normalizeWaysPrinciples(undefined)).toEqual({ ok: false, count: 0, items: [] });
    expect(normalizeWaysPrinciples(null)).toEqual({ ok: false, count: 0, items: [] });
    expect(normalizeWaysPrinciples({ items: 'nope' })).toEqual({ ok: false, count: 0, items: [] });
    expect(normalizeWaysPrinciples({ items: [null, {}, { id: '' }] })).toEqual({ ok: false, count: 0, items: [] });
  });
});

describe('filterWaysPrinciples', () => {
  const items = normalizeWaysPrinciples(INJECTED).items;
  it('filters case-insensitively over id + summary; empty query returns all', () => {
    expect(filterWaysPrinciples(items, '').length).toBe(2);
    expect(filterWaysPrinciples(items, 'phi').map((p) => p.id)).toEqual(['TLC-FIREWALL']);
    expect(filterWaysPrinciples(items, 'three').map((p) => p.id)).toEqual(['THREE-BRAKES']);
    expect(filterWaysPrinciples(items, 'zzz')).toEqual([]);
  });
});

describe('findWaysPrinciple', () => {
  const items = normalizeWaysPrinciples(INJECTED).items;
  it('looks up by exact id, case-insensitive; null when absent', () => {
    expect(findWaysPrinciple(items, 'tlc-firewall').id).toBe('TLC-FIREWALL');
    expect(findWaysPrinciple(items, 'NOPE')).toBeNull();
    expect(findWaysPrinciple(items, '')).toBeNull();
  });
});
