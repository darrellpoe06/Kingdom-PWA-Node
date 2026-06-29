// =============================================================================
// Church Infrastructure Program seed guard (2026-06-29).
// =============================================================================
// Closes the gap from the church-infrastructure documentation audit: the seven
// hardware/compute infra items had NO record in the in-app Projects surface.
// This guard ties the in-app program seed to reality so it cannot silently rot:
//   * all 7 milestone items are present (item_no 1..7), none dropped;
//   * the program is role-scoped to the COLG instance (NOT public/poe-family seed);
//   * every linked_doc actually EXISTS on this branch (no broken in-app doc link);
//   * docs that are only in the local working tree are declared under pending_docs
//     with a reason -- never asserted as a live link;
//   * SME-pending items (specs Darrell has not supplied) carry NO fabricated doc
//     and are explicitly flagged (DR-0076 verification doctrine: no invented facts);
//   * the JSON source of truth and the apply-able SQL cannot drift (every slug in
//     the JSON appears in the SQL).
// Proven-to-catch: deleting an item, flipping the instance to a public slug, or
// linking a non-existent doc all fail this test.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const seedJsonPath = resolve(repoRoot, 'infra/seed-data/2026-06-29-colg-church-infrastructure-program.json');
const seedSqlPath = resolve(repoRoot, 'infra/seed-data/2026-06-29-colg-church-infrastructure-program.sql');

const seed = JSON.parse(readFileSync(seedJsonPath, 'utf8'));
const sql = readFileSync(seedSqlPath, 'utf8');

const KINDS = ['directive', 'decision', 'reflection', 'handoff']; // 0035-discussions CHECK
const VISIBILITY = ['shared', 'private'];
const STATUS = ['open', 'resolved', 'archived'];
const PROGRAM_SLUG = 'colg-church-infra-program-2026-06';

describe('church infra program seed — shape + role scope', () => {
  it('is role-scoped to the COLG instance, never a public/family seed', () => {
    expect(seed.instance_slug).toBe('colg');
  });

  it('declares exactly the one program project, domain church', () => {
    expect(Array.isArray(seed.projects)).toBe(true);
    expect(seed.projects).toHaveLength(1);
    const p = seed.projects[0];
    expect(p.slug).toBe(PROGRAM_SLUG);
    expect(p.domain).toBe('church');
    expect(p.title).toMatch(/Church Infrastructure Program/i);
  });

  it('carries all 7 milestone items, item_no 1..7, none dropped', () => {
    expect(Array.isArray(seed.items)).toBe(true);
    expect(seed.items).toHaveLength(7);
    const nums = seed.items.map((i) => i.item_no).sort((a, b) => a - b);
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const slugs = new Set(seed.items.map((i) => i.slug));
    expect(slugs.size).toBe(7); // no duplicate slugs
  });
});

describe('church infra program seed — every item is valid and wired to the program', () => {
  for (const item of seed.items) {
    it(`item ${item.item_no} (${item.slug}) has a valid kind/visibility/status and links the program`, () => {
      expect(KINDS).toContain(item.kind);
      expect(VISIBILITY).toContain(item.visibility);
      expect(STATUS).toContain(item.status);
      expect(item.title && item.title.length).toBeGreaterThan(0);
      expect(item.body && item.body.length).toBeGreaterThan(0);
      expect(item.project_slugs).toContain(PROGRAM_SLUG);
    });
  }
});

describe('church infra program seed — link integrity (no broken in-app doc links)', () => {
  const allWithDocs = [seed.projects[0], ...seed.items];
  for (const rec of allWithDocs) {
    const label = rec.slug;
    it(`${label}: every linked_doc exists on this branch`, () => {
      for (const docPath of rec.linked_docs || []) {
        expect(existsSync(resolve(repoRoot, docPath)), `missing linked_doc: ${docPath}`).toBe(true);
      }
    });
    it(`${label}: every pending_doc carries a {path, reason} (honest in-flight flag)`, () => {
      for (const pd of rec.pending_docs || []) {
        expect(typeof pd.path).toBe('string');
        expect(pd.path.length).toBeGreaterThan(0);
        expect(typeof pd.reason).toBe('string');
        expect(pd.reason.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('church infra program seed — no fabricated specs (DR-0076)', () => {
  it('every sme_pending entry names a field and a reason, never a value', () => {
    for (const item of seed.items) {
      for (const sp of item.sme_pending || []) {
        expect(typeof sp.field).toBe('string');
        expect(sp.field.length).toBeGreaterThan(0);
        expect(typeof sp.reason).toBe('string');
        expect(sp.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it('the staff Learn course (item 6) is flagged SME-pending with no fabricated doc', () => {
    const course = seed.items.find((i) => i.item_no === 6);
    expect(course).toBeTruthy();
    expect(course.verify_status).toBe('SME-PENDING');
    expect(course.sme_pending.length).toBeGreaterThan(0);
    expect(course.linked_docs).toHaveLength(0); // no invented curriculum doc
  });
});

describe('church infra program seed — JSON and SQL cannot drift', () => {
  it('the SQL applies the same program + item slugs as the JSON', () => {
    expect(sql).toContain(PROGRAM_SLUG);
    for (const item of seed.items) {
      expect(sql, `SQL missing item slug: ${item.slug}`).toContain(item.slug);
    }
  });

  it('the SQL is idempotent and colg-scoped (the proven seed pattern)', () => {
    expect(sql).toMatch(/slug\s*=\s*'colg'/);
    expect(sql).toMatch(/ON CONFLICT \(instance_id, slug\) DO NOTHING/);
  });
});
