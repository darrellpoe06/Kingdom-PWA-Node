// =============================================================================
// Your team is named before a shovel moves (DR-1175, migration 0308)
// =============================================================================
// Darrell, 2026-10-21, with a photograph of a slide titled "Your Team":
// "Research and add features and functionality for users to formulation of
// their teams... make sense? Inside the Poe Properties Apps for building from
// nothing... make sense?"
//
// The slide's own list is pinned in your-team-for-building-from-nothing.test.js.
// This file proves the three things that reach a person: the records the names
// are kept in, the seam that writes them, and what the card SAYS — including
// that it never calls the slide's bold "required", and never reads a gap as
// somebody.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DevelopmentTab } from '../modules/properties/DevelopmentTab.jsx';
import { CHILD_TABLES, setTeamMember, projectForEngine } from '../modules/properties/development-cloud.js';
import { DEV_TEAM_ROLES, roleKey } from '../modules/properties/development-team.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SQL = readFileSync(join(ROOT, 'infra/supabase/migrations-auto/0308-a-team-is-named-before-a-shovel-moves.sql'), 'utf8');

// ---------------------------------------------------------------------------
// The records (migration 0308)
// ---------------------------------------------------------------------------
describe('the sixth child of a project is its people', () => {
  it('is the sixth child table, and LAST, because loadProject destructures in this order', () => {
    expect(CHILD_TABLES).toHaveLength(6);
    expect(CHILD_TABLES[5]).toBe('dev_team');
  });

  it('keeps one person to a role, so a count of roles is never a count of rows', () => {
    expect(SQL).toMatch(/UNIQUE \(project_id, role_key\)/);
  });

  it('refuses a row with no name — a nameless row would read as a filled role', () => {
    expect(SQL).toMatch(/dev_team_name_chk CHECK \(length\(btrim\(name\)\) > 0\)/);
    expect(SQL).toMatch(/dev_team_role_chk CHECK \(length\(btrim\(role_key\)\) > 0\)/);
  });

  it('inherits 0307’s wall exactly and declares no new rule of its own', () => {
    expect(SQL).toMatch(/ALTER TABLE public\.dev_team ENABLE ROW LEVEL SECURITY/);
    for (const verb of ['read', 'insert', 'update', 'delete']) {
      expect(SQL).toMatch(new RegExp(`DROP POLICY IF EXISTS dev_team_${verb} ON public\\.dev_team`));
    }
    // Read by a reader; written only by a writer; and a child row must sit in
    // its own project's instance, so a name cannot be filed into another
    // household's project.
    // `[^;]*` and NOT a lazy `[\s\S]*?`: the lazy form runs on past the end of
    // the statement into the NEXT policy, so an insert policy with the instance
    // check deleted still matched its sibling's copy of it. Measured by
    // deleting exactly that clause and watching this assertion stay green.
    expect(SQL).toMatch(/CREATE POLICY dev_team_read[^;]*USING \(public\.dev_can_read\(instance_id\)\)/);
    expect(SQL).toMatch(/CREATE POLICY dev_team_insert[^;]*public\.dev_can_write\(instance_id\) AND public\.dev_project_in\(project_id, instance_id\)/);
    expect(SQL).toMatch(/CREATE POLICY dev_team_update[^;]*public\.dev_can_write\(instance_id\) AND public\.dev_project_in\(project_id, instance_id\)/);
    // It defines none of the three functions — it joins the wall already standing.
    expect(SQL).not.toMatch(/CREATE OR REPLACE FUNCTION public\.dev_can_/);
    // And nothing here is granted to anon.
    expect(SQL).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.dev_team TO authenticated/);
    expect(SQL).not.toMatch(/TO anon/);
  });

  it('runs both overlays, in 0232’s order, like its five siblings', () => {
    const a = SQL.indexOf('apply_assistant_scope_overlay');
    const v = SQL.indexOf('apply_viewer_readonly_overlay');
    expect(a).toBeGreaterThan(-1);
    expect(v).toBeGreaterThan(a);
  });

  it('can be applied twice', () => {
    expect(SQL).toMatch(/CREATE TABLE IF NOT EXISTS public\.dev_team/);
    expect(SQL).toMatch(/CREATE INDEX IF NOT EXISTS dev_team_project_idx/);
  });
});

