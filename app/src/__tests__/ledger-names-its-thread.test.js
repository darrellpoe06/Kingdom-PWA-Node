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
//
// TWO ROADS, 2026-10-22. DR-1202 opened a second intake — a link sent into the
// app's own research road, built from an `agent_inbox` row, no email anywhere.
// Until this change the guard did not see that class AT ALL, so a lesson built
// the new way carried no second witness: the near-miss above, reopened on a
// new road. The witness is now the ROAD's own identifier — a thread id for a
// forward, the row uuid for the research road — and the debt list is split
// from the records that BUILT a road, because carrying those as debt made the
// debt number itself a lie.
import { describe, it, expect } from 'vitest';
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isEmailSourced, isResearchSourced, roadOf, namesAThread, namesARow,
  walkLedger, NEAR_WINDOW, THREAD_ID, ROW_ID,
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

// The records that BUILT an intake road. A road's own founding record quotes
// the one-word instruction while explaining how the door works, so the
// proximity detector cannot tell it from a record built THROUGH the door. They
// are not debt: there is no id to recover, because no teaching came that way.
//
// THEY WERE CARRIED AS DEBT UNTIL 2026-10-22, AND THAT WAS THE WRONG SHAPE.
// A future session reads the debt count to know how many ids are still owed;
// counting two permanent false positives in it made that number say 2 when the
// real answer was 1. Splitting them is not an excuse being moved — it is the
// count becoming true. This list is CLOSED at two: a third entry means someone
// is about to build a third intake road, which is a decision, not a test edit.
const BUILT_THE_ROAD = [
  {
    file: 'DR-0312-the-inbox-is-a-lesson-door-and-the-way-reviews-itself.md',
    road: 'email',
    why: 'the record that CREATED the email lane. It quotes the one-word instruction while describing how the door works, and the detector cannot tell a record about the door from a record built through it. Tightening the detector further would start losing real lessons, so this is carried as a known, deliberate false positive instead of weakening the check.',
  },
  {
    file: 'DR-0608-the-lesson-door-inside-the-app-built-and-pinned-its-reader-staged-and-the-transition-written-before-it-is-taken.md',
    road: 'research',
    why: 'the research road\'s DR-0312 — the record that BUILT the in-app lesson door. It measured `agent_inbox` at 0 rows by SQL count on the live project while it was being written, which is proof in the record itself that no teaching had yet arrived that way. There is no row id to name, and asking it for one would be asking a gate to be satisfied by a fiction.',
  },
];

