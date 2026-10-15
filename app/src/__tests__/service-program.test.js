// Tests for lib/service-program.js — the Order of Service derivation + timing.
// Locks the row<->shape mappers, sector routing, the schedule clock math, the
// proportional reflow (sermon stays fixed), and the master->sector derivation
// the surface renders. Pure functions only; no Supabase.
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the reflow case asserts the FIXED
// sermon segment is NOT compressed when the service is short — the whole point of
// the fixed flag. If reflow ever scales fixed segments, that test fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  toProgramShape, toSegmentShape, sectorForRole, sectorLabel, STEWARD,
  parseClock, formatClock, computeSchedule, reflowProgram, deriveSectorView,
  seedDefaultOrder, deriveAccess, accessDiagnosis, playbookFor, summarizeChange, toChangeShape, toFinalizerMemberShape,
  parsePeople, peopleOf, whoText, whoServes, segmentRow, windowSay, SERVICE_WINDOW,
} from '../lib/service-program.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('mappers', () => {
  it('toProgramShape defaults missing fields', () => {
    const p = toProgramShape({ id: 'p1', service_date: '2026-06-28' });
    expect(p).toMatchObject({ id: 'p1', serviceDate: '2026-06-28', serviceType: 'sunday', status: 'draft', title: 'Order of Worship' });
  });
  it('toSegmentShape coerces arrays/objects + flexible default', () => {
    const s = toSegmentShape({ id: 's1', program_id: 'p1', title: 'Sermon', sector: 'pulpit', song_ids: null, cues: null });
    expect(s.songIds).toEqual([]);
    expect(s.cues).toEqual({});
    expect(s.flexible).toBe(true);
    const fixed = toSegmentShape({ id: 's2', program_id: 'p1', title: 'Sermon', flexible: false, song_ids: ['a', 'b'] });
    expect(fixed.flexible).toBe(false);
    expect(fixed.songIds).toEqual(['a', 'b']);
  });
});

describe('sectorForRole', () => {
  it('owner/admin steward the whole master', () => {
    expect(sectorForRole('owner', null)).toBe(STEWARD);
    expect(sectorForRole('admin', 'media')).toBe(STEWARD);
  });
  it('maps choir roles to their sector', () => {
    expect(sectorForRole('member', 'musician')).toBe('music');
    expect(sectorForRole('member', 'sound')).toBe('media');
    expect(sectorForRole('member', 'tech')).toBe('media');
    expect(sectorForRole('member', 'director')).toBe('worship');
    expect(sectorForRole('member', null)).toBe('worship');
  });
  it('labels steward + a sector', () => {
    expect(sectorLabel(STEWARD)).toMatch(/Steward/);
    expect(sectorLabel('pulpit')).toMatch(/Preacher/);
  });
});

describe('clock math', () => {
  it('parseClock parses and rejects', () => {
    expect(parseClock('11:00')).toBe(660);
    expect(parseClock('9:05')).toBe(545);
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('bad')).toBeNull();
  });
  it('formatClock renders 12h', () => {
    expect(formatClock(660)).toBe('11:00 AM');
    expect(formatClock(13 * 60 + 5)).toBe('1:05 PM');
    expect(formatClock(0)).toBe('12:00 AM');
  });
});

