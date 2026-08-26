// @vitest-environment node
// =============================================================================
// The Poe Properties App — the module, the door, and the database contract
// =============================================================================
// DR-0313. Three things this gate exists to catch, each a class that has ALREADY
// bitten this repo once:
//
//   1. THE CAPABILITY LISTS DRIFT. The app's idea of what a manager or a 1099
//      worker may do is a MIRROR of migration 0075's vocabulary. If the SQL adds
//      or renames a capability and this module does not, the invite UI silently
//      offers (or hides) the wrong thing. So the vocabulary is read OUT OF THE
//      SQL and compared — no second source of truth survives this test.
//   2. THE INSTALL FACE COLLAPSES. A fifth installable app on one origin has to
//      carry a disjoint scope, be served by a real page whose STATIC markup links
//      its manifest, and actually be built by vite (DR-0258/DR-0261).
//   3. THE PLAN LIES. A phase that claims "built" with no evidence, or defers
//      with no re-review date, is exactly the painted-status class DR-0076 and
//      DR-0075 exist to stop.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  ROLE_CEILING, ALL_CAPABILITIES, CAPABILITY_LABELS, capabilitiesFor, resolveFace,
  buildHistory, newestFirst, buildJobDoc, buildTenancyNote,
  rentRecordToBookEntry, unpostedRent, canPostToBooks,
} from '../modules/properties/model.js';
import { POE_PROPERTIES, LAUNCH_PLAN, OPPORTUNITIES, CONSTRAINTS, validateLaunchPlan } from '../modules/properties/config.js';

const here = dirname(fileURLToPath(import.meta.url));
const repo = (rel) => join(here, '../../../', rel);
const pub = (rel) => join(here, '../../public/', rel);
const readRepo = (rel) => readFileSync(repo(rel), 'utf8');

const MIGRATION = 'infra/supabase/migrations-auto/0150-poe-properties-app-invite-claim-and-household.sql';
const SMOKE = 'infra/supabase/tests/0150-poe-properties-isolation-smoke.sql';

describe('the capability vocabulary MIRRORS the database (no second source of truth)', () => {
  const sql = readRepo('infra/supabase/migrations-auto/0075-delegated-property-management.sql');

  it('every capability the app can offer exists in 0075', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(sql.includes(`'${cap}'`), `${cap} is offered by the app but never appears in migration 0075`).toBe(true);
    }
  });

  it('the role ceilings match the ones the claim function enforces', () => {
    const claim = readRepo(MIGRATION);
    // The function's CASE arms are the server-side ceiling. Every capability the
    // app would offer for a role must appear in that role's arm.
    const arm = (role) => {
      const m = new RegExp(`WHEN '${role}'\\s+THEN ARRAY\\[([^\\]]+)\\]`).exec(claim);
      return m ? m[1].split(',').map((x) => x.trim().replace(/^'|'$/g, '')) : [];
    };
    expect(arm('manager').sort()).toEqual([...ROLE_CEILING.manager].sort());
    expect(arm('field_worker').sort()).toEqual([...ROLE_CEILING.field_worker].sort());
  });

  it('every offered capability has a plain-language label (nothing raw reaches a landlord)', () => {
    for (const cap of ALL_CAPABILITIES) expect(CAPABILITY_LABELS[cap], `${cap} has no label`).toBeTruthy();
  });

  it('an over-asking request is cut down to the role ceiling — the same rule the server applies', () => {
    expect(capabilitiesFor('field_worker', ['docs.add', 'rent.adjust', 'rentroll.view'])).toEqual(['docs.add']);
    expect(capabilitiesFor('tenant', ['rent.adjust'])).toEqual([]);
    expect(capabilitiesFor('manager', ['rent.adjust', 'nonsense'])).toEqual(['rent.adjust']);
  });
});