// Every record that arrived before the rule and names no witness, with WHY.
// This is REAL DEBT: an id that exists and has not been recovered yet. The
// list may only SHRINK. Recovering an id means deleting its entry in the same
// commit, and the test fails if an entry no longer applies — so a stale excuse
// cannot sit here looking like a fact.
const OUTSTANDING = [
  {
    file: 'DR-0505-the-swarm-that-agreed-together-and-the-plumbline-held-from-outside.md',
    why: 'its provenance line names the sender but not the publication or the date ("Darrell forwarded, from dpoe@illinois..."), so unlike the seven recovered on 2026-10-15 there is nothing to match a thread on. Recovering it means reading the record for which teaching it carries and finding that newsletter by subject. A guessed id is worse than none, so it waits for that reading.',
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

describe('isResearchSourced — the second road, opened by DR-1202', () => {
  it('recognises the shape a research-road record actually writes', () => {
    expect(isResearchSourced('Darrell sent an Instagram reel into the app\'s research road on 2026-10-22 with one word on it: "Lesson"')).toBe(true);
    expect(isResearchSourced('arrived as an `agent_inbox` row tagged lesson, with the single word **"Lesson."**')).toBe(true);
  });

  it('PROVEN-TO-CATCH: "research" alone is not the research road', () => {
    // Nearly every record in this ledger researches something. If the detector
    // took the bare word, it would sweep in most of the ledger and then demand
    // a row uuid from records that never saw an intake at all.
    expect(isResearchSourced('I researched this thoroughly before writing the "Lesson"'), 'the bare word is not the road').toBe(false);
    expect(isResearchSourced('four web searches of prior research informed the "Lesson"')).toBe(false);
    // And the real phrase IS caught, so the fixture is not simply inert.
    expect(isResearchSourced('it came up the research road with one word on it, "Lesson"')).toBe(true);
  });

  it('roadOf prefers the research road, because every intake record cites DR-0312', () => {
    // MEASURED ON DR-1205, the first research-road lesson. Its Principles line
    // cites "DR-0312 (a forwarded item is built Word-first...)", which puts
    // "forwarded" a line from the quoted instruction — so the email detector
    // fires on a teaching that never touched email. Without this ordering the
    // guard would demand a Gmail thread id for a lesson that has none, on
    // every record built through the new road, forever.
    const real = 'sent a reel into the app\'s research road with one word on it: "Lesson" '
      + '(`agent_inbox` row `d5480d79-4005-418d-b882-69f3187cc32c`).\n'
      + '**Principles:** DR-0312 (a forwarded item is built Word-first)';
    expect(isEmailSourced(real), 'the email detector really does fire on it').toBe(true);
    expect(roadOf(real), 'and the research road wins anyway').toBe('research');
    // A plain forward is still judged as a forward.
    expect(roadOf('Darrell forwarded the newsletter with one word on it, "Lesson"')).toBe('email');
    expect(roadOf('a record about nothing in particular')).toBe(null);
  });
});

describe('namesARow — the research road’s witness', () => {
  it('accepts a real row id and rejects what is nearly one', () => {
    expect(namesARow('(`agent_inbox` row `d5480d79-4005-418d-b882-69f3187cc32c`)')).toBe(true);
    expect(namesARow('row d5480d79-4005-418d-b882-69f3187cc32'), '11 in the last group').toBe(false);
    expect(namesARow('D5480D79-4005-418D-B882-69F3187CC32C'), 'the API returns lowercase').toBe(false);
    expect(namesARow('no id here at all')).toBe(false);
    expect(ROW_ID.test('ed11c486-9568-49ad-94ca-5fcd6872e577'), 'the research item id shape too').toBe(true);
  });

  it('PROVEN-TO-CATCH: a thread id does not satisfy the research road', () => {
    // The two roads are not interchangeable. A 16-hex Gmail id is the wrong
    // witness for a teaching that came through the app, and a row uuid is the
    // wrong witness for a forward — each would answer the grep with nothing.
    expect(namesARow('(Gmail thread `1a135f165fe391e3`)')).toBe(false);
    expect(namesAThread('row `d5480d79-4005-418d-b882-69f3187cc32c`'), 'a uuid has no 16-hex run').toBe(false);
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
  const { sourced, missing, roads } = walkLedger(ROOT);
  const numOf = (f) => parseInt(f.slice(3, 7), 10);
  const FOUNDING = BUILT_THE_ROAD.map((b) => b.file);

  it('the walk reaches the real ledger, not an empty directory', () => {
    const all = readdirSync(join(ROOT, 'docs/decisions')).filter((f) => /^DR-\d{4}-.+\.md$/.test(f));
    expect(all.length, 'the ledger itself').toBeGreaterThan(500);
    expect(sourced.length, 'records built from an intake').toBeGreaterThan(20);
  });

  it('BOTH roads are actually walked — a road with no records would pass silently', () => {
    // The whole failure this change fixes was a class the guard could not see.
    // If the research road ever stops being detected, these numbers say so
    // instead of the suite going quietly green on an empty set.
    const count = (r) => sourced.filter((f) => roads[f] === r).length;
    expect(count('email'), 'forwarded lessons').toBeGreaterThan(20);
    expect(count('research'), 'research-road records (DR-0608 built the door, DR-1205 came through it)')
      .toBeGreaterThanOrEqual(2);
  });

  it(`every record from DR-${FIRST_RECORD_UNDER_THE_RULE} on names the intake it was built from`, () => {
    const ruled = missing.filter((f) => numOf(f) >= FIRST_RECORD_UNDER_THE_RULE);
    expect(
      ruled,
      'a lesson built from an intake must record its road\'s identifier, so the repo is a second witness '
      + 'when the Lesson-Captured label is missed. A forward names (Gmail thread `<16 hex>`); a research-road '
      + 'lesson names its `agent_inbox` row `<uuid>`.',
    ).toEqual([]);
  });

  it('the outstanding list is EXACTLY the real debt — no stale excuses, no quiet additions', () => {
    const older = missing
      .filter((f) => numOf(f) < FIRST_RECORD_UNDER_THE_RULE && !FOUNDING.includes(f))
      .sort();
    const listed = OUTSTANDING.map((o) => o.file).sort();
    // Both directions. An entry whose record now names its witness is a stale
    // excuse and must be deleted; a record that slipped in unlisted is a
    // quiet addition.
    expect(listed, 'an entry no longer applies — delete it in the same commit that recovered the id').toEqual(older);
  });

  it('the debt may only SHRINK', () => {
    const older = missing
      .filter((f) => numOf(f) < FIRST_RECORD_UNDER_THE_RULE && !FOUNDING.includes(f));
    // ONE, since 2026-10-22. It was two while DR-0312 was counted here; moving
    // it to BUILT_THE_ROAD did not recover an id, it corrected what the number
    // means. The ceiling may go down and never up.
    expect(older.length, 'this number may go down and never up').toBeLessThanOrEqual(1);
  });

  it('every outstanding entry states a real why, not a shrug', () => {
    for (const o of [...OUTSTANDING, ...BUILT_THE_ROAD]) {
      expect(o.why.length, `${o.file} needs a reason worth reading`).toBeGreaterThan(60);
      expect(o.why, `${o.file} must not excuse itself by guessing`).not.toMatch(/^unknown$|^tbd$/i);
    }
  });

  it('the road-founding list is exactly the records that really are founding, and really do slip the detector', () => {
    // An entry here must EARN its place twice: the detector has to flag it (or
    // the entry is dead weight pretending to hold something) and the record
    // has to be flagged on the road it claims to have built.
    for (const b of BUILT_THE_ROAD) {
      expect(missing, `${b.file} is listed as a false positive but is not flagged — delete the entry`).toContain(b.file);
      expect(roads[b.file], `${b.file} claims the ${b.road} road`).toBe(b.road);
      expect(numOf(b.file), 'a founding record predates the rule by definition')
        .toBeLessThan(FIRST_RECORD_UNDER_THE_RULE);
    }
    // CLOSED at two. A third road is a decision (DR-1202 was one), not an edit.
    expect(BUILT_THE_ROAD.length, 'a third entry means a third intake road — record the decision first').toBe(2);
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

  it('a research-road lesson is answerable the same way — by its row id', () => {
    // The new road's half of the claim above. DR-1205 is the first lesson
    // built this way; `grep <row id> docs/decisions/` must answer for it.
    const dr = readFileSync(
      join(ROOT, 'docs/decisions', 'DR-1205-the-way-was-45-minutes-long.md'), 'utf8',
    );
    expect(dr, 'the row that carried the teaching').toContain('d5480d79-4005-418d-b882-69f3187cc32c');
    expect(roads['DR-1205-the-way-was-45-minutes-long.md'], 'judged on the road it came in on').toBe('research');
  });
});

describe('PROVEN-TO-CATCH on a fixture tree: the new road is really guarded', () => {
  // The guard's failure mode is silence, so this builds the two records the
  // real ledger cannot contain — a research-road lesson WITHOUT its row id,
  // and one with it — and walks a tree holding only those. If this ever goes
  // green on the missing-id case, the whole two-road change is theatre.
  const tree = (files) => {
    const root = mkdtempSync(join(tmpdir(), 'ledger-witness-'));
    mkdirSync(join(root, 'docs/decisions'), { recursive: true });
    for (const [name, body] of Object.entries(files)) {
      writeFileSync(join(root, 'docs/decisions', name), body, 'utf8');
    }
    return root;
  };
  const LESSON = (witness) => '# DR-9001 — a teaching that came up the research road\n\n'
    + `**Grounds:** Darrell sent a link into the app's research road with one word on it: "Lesson"${witness}.\n`;

  it('flags a research-road lesson that names no row id', () => {
    const root = tree({ 'DR-9001-a-teaching.md': LESSON('') });
    const { sourced, missing, roads } = walkLedger(root);
    expect(sourced, 'it is seen as an intake record at all').toEqual(['DR-9001-a-teaching.md']);
    expect(roads['DR-9001-a-teaching.md']).toBe('research');
    expect(missing, 'no row id, so it must be flagged').toEqual(['DR-9001-a-teaching.md']);
  });

  it('passes the same record once the row id is in it', () => {
    const root = tree({
      'DR-9001-a-teaching.md': LESSON(' (`agent_inbox` row `d5480d79-4005-418d-b882-69f3187cc32c`)'),
    });
    const { sourced, missing } = walkLedger(root);
    expect(sourced).toEqual(['DR-9001-a-teaching.md']);
    expect(missing, 'the witness is there').toEqual([]);
  });

  it('a Gmail thread id does NOT satisfy a research-road lesson', () => {
    // The temptation when a gate is red is to paste in whatever identifier is
    // at hand. A thread id for a teaching that never touched email would be a
    // grep that finds nothing, which is worse than an empty provenance line.
    const root = tree({ 'DR-9001-a-teaching.md': LESSON(' (Gmail thread `1a135f165fe391e3`)') });
    expect(walkLedger(root).missing, 'wrong road\'s witness').toEqual(['DR-9001-a-teaching.md']);
  });

  it('and a row id does NOT satisfy a forward', () => {
    const root = tree({
      'DR-9002-a-forward.md': '# DR-9002\n\n**Grounds:** Darrell forwarded a newsletter with one '
        + 'word on it, "Lesson" (row `d5480d79-4005-418d-b882-69f3187cc32c`).\n',
    });
    const { roads, missing } = walkLedger(root);
    expect(roads['DR-9002-a-forward.md']).toBe('email');
    expect(missing, 'a forward owes a thread id').toEqual(['DR-9002-a-forward.md']);
  });
});
