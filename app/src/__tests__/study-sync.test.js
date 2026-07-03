// =============================================================================
// study-sync — the merge that carries the circle's Study across devices.
// =============================================================================
// Darrell 2026-07-03: "we need sync for BG he will use multiple devices and so
// do we." These tests pin the PURE merge semantics (study-sync.js) so the
// cross-device behavior is proven, not claimed (DR-0076):
//   * newest-wins by the entry's own updatedAt — the owner's later edit never
//     loses to a stale copy from another device;
//   * cloud tombstones delete local copies (no resurrection), but an edit made
//     AFTER the delete survives — the owner's words never silently vanish;
//   * local-only entries are kept AND queued for push (first sync uploads the
//     existing device store — nothing BG already wrote is lost);
//   * per-device seed duplicates (same teaching, different generated ids)
//     collapse to one copy, and the dropped cloud duplicate is tombstoned so
//     every device converges;
//   * the label follows the cloud once one exists; a custom local label seeds
//     the cloud on first sync.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { mergeStudy, dedupeSeeds, entryToRow, rowToEntry } from '../lib/study-sync.js';
import { normalizeEntry, DEFAULT_LABEL } from '../lib/study-space.js';

const entry = (id, over = {}) => normalizeEntry({
  id, kind: 'reflection', title: `t-${id}`, deep: 'deep', plain: '',
  createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
  ...over,
});
const row = (e, over = {}) => ({ ...entryToRow(e), ...over });
const local = (entries, label = DEFAULT_LABEL) => ({ version: 1, label, entries });

describe('mergeStudy — newest wins by the entry’s own clock', () => {
  it('local edit newer than cloud copy: local wins and is queued for push', () => {
    const le = entry('a', { deep: 'edited here', updatedAt: '2026-07-03T10:00:00.000Z' });
    const ce = entry('a', { deep: 'stale', updatedAt: '2026-07-02T00:00:00.000Z' });
    const r = mergeStudy(local([le]), { rows: [row(ce)], label: '' });
    expect(r.study.entries).toHaveLength(1);
    expect(r.study.entries[0].deep).toBe('edited here');
    expect(r.pushEntries.map((e) => e.id)).toEqual(['a']);
  });

  it('cloud copy newer than local: cloud wins, nothing pushed', () => {
    const le = entry('a', { deep: 'old here', updatedAt: '2026-07-01T00:00:00.000Z' });
    const ce = entry('a', { deep: 'newer from the other device', updatedAt: '2026-07-03T00:00:00.000Z' });
    const r = mergeStudy(local([le]), { rows: [row(ce)], label: '' });
    expect(r.study.entries[0].deep).toBe('newer from the other device');
    expect(r.pushEntries).toHaveLength(0);
  });

  it('cloud entries this device has never seen come down', () => {
    const ce = entry('b', { title: 'written on the phone' });
    const r = mergeStudy(local([entry('a')]), { rows: [row(entry('a')), row(ce)], label: '' });
    expect(r.study.entries.map((e) => e.id).sort()).toEqual(['a', 'b']);
    expect(r.pushEntries).toHaveLength(0);
  });
});

describe('mergeStudy — first sync uploads the existing device store', () => {
  it('every local-only entry is kept and queued for push', () => {
    const les = [entry('a'), entry('b')];
    const r = mergeStudy(local(les), { rows: [], label: '' });
    expect(r.study.entries).toHaveLength(2);
    expect(r.pushEntries.map((e) => e.id).sort()).toEqual(['a', 'b']);
  });
});

