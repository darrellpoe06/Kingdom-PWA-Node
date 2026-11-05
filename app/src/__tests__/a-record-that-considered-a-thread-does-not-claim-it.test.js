// =============================================================================
// A record that CONSIDERED a thread does not claim it (2026-11-03, DR-1304)
// =============================================================================
// MEASURED, and it had already cost two of Darrell's sends.
//
// DR-1303 built sov59 from Gmail thread `1a0d92de3dba5e7e`. To show it had
// taken the OLDEST unbuilt send it named the two it rejected --
// `1a11bdbce29bab3e` and `1a11bea0b4de78e0`, both 2026-10-08, both swept
// `unknown` at the time -- as newer alternatives it did not build. That is
// careful work and exactly what the Way asks for.
//
// From the moment that record landed, `lesson-row-shipped-sweep.mjs` answered
// `SHIPPED -> named in DR-1303` for both, and DR-1303 is the ONLY record
// naming either. So the record that PROVED those two were unbuilt became the
// record blocking them, and the Gmail lane -- whose exit code is its decision
// -- would have skipped them every firing, for ever, silently.
//
// WHY THE SWEEP'S OWN DOCTRINE DID NOT COVER THIS. That file argues a false
// SHIPPED is the safe direction because it "only stops a build until someone
// reads the record named". True for a person at a keyboard. FALSE for an
// unattended lane, where nobody reads anything and his words just stop
// arriving -- the one failure DR-0312's lane exists to prevent. The bias stays;
// an explicit, declared exception is added.
//
// WHAT IT IS NOT. Not a heuristic about where in a record an id sits. DR-1270
// §37 measured that direction: the full-uuid-only matcher produced a false
// UNKNOWN for two handled rows, and a false UNKNOWN permits rebuilding a live
// lesson. A record must SAY SO, on one line, in a form a reader can audit:
//
//   **Considered, not built:** `<id>`, `<id>` — <why>
//
// AND IT CANNOT UN-SHIP A RECORD'S OWN SOURCE. If a declared id also appears in
// that record's `**Intake:**` line -- where the ledger states provenance -- the
// declaration is refused and the hit stands. Without that, a careless builder
// could write the line about its own thread and make a live lesson look
// unbuilt. That pin is the last case here and it is the important one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { sweep, consideredNotBuilt, readLedger, DECISIONS } from '../../../scripts/lesson-row-shipped-sweep.mjs';

const REPO = resolve(import.meta.dirname, '../../..');

// The two real threads this was found on. UPDATED DELIBERATELY ON 2026-11-03,
// as the note here required: `1a11bdbce29bab3e` is no longer unbuilt. It was
// built as **sov60** (the bottleneck was never the typing) by **DR-1306**, which
// names it in its own `Intake:` line, so the sweep now answers DR-1306 for it
// and SHOULD. That is this whole fix working end to end: the thread went
// unknown -> built -> SHIPPED by the record that actually built it, rather than
// staying SHIPPED by the record that had only considered it.
//
// UPDATED DELIBERATELY AGAIN ON 2026-11-04, for the same reason and in the same
// way: `1a11bea0b4de78e0` is no longer unbuilt either. It was built as **sov61**
// (one thing I know — the warrant nobody claimed) by **DR-1307**, which names it
// in its own `Intake:` line. So BOTH of the sends DR-1303 blocked have now
// arrived, and neither is claimed by a record that merely considered it.
//
// STILL_BLOCKED is therefore EMPTY, and the case that read it has been replaced
// rather than deleted, because an empty list passing vacuously is precisely what
// this file exists to refuse. What replaced it is STRICTER than what it covered:
// each of the two threads is now named by FOUR records and must be claimed by
// EXACTLY ONE — the one that built it. DR-1307 declares `1a11bdbce29bab3e` and
// DR-1306 declares `1a11bea0b4de78e0`, so the two declarations now point at each
// other, which is the hardest shape the exemption has had to hold and the reason
// the stricter assertion is worth more than the old one.
const STILL_BLOCKED = [];
// The two ids DR-1303's OWN declaration names. That line has not changed and
// must not: it is the evidence for this record's account of the damage, and the
// two cases below read DR-1303's text rather than today's build state.
const DR1303_DECLARED = ['1a11bdbce29bab3e', '1a11bea0b4de78e0'];
const BUILT_SINCE = { '1a11bdbce29bab3e': 'DR-1306', '1a11bea0b4de78e0': 'DR-1307' };
// Every record that NAMES one of the two without having built it. Each must be
// absent from both sweeps, or a citation is still reading as a claim.
const ONLY_CONSIDERED = ['DR-1303', 'DR-1305'];
const DR1303_SOURCE = '1a0d92de3dba5e7e';

