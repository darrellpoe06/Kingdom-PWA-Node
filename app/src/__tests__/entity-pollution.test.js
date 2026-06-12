// Entity pollution defense — 2026-06-12 ("It merged seed data with ours").
// Historical cloud rows wear new UUIDs or null slugs, so id-based filters
// miss them; these lock the name-based belt: demo-named entities never
// render, and duplicate names collapse to the best row.
import { describe, it, expect } from 'vitest';
import { DEMO_ENTITY_NAMES, notDemoEntityRow, dedupeEntitiesByName } from '../poe-financial-mvp-v28.jsx';

describe('notDemoEntityRow', () => {
  it('catches demo entities whatever id they wear (UUID, null, anything)', () => {
    expect(DEMO_ENTITY_NAMES.size).toBeGreaterThan(0);
    const demoName = [...DEMO_ENTITY_NAMES][0];
    expect(notDemoEntityRow({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: demoName })).toBe(false);
    expect(notDemoEntityRow({ id: null, name: demoName.toUpperCase() })).toBe(false);
  });

  it('the family\'s real entities pass', () => {
    for (const name of ['Personal (Darrell + Christina)', 'Poe Properties LLC', 'PoeTech LLC', 'TLC Therapy Solutions LLC']) {
      expect(notDemoEntityRow({ id: 'e-x', name })).toBe(true);
    }
  });
});

describe('union + filter integration (the wizard regression)', () => {
  // 2026-06-12 second pass: filtering only the INCOMING cloud list let the
  // union re-add the polluted copies from the device's saved state (their
  // non-UUID ids look like rows awaiting upload). Both sides filter now;
  // this locks the exact composition the sync effect uses.
  it('a demo entity present ONLY in local saved state does not survive', async () => {
    const { unionPreservingLocal } = await import('../lib/table-sync.js');
    const demoName = [...DEMO_ENTITY_NAMES][0];
    const localSaved = [
      { id: 'e-demo-leftover', name: demoName },
      { id: 'e-poetech', name: 'PoeTech LLC' },
    ];
    const incoming = [{ id: 'e-poetech', name: 'PoeTech LLC', createdAt: '2026-05-01' }].filter(notDemoEntityRow);
    const current = localSaved.filter(notDemoEntityRow);
    const out = dedupeEntitiesByName(unionPreservingLocal(current, incoming));
    expect(out.some((e) => e.name === demoName)).toBe(false);
    expect(out.filter((e) => e.name === 'PoeTech LLC')).toHaveLength(1);
  });
});

describe('dedupeEntitiesByName', () => {
  it('collapses duplicates, preferring the slugged row over the null-slug row', () => {
    const out = dedupeEntitiesByName([
      { id: null, name: 'PoeTech LLC', createdAt: '2026-05-01' },
      { id: 'e-poetech', name: 'PoeTech LLC', createdAt: '2026-06-01' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('e-poetech');
  });

  it('ties keep the earliest created', () => {
    const out = dedupeEntitiesByName([
      { id: 'e-tlc', name: 'TLC Therapy Solutions LLC', createdAt: '2026-06-01' },
      { id: 'e-tlc2', name: 'TLC Therapy Solutions LLC', createdAt: '2026-05-01' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('e-tlc2');
  });

  it('distinct names all survive', () => {
    const out = dedupeEntitiesByName([
      { id: 'e-1', name: 'Poe Properties LLC' },
      { id: 'e-2', name: 'PoeTech LLC' },
    ]);
    expect(out).toHaveLength(2);
  });
});