describe('the database seam is present and gated', () => {
  const sql = readRepo(MIGRATION);

  it('an invite grants nothing by itself — only claim_property_access() writes a grant', () => {
    expect(existsSync(repo(MIGRATION))).toBe(true);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS property_access_invites/);
    expect(sql).toMatch(/FUNCTION public\.claim_property_access\(\)/);
    // The invite table itself must never be writable by the invitee.
    expect(sql).toMatch(/property_access_invites_insert[\s\S]*?WITH CHECK \(user_role_in_instance\(instance_id\) IN \('owner','admin'\)\)/);
  });

  it('the tenant\'s family gets its own predicate, and it is locked down like user_is_tenant', () => {
    expect(sql).toMatch(/FUNCTION public\.user_is_tenancy_household\(p_tenancy uuid\)/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.user_is_tenancy_household\(uuid\) FROM PUBLIC/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.user_is_tenancy_household\(uuid\) TO authenticated/);
    expect(sql).toMatch(/SECURITY DEFINER[\s\S]*?SET search_path = public/);
  });

  it('the family can read the rent but never write it (the signer reports, the landlord confirms)', () => {
    const insert = /CREATE POLICY rent_records_insert[\s\S]*?;/.exec(sql);
    // 0150 does not touch rent_records_insert at all — that is the proof.
    expect(insert).toBeNull();
    expect(sql).toMatch(/rent_records_read[\s\S]*?user_is_tenancy_household\(tenancy_id\)/);
  });

  it('posting to the books is instance-side only, enforced by a trigger and not by a comment', () => {
    expect(sql).toMatch(/CREATE TRIGGER rent_records_posting_guard/);
    expect(sql).toMatch(/posting to the books is instance-member only/);
    expect(sql).toMatch(/rent_records_posted_tx_uniq/);   // one books entry per record, ever
  });

  it('the isolation smoke exists and is wired into the rls-isolation matrix', () => {
    expect(existsSync(repo(SMOKE)), 'the enablement gate DR-0076 requires is missing').toBe(true);
    const wf = readRepo('.github/workflows/rls-isolation.yml');
    expect(wf).toMatch(/feature: poe-properties/);
    expect(wf).toMatch(/0150-poe-properties-isolation-smoke\.sql/);
  });

  it('the smoke actually asserts the things that would hurt if they broke', () => {
    const smoke = readRepo(SMOKE);
    expect(smoke).toMatch(/BEFORE claiming/);          // an invite is not access
    expect(smoke).toMatch(/stranger claimed/);          // no invite, no grant
    expect(smoke).toMatch(/ceiling LEAKED rent\.adjust/);
    expect(smoke).toMatch(/must be refused — rent stays with the signer/);
    expect(smoke).toMatch(/manager posts to the BOOKS \(must be refused\)/);
    expect(smoke).toMatch(/sees the other landlord/);   // no cross-landlord leak
    expect(smoke.trimEnd().endsWith('ROLLBACK;'), 'the smoke must leave no data behind').toBe(true);
  });
});