const dr1303 = () => {
  const rec = readLedger().find((r) => r.dr === 'DR-1303');
  expect(rec, 'DR-1303 is missing from the ledger').toBeTruthy();
  return rec.text;
};

describe('a decision record can name a thread it did not build without blocking it', () => {
  it('each of the two sends DR-1303 blocked is claimed by EXACTLY ONE record, the one that built it', () => {
    // This replaces the old STILL_BLOCKED case, which asserted that
    // `1a11bea0b4de78e0` still swept UNKNOWN. It no longer does, because it was
    // built, and pretending otherwise would be the lie this file is against.
    // The stricter form keeps the coverage and adds to it: four records name
    // each thread, and exactly one may claim it.
    const ids = Object.keys(BUILT_SINCE);
    expect(ids.length, 'an empty map would make this pass vacuously').toBeGreaterThan(1);
    expect(STILL_BLOCKED, 'nothing DR-1303 blocked is still unbuilt; see the note above').toEqual([]);
    const found = sweep(ids);
    for (const id of ids) {
      expect(
        found.get(id).drs,
        `${id} is one of Darrell's 2026-10-08 sends. FOUR records name it and only the one that `
        + 'BUILT it may claim it; a record naming it as a considered candidate must not, or the '
        + 'lane skips his words for ever.',
      ).toEqual([BUILT_SINCE[id]]);
    }
  });

  it('and the one that HAS been built since is claimed by the record that built it, not by the one that considered it', () => {
    // The other half of the same rule, and the reason this case exists: an
    // exemption that also hid a real lesson would be worse than the bug.
    const ids = Object.keys(BUILT_SINCE);
    expect(ids.length, 'an empty map would make this pass vacuously').toBeGreaterThan(0);
    const found = sweep(ids);
    for (const id of ids) {
      const drs = found.get(id).drs;
      expect(drs, `${id} was built and must read SHIPPED`).toContain(BUILT_SINCE[id]);
      // DR-1303 and DR-1305 only CONSIDERED both, and must still not claim either.
      for (const dr of ONLY_CONSIDERED) {
        expect(drs, `${id}: ${dr} only considered it`).not.toContain(dr);
      }
      // AND THE TWO LESSON RECORDS MUST NOT CLAIM EACH OTHER'S THREAD, which is
      // the new shape as of 2026-11-04: DR-1307 declares DR-1306's source and
      // DR-1306 declares DR-1307's, so each declaration is load-bearing.
      const sibling = Object.values(BUILT_SINCE).find((d) => d !== BUILT_SINCE[id]);
      expect(sibling, 'there must be a sibling record for this case to mean anything').toBeTruthy();
      expect(drs, `${id}: ${sibling} only considered it`).not.toContain(sibling);
    }
  });

  it("DR-1303 still claims its OWN source — the declaration took nothing real away", () => {
    const found = sweep([DR1303_SOURCE]);
    expect(found.get(DR1303_SOURCE).drs).toContain('DR-1303');
  });

  it('DR-1303 carries the declaration, and says why rather than only listing ids', () => {
    const text = dr1303();
    expect(text).toMatch(/\*\*Considered, not built:\*\*/);
    for (const id of DR1303_DECLARED) expect(text).toContain(id);
    expect(text, 'the declaration must state that these are still unbuilt').toMatch(/still unbuilt/i);
  });

  it('the parser reads the ids out of a declaration', () => {
    const got = consideredNotBuilt('**Considered, not built:** `aaaaaaaaaaaa`, `bbbbbbbbbbbb` — newer sends.');
    expect([...got].sort()).toEqual(['aaaaaaaaaaaa', 'bbbbbbbbbbbb']);
  });

  it('a record with no declaration exempts nothing', () => {
    expect([...consideredNotBuilt('**Intake:** thread `aaaaaaaaaaaa`.')]).toEqual([]);
    expect([...consideredNotBuilt('')]).toEqual([]);
  });

  it('only a backticked id counts, so prose about a number cannot exempt a thread by accident', () => {
    const got = consideredNotBuilt('**Considered, not built:** 1a11bdbce29bab3e and `cccccccccccc`.');
    expect([...got]).toEqual(['cccccccccccc']);
  });

  // ---------------------------------------------------------------------------
  // THE DANGEROUS DIRECTION. This is the case that matters most: the exemption
  // must never be able to un-ship a record's own lesson.
  // ---------------------------------------------------------------------------
  it('PROVEN NOT TO WEAKEN: a record cannot exempt the thread its own Intake line names', () => {
    const forged = [
      '**Intake:** Gmail lesson-intake lane. Thread `aaaaaaaaaaaa`, forwarded 2026-01-01.',
      '**Considered, not built:** `aaaaaaaaaaaa`, `bbbbbbbbbbbb` — a lie about its own source.',
    ].join('\n');
    const got = consideredNotBuilt(forged);
    expect(
      [...got],
      'provenance must win over a declaration: the Intake id stays claimed, the other is exempt',
    ).toEqual(['bbbbbbbbbbbb']);
  });

  it('PROVEN TO CATCH: without the declaration, both sends read as SHIPPED by DR-1303', () => {
    // The ledger as it stood before this fix: DR-1303's text with the
    // declaration line removed. Reconstructed rather than remembered.
    const text = dr1303();
    const stripped = text.replace(/\*\*Considered, not built:\*\*[^\n]*\n/, '');
    expect(stripped, 'the revert must actually remove the line, or this case proves nothing')
      .not.toMatch(/\*\*Considered, not built:\*\*/);
    const ledger = [{ dr: 'DR-1303', file: 'DR-1303.md', text: stripped }];
    const found = sweep(DR1303_DECLARED, ledger);
    for (const id of DR1303_DECLARED) {
      expect(found.get(id).drs, `${id} must read SHIPPED once the declaration is gone`).toEqual(['DR-1303']);
    }
  });

  it('DECISIONS still points at the repository ledger', () => {
    expect(DECISIONS).toBe(join(REPO, 'docs', 'decisions'));
    expect(readFileSync(join(DECISIONS, 'INDEX.md'), 'utf8').length).toBeGreaterThan(1000);
  });
});

