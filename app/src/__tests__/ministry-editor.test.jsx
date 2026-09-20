// @vitest-environment jsdom
// =============================================================================
// The office edits its own list — no agent, no commit, no deploy
// =============================================================================
// Darrell 2026-09-20: "expandable by staff and no need for technical work."
//
// The table and the merge without a SCREEN deliver none of that — the office
// would still need an agent to add a ministry, which is the exact thing being
// removed. These gate the screen and the rules underneath it.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { slugify, blankMinistry } from '../lib/church-ministries-sync.js';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

describe('a name the office types becomes a safe, stable key', () => {
  it('turns a real ministry name into a slug', () => {
    expect(slugify('Motorcycle Ministry')).toBe('motorcycle-ministry');
    expect(slugify("Children's Ministry")).toBe('childrens-ministry');
    expect(slugify('School Outreach & Youth Education')).toBe('school-outreach-youth-education');
  });

  it('never leaves a leading or trailing dash', () => {
    expect(slugify('  Prayer!  ')).toBe('prayer');
    expect(slugify('***')).toBe('');
  });

  it('returns empty for a name with nothing usable, so the caller can refuse', () => {
    // Writing a row keyed on '' would collide with the next one and silently
    // overwrite it.
    for (const junk of ['', '   ', '!!!', null, undefined]) expect(slugify(junk)).toBe('');
  });

  it('is bounded, so a pasted paragraph cannot become a key', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(40);
  });
});

describe('the rules the editor enforces', () => {
  const src = read('app/src/components/MinistryEditor.jsx');

  it('renders for owner/admin only', () => {
    // A Retire button in front of a member is an invitation to an accident.
    expect(src).toMatch(/if \(!access\.canEdit\) return null;/);
  });

  it('refuses a nameless ministry rather than writing a blank row', () => {
    expect(src).toMatch(/Give the ministry a name first/);
  });

  it('refuses a name that yields no slug', () => {
    expect(src).toMatch(/no letters or numbers in it/);
  });

  it('derives the slug ONLY on create, never on rename', () => {
    // Re-deriving on edit would orphan every volunteer attached to the old
    // slug. `draft.id || slugify(name)` is the whole guarantee.
    expect(src).toMatch(/const id = draft\.id \|\| slugify\(name\)/);
  });

  it('says plainly that no code is needed, because that is the point', () => {
    expect(src).toMatch(/Nobody has to write any code/);
  });

  it('a blank ministry starts empty, not half-filled with a guess', () => {
    const b = blankMinistry(3);
    expect(b.id).toBe('');
    expect(b.name).toBe('');
    expect(b.sortOrder).toBe(3);
  });
});

describe('the door underneath it fails in the safe direction', () => {
  const src = read('app/src/lib/church-ministries-sync.js');

  it('RETIRES rather than deletes — the history is the church’s', () => {
    // A ministry that ran for years is part of the record, and volunteers are
    // attached to its slug.
    expect(src).toMatch(/is_active: false/);
    expect(src, 'a hard delete was introduced').not.toMatch(/\.delete\(\)/);
  });

  it('every read failure falls back to the seed, never to an empty church', () => {
    // An empty volunteer list on the morning a flyer goes out is worse than a
    // slightly stale one.
    const loads = src.slice(src.indexOf('export async function loadMinistries'));
    expect((loads.match(/CHURCH_MINISTRIES/g) || []).length).toBeGreaterThanOrEqual(3);
  });

  it('a failed access check denies the edit rather than guessing permissive', () => {
    expect(src).toMatch(/catch \(_\) \{[\s\S]{0,200}canEdit: false/);
  });

  it('reading needs NO session — the invitation is public', () => {
    // The flyer with this QR code is handed to strangers; a list that demanded
    // an account before showing itself would turn an invitation into a door.
    const loads = src.slice(src.indexOf('export async function loadMinistries'), src.indexOf('export async function saveMinistry'));
    expect(loads, 'the public read was gated behind a session').not.toMatch(/getSession|currentSession/);
  });

  it('writes upsert on the tenant+slug pair, so editing a seeded ministry sticks', () => {
    expect(src).toMatch(/onConflict: 'instance_id,slug'/);
  });
});
