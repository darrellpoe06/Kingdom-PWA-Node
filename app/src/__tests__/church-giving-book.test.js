// =============================================================================
// The office's contribution book -- the walls, the money, and the honest states
// =============================================================================
// These tests are about the properties that a future edit is most likely to
// break quietly, not about coverage. Three classes:
//
//   1. THE WALLS. The giving book must never join the giver's private ledger
//      (0184) or the pastoral roll (0209). A comment cannot stop that edit; a
//      failing build can. Proven-to-catch is asserted in the file itself.
//   2. THE MONEY. Cents <-> numeric(12,2) must round-trip exactly, on the
//      values that actually break naive conversions rather than on 1.00.
//   3. THE CONTRACTS. The shapes the component consumes from the libraries --
//      the ones where a wrong field name renders a plausible, empty screen.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { centsToNumeric, numericToCents, toClaimRow, fromClaimRow, toBatchRow, fromBatchRow } from '../lib/church-giving-book-sync.js';
import { findCashAppHeader, parseCashAppStatement, giftsOf, payoutsOf } from '../lib/cashapp-statement.js';
import { proposeDonorMatches, reviewQueue, normalizeName, BASIS } from '../lib/giving-donor-match.js';

const ROOT = join(__dirname, '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// The walls below are about what the CODE does, not about what the comments
// say. A file that explains at length why it must never touch the giver's
// private ledger is doing the right thing; matching the prose would punish the
// documentation and push future authors to delete the explanation to get green.
// So comments and string literals are stripped before the check runs.
const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')      // block comments
  .replace(/^\s*\/\/.*$/gm, ' ')          // whole-line // comments
  .replace(/\/\/[^\n'"`]*$/gm, ' ')        // trailing // comments
  .replace(/^\s*--.*$/gm, ' ');            // SQL comments

// Whitespace-insensitive prose match, for text that wraps across lines.
const says = (src, phrase) => new RegExp(
  phrase.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]{0,12}?'),
  'i',
).test(src);

const SYNC = 'app/src/lib/church-giving-book-sync.js';
const SCREEN = 'app/src/components/ChurchGivingBook.jsx';
const MIGRATION = 'infra/supabase/migrations-auto/0214-the-office-keeps-its-own-book-of-what-the-church-received.sql';

// ---------------------------------------------------------------------------
// 1. THE WALLS
// ---------------------------------------------------------------------------
describe('the giving book never touches the giver’s private ledger', () => {
  // 0184 is owner-only and says in its own header that an instance admin cannot
  // read it. The office's book is a SEPARATE record. If either file below ever
  // imports or queries giving_records, a member's private ledger has been
  // joined to a book the office reads -- exactly the widening 0184 forbids.
  it('neither the sync layer nor the screen reads giving_records', () => {
    for (const path of [SYNC, SCREEN]) {
      const code = codeOnly(read(path));
      expect(code, `${path} must not query the private ledger table`).not.toMatch(/giving_records/);
      expect(code, `${path} must not import the private ledger's sync layer`).not.toMatch(/giving-records-sync/);
      expect(code, `${path} must not import the private ledger's shapes`).not.toMatch(/giving-records\.js/);
    }
  });

  it('and the prose explaining that wall is allowed to stay', () => {
    // Guarding the guard: the stripper must not be so aggressive that the wall
    // stops seeing real code, nor so lax that a comment satisfies it.
    const src = read(SYNC);
    expect(src, 'the header should explain the boundary').toMatch(/giving-records-sync/);
    expect(codeOnly(src), 'but only in prose').not.toMatch(/giving-records-sync/);
    expect(codeOnly(src), 'real imports must survive stripping').toMatch(/import supabase from/);
  });

  // PROVEN-TO-CATCH. The assertion above is only worth anything if it fails on
  // the edit it exists to prevent. This runs the same check against a doctored
  // copy of the real file and requires it to fail.
  it('that wall actually catches the import it forbids', () => {
    const doctored = read(SYNC).replace(
      "import supabase from './supabase.js';",
      "import supabase from './supabase.js';\nimport { fetchMyGiving } from './giving-records-sync.js';",
    );
    // The wall's own predicate, applied to the doctored source.
    const wouldPass = !/giving-records-sync/.test(codeOnly(doctored));
    expect(wouldPass, 'the wall must reject a file that imports the private ledger').toBe(false);
  });

  it('neither the sync layer nor the screen touches the pastoral roll', () => {
    // 0209 refuses to carry a giving amount by construction. Rendering giving
    // beside the member record would defeat that refusal from the other side.
    for (const path of [SYNC, SCREEN]) {
      const src = read(path);
      expect(codeOnly(src), `${path} must not read the member record table`).not.toMatch(/church_member_records/);
    }
  });

  it('the migration states the walls it is built between', () => {
    const sql = read(MIGRATION);
    expect(sql).toMatch(/0184/);
    expect(sql).toMatch(/0209/);
    // The reason, not just the reference -- a future reader must find the WHY
    // in the file rather than having to reconstruct it.
    expect(says(sql, 'never a widening of this policy')).toBe(true);
  });
});

describe('the office, and only the office', () => {
  const sql = read(MIGRATION);

  it('every table is RLS-gated to owner/admin with no member clause', () => {
    for (const t of ['church_giving_batches', 'church_giving_claims', 'church_giving_aliases']) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE public\\.${t}\\s+ENABLE ROW LEVEL SECURITY`));
    }
    // Three policies, each naming exactly the two office roles.
    const policies = sql.match(/IN \('owner','admin'\)/g) || [];
    expect(policies.length).toBeGreaterThanOrEqual(6); // USING + WITH CHECK per table
    // No member/viewer/anon ever appears in a policy on these tables.
    expect(sql).not.toMatch(/'member'/);
    expect(sql).not.toMatch(/TO anon/);
  });

  it('re-runs the standing overlays so the tenancy gate holds', () => {
    expect(sql).toMatch(/apply_viewer_readonly_overlay/);
    expect(sql).toMatch(/apply_assistant_scope_overlay/);
  });

  it('refuses a person-link that nobody confirmed', () => {
    // parishioner_user_id without match_confirmed_by is an unattributed claim
    // about somebody's money. The database refuses the half-state.
    expect(sql).toMatch(/church_giving_claims_confirmed_chk/);
    expect(sql).toMatch(/parishioner_user_id IS NULL OR match_confirmed_by IS NOT NULL/);
  });

  it('cannot double-count a re-imported statement', () => {
    expect(sql).toMatch(/UNIQUE \(instance_id, source, source_ref\)/);
  });

  it('the screen is gated on the same two roles the policy names', () => {
    const app = read('app/src/poe-financial-mvp-v28.jsx');
    // The rule lives in the access store so the app and 0214's RLS cannot drift.
    const store = read('app/src/lib/church-access-store.js');
    expect(store).toMatch(/export function isChurchOfficeRole/);
    expect(store).toMatch(/role === 'owner' \|\| role === 'admin'/);
    // The tab AND the route both ride that predicate. A tab without the route
    // guard would leave the surface reachable by URL, which is the real risk.
    expect(app).toMatch(/isChurchOfficeRole\(churchAccess\.role\) \? \[\['giving-book'/);
    expect(app).toMatch(/churchView === 'giving-book' && !reviewerMode && isChurchOfficeRole\(churchAccess\.role\)/);
  });
});

// ---------------------------------------------------------------------------
// 2. THE MONEY
// ---------------------------------------------------------------------------
describe('money crosses the boundary without losing a cent', () => {
  it('round-trips exactly across the whole plausible range, including negatives', () => {
    let mismatches = 0;
    for (let c = -500000; c <= 500000; c += 7) {
      if (numericToCents(centsToNumeric(c)) !== c) mismatches += 1;
    }
    expect(mismatches).toBe(0);
  });

  it('handles the values that break naive float conversion', () => {
    // Each of these, multiplied by 100 in IEEE-754, lands just under the
    // integer. A truncating implementation loses a cent on every one.
    for (const [text, cents] of [['0.29', 29], ['0.57', 57], ['0.58', 58], ['1.13', 113], ['1.15', 115]]) {
      expect(numericToCents(text), `${text} must be ${cents}`).toBe(cents);
      expect(centsToNumeric(cents)).toBe(text);
    }
  });

  it('formats sub-dollar and negative amounts without dropping the sign or the pad', () => {
    expect(centsToNumeric(1)).toBe('0.01');
    expect(centsToNumeric(0)).toBe('0.00');
    expect(centsToNumeric(-1235)).toBe('-12.35');
    expect(centsToNumeric(5)).toBe('0.05');
  });

  it('treats an unreadable amount as zero rather than NaN', () => {
    // NaN in a money column would propagate through every subtotal silently.
    expect(numericToCents(null)).toBe(0);
    expect(numericToCents('')).toBe(0);
    expect(numericToCents('not a number')).toBe(0);
  });
});

describe('a claim survives the trip to the table and back', () => {
  const claim = {
    giverName: 'Mary Ann Coleman',
    parishionerId: null,
    amountClaimedCents: 4971,
    grossCents: 5000,
    feeCents: 29,
    givenOn: '2026-09-07',
    givenAt: '10:42:00',
    note: 'tithe',
    txnId: 'TX-1',
  };

  it('keeps every figure and the time of day', () => {
    const row = toClaimRow(claim, { tenantId: 'i1', batchId: 'b1', slug: 's1', confirmedBy: 'u1' });
    const back = fromClaimRow({ ...row, id: 'c1' });
    expect(back.giverName).toBe('Mary Ann Coleman');
    expect(back.grossCents).toBe(5000);
    expect(back.feeCents).toBe(29);
    expect(back.amountClaimedCents).toBe(4971);
    expect(back.givenOn).toBe('2026-09-07');
    expect(back.givenAt).toBe('10:42:00');   // the meeting asked for times
    expect(back.note).toBe('tithe');
  });

  it('never writes a person-link without the person who confirmed it', () => {
    const row = toClaimRow(claim, { tenantId: 'i1', batchId: 'b1', slug: 's1', confirmedBy: 'u1' });
    expect(row.parishioner_user_id).toBeNull();
    expect(row.match_confirmed_by).toBeNull();

    const linked = toClaimRow({ ...claim, parishionerId: 'p9' }, { tenantId: 'i1', batchId: 'b1', slug: 's1', confirmedBy: 'u1' });
    expect(linked.parishioner_user_id).toBe('p9');
    expect(linked.match_confirmed_by).toBe('u1');
  });

  it('does not smuggle a link through when nobody confirmed it', () => {
    // confirmedBy omitted: the link must not be written half-formed, because
    // the table's CHECK would refuse the row and the import would fail wholesale.
    const row = toClaimRow({ ...claim, parishionerId: 'p9' }, { tenantId: 'i1', batchId: 'b1', slug: 's1' });
    expect(row.match_confirmed_by).toBeNull();
  });

  it('a batch keeps gross, fees and net as three separate truths', () => {
    const row = toBatchRow(
      { onlineTotalCents: 4971, feesCents: 29, depositCents: 4971, giftCount: 1, payoutOn: '2026-09-08' },
      { tenantId: 'i1', userId: 'u1', slug: 'b1' },
    );
    const back = fromBatchRow({ ...row, id: 'b1' });
    expect(back.onlineTotalCents).toBe(4971);   // what arrived
    expect(back.feesCents).toBe(29);
    expect(back.grossCents).toBe(5000);          // what the giver gave
    expect(back.depositCents).toBe(4971);
  });
});

// ---------------------------------------------------------------------------
// 3. THE CONTRACTS the screen depends on
// ---------------------------------------------------------------------------
describe('reading a real-shaped Cash App export', () => {
  const CSV = [
    'Love Corner Church',
    'Transaction history 1 Sep 2026 - 30 Sep 2026',
    '',
    'Transaction ID,Date,Transaction Type,Name of sender/receiver,Note,Amount,Fee,Net Amount',
    'TX1,2026-09-06 09:14:00,Payment,Mary Ann Coleman,tithe,$50.00,-$0.29,$49.71',
    'TX2,2026-09-06 10:02:00,Payment,Bee,offering,$20.00,-$0.12,$19.88',
    'TX3,2026-09-08 00:00:00,Cash Out,,,-$69.59,$0.00,-$69.59',
  ].join('\n');

  const lines = CSV.split('\n').filter((l) => l.trim() !== '').map((l) => l.split(','));

  it('finds the header under a preamble instead of reading line 0', () => {
    const found = findCashAppHeader(lines);
    expect(found.headerRow).toBe(2);             // after the two preamble lines (blank dropped)
    expect(found.roles).toContain('counterparty');
    expect(found.roles).toContain('amount');
  });

  it('separates the gifts from the transfer to the bank', () => {
    const found = findCashAppHeader(lines);
    const parsed = parseCashAppStatement({ header: found.header, rows: found.rows });
    expect(parsed.recognized).toBe(true);
    const gifts = giftsOf(parsed);
    const payouts = payoutsOf(parsed);
    expect(gifts).toHaveLength(2);
    expect(payouts).toHaveLength(1);
    expect(gifts.map((g) => g.giver)).toEqual(['Mary Ann Coleman', 'Bee']);
  });

  it('accounts for every row in the file', () => {
    const found = findCashAppHeader(lines);
    const parsed = parseCashAppStatement({ header: found.header, rows: found.rows });
    const { sourceRows, accepted, rejected } = parsed.reconciliation;
    expect(accepted + rejected).toBe(sourceRows);
  });

  it('refuses a file with no amount column rather than guessing', () => {
    const noAmount = [['Date', 'Who', 'Note'], ['2026-09-06', 'Mary', 'tithe']];
    expect(findCashAppHeader(noAmount).headerRow).toBe(-1);
  });
});

describe('the matcher’s contract, as the screen consumes it', () => {
  const people = [
    { id: 'p1', displayName: 'Mary Coleman' },
    { id: 'p2', displayName: 'Bobby Johnson' },
  ];

  it('proposals are keyed by normalized name, which is how the screen looks them up', () => {
    const props = proposeDonorMatches(['Mary Ann Coleman'], people, {});
    expect(props).toHaveLength(1);
    // The screen builds Map(p.normalized) and looks up normalizeName(giverName).
    // If either side stopped normalizing, this lookup would silently miss.
    const byName = new Map(props.map((p) => [p.normalized, p]));
    expect(byName.get(normalizeName('Mary Ann Coleman'))).toBeTruthy();
  });

  it('candidates carry parishionerId and basis — the fields the option list renders', () => {
    const [prop] = proposeDonorMatches(['Mary Ann Coleman'], people, {});
    expect(prop.candidates.length).toBeGreaterThan(0);
    for (const c of prop.candidates) {
      expect(c).toHaveProperty('parishionerId');
      expect(c).toHaveProperty('displayName');
      expect(c).toHaveProperty('basis');
      expect(c.id).toBeUndefined();          // the field I wrongly reached for once
    }
  });

  it('an alias map is flat name -> id, which is what the sync layer must return', () => {
    const aliases = { [normalizeName('Bee')]: 'p2' };
    const [prop] = proposeDonorMatches(['Bee'], people, aliases);
    expect(prop.best.parishionerId).toBe('p2');
    expect(prop.best.basis).toBe(BASIS.ALIAS);
  });

  it('reviewQueue returns an object with a queue array, not an array', () => {
    // The tab badge counts queue.queue.length. Treating the return value as an
    // array yields undefined and a badge that never appears.
    const q = reviewQueue(proposeDonorMatches(['Mary Ann Coleman', 'Nobody At All'], people, {}));
    expect(Array.isArray(q)).toBe(false);
    expect(Array.isArray(q.queue)).toBe(true);
    expect(typeof q.toReview).toBe('number');
  });

  it('never decides on its own, however good the match', () => {
    const [exact] = proposeDonorMatches(['Mary Coleman'], people, {});
    expect(exact.best.basis).toBe(BASIS.EXACT);
    expect(exact.needsReview).toBe(true);    // even an exact name is a proposal
    expect(exact.decided).toBe(false);
  });
});

describe('the screen tells the truth about what it is', () => {
  const src = read(SCREEN);

  it('says nothing is saved until the person presses the button', () => {
    expect(says(src, 'Nothing is saved when you pick a file')).toBe(true);
  });

  it('does not report an unchecked batch as balanced', () => {
    // With no bank figure entered, the honest answer is "not checked yet" --
    // never a tie the app has not actually verified.
    expect(src).toMatch(/Not checked yet/);
  });

  it('distinguishes “you may not read this” from “there is nothing here”', () => {
    expect(says(src, 'does not have office access')).toBe(true);
    expect(says(src, 'connection problem, not an empty book')).toBe(true);
  });

  it('states that it is not a church-issued tax statement', () => {
    expect(says(src, 'not a church-issued tax statement')).toBe(true);
  });
});