// =============================================================================
// The same declaration clears a guard that had been red on `main`
// =============================================================================
// `one-thread-one-record-guard.mjs` reads the first 4000 characters of a record
// as its front matter, and its own note says that approximation "cannot tell
// PROVENANCE from CITATION when a record discusses an intake incident in its
// opening", with `re-review: 2026-11-29` for a sharper rule. The declaration IS
// that sharper rule.
//
// It had a live cost. DR-1300 built ll273 from `1a0aab01a0b1746e` and printed a
// two-row table showing that the OTHER 2026-09-16 send, `1a0aaaf7d6952b4b`, was
// "already built" as sov54 (DR-1272). The guard read that table as a second
// claim and had been FAILING on `main` with `thread 1a0aaaf7d6952b4b is named by
// DR-1272 and DR-1300`. DR-1303 §97 measured the same failure on a clean
// worktree, correctly called it inherited and not its own, and left it -- so it
// sat red, owned by nobody. Declaring the citation clears it at the cause
// rather than by an allow-list entry, which is what KNOWN_SHARED_THREADS would
// otherwise have had to absorb.
describe('the guard reads a declared citation as a citation', () => {
  // NOTE ON WHAT THIS DOES *NOT* ASSERT, because the first draft of this case
  // got it wrong and the suite caught me: it required ZERO unexplained
  // collisions and went red with six. Those six are the guard's own
  // pre-existing UNEXAMINED DEBT (re-review: 2026-11-28) and they are not in
  // KNOWN_SHARED_THREADS, so my assertion was a claim about the ledger I had
  // not measured. The honest pin is the guard's own verdict plus the one
  // collision this change actually removes.
  it('the guard exits 0, where it had been failing on main', () => {
    const r = spawnSync('node', [join(REPO, 'scripts', 'one-thread-one-record-guard.mjs')], { encoding: 'utf8' });
    expect(r.stdout + r.stderr).toMatch(/one-thread-one-record-guard: OK/);
    expect(r.status, 'a red guard nobody owns is how this sat unfixed for days').toBe(0);
  });

  it('that thread is claimed by exactly one record now — DR-1272, which built it', async () => {
    const { threadClaims } = await import('../../../scripts/one-thread-one-record-guard.mjs');
    expect(threadClaims().get('1a0aaaf7d6952b4b')).toEqual(['DR-1272']);
  });

  it('PROVEN TO CATCH: without its declaration, DR-1300 collides with DR-1272 again', async () => {
    const { threadClaims } = await import('../../../scripts/one-thread-one-record-guard.mjs');
    const ledger = readLedger().map((r) => (r.dr === 'DR-1300'
      ? { ...r, text: r.text.replace(/\*\*Considered, not built:\*\*[^\n]*\n/, '') }
      : r));
    const stripped = ledger.find((r) => r.dr === 'DR-1300');
    expect(stripped.text, 'the revert must remove the line or this proves nothing')
      .not.toMatch(/\*\*Considered, not built:\*\*/);
    const claims = threadClaims(ledger);
    expect(claims.get('1a0aaaf7d6952b4b')).toEqual(['DR-1272', 'DR-1300']);
  });

  it('DR-1300 carries the declaration and names the lesson that really built that thread', () => {
    const rec = readLedger().find((r) => r.dr === 'DR-1300');
    expect(rec.text).toMatch(/\*\*Considered, not built:\*\*/);
    expect(rec.text, 'a declaration that does not say who DID build it is half an answer')
      .toMatch(/DR-1272/);
  });
});

