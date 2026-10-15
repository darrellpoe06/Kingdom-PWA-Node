// @vitest-environment node
// =============================================================================
// The ledger names the thread it was built from (DR-1051)
// =============================================================================
// MEASURED ON A REAL NEAR-MISS, 2026-10-15. The Gmail intake surfaced thread
// `1a135f165fe391e3` as uncaptured. It was ALREADY a lesson — sov39, under
// DR-1005, built on 2026-10-13 from that same forward, the same day it came.
// The thread was simply never tagged `Lesson-Captured`.
//
// DR-0610 names the lock: "the `lesson-captured` tag written only after the
// push." That is a Gmail label — a SINGLE witness, outside the repo, which can
// silently fail to be written. It did. And DR-1005 recorded no thread id, so
// nothing in the repo contradicted the label. Both witnesses were blind at
// once, and the duplicate lesson was avoided only because the phrase
// "positional encoding" happened to sit in DR-1005's prose.
//
// SO THE REPO BECOMES THE SECOND WITNESS. A record is append-only and local.
// With the thread id in it, `grep <id> docs/decisions/` answers "have we built
// this?" exactly, offline, with no label and no inference. DR-1050 had to
// measure character distances between a source name and a date to make the
// INEXACT match safe precisely because the exact identifier was missing.
//
// SHRINK-ONLY, the pattern this repo already uses for a real debt (see the
// HELD ledger in n8n-is-gone.test.js and the band-coverage baseline). Nine
// records predate the rule. Each is named with why it is outstanding, the list
// may only get shorter, and no NEW record may join it.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isEmailSourced, namesAThread, walkLedger, NEAR_WINDOW, THREAD_ID,
} from '../../../scripts/ledger-names-its-thread.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

// The first record written under this rule. Anything from here on must name
// its thread; the nine below are the measured debt from before it.
//
// IT IS 1048 AND NOT 1051 ON PURPOSE. Today's three lesson records already
// comply, so the rule starts where compliance actually starts rather than
// where the guard was written — a threshold set at the guard's own number
// would exempt the three records that prove it works. Verified before setting
// it: DR-1048 (sov40) names `1a13feefef705fa7`, DR-1049 (World Issues 20)
// names `1a13f985bb4d2a79`, DR-1050 names `1a135f165fe391e3`.
const FIRST_RECORD_UNDER_THE_RULE = 1048;

// Every record that arrived before the rule and names no thread, with WHY.
// This list may only SHRINK. Recovering an id means deleting its entry in the
// same commit, and the test fails if an entry no longer applies — so a stale
// excuse cannot sit here looking like a fact.
const OUTSTANDING = [
  {
    file: 'DR-0312-the-inbox-is-a-lesson-door-and-the-way-reviews-itself.md',
    why: 'not a lesson built from one forward at all — it is the record that CREATED the email lane, and it quotes the one-word instruction while describing how the door works. The detector cannot tell a record about the door from a record built through it, and tightening it further would start losing real lessons. Carried as a known, deliberate false positive rather than weakening the check.',
  },
  {
    file: 'DR-0411-who-keeps-powerful-ai-under-control-the-servant-under-authority-and-the-guardrails-this-house-built.md',
    why: '2026-09 Morning Brew forward, built before thread ids were recorded. Recoverable by searching Gmail for the issue by source and date, which needs the Gmail connector and a per-record match; not done blind.',
  },
  {
    file: 'DR-0412-the-epa-unwinds-the-power-plant-carbon-rules-and-the-word-on-the-land.md',
    why: 'one of TWO items Darrell forwarded on 2026-09-15, so source-and-day alone cannot tell it from DR-0416. Needs the subject matched against the thread before an id is written, and a guessed id is worse than none.',
  },
  {
    file: 'DR-0413-the-supreme-court-leaves-the-mail-in-rules-alone-and-the-word-on-a-just-measure.md',
    why: '2026-09 Morning Brew forward from before the convention. Same recovery as DR-0411.',
  },
  {
    file: 'DR-0414-the-kennedy-center-on-the-brink-whose-name-goes-on-the-house-and-the-word-on-names-patrons-and-the-arts.md',
    why: '2026-09 forward from before the convention. Same recovery as DR-0411.',
  },
  {
    file: 'DR-0415-evanstons-reparations-and-the-equal-protection-suit-restitution-respect-of-persons-and-a-wrong-that-can-be-documented.md',
    why: '2026-09 forward from before the convention. Same recovery as DR-0411.',
  },
  {
    file: 'DR-0416-the-trades-are-hiring-the-non-degree-job-market-and-the-word-on-work-with-your-hands.md',
    why: 'the second of the two items forwarded on 2026-09-15 (its own text says so), so it has the same ambiguity as DR-0412 and needs the same subject match.',
  },
  {
    file: 'DR-0436-do-the-tools-have-the-memory-of-a-goldfish-the-desk-the-book-of-remembrance-and-the-one-who-brings-all-things-to-your-remembrance.md',
    why: 'a ByteByteGo forward from 2026-09, before the convention. Recoverable by subject; not guessed.',
  },
  {
    file: 'DR-0505-the-swarm-that-agreed-together-and-the-plumbline-held-from-outside.md',
    why: 'a forward from before the convention. Recoverable by subject; not guessed.',
  },
];

