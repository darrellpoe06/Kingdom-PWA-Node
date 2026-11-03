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
// `1a11bea0b4de78e0` is STILL UNBUILT, and it is now declared `Considered, not
// built` by DR-1306 as well as DR-1303 and DR-1305 — three records naming it,
// none claiming it. It stays in STILL_BLOCKED below, which is the case that
// proves the exemption still holds when more than one record names a thread.
// If it ever becomes a lesson, move it the same way, citing that lesson.
const STILL_BLOCKED = ['1a11bea0b4de78e0'];
// The two ids DR-1303's OWN declaration names. That line has not changed and
// must not: it is the evidence for this record's account of the damage, and the
// two cases below read DR-1303's text rather than today's build state.
const DR1303_DECLARED = ['1a11bdbce29bab3e', '1a11bea0b4de78e0'];
const BUILT_SINCE = { '1a11bdbce29bab3e': 'DR-1306' };
const DR1303_SOURCE = '1a0d92de3dba5e7e';

const dr1303 = () => {
  const rec = readLedger().find((r) => r.dr === 'DR-1303');
  expect(rec, 'DR-1303 is missing from the ledger').toBeTruthy();
  return rec.text;
};

describe('a decision record can name a thread it did not build without blocking it', () => {
  it('the send DR-1303 proved was unbuilt and nobody has built sweeps UNKNOWN again', () => {
    const found = sweep(STILL_BLOCKED);
    expect(STILL_BLOCKED.length, 'an empty list would make this pass vacuously').toBeGreaterThan(0);
    for (const id of STILL_BLOCKED) {
      expect(
        found.get(id).drs,
        `${id} is one of Darrell's unbuilt sends (2026-10-08). A record naming it as a REJECTED `
        + 'candidate must not claim it, or the lane skips his words for ever. Three records now '
        + 'name this one (DR-1303, DR-1305, DR-1306) and not one of them built it.',
      ).toEqual([]);
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
      // DR-1303 and DR-1305 only CONSIDERED it, and must still not claim it.
      expect(drs, `${id}: DR-1303 only considered it`).not.toContain('DR-1303');
      expect(drs, `${id}: DR-1305 only considered it`).not.toContain('DR-1305');
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