// =============================================================================
// THE SIX UNEXAMINED PAIRS, READ (2026-11-04)
// =============================================================================
// The note at the top of the previous describe says this suite deliberately did
// NOT assert zero unexplained collisions, because six were unexamined debt and
// claiming they were fine without reading them would have been the hollowing-out
// the guard exists to prevent. They have now been READ, and the answer was three
// different answers: three were never duplicates, one healed at the cause, and
// TWO are real. So the pin can finally be exact.
describe('the six unexamined collisions are read, and what they are is pinned', () => {
  const guard = async () => import('../../../scripts/one-thread-one-record-guard.mjs');

  it('nothing is left unexamined', async () => {
    const { UNEXAMINED_BASELINE } = await guard();
    expect(UNEXAMINED_BASELINE, 'the list may only shrink, and it is now empty').toEqual([]);
  });

  it('DR-1051 declares the four ids it RECOVERED rather than built', async () => {
    // It is `Type: orchestration`: it built a guard and no lesson. Without the
    // declaration the sweep reads a recovery record as a claim -- the very fault
    // DR-1051 was itself written to catch, one layer in.
    const rec = readLedger().find((r) => r.dr === 'DR-1051');
    const declared = consideredNotBuilt(rec.text);
    for (const id of ['1a135f165fe391e3', '1a135b7ba6605c98', '1a13f985bb4d2a79', '1a13feefef705fa7']) {
      expect([...declared], `DR-1051 must disown ${id}`).toContain(id);
    }
    expect(rec.text, 'a declaration must name who DID build it').toMatch(/DR-1005/);
  });

  it('the four recovered threads still read SHIPPED, via the records that really built them', async () => {
    const { threadClaims } = await guard();
    const claims = threadClaims();
    // DR-1051 is gone from each; the real builder remains.
    expect(claims.get('1a135b7ba6605c98')).toEqual(['DR-1004']);
    expect(claims.get('1a13f985bb4d2a79')).toEqual(['DR-1049']);
    expect(claims.get('1a13feefef705fa7')).toEqual(['DR-1048']);
    expect(claims.get('1a135f165fe391e3'), 'sov39 built it; DR-1051 only recovered its id')
      .not.toContain('DR-1051');
  });

  it('PROVEN TO CATCH: strip DR-1051 declaration and the collision comes straight back', async () => {
    const { threadClaims } = await guard();
    const ledger = readLedger().map((r) => (r.dr === 'DR-1051'
      ? { ...r, text: r.text.replace(/\*\*Considered, not built:\*\*[^\n]*\n/, '') }
      : r));
    expect(ledger.find((r) => r.dr === 'DR-1051').text,
      'the revert must remove the line or this proves nothing')
      .not.toMatch(/\*\*Considered, not built:\*\*/);
    expect(threadClaims(ledger).get('1a135f165fe391e3')).toContain('DR-1051');
  });

  it('the two measured duplicates are RECORDED, so the guard stays green and stays loud', async () => {
    const { EXAMINED_AWAITING_FOLD } = await guard();
    expect(EXAMINED_AWAITING_FOLD).toHaveLength(2);
    expect(EXAMINED_AWAITING_FOLD.map((p) => p.thread).sort())
      .toEqual(['1a11668e8023cd3e', '1a11be8ea0e58748']);
    for (const p of EXAMINED_AWAITING_FOLD) {
      expect(p.lessons, 'a duplicate entry must name the two lessons').toHaveLength(2);
      expect(p.why.length, 'and must carry its comparison, not just a flag').toBeGreaterThan(200);
    }
  });

  it('each duplicate pair is STILL a live collision, so the list cannot go stale', async () => {
    const { threadClaims, EXAMINED_AWAITING_FOLD } = await guard();
    const claims = threadClaims();
    for (const p of EXAMINED_AWAITING_FOLD) {
      expect(claims.get(p.thread), `${p.thread} must still be named by both records`)
        .toEqual([...p.drs].sort());
    }
  });

  // Loading all 44 courses costs seconds, so the catalog is built ONCE here and
  // the two cases below carry a real timeout. The first drafts of them timed out
  // at vitest's 5s default, which is a slow test rather than a true finding --
  // worth saying because a timeout dressed up as a failure teaches nothing.
  let byId = null;
  const catalog = async () => {
    if (byId) return byId;
    const { buildCatalogCourseDescriptors } = await import('../lib/learn-catalog.js');
    byId = new Map();
    for (const c of buildCatalogCourseDescriptors()) {
      for (const m of (c.schedule || c.modules || []).filter(Boolean)) byId.set(String(m.id || ''), m);
    }
    return byId;
  };
  const find = (map, p) => [...map.keys()].find((k) => k === p || k.startsWith(`${p}-`));

  // THE MEASUREMENT ITSELF, EXECUTABLE. The 13 and 14 in that list are claims
  // about the live catalog; here they are recomputed with the catalog's own
  // rule, so a drift in either direction fails rather than ages quietly.
  it('the claimed shared-verse counts are what the catalog actually holds', async () => {
    const { EXAMINED_AWAITING_FOLD } = await guard();
    const { sharedGround } = await import('../lib/one-teaching-one-lesson.js');
    const map = await catalog();
    for (const pair of EXAMINED_AWAITING_FOLD) {
      const [a, b] = pair.lessons.map((l) => find(map, l));
      expect(a, `${pair.lessons[0]} must exist in the catalog`).toBeTruthy();
      expect(b, `${pair.lessons[1]} must exist in the catalog`).toBeTruthy();
      const g = sharedGround(map.get(a), map.get(b));
      expect(g.shared, `${pair.lessons.join('/')} claims ${pair.sharedVerses} shared verses`)
        .toBe(pair.sharedVerses);
      expect(g.shared, 'and a duplicate claim needs real shared ground under it')
        .toBeGreaterThanOrEqual(10);
    }
  }, 60000);

  it('the control pair is NOT listed: one source, two genuine teachings', async () => {
    // ll221 "Owning the Light Instead of Renting It" and ll236 "The Bill You
    // Cannot Read" came from one utility-billing forward and share ONE verse.
    // If a future rule starts flagging these, it over-flags.
    const { EXAMINED_AWAITING_FOLD } = await guard();
    expect(EXAMINED_AWAITING_FOLD.map((p) => p.thread)).not.toContain('1a11be8188dbc2f6');
    const { sharedGround } = await import('../lib/one-teaching-one-lesson.js');
    const map = await catalog();
    const g = sharedGround(map.get(find(map, 'll221')), map.get(find(map, 'll236')));
    expect(g.shared, 'the control must stay far below the duplicate threshold').toBeLessThan(5);
  }, 60000);
});