describe('isEmailSourced — proximity, which is DR-1050’s lesson applied', () => {
  it('recognises a provenance line in the shapes records actually write', () => {
    expect(isEmailSourced('Darrell forwarded a ByteByteGo article on 2026-10-13 with one word on it, "Lesson"')).toBe(true);
    expect(isEmailSourced('Darrell, 2026-09-15, forwarded the Morning Brew newsletter with the single word **"Lesson."**')).toBe(true);
    expect(isEmailSourced('forwarded it into the lesson lane with one word of his own written over it: *"Lesson"*')).toBe(true);
  });

  it('PROVEN-TO-CATCH: a record that merely DISCUSSES forwards is not one', () => {
    // The loose version of this check (both strings anywhere in the file)
    // flagged 40 records where this flags 27, and the extras included a record
    // about Android dictation. Distance is what separates them.
    const far = `A note on how the lane works: a teaching is forwarded in.\n${'filler. '.repeat(400)}\nElsewhere, unrelated, someone wrote "Lesson" on a whiteboard.`;
    expect(isEmailSourced(far), 'two mentions a paragraph apart are not a provenance line').toBe(false);
    // And the same text IS caught when they sit together, so the detector is
    // not simply failing on this fixture.
    expect(isEmailSourced('a teaching is forwarded in with one word on it, "Lesson"')).toBe(true);
  });

  it('needs both halves — neither alone is provenance', () => {
    expect(isEmailSourced('Darrell forwarded a newsletter with a note'), 'no one-word instruction').toBe(false);
    expect(isEmailSourced('the one word on it was "Lesson"'), 'nothing says it was forwarded').toBe(false);
    expect(isEmailSourced('')).toBe(false);
    expect(isEmailSourced(null)).toBe(false);
  });

  it('the window is the measured one, so a drift in it is a visible change', () => {
    expect(NEAR_WINDOW).toBe(600);
  });
});

describe('namesAThread — a Gmail thread id, not just any hex', () => {
  it('accepts a real id, in prose or in backticks', () => {
    expect(namesAThread('(Gmail thread `1a135f165fe391e3`)')).toBe(true);
    expect(namesAThread('thread 1a13feefef705fa7 carried it')).toBe(true);
  });

  it('rejects what is nearly one', () => {
    expect(namesAThread('1a135f165fe391e'), '15 characters').toBe(false);
    expect(namesAThread('1A135F165FE391E3'), 'the API returns lowercase').toBe(false);
    expect(namesAThread('no id here at all')).toBe(false);
    // A git SHA is 40 hex; the \b boundaries must not let a 16-char slice of
    // one pass as a thread id, or every record citing a commit would look
    // compliant and the guard would be theatre.
    expect(namesAThread('merged as 0c3c68665ffeeddccbbaa99887766554433221100'), 'a 40-char SHA is not a thread id').toBe(false);
  });
});

