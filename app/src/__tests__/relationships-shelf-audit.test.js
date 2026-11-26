// The Relationships shelf is sorted by its written definition (DR-1694), and the shelf and
// its audit can never silently disagree. Darrell 2026-11-26: the shelf came back nearly
// empty from a title search; relationships are relating in every direction, measured by the
// fruit of the Spirit (docs/00-foundations/_root/RELATIONSHIPS-RELATING-IN-EVERY-DIRECTION.md).
// Every shelf id must resolve to a mounted lesson AND appear in the committed audit with a
// reason; every lesson the audit puts on the shelf must be on it. Each check is proven to catch.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RELATIONSHIP_LESSONS } from '../lib/learn-presentation/presentation.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

const AUDIT = join(__dirname, '..', '..', '..', 'docs', '99-session-notes', '2026-11-26-relationships-shelf-audit.md');
const DEFINITION = join(__dirname, '..', '..', '..', 'docs', '00-foundations', '_root', 'RELATIONSHIPS-RELATING-IN-EVERY-DIRECTION.md');

/** Pure. The audit's rows, split into the on-shelf section and the near-miss section: id -> reason. */
export function readAudit(md) {
  const text = String(md);
  const cut = text.indexOf('\n## Near-misses');
  const row = /^\|\s*`([^`]+)`\s*\|[^|]*\|\s*([^|]*?)\s*\|\s*$/gm;
  const rows = (part) => new Map([...part.matchAll(row)].map((m) => [m[1], m[2]]));
  return { onShelf: rows(cut < 0 ? text : text.slice(0, cut)), nearMiss: rows(cut < 0 ? '' : text.slice(cut)) };
}

/** Pure. Every way the shelf and its audit disagree, named. Empty is a pass. */
export function shelfAuditFaults(shelf, audit, mountedIds) {
  const faults = [];
  for (const id of shelf) {
    if (!mountedIds.has(id)) faults.push(`${id} is not a mounted lesson`);
    if (!audit.onShelf.has(id)) faults.push(`${id} is on the shelf but not in the audit`);
    else if (audit.onShelf.get(id).length < 20) faults.push(`${id} has no real reason in the audit`);
    if (audit.nearMiss.has(id)) faults.push(`${id} is on the shelf and also listed as a near-miss`);
  }
  const listed = new Set(shelf);
  for (const id of audit.onShelf.keys()) if (!listed.has(id)) faults.push(`${id} is in the audit but not on the shelf`);
  if (new Set(shelf).size !== shelf.length) faults.push('the shelf lists a lesson twice');
  return faults;
}

const md = readFileSync(AUDIT, 'utf8');
const audit = readAudit(md);
const mounted = new Set(learnInventory().flatMap((c) => (c.lessons || []).map((l) => l.id)));

describe('Relationships, sorted by its definition (DR-1694)', () => {
  it('the definition exists and names the six groups the shelf is sorted by', () => {
    const def = readFileSync(DEFINITION, 'utf8');
    for (const g of [
      'With Yahweh',
      'Within yourself and your emotions',
      'Marriage',
      'Family and children',
      'Friendship, church and neighbour',
      'Conflict and forgiveness',
    ]) {
      expect(def).toContain(g);
    }
  });

  it('every shelf id is a mounted lesson, in the audit with a reason, and the audit lists nothing the shelf drops', () => {
    expect(audit.onShelf.size, 'an empty audit cannot read as a pass').toBeGreaterThanOrEqual(100);
    expect(shelfAuditFaults([...RELATIONSHIP_LESSONS], audit, mounted)).toEqual([]);
  });

  it('the lessons the definition was written for open the shelf', () => {
    expect(RELATIONSHIP_LESSONS[0]).toBe('ll344-how-relating-works-every-direction-measured-by-the-fruit-of');
    expect(RELATIONSHIP_LESSONS[1]).toBe('ll345-the-mirror-your-relationship-with-everything-you-touch');
  });

  it('PROVEN-TO-CATCH: a planted id, a missing reason, a dropped lesson and a double listing are each named', () => {
    const shelf = [...RELATIONSHIP_LESSONS];
    expect(shelfAuditFaults([...shelf, 'll9999-not-a-lesson'], audit, mounted)).toEqual(
      expect.arrayContaining(['ll9999-not-a-lesson is not a mounted lesson', 'll9999-not-a-lesson is on the shelf but not in the audit'])
    );
    const noReason = readAudit(md.replace(/^(\|\s*`ll344-[^`]+`\s*\|[^|]*\|)[^|]*\|/m, '$1 |'));
    expect(shelfAuditFaults(shelf, noReason, mounted)).toContain(`${shelf[0]} has no real reason in the audit`);
    expect(shelfAuditFaults(shelf.slice(1), audit, mounted)).toContain(`${shelf[0]} is in the audit but not on the shelf`);
    expect(shelfAuditFaults([...shelf, shelf[2]], audit, mounted)).toContain('the shelf lists a lesson twice');
  });
});