describe('computeSchedule', () => {
  const segs = [
    { id: 'b', sortOrder: 20, plannedMinutes: 20 },
    { id: 'a', sortOrder: 10, plannedMinutes: 5 },
    { id: 'c', sortOrder: 30, plannedMinutes: 35 },
  ];
  it('orders by sortOrder and accumulates clocks from start', () => {
    const out = computeSchedule(segs, '11:00');
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(out[0].startClock).toBe('11:00 AM');
    expect(out[1].startClock).toBe('11:05 AM'); // after 5'
    expect(out[2].startClock).toBe('11:25 AM'); // after 5'+20'
  });
  it('no start time -> null clocks but still ordered', () => {
    const out = computeSchedule(segs, null);
    expect(out[0].startClock).toBeNull();
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('reflowProgram', () => {
  const segs = [
    { id: 'praise', sortOrder: 10, plannedMinutes: 20, flexible: true },
    { id: 'sermon', sortOrder: 20, plannedMinutes: 40, flexible: false },
    { id: 'altar', sortOrder: 30, plannedMinutes: 20, flexible: true },
  ];
  it('keeps the fixed sermon and compresses only flexible segments', () => {
    // planned 80; fixed 40; flex 40. Target 60 -> flex budget 20 -> scale 0.5.
    const r = reflowProgram(segs, 60);
    expect(r.plannedTotal).toBe(80);
    expect(r.fixedTotal).toBe(40);
    expect(r.scale).toBeCloseTo(0.5, 5);
    const byId = Object.fromEntries(r.segments.map((s) => [s.id, s.adjustedMinutes]));
    expect(byId.sermon).toBe(40);   // FIXED — never compressed
    expect(byId.praise).toBe(10);   // 20 * 0.5
    expect(byId.altar).toBe(10);    // 20 * 0.5
  });
  it('flags infeasible when fixed alone exceeds the available time', () => {
    const r = reflowProgram(segs, 30); // fixed 40 > 30
    expect(r.feasible).toBe(false);
  });
  it('expands flexible segments when more time is available', () => {
    const r = reflowProgram(segs, 100); // flex budget 60 over flex 40 -> 1.5x
    const byId = Object.fromEntries(r.segments.map((s) => [s.id, s.adjustedMinutes]));
    expect(byId.sermon).toBe(40);
    expect(byId.praise).toBe(30);
  });
});

describe('deriveSectorView', () => {
  const program = { id: 'p1', title: 'Order of Worship', serviceDate: '2026-06-28', startTime: '11:00', status: 'published' };
  const segs = [
    { id: 's1', programId: 'p1', sortOrder: 10, title: 'Praise & Worship', sector: 'worship', plannedMinutes: 20, songIds: ['song1'], cues: { media: 'Lyrics lower-third', music: 'Key of Bb' } },
    { id: 's2', programId: 'p1', sortOrder: 20, title: 'Sermon', sector: 'pulpit', plannedMinutes: 35, flexible: false, sermonId: 'serm1', cues: { media: 'Sermon title slate' } },
    { id: 's3', programId: 'p1', sortOrder: 30, title: 'Welcome', sector: 'general', plannedMinutes: 5 },
  ];
  const songs = [{ id: 'song1', title: 'Goodness of God', scriptureRef: 'Ps 23', notes: 'verse 1 only' }];
  const sermons = [{ id: 'serm1', title: 'The Narrow Way', speaker: 'Bishop Gwin', scriptureRef: 'Matt 7:13-14' }];

  it('worship lens: owns praise, resolves the real song, sees its own cue', () => {
    const v = deriveSectorView(program, segs, 'worship', { songs, sermons });
    expect(v.flow).toHaveLength(3);
    const praise = v.flow.find((f) => f.id === 's1');
    expect(praise.isOwner).toBe(true);
    expect(praise.songs[0].title).toBe('Goodness of God');
    expect(praise.startClock).toBe('11:00 AM');
    // worship does not own the sermon
    expect(v.flow.find((f) => f.id === 's2').isOwner).toBe(false);
    expect(v.mineCount).toBe(1);
  });
  it('music lens reads its cross-cutting cue on a segment it does not own', () => {
    const v = deriveSectorView(program, segs, 'music', { songs, sermons });
    const praise = v.flow.find((f) => f.id === 's1');
    expect(praise.isOwner).toBe(false);     // worship owns it
    expect(praise.myCue).toBe('Key of Bb'); // but music still gets its cue
  });
  it('pulpit lens resolves the real sermon on its slot', () => {
    const v = deriveSectorView(program, segs, 'pulpit', { songs, sermons });
    const sermon = v.flow.find((f) => f.id === 's2');
    expect(sermon.isOwner).toBe(true);
    expect(sermon.sermon.speaker).toBe('Bishop Gwin');
  });
  it('general segment is mine for every sector (all-hands)', () => {
    const v = deriveSectorView(program, segs, 'ushers', { songs, sermons });
    expect(v.flow.find((f) => f.id === 's3').isMine).toBe(true);
  });
  it('steward lens owns nothing specific but sees the whole flow', () => {
    const v = deriveSectorView(program, segs, STEWARD, { songs, sermons });
    expect(v.mineCount).toBe(3);
    expect(v.plannedTotalMinutes).toBe(60);
  });
});

describe('seedDefaultOrder + deriveAccess', () => {
  it('seed is the church\u2019s own order, with the Speaker fixed and the Choir lines carried by the Choir (DR-1029)', () => {
    // Darrell 2026-10-15: Prayer · Announcements · Choir, 1 song · Special
    // events (if we have one) · Offering / Givers' Creed · Choir, 2 songs ·
    // Speaker · Benediction.
    const seed = seedDefaultOrder();
    expect(seed.map((s) => s.title)).toEqual([
      'Prayer', 'Announcements', 'Choir \u2014 1 song', 'Special events (if we have one)', 'Offering / Givers\u2019 Creed', 'Choir \u2014 2 songs', 'Speaker', 'Benediction',
    ]);
    const sermon = seed.find((s) => s.title === 'Speaker');
    expect(sermon.flexible).toBe(false);
    expect(seed.filter((s) => s.auxiliary === 'Choir')).toHaveLength(2);
    expect(seed.find((s) => s.title.startsWith('Offering')).auxiliary).toBe('Ushers');
    expect(seed.reduce((n, s) => n + s.plannedMinutes, 0)).toBe(81);
    // strictly increasing sortOrder
    const orders = seed.map((s) => s.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
  it('deriveAccess: owner edits, member sees, outsider neither', () => {
    expect(deriveAccess('owner', false)).toEqual({ canSee: true, canEdit: true });
    expect(deriveAccess(null, true)).toEqual({ canSee: true, canEdit: false });
    expect(deriveAccess(null, false)).toEqual({ canSee: false, canEdit: false });
  });

  // =========================================================================
  // THE ORDER OF SERVICE IS THE CONGREGATION'S TO READ (DR-1037)
  // =========================================================================
  // Darrell 2026-10-15: "Christina does not see the order of service!!!!!!!!!
  // Either!!!!!!!!!" She is a member of the church space and not on the choir
  // roster, and reading the order required CHOIR membership from 0042 until
  // 0293. The case below is the exact account that was locked out, and it is
  // the case this whole describe block never had: every assertion above passes
  // a role of 'owner', 'admin' or null, so a plain member was never tested.
  it('a plain member of the church space SEES the order (the Christina case)', () => {
    expect(deriveAccess('member', false, false)).toEqual({ canSee: true, canEdit: false });
  });

  it('and an usher or deacon named ON the order can open it (0292 made this absurd)', () => {
    // 0292 taught every line to name the auxiliary carrying it -- Choir,
    // Ushers, Deacons -- so a deacon could be printed on the order and unable
    // to read the page he was printed on.
    expect(deriveAccess('member', false, false).canSee).toBe(true);
  });

  it('seeing is NOT editing: a member may read the order and change nothing', () => {
    // The widening is read-only on purpose. 0293 carries no write policy, and
    // this is the assertion that keeps it that way.
    const a = deriveAccess('member', false, false);
    expect(a.canSee).toBe(true);
    expect(a.canEdit).toBe(false);
  });

  it('THE TENANCY WALL DOES NOT MOVE: a non-member still sees nothing', () => {
    // 'a member of THIS church space', never 'anyone signed in' (DR-0060).
    // user_role_in_instance returns NULL outside the space, so role is falsy.
    expect(deriveAccess(null, false, false)).toEqual({ canSee: false, canEdit: false });
    expect(deriveAccess('', false, false)).toEqual({ canSee: false, canEdit: false });
    expect(deriveAccess(undefined, false, false)).toEqual({ canSee: false, canEdit: false });
  });

  it('PROVEN-TO-CATCH: the pre-0293 rule fails the Christina case', () => {
    // The rule as it stood from 0042 until this change, written out. If someone
    // narrows canSee back to choir membership, the assertion above goes red and
    // this one says why in one line.
    const preFix = (role, inChoir, isFinalizer = false) => {
      const isAdmin = role === 'owner' || role === 'admin';
      const canEdit = isAdmin || isFinalizer === true;
      return { canSee: canEdit || inChoir === true, canEdit };
    };
    expect(preFix('member', false, false).canSee).toBe(false);
    expect(deriveAccess('member', false, false).canSee).toBe(true);
  });
});

// ===========================================================================
// THE OTHER HALF: THE POLICIES (DR-1037)
// ===========================================================================
// deriveAccess alone would render the page and the database would hand back
// zero rows. Three tables are gated, not one, and fixing only the first two
// leaves yesterday's "Actual times" and "Track record" tabs blank. These read
// the migration off disk so the UI half can never drift from the SQL half.
describe('0293 widens READING to the whole house, and nothing else', () => {
  const sql = readFileSync(
    join(ROOT, 'infra/supabase/migrations-auto/0293-the-order-of-service-is-the-congregations-to-read.sql'),
    'utf8',
  );
  const TABLES = ['church_service_programs', 'church_service_segments', 'church_service_segment_actuals'];
  // The EXECUTABLE half only. The header deliberately quotes the three old
  // policies so a reader can see what changed, so every "this must not appear"
  // assertion below has to read the statements and not the documentation --
  // which is exactly what tripped the first cut of this test.
  const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');

  it('all THREE read policies move, including the actuals that shipped yesterday', () => {
    // Each POLICY STATEMENT must carry the predicate -- asserted on the
    // statement, not by counting the file, because the header explains the
    // predicate in prose too and a whole-file count reads 4 for 3 policies.
    for (const t of TABLES) {
      const stmt = new RegExp(
        `CREATE POLICY ${t}_read ON ${t} FOR SELECT\\s*\\n?\\s*USING \\(user_role_in_instance\\(instance_id\\) IS NOT NULL\\);`,
      );
      expect(stmt.test(sql), `${t}_read must SELECT on instance membership`).toBe(true);
    }
    // And no choir predicate is left behind on any of them.
    expect(code).not.toMatch(/USING \(user_in_choir/);
  });

  it('it carries NO write policy — a member reads, only the old hands change it', () => {
    expect(code).not.toMatch(/FOR\s+(INSERT|UPDATE|DELETE)/i);
    expect(code).not.toMatch(/WITH CHECK/i);
  });

  it('and it is a member of THIS space, never anyone signed in', () => {
    // The wall is the predicate: user_role_in_instance reads instance_members
    // and returns NULL outside the space (DR-0060).
    expect(sql).toContain('instance_members');
    expect(code).not.toMatch(/USING \(true\)/);
    expect(code).not.toMatch(/auth\.role\(\)\s*=\s*'authenticated'/);
  });
});

describe('finalizer circle (collaborative master edit)', () => {
  it('a designated finalizer who is NOT an admin can edit the whole master', () => {
    // the keyboardist: choir member (sees), is_finalizer true (edits), role null.
    expect(deriveAccess(null, true, true)).toEqual({ canSee: true, canEdit: true });
  });
  it('owner/admin finalize without the flag (BG / Christina / Darrell)', () => {
    expect(deriveAccess('admin', true, false)).toEqual({ canSee: true, canEdit: true });
    expect(deriveAccess('owner', false, false)).toEqual({ canSee: true, canEdit: true });
  });
  it('a non-finalizer member still only reads (sector view), cannot finalize', () => {
    expect(deriveAccess(null, true, false)).toEqual({ canSee: true, canEdit: false });
  });
  it('finalizer flag without choir membership still grants edit (and thus see)', () => {
    expect(deriveAccess(null, false, true)).toEqual({ canSee: true, canEdit: true });
  });
});

describe('change log (institutional memory)', () => {
  it('summarizeChange renders a readable trail line per action', () => {
    expect(summarizeChange('create-program')).toMatch(/Created/);
    expect(summarizeChange('add-segment', 'Offering')).toBe('Added segment "Offering"');
    expect(summarizeChange('edit-segment', 'Sermon')).toBe('Edited segment "Sermon"');
    expect(summarizeChange('delete-segment', 'Altar Call')).toBe('Removed segment "Altar Call"');
    expect(summarizeChange('seed-order')).toMatch(/standard order/);
  });
  it('toChangeShape maps the row, keeping actor name for the trail', () => {
    const c = toChangeShape({ id: 'c1', program_id: 'p1', segment_id: 's2', actor_name: 'Christina', action: 'edit-segment', summary: 'Edited segment "Sermon"', created_at: '2026-06-24T18:00:00Z' });
    expect(c).toMatchObject({ id: 'c1', programId: 'p1', segmentId: 's2', actorName: 'Christina', action: 'edit-segment' });
  });
  it('toFinalizerMemberShape coerces the is_finalizer flag to a real boolean', () => {
    expect(toFinalizerMemberShape({ id: 'm1', user_id: 'u1', display_name: 'Christian', choir_role: 'musician', is_finalizer: true }).isFinalizer).toBe(true);
    expect(toFinalizerMemberShape({ id: 'm2', user_id: 'u2', display_name: 'Member', choir_role: 'member' }).isFinalizer).toBe(false);
  });
});

describe('key personnel and auxiliaries on every line (DR-1029; 0292)', () => {
  // Darrell 2026-10-15: "add the ability to add time to each section so any
  // church can total their time and add key personnel to each task on the
  // order of services list... or add a auxiliary."
  it('parsePeople splits on commas, semicolons and lines, trims, and keeps one of each', () => {
    expect(parsePeople('Bishop Gwin, Sis. Jones; Bro. Lee\n bishop gwin ,, ')).toEqual(['Bishop Gwin', 'Sis. Jones', 'Bro. Lee']);
    expect(parsePeople('')).toEqual([]);
    expect(parsePeople(null)).toEqual([]);
  });
  it('toSegmentShape carries personnel and the auxiliary; a row from before 0292 names its one owner', () => {
    const s = toSegmentShape({ id: 's1', program_id: 'p1', title: 'Offering', personnel: ['Deacon Hill', ' Sis. Ray '], auxiliary: ' Ushers ' });
    expect(s.personnel).toEqual(['Deacon Hill', 'Sis. Ray']);
    expect(s.auxiliary).toBe('Ushers');
    const old = toSegmentShape({ id: 's2', program_id: 'p1', title: 'Speaker', owner_name: 'Bishop Gwin', personnel: [] });
    expect(old.personnel).toEqual(['Bishop Gwin']);
    expect(old.auxiliary).toBeNull();
    expect(toSegmentShape({ id: 's3', program_id: 'p1', title: 'Prayer' }).personnel).toEqual([]);
  });
  it('peopleOf and whoText read the line as the card prints it: auxiliary first, then the people', () => {
    expect(whoText({ auxiliary: 'Choir', personnel: ['Christina'] })).toBe('Choir · Christina');
    expect(whoText({ personnel: ['Bishop Gwin', 'Sis. Jones'] })).toBe('Bishop Gwin, Sis. Jones');
    expect(whoText({ ownerName: 'Elder Cole' })).toBe('Elder Cole');
    expect(whoText({})).toBe('');
    expect(peopleOf({ personnel: [' '], ownerName: 'Elder Cole' })).toEqual(['Elder Cole']);
  });
  it('segmentRow writes personnel and the auxiliary, and the first key person doubles as the legacy owner', () => {
    const row = segmentRow({ title: 'Choir \u2014 1 song', sector: 'worship', personnel: ['Christina', 'Sis. Jones'], auxiliary: 'Choir', plannedMinutes: 5 });
    expect(row.personnel).toEqual(['Christina', 'Sis. Jones']);
    expect(row.auxiliary).toBe('Choir');
    expect(row.owner_name).toBe('Christina');
    expect(segmentRow({ title: 'Prayer', personnel: [], auxiliary: '   ' }).auxiliary).toBeNull();
  });
  it('whoServes totals the minutes per person and per auxiliary across the order, most first', () => {
    const segs = [
      { id: 'a', sortOrder: 10, title: 'Prayer', plannedMinutes: 5, personnel: ['Elder Cole'] },
      { id: 'b', sortOrder: 30, title: 'Choir \u2014 1 song', plannedMinutes: 5, auxiliary: 'Choir', personnel: ['Christina'] },
      { id: 'c', sortOrder: 60, title: 'Choir \u2014 2 songs', plannedMinutes: 10, auxiliary: 'choir', personnel: ['Christina'] },
      { id: 'd', sortOrder: 70, title: 'Speaker', plannedMinutes: 35, ownerName: 'Bishop Gwin' },
      { id: 'e', sortOrder: 20, title: 'Announcements', plannedMinutes: 5 },
    ];
    const who = whoServes(segs);
    expect(who.map((w) => `${w.kind}:${w.name}:${w.minutes}:${w.count}`)).toEqual([
      'person:Bishop Gwin:35:1', 'auxiliary:Choir:15:2', 'person:Christina:15:2', 'person:Elder Cole:5:1',
    ]);
    expect(who.find((w) => w.name === 'Choir').titles).toEqual(['Choir \u2014 1 song', 'Choir \u2014 2 songs']); // in the order's order
    expect(whoServes([])).toEqual([]);
  });
  it('deriveSectorView hands the flow its people, auxiliary and the who line', () => {
    const v = deriveSectorView({ id: 'p1', startTime: '11:00' }, [{ id: 's1', programId: 'p1', sortOrder: 10, title: 'Choir \u2014 1 song', sector: 'worship', plannedMinutes: 5, auxiliary: 'Choir', personnel: ['Christina'] }], STEWARD);
    expect(v.flow[0]).toMatchObject({ personnel: ['Christina'], auxiliary: 'Choir', who: 'Choir · Christina' });
  });
  it('0292 adds the two columns additively and backfills the one owner once (idempotent)', () => {
    const sql = readFileSync(join(ROOT, 'infra/supabase/migrations-auto/0292-every-line-of-the-order-names-its-people.sql'), 'utf8');
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS personnel jsonb NOT NULL DEFAULT '\[\]'::jsonb/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS auxiliary text/);
    expect(sql).toMatch(/WHERE personnel = '\[\]'::jsonb/);
    expect(sql).not.toMatch(/DROP (TABLE|COLUMN)/);
  });
});

describe('the service window: 75 to 90 minutes (DR-1029)', () => {
  // Darrell 2026-10-15: "Services time needs to be between 1 hour and 15
  // minutes to 1 hour 30 minutes max."
  it('reads a total against the window in the church\u2019s own words', () => {
    expect(SERVICE_WINDOW).toEqual({ minMinutes: 75, maxMinutes: 90 });
    expect(windowSay(81)).toMatchObject({ ok: true, say: 'within 75\u201390\u2032' });
    expect(windowSay(75).ok).toBe(true);
    expect(windowSay(90).ok).toBe(true);
    expect(windowSay(97)).toMatchObject({ ok: false, over: 7, say: '7\u2032 over the 90\u2032 limit' });
    expect(windowSay(60)).toMatchObject({ ok: false, under: 15, say: '15\u2032 under the 75\u2032 floor' });
    expect(windowSay(null).say).toBe('');
  });
  it('the plan carries its verdict: the church\u2019s own order fits, a padded one does not', () => {
    const seed = seedDefaultOrder().map((s, i) => ({ ...s, id: `s${i}`, programId: 'p1' }));
    expect(deriveSectorView({ id: 'p1' }, seed, STEWARD).window.ok).toBe(true); // 81'
    const padded = seed.map((s) => (s.title === 'Speaker' ? { ...s, plannedMinutes: 50 } : s)); // 96'
    expect(deriveSectorView({ id: 'p1' }, padded, STEWARD).window).toMatchObject({ ok: false, over: 6 });
  });
});

describe('accessDiagnosis — a refusal names what was read (DR-0076)', () => {
  it('no church space: says so and how a steward adds you', () => {
    const lines = accessDiagnosis({ email: 'd@x.com', tenantId: null, role: null, errors: ['no church space answered for this account'] });
    expect(lines[0]).toBe('Signed in as d@x.com.');
    expect(lines.some((l) => l.startsWith('No church space answered'))).toBe(true);
    expect(lines.some((l) => l.includes('no church space answered'))).toBe(true);
  });
  it('a member not on the roster: role and roster both named', () => {
    const lines = accessDiagnosis({ email: 'm@x.com', tenantId: 't', role: 'member', choirRole: null, errors: [] });
    expect(lines).toContain('Your role in the church space: member.');
    expect(lines).toContain('Choir roster: not on it.');
  });
  it('an owner refused means a read failed, and the screen says so', () => {
    const lines = accessDiagnosis({ email: 'o@x.com', tenantId: 't', role: 'owner', choirRole: 'director', errors: ['choir read failed: 500'] });
    expect(lines.some((l) => l.startsWith('An owner or admin always sees'))).toBe(true);
    expect(lines).toContain('Choir roster: on it as director.');
    expect(lines).toContain('Read failed \u2014 choir read failed: 500');
  });
  it('falls back to the actor name, never an empty subject', () => {
    expect(accessDiagnosis({ actorName: 'Darrell', tenantId: null })[0]).toBe('Signed in as Darrell.');
    expect(accessDiagnosis(null)).toEqual([]);
  });
});

describe('playbookFor — the Sunday or Wednesday playbook across every sector (Darrell 2026-10-15)', () => {
  const program = { id: 'p1', title: 'Order of Worship', serviceType: 'sunday', serviceDate: '2026-10-18', startTime: '11:00' };
  const segs = [
    { id: 'a', sortOrder: 10, title: 'Prayer', sector: 'pastoral', plannedMinutes: 5, flexible: true, personnel: ['Deacon Lee'], cues: { media: 'house lights down' } },
    { id: 'b', sortOrder: 20, title: 'Choir \u2014 1 song', sector: 'worship', plannedMinutes: 5, flexible: true, personnel: ['Christina'], auxiliary: 'Choir', cues: {} },
    { id: 'c', sortOrder: 30, title: 'Speaker', sector: 'pulpit', plannedMinutes: 35, flexible: false, personnel: ['Bishop Gwin'], cues: { media: 'sermon slides' } },
    { id: 'd', sortOrder: 40, title: 'Benediction', sector: 'pulpit', plannedMinutes: 3, flexible: true, personnel: [], cues: {} },
  ];
  const book = playbookFor(program, segs, { members: [{ displayName: 'Keys', isFinalizer: true }, { displayName: 'Alto', isFinalizer: false }] });

  it('clocks every line from the start time and totals the order', () => {
    expect(book.lines.map((l) => l.startClock)).toEqual(['11:00 AM', '11:05 AM', '11:10 AM', '11:45 AM']);
    expect(book.endClock).toBe('11:48 AM');
    expect(book.total).toBe(48);
    expect(book.window.under).toBe(27);
  });

  it('names who presides from the fixed pulpit line, and who signs from the roster', () => {
    expect(book.presiding).toEqual(['Bishop Gwin']);
    expect(book.finalizers).toEqual(['Keys']);
  });

  it('gives each team its stops: the lines it owns and the lines that cue it', () => {
    const media = book.sectors.find((s) => s.key === 'media');
    expect(media.stops.map((st) => [st.title, st.cue])).toEqual([['Prayer', 'house lights down'], ['Speaker', 'sermon slides']]);
    const choir = book.sectors.find((s) => s.key === 'worship');
    expect(choir.stops.map((st) => st.title)).toEqual(['Choir \u2014 1 song']);
    expect(choir.stops[0].owns).toBe(true);
    expect(choir.stops[0].who).toBe('Choir \u00b7 Christina');
    expect(book.sectors.find((s) => s.key === 'ushers')).toBeUndefined();
  });

  it('an empty order has no window and no presiding, never a painted one', () => {
    const empty = playbookFor(program, []);
    expect(empty.lines).toEqual([]);
    expect(empty.window).toBeNull();
    expect(empty.presiding).toEqual([]);
    expect(empty.sectors).toEqual([]);
  });
});