// ---------------------------------------------------------------------------
// The seam that writes a name
// ---------------------------------------------------------------------------
const fakeClient = (result = { data: { id: 't1' }, error: null }) => {
  const calls = { upsert: null, onConflict: null, table: null };
  return {
    calls,
    from(table) {
      calls.table = table;
      return {
        upsert(row, opts) { calls.upsert = row; calls.onConflict = opts && opts.onConflict; return this; },
        select() { return this; },
        single() { return Promise.resolve(result); },
      };
    },
  };
};
const PROJECT = { id: 'p1', instance_id: 'i1', name: 'Richmond 40', kind: 'mixed-use' };

describe('naming whoever fills a role', () => {
  it('writes one row for the project and the role, replacing rather than doubling', async () => {
    const c = fakeClient();
    const r = await setTeamMember(PROJECT, { roleKey: 'surveyor', name: ' Ames Land Survey ', phone: '555-0101' }, c);
    expect(r.ok).toBe(true);
    expect(c.calls.table).toBe('dev_team');
    expect(c.calls.onConflict).toBe('project_id,role_key');
    expect(c.calls.upsert).toMatchObject({ project_id: 'p1', instance_id: 'i1', role_key: 'surveyor', name: 'Ames Land Survey', phone: '555-0101' });
  });

  it('a blank is NULL, never an empty string pretending to be a value', async () => {
    const c = fakeClient();
    await setTeamMember(PROJECT, { roleKey: 'gc', name: 'Bell Brothers' }, c);
    expect(c.calls.upsert.phone).toBe(null);
    expect(c.calls.upsert.email).toBe(null);
    expect(c.calls.upsert.joined_on).toBe(null);
    expect(c.calls.upsert.label).toBe(null);
  });

  it('refuses a nameless person with ITS OWN reason, not the project’s', async () => {
    const c = fakeClient();
    expect((await setTeamMember(PROJECT, { roleKey: 'gc', name: '   ' }, c)).reason).toBe('needs-a-person');
    expect((await setTeamMember(PROJECT, { roleKey: '', name: 'Someone' }, c)).reason).toBe('needs-a-role');
    expect((await setTeamMember(null, { roleKey: 'gc', name: 'Someone' }, c)).reason).toBe('no-project');
    // Nothing was written by any of the three.
    expect(c.calls.upsert).toBe(null);
  });

  it('never throws: a dark network is a reason', async () => {
    const dark = { from() { throw Object.assign(new Error('boom'), { name: 'TimeoutError' }); } };
    const r = await setTeamMember(PROJECT, { roleKey: 'gc', name: 'Bell Brothers' }, dark);
    expect(r).toMatchObject({ ok: false, reason: 'timed-out' });
  });

  it('turns the rows into the shape teamState reads, keyed by role', () => {
    const e = projectForEngine(PROJECT, {
      team: [
        { id: 't1', role_key: 'surveyor', label: null, name: 'Ames Land Survey', company: null, phone: '555', email: null, note: null, joined_on: '2026-03-01' },
        { id: 't2', role_key: 'architect', label: null, name: 'R. Okafor', company: 'Okafor Studio', phone: null, email: null, note: null, joined_on: null },
      ],
    });
    expect(Object.keys(e.filled).sort()).toEqual(['architect', 'surveyor']);
    expect(e.filled.surveyor).toMatchObject({ id: 't1', name: 'Ames Land Survey', joinedOn: '2026-03-01' });
    expect(e.team).toHaveLength(2);
    // A project with no team is an EMPTY record, never a missing one.
    expect(projectForEngine(PROJECT, {}).filled).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// What the card says
// ---------------------------------------------------------------------------
let host;
let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const settle = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 10)); }); };
const byId = (id) => host.querySelector(`#${id}`);
const byTest = (id) => host.querySelector(`[data-testid="${id}"]`);
async function setValue(el, v) {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  await act(async () => { el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
  await settle();
}
const api = ({ kind = 'mixed-use', team = [], ...over } = {}) => {
  const project = { ...PROJECT, kind };
  return {
    instanceId: vi.fn(async () => 'i1'),
    loadProjects: vi.fn(async () => ({ ok: true, projects: [project] })),
    loadProject: vi.fn(async () => ({ ok: true, lines: [], changeOrders: [], bays: [], checks: [], capital: [], team })),
    createProject: vi.fn(async () => ({ ok: true, project })),
    patchProject: vi.fn(async () => ({ ok: true })),
    addRow: vi.fn(async () => ({ ok: true })),
    patchRow: vi.fn(async () => ({ ok: true })),
    deleteRow: vi.fn(async () => ({ ok: true })),
    setCheck: vi.fn(async () => ({ ok: true })),
    setTeamMember: vi.fn(async () => ({ ok: true })),
    ...over,
  };
};
async function pick(a) {
  await act(async () => { root.render(createElement(DevelopmentTab, { api: a })); });
  await settle();
  await setValue(byId('dev-project'), 'p1');
  return a;
}

describe('the Team card on the screen', () => {
  it('offers all sixteen on a mixed-use build, in the slide’s numbering', async () => {
    await pick(api());
    const items = byTest('dev-team-list').querySelectorAll('li');
    expect(items).toHaveLength(16);
    expect(items[0].textContent).toMatch(/1\.\s*Surveyor/);
    expect(items[15].textContent).toMatch(/16\.\s*Property Manager/);
    expect(items[15].textContent).toMatch(/should be a part of the dev process/);
  });

  it('a home build offers thirteen and says why the other three are not shown', async () => {
    await pick(api({ kind: 'home' }));
    expect(byTest('dev-team-list').querySelectorAll('li')).toHaveLength(13);
    expect(byTest('dev-team-list').textContent).not.toMatch(/MEP Engineer/);
    expect(host.textContent).toMatch(/civil, MEP and structural engineers/);
  });

  it('an empty record reads as sixteen gaps and names the first to go and find', async () => {
    await pick(api());
    expect(byTest('dev-team-count').textContent).toBe('0 of 16 filled');
    expect(byTest('dev-team-words').textContent).toMatch(/Nobody on the team yet — 16 roles to fill/);
    const first = byTest('dev-team-list').querySelectorAll('li')[0];
    expect(first.textContent).toMatch(/nobody yet · next by the numbering/);
  });

  it('shows whoever fills a role, and their reach, and counts only them', async () => {
    await pick(api({ team: [
      { id: 't1', role_key: 'surveyor', label: null, name: 'Ames Land Survey', company: 'Ames', phone: '555-0101', email: null, note: 'knows the county', joined_on: '2026-03-01' },
    ] }));
    expect(byTest('dev-team-count').textContent).toBe('1 of 16 filled');
    expect(byTest('dev-team-words').textContent).toMatch(/1 of 16 filled · 15 to go · next by the numbering: Soil Engineer/);
    const first = byTest('dev-team-list').querySelectorAll('li')[0];
    expect(first.textContent).toMatch(/Ames Land Survey · Ames/);
    expect(first.textContent).toMatch(/555-0101 · since 2026-03-01 · knows the county/);
  });

  it('names someone through the seam, with the role’s own key', async () => {
    const a = await pick(api());
    const nameBtn = [...host.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Name someone for Soil Engineer');
    expect(nameBtn).toBeTruthy();
    await act(async () => { nameBtn.click(); });
    await settle();
    await setValue(byId('team-name-soil-engineer'), 'Piedmont Geotechnical');
    await setValue(byId('team-phone-soil-engineer'), '555-0202');
    const save = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Save');
    await act(async () => { save.click(); });
    await settle();
    expect(a.setTeamMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1' }),
      expect.objectContaining({ roleKey: 'soil-engineer', name: 'Piedmont Geotechnical', phone: '555-0202' }),
    );
  });

  it('PROVEN TO CATCH: the card shows the slide’s emphasis and never calls it required', async () => {
    await pick(api());
    expect(host.textContent).not.toMatch(/required/i);
    expect(host.textContent).toMatch(/It sets nine of them in bold and does not say what bold means/);
    expect(host.textContent).toMatch(/9 of the 9 it emphasises are still to find/);
  });

  it('says whose the reading of the numbering is, so his list and mine are never one voice', async () => {
    await pick(api());
    expect(byTest('dev-team-reading').textContent)
      .toMatch(/Reading the numbering \(read from the numbering by PoeTech, not stated on the slide\)/);
  });

  it('clearing a role goes through delete, so the role becomes a gap again', async () => {
    const a = await pick(api({ team: [{ id: 't9', role_key: 'gc', label: null, name: 'Bell Brothers', company: null, phone: null, email: null, note: null, joined_on: null }] }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const remove = [...host.querySelectorAll('button')].find((b) => b.textContent === 'remove');
    await act(async () => { remove.click(); });
    await settle();
    expect(a.deleteRow).toHaveBeenCalledWith('dev_team', 't9');
    confirm.mockRestore();
  });

  it('every role on the card has a key the records can hold', () => {
    for (const r of DEV_TEAM_ROLES) expect(roleKey(r.role)).toMatch(/^[a-z0-9][a-z0-9-]*$/);
  });
});