describe('mergeStudy — tombstones delete without resurrection', () => {
  it('a cloud tombstone removes the local copy', () => {
    const le = entry('a', { updatedAt: '2026-07-01T00:00:00.000Z' });
    const r = mergeStudy(local([le]), {
      rows: [{ id: 'a', doc: {}, deleted: true, updated_at: '2026-07-02T00:00:00.000Z' }],
      label: '',
    });
    expect(r.study.entries).toHaveLength(0);
    expect(r.pushEntries).toHaveLength(0);
  });

  it('an edit made AFTER the delete survives and re-uploads (the owner’s words never silently vanish)', () => {
    const le = entry('a', { deep: 'kept working on it', updatedAt: '2026-07-03T09:00:00.000Z' });
    const r = mergeStudy(local([le]), {
      rows: [{ id: 'a', doc: {}, deleted: true, updated_at: '2026-07-02T00:00:00.000Z' }],
      label: '',
    });
    expect(r.study.entries).toHaveLength(1);
    expect(r.pushEntries.map((e) => e.id)).toEqual(['a']);
  });
});

describe('seed dedupe — per-device seed ids converge to one copy per teaching', () => {
  it('two seeds with the same title collapse; the edited (newer) copy wins', () => {
    const mine = entry('e_dev1', { seed: true, title: 'The Table', plain: 'my distillation', updatedAt: '2026-07-03T00:00:00.000Z' });
    const theirs = entry('e_dev2', { seed: true, title: 'The Table', updatedAt: '2026-07-01T00:00:00.000Z' });
    const { entries, dropped } = dedupeSeeds([theirs, mine]);
    expect(entries).toHaveLength(1);
    expect(entries[0].plain).toBe('my distillation');
    expect(dropped).toEqual(['e_dev2']);
  });

  it('merge tombstones a dropped duplicate ONLY when the cloud holds it', () => {
    const mine = entry('e_dev1', { seed: true, title: 'The Table', plain: 'edited', updatedAt: '2026-07-03T00:00:00.000Z' });
    const cloudDup = entry('e_dev2', { seed: true, title: 'The Table', updatedAt: '2026-07-01T00:00:00.000Z' });
    const r = mergeStudy(local([mine]), { rows: [row(cloudDup)], label: '' });
    expect(r.study.entries).toHaveLength(1);
    expect(r.study.entries[0].id).toBe('e_dev1');
    expect(r.pushTombstones).toEqual(['e_dev2']);
    // the surviving local copy still uploads (cloud doesn't have e_dev1)
    expect(r.pushEntries.map((e) => e.id)).toEqual(['e_dev1']);
  });

  it('non-seed entries with the same title are BOTH kept (dedupe is seeds-only)', () => {
    const a = entry('a', { title: 'Same name' });
    const b = entry('b', { title: 'Same name' });
    expect(dedupeSeeds([a, b]).entries).toHaveLength(2);
  });
});

describe('mergeStudy — label', () => {
  it('an existing cloud label wins', () => {
    const r = mergeStudy(local([], 'My old device name'), { rows: [], label: 'Father of Lights' });
    expect(r.study.label).toBe('Father of Lights');
    expect(r.pushLabel).toBe(false);
  });

  it('a custom local label seeds an empty cloud', () => {
    const r = mergeStudy(local([], 'Father of Lights'), { rows: [], label: '' });
    expect(r.study.label).toBe('Father of Lights');
    expect(r.pushLabel).toBe(true);
  });

  it('the default label is never pushed as if it were a choice', () => {
    const r = mergeStudy(local([], DEFAULT_LABEL), { rows: [], label: '' });
    expect(r.pushLabel).toBe(false);
  });
});

describe('row mapping', () => {
  it('entryToRow carries the whole normalized entry and its clock', () => {
    const e = entry('a', { updatedAt: '2026-07-03T08:00:00.000Z' });
    const r = entryToRow(e);
    expect(r.id).toBe('a');
    expect(r.deleted).toBe(false);
    expect(r.updated_at).toBe('2026-07-03T08:00:00.000Z');
    expect(r.doc.title).toBe('t-a');
  });

  it('rowToEntry returns null for tombstones and normalizes malformed docs', () => {
    expect(rowToEntry({ id: 'a', doc: {}, deleted: true })).toBeNull();
    const e = rowToEntry({ id: 'a', doc: { id: 'a', kind: 'nope', tags: 'not-an-array' }, deleted: false });
    expect(e.kind).toBe('reflection');
    expect(e.tags).toEqual([]);
  });
});
