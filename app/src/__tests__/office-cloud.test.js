// office-cloud — the office_records sync layer (DR-0271): Christina and her
// granted assistant see the SAME workspace. Proven-to-catch on the pure
// contract: row mapping round-trips, seeds NEVER upload (every cloud row is a
// real record — DR-0061), the partitioned merge folds cloud rows in without
// dropping a never-uploaded local record or the local seed baseline, and the
// schedule row mirrors the store's wholesale authority.
import { describe, it, expect } from 'vitest';
import { createOfficeCloud } from '../modules/office-assistant/cloud.js';
import { createOfficeModel } from '../modules/office-assistant/model.js';
import { createOfficeStore } from '../modules/office-assistant/store.js';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';

const cloud = createOfficeCloud(TLC_CONFIG);
const ids = { tenantId: 'inst-1', userId: 'user-1' };

describe('office-cloud — row mapping', () => {
  it('toRow carries instance + office + kind + slug(=local id) + clean payload', () => {
    const org = { id: 'org-abc', organization: 'Real Org', categoryId: 'medical', remoteUuid: 'should-strip' };
    const row = cloud.toRow('org', org, ids);
    expect(row.instance_id).toBe('inst-1');
    expect(row.created_by).toBe('user-1');
    expect(row.office_id).toBe('tlc');
    expect(row.kind).toBe('org');
    expect(row.slug).toBe('org-abc');
    expect(row.payload.organization).toBe('Real Org');
    expect(row.payload.remoteUuid).toBeUndefined(); // sync bookkeeping never nests
  });

  it('fromRow round-trips: local id from slug/payload, cloud uuid as remoteUuid', () => {
    const row = { id: 'uuid-1', kind: 'post', slug: 'post-x', payload: { id: 'post-x', caption: 'Hi' } };
    const { kind, item } = cloud.fromRow(row);
    expect(kind).toBe('post');
    expect(item.id).toBe('post-x');
    expect(item.remoteUuid).toBe('uuid-1');
    expect(item.caption).toBe('Hi');
  });

  it('the schedule maps to ONE row (slug "schedule") holding the whole list', () => {
    const row = cloud.toRow('schedule', { blocks: [{ id: 'b1', time: '9:00', name: 'Open' }] }, ids);
    expect(row.slug).toBe('schedule');
    expect(row.payload.blocks).toHaveLength(1);
  });
});

describe('office-cloud — seeds never upload (DR-0061: real records only)', () => {
  it('onAdd refuses a seed/sample row before touching the network', async () => {
    const res = await cloud.onAdd('org', { id: 'seed-org-01', organization: 'Sample' });
    expect(res).toEqual({ skipped: 'seed' });
  });
  it('onUpdate refuses a seed row too', async () => {
    const res = await cloud.onUpdate('org', { id: 'seed-org-02', organization: 'Sample' });
    expect(res).toEqual({ skipped: 'seed' });
  });
  it('a real row signed out is a fail-soft no-op (device-local keeps working)', async () => {
    const res = await cloud.onAdd('org', { id: 'org-real', organization: 'Real' });
    expect(res.skipped).toBe('signed-out');
  });
});

describe('office-cloud — partition', () => {
  it('splits rows into orgs/posts/ideas and the schedule blocks', () => {
    const rows = [
      { id: 'u1', kind: 'org', slug: 'org-1', payload: { id: 'org-1', organization: 'A' } },
      { id: 'u2', kind: 'post', slug: 'post-1', payload: { id: 'post-1', caption: 'C' } },
      { id: 'u3', kind: 'idea', slug: 'idea-1', payload: { id: 'idea-1', text: 'T' } },
      { id: 'u4', kind: 'schedule', slug: 'schedule', payload: { blocks: [{ id: 'b1', name: 'Open' }] } },
    ];
    const p = cloud.partition(rows);
    expect(p.orgs).toHaveLength(1);
    expect(p.posts).toHaveLength(1);
    expect(p.ideas).toHaveLength(1);
    expect(p.schedule.blocks).toHaveLength(1);
    expect(p.orgs[0].remoteUuid).toBe('u1');
  });
  it('an unknown kind is ignored, never crashes the merge', () => {
    const p = cloud.partition([{ id: 'u9', kind: 'mystery', slug: 'x', payload: {} }]);
    expect(p.orgs).toHaveLength(0);
  });
});