describe('the installable face', () => {
  const manifest = JSON.parse(readFileSync(pub('manifest-properties.webmanifest'), 'utf8'));

  it('installs under its OWN name, in its OWN scope', () => {
    expect(manifest.short_name).toBe('Poe Properties');
    expect(manifest.name).not.toMatch(/^PoeTech/);
    expect(manifest.scope).toBe(POE_PROPERTIES.scope);
    expect(manifest.id.startsWith(manifest.scope)).toBe(true);
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
    expect(manifest.start_url).toBe(POE_PROPERTIES.startUrl);
  });

  it('does not sit inside — or contain — the PoeTech scope', () => {
    const poetech = JSON.parse(readFileSync(pub('manifest.webmanifest'), 'utf8'));
    expect(manifest.scope.startsWith(poetech.scope)).toBe(false);
    expect(poetech.scope.startsWith(manifest.scope)).toBe(false);
  });

  it('carries real raster icons (the store/installer path, not SVG-only)', () => {
    for (const size of [192, 512]) {
      expect(existsSync(pub(`properties-icon-${size}.png`)), `properties-icon-${size}.png missing`).toBe(true);
      expect(existsSync(pub(`properties-icon-maskable-${size}.png`)), `maskable ${size} missing`).toBe(true);
    }
    expect(existsSync(pub('properties-apple-touch.png'))).toBe(true);
  });

  it('is served by a real page whose STATIC markup links its manifest', () => {
    const appHtml = join(here, '../../properties/app/index.html');
    expect(existsSync(appHtml), 'app/properties/app/index.html missing — the scope has no page to install from').toBe(true);
    const html = readFileSync(appHtml, 'utf8');
    expect(html).toMatch(/<link rel="manifest" href="\/manifest-properties\.webmanifest"/);
    expect(html).toMatch(/<script type="module" src="\/src\/main\.jsx">/);
  });

  it('the vite config actually builds it (an unbuilt input would 404 the whole scope)', () => {
    const vite = readFileSync(join(here, '../../vite.config.js'), 'utf8');
    expect(vite).toMatch(/properties: fileURLToPath\(new URL\('\.\/properties\/app\/index\.html'/);
  });

  it('the shared link previews as Poe Properties and lands inside the app scope', () => {
    const door = readFileSync(pub('properties/index.html'), 'utf8');
    expect(door).toMatch(/<meta property="og:title" content="Poe Properties"/);
    expect(door).toMatch(/url=\/properties\/app\/\?properties=1/);
  });

  it('the door boots the MODULE, never the monolith (a tenant does not download the family platform)', () => {
    const main = readFileSync(join(here, '../main.jsx'), 'utf8');
    expect(main).toMatch(/__params\.get\('properties'\) === '1'/);
    expect(main).toMatch(/import\('\.\/components\/PropertiesDoor\.jsx'\)/);
    const doorSrc = readFileSync(join(here, '../components/PropertiesDoor.jsx'), 'utf8');
    expect(doorSrc).not.toMatch(/poe-financial-mvp-v28/);
  });
});

describe('ONE module, TWO doors — the two faces cannot drift', () => {
  it('the PoeTech app mounts the SAME module the properties door mounts', () => {
    const surfaces = readFileSync(join(here, '../surfaces.js'), 'utf8');
    expect(surfaces).toMatch(/id: 'properties'[\s\S]*?modules\/properties\/index\.js/);
    const shell = readFileSync(join(here, '../poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/view === 'properties'/);
    const doorSrc = readFileSync(join(here, '../components/PropertiesDoor.jsx'), 'utf8');
    expect(doorSrc).toMatch(/modules\/properties\/PropertiesApp\.jsx/);
  });

  it('the route is known to nav-history, so a properties deep-link survives a reload', () => {
    const nav = readFileSync(join(here, '../lib/nav-history.js'), 'utf8');
    expect(nav).toMatch(/'properties'/);
  });

  it('the module reads with NO instance filter — that is what lets a non-member use it', () => {
    const cloud = readFileSync(join(here, '../modules/properties/cloud.js'), 'utf8');
    // A call needs an import — checking the import is the honest, comment-proof
    // form of "this file never scopes a read by the caller's instance".
    expect(cloud).not.toMatch(/^import[^\n]*getInstanceId/m);
    expect(cloud).not.toMatch(/\.eq\('instance_id'/);
    expect(cloud).toMatch(/from\('rental_tenancies'\)/);
  });
});

describe('the launch plan tells the truth', () => {
  it('validates: built phases name evidence, gated phases name a gate, deferrals carry a date', () => {
    expect(validateLaunchPlan()).toEqual({ ok: true, problems: [] });
  });

  it('the validator can actually FAIL (a gate that cannot fail is theatre)', () => {
    expect(validateLaunchPlan([{ id: 'X', title: 'Done!', state: 'built' }]).ok).toBe(false);
    expect(validateLaunchPlan([{ id: 'Y', title: 'Later', state: 'planned' }]).problems.join(' ')).toMatch(/re-review/);
    expect(validateLaunchPlan([{ id: 'Z', title: 'Someone', state: 'hand' }]).problems.join(' ')).toMatch(/nobody named/);
  });

  it('every phase that claims evidence points at a file that exists', () => {
    for (const p of LAUNCH_PLAN) {
      if (!p.evidence) continue;
      expect(existsSync(repo(p.evidence)), `${p.id} cites ${p.evidence}, which does not exist`).toBe(true);
    }
  });

  it('the opportunities and constraints Darrell asked for are recorded, dated, and specific', () => {
    expect(OPPORTUNITIES.length).toBeGreaterThanOrEqual(4);
    expect(CONSTRAINTS.length).toBeGreaterThanOrEqual(4);
    for (const o of OPPORTUNITIES) expect(o.reReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const c of CONSTRAINTS) expect(c.detail.length).toBeGreaterThan(40);
  });
});

describe('the faces people actually meet', () => {
  it('a tenant gets their place, work orders, the thread, the history, and their payments', () => {
    const face = resolveFace('tenant', []);
    expect(face.tabs.map((t) => t.id)).toEqual(['door', 'work', 'thread', 'history', 'rent', 'notices']);
    // The rollout/plan view is management's, not the tenant's.
    expect(face.tabs.some((t) => t.id === 'plan')).toBe(false);
    expect(face.tabs.some((t) => t.locked)).toBe(false);
    expect(face.canWriteRent).toBe(true);
    expect(face.canPostToBooks).toBe(false);
  });

  it('management sees the rollout, gates and constraints in the app itself (DR-0121)', () => {
    const mgr = resolveFace('manager', ['request.manage']);
    expect(mgr.tabs.some((t) => t.id === 'plan')).toBe(true);
  });

  it('a household member shares the door but the rent is read-only for them', () => {
    const face = resolveFace('household', []);
    expect(face.canWriteRent).toBe(false);
    expect(face.readOnly).toContain('rent');
  });

  it('a 1099 worker with no grants sees WHY a tab is locked instead of a mystery', () => {
    const face = resolveFace('field_worker', []);
    const jobs = face.tabs.find((t) => t.id === 'jobs');
    expect(jobs.locked).toBe(true);
    expect(jobs.lockReason).toMatch(/has not turned on/);
    const granted = resolveFace('field_worker', ['property.history', 'docs.add']);
    expect(granted.tabs.filter((t) => t.locked)).toHaveLength(0);
  });

  it('nobody but the landlord can post to the books', () => {
    for (const role of ['tenant', 'household', 'field_worker', 'manager']) {
      expect(resolveFace(role, ['rent.confirm', 'rent.adjust']).canPostToBooks, `${role} could post to the books`).toBe(false);
    }
    expect(resolveFace('owner', []).canPostToBooks).toBe(true);
  });
});

describe('the relationship record', () => {
  const record = {
    requests: [{ id: 'r1', title: 'Furnace out', created_at: '2026-08-02T10:00:00Z', created_by_role: 'tenant' }],
    messages: [{ id: 'm1', body: 'On my way', sent_at: '2026-08-02T12:00:00Z', from_role: 'manager' }],
    notes: [{ id: 'n1', body: 'Gate left unlocked', created_at: '2026-08-02T11:00:00Z', author_role: 'household' }],
    docs: [{ id: 'd1', outcome: 'not_fixed', followup: 'needs_parts', note: 'Igniter ordered', created_at: '2026-08-03T09:00:00Z' }],
    rent: [{ id: 'p1', amount: 900, for_period: '2026-08', status: 'confirmed', confirmed_at: '2026-08-01T09:00:00Z', reported_by_role: 'tenant' }],
    notices: [{ id: 'x1', title: 'Water shutoff', posted_at: '2026-08-04T09:00:00Z' }],
  };

  it('merges every kind of event into ONE chronological stream', () => {
    const h = buildHistory(record);
    expect(h.map((e) => e.kind)).toEqual(['rent', 'work-order', 'note', 'message', 'job-doc', 'notice']);
  });

  it('a note from the tenant\'s family is IN the record management reads', () => {
    const h = buildHistory(record);
    const note = h.find((e) => e.kind === 'note');
    expect(note.summary).toBe('Gate left unlocked');
  });

  it('an undated row is carried as UNDATED — never given an invented date (DR-0076/DR-0124)', () => {
    const h = buildHistory({ notes: [{ id: 'n9', body: 'no timestamp' }] });
    expect(h[0].undated).toBe(true);
    expect(h[0].at).toBeNull();
    expect(newestFirst(h)[0].undated).toBe(true);   // undated sorts last, not first
  });

  it('newest-first puts dated events before undated ones', () => {
    const h = newestFirst(buildHistory({ ...record, notes: [...record.notes, { id: 'n9', body: 'no date' }] }));
    expect(h[0].kind).toBe('notice');
    expect(h[h.length - 1].undated).toBe(true);
  });
});

describe('job documentation stays honest', () => {
  it('a follow-up reason only survives when the job is NOT fixed', () => {
    expect(buildJobDoc({ outcome: 'fixed', followup: 'needs_parts' }).followup).toBeNull();
    expect(buildJobDoc({ outcome: 'not_fixed', followup: 'needs_parts' }).followup).toBe('needs_parts');
    expect(buildJobDoc({ outcome: 'not_fixed', followup: 'nonsense' }).followup).toBeNull();
  });

  it('an unknown outcome degrades to not_fixed rather than silently claiming a fix', () => {
    expect(buildJobDoc({ outcome: 'whatever' }).outcome).toBe('not_fixed');
  });

  it('a note records the author\'s role in the record\'s own vocabulary', () => {
    expect(buildTenancyNote({ authorRole: 'owner', body: 'x' }).author_role).toBe('landlord');
    expect(buildTenancyNote({ authorRole: 'field_worker', body: 'x' }).author_role).toBe('worker');
    expect(buildTenancyNote({ authorRole: 'household', body: ' y ' }).body).toBe('y');
  });
});

describe('the money river', () => {
  const confirmed = { id: 'p1', amount: 900, for_period: '2026-08', status: 'confirmed', confirmed_at: '2026-08-01T09:00:00Z', method: 'zelle' };

  it('a confirmed payment maps to ONE income entry with a stable id', () => {
    const entry = rentRecordToBookEntry(confirmed, { propertyLabel: '1003 Koehn', unitLabel: 'Unit 1' });
    expect(entry.id).toBe('rent-p1');
    expect(entry.type).toBe('income');
    expect(entry.amount).toBe(900);
    expect(entry.date).toBe('2026-08-01');
    expect(entry.description).toMatch(/1003 Koehn/);
    // Same record in, same id out — the books row can never double-count.
    expect(rentRecordToBookEntry(confirmed).id).toBe(entry.id);
  });

  it('refuses to post what is not confirmed, already posted, or has no amount', () => {
    expect(canPostToBooks(confirmed).ok).toBe(true);
    expect(canPostToBooks({ ...confirmed, status: 'reported' })).toEqual({ ok: false, reason: 'not-confirmed' });
    expect(canPostToBooks({ ...confirmed, posted_tx_id: 'rent-p1' })).toEqual({ ok: false, reason: 'already-posted' });
    expect(canPostToBooks({ ...confirmed, amount: 0 })).toEqual({ ok: false, reason: 'no-amount' });
  });

  it('only confirmed, unposted rent is waiting for the books', () => {
    const waiting = unpostedRent([confirmed, { ...confirmed, id: 'p2', posted_tx_id: 'rent-p2' }, { ...confirmed, id: 'p3', status: 'reported' }]);
    expect(waiting.map((r) => r.id)).toEqual(['p1']);
  });
});