describe('the real ledger — the rule for new records, and a shrink-only debt', () => {
  const { sourced, missing } = walkLedger(ROOT);
  const numOf = (f) => parseInt(f.slice(3, 7), 10);

  it('the walk reaches the real ledger, not an empty directory', () => {
    const all = readdirSync(join(ROOT, 'docs/decisions')).filter((f) => /^DR-\d{4}-.+\.md$/.test(f));
    expect(all.length, 'the ledger itself').toBeGreaterThan(500);
    expect(sourced.length, 'records built from a forward').toBeGreaterThan(20);
  });

  it(`every record from DR-${FIRST_RECORD_UNDER_THE_RULE} on names the thread it was built from`, () => {
    const ruled = missing.filter((f) => numOf(f) >= FIRST_RECORD_UNDER_THE_RULE);
    expect(
      ruled,
      'a lesson built from a forward must record its Gmail thread id, so the repo is a second witness '
      + 'when the Lesson-Captured label is missed. Add it to the provenance line as (Gmail thread `<16 hex>`).',
    ).toEqual([]);
  });

  it('the outstanding list is EXACTLY the real debt — no stale excuses, no quiet additions', () => {
    const older = missing.filter((f) => numOf(f) < FIRST_RECORD_UNDER_THE_RULE).sort();
    const listed = OUTSTANDING.map((o) => o.file).sort();
    // Both directions. An entry whose record now names its thread is a stale
    // excuse and must be deleted; a record that slipped in unlisted is a
    // quiet addition.
    expect(listed, 'an entry no longer applies — delete it in the same commit that recovered the id').toEqual(older);
  });

  it('the debt may only SHRINK', () => {
    const older = missing.filter((f) => numOf(f) < FIRST_RECORD_UNDER_THE_RULE);
    expect(older.length, 'this number may go down and never up').toBeLessThanOrEqual(9);
  });

  it('every outstanding entry states a real why, not a shrug', () => {
    for (const o of OUTSTANDING) {
      expect(o.why.length, `${o.file} needs a reason worth reading`).toBeGreaterThan(60);
      expect(o.why, `${o.file} must not excuse itself by guessing`).not.toMatch(/^unknown$|^tbd$/i);
    }
  });

  it('the two ids recovered on 2026-10-15 are actually in their records', () => {
    // Not "we intended to backfill" — the bytes are there or this fails.
    const read = (f) => readFileSync(join(ROOT, 'docs/decisions', f), 'utf8');
    expect(read('DR-1005-order-carries-meaning.md'), 'the near-miss record itself').toContain('1a135f165fe391e3');
    expect(read('DR-1004-the-cost-of-owning.md')).toContain('1a135b7ba6605c98');
    // And they are reachable the way a future session will actually look.
    for (const id of ['1a135f165fe391e3', '1a135b7ba6605c98']) {
      expect(THREAD_ID.test(id), `${id} must match the id shape the guard looks for`).toBe(true);
    }
  });

  it('a forward already built is answerable by thread id — the exact query a tick will run', () => {
    // The whole point. `grep <thread id> docs/decisions/` must answer "have we
    // built this?" with no label, no network and no inference from a subject.
    //
    // Two of today's three threads are asserted here. The third — the Morning
    // Brew thread `1a13f985bb4d2a79`, World Issues 20 — is recorded in
    // DR-1049, which is still on its own branch and so is not in this tree.
    // It is NOT skipped: the rule above starts at DR-1048, so the moment
    // DR-1049 lands on main it is enforced like any other, and it already
    // carries the id (verified on that branch before this threshold was set).
    // Asserting it here instead would just fail on a record that does not
    // exist yet, which proves nothing about the ledger.
    const all = readdirSync(join(ROOT, 'docs/decisions'))
      .filter((f) => /^DR-\d{4}-.+\.md$/.test(f))
      .map((f) => readFileSync(join(ROOT, 'docs/decisions', f), 'utf8'))
      .join('\n');
    for (const [id, what] of [
      ['1a135f165fe391e3', 'ByteByteGo / sov39 — the near-miss this rule exists for'],
      ['1a13feefef705fa7', 'CompTIA / sov40'],
      ['1a135b7ba6605c98', 'CFO Dive / DR-1004 — recovered 2026-10-15'],
    ]) {
      expect(all.includes(id), `${what}: grep ${id} docs/decisions/ must find it`).toBe(true);
    }
  });
});