describe('office store — mergeRemote (cloud authoritative, local survivors kept)', () => {
  function freshStore() {
    const model = createOfficeModel(TLC_CONFIG);
    try { localStorage.removeItem(TLC_CONFIG.storageKey); } catch { /* node env */ }
    return { store: createOfficeStore(TLC_CONFIG, model), model };
  }

  it('folds cloud rows in, keeps a never-uploaded local record and the seed baseline', () => {
    const { store, model } = freshStore();
    const local = store.addOrg({ organization: 'Local Only', categoryId: 'medical' });
    store.mergeRemote({
      orgs: [{ id: 'org-cloud', organization: 'From Cloud', categoryId: 'community', remoteUuid: 'u-c' }],
      posts: [], ideas: [], schedule: null,
    });
    const orgs = store.getState().orgs;
    const idsNow = orgs.map((o) => o.id);
    expect(idsNow).toContain('org-cloud');            // cloud row landed
    expect(idsNow).toContain(local.id);               // unsynced local survives
    for (const seed of model.seedOrgs) expect(idsNow).toContain(seed.id); // baseline intact
  });

  it('an EMPTY cloud list is not proof of deletion — local rows are kept', () => {
    const { store } = freshStore();
    const local = store.addOrg({ organization: 'Keep Me', categoryId: 'legal' });
    store.mergeRemote({ orgs: [], posts: [], ideas: [], schedule: null });
    expect(store.getState().orgs.map((o) => o.id)).toContain(local.id);
  });

  it('a remote schedule replaces wholesale; no remote schedule keeps the local one', () => {
    const { store } = freshStore();
    const before = store.getState().schedule.length;
    store.mergeRemote({ orgs: [], posts: [], ideas: [], schedule: { blocks: [{ id: 'b9', time: '1:00', name: 'Only' }] } });
    expect(store.getState().schedule).toHaveLength(1);
    expect(store.getState().schedule[0].name).toBe('Only');
    store.mergeRemote({ orgs: [], posts: [], ideas: [], schedule: null });
    expect(store.getState().schedule).toHaveLength(1); // null = no authority, keep
    expect(before).toBeGreaterThan(0);
  });

  it('stampRemote records the cloud uuid without duplicating the row', () => {
    const { store } = freshStore();
    const org = store.addOrg({ organization: 'Stamp Me', categoryId: 'business' });
    store.stampRemote('org', org.id, 'uuid-stamped');
    const found = store.getState().orgs.filter((o) => o.id === org.id);
    expect(found).toHaveLength(1);
    expect(found[0].remoteUuid).toBe('uuid-stamped');
  });

  it('outbound hooks fire on real adds and skip nothing local (fake cloud)', () => {
    const { store } = freshStore();
    const calls = [];
    store.attachCloud({
      onAdd: (kind, item) => { calls.push(['add', kind, item.id]); },
      onUpdate: (kind, item) => { calls.push(['update', kind, item.id]); },
      onScheduleReplace: (blocks) => { calls.push(['schedule', blocks.length]); },
    });
    const org = store.addOrg({ organization: 'Wired', categoryId: 'medical' });
    store.updateOrg(org.id, { jobTitle: 'Manager' });
    store.addBlock({ time: '2:00', name: 'New block' });
    expect(calls[0]).toEqual(['add', 'org', org.id]);
    expect(calls[1]).toEqual(['update', 'org', org.id]);
    expect(calls[2][0]).toBe('schedule');
  });
});
