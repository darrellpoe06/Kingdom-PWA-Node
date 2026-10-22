# DR-1209: The refusal says its number is a guess — it named three different targets for one record in ninety minutes, and every one was taken

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one refusal message; the number it computes is unchanged; 3 assertions added, proven to catch)
**Type:** tooling
**Area:**
- `scripts/resolve-ledger-conflicts.mjs` (the collision refusal — the guess is marked as a guess and names the tool that verifies it)
- `app/src/__tests__/resolve-ledger-conflicts.test.js` (3 assertions added to the existing refusal case, 21 cases total)

**Grounds:** measured on PR #2360 tonight, three times, by watching my own work invalidate the advice the resolver had just given another session.
**Principles:** DR-0076 §4 (measure, never claim) and §8 (name the method's limits — a guess that reads as a verified number is an unnamed limit); DR-1079 (disk cannot see a branch in flight); DR-1021 (the resolver's refusal is where the cure is written down); DR-0075 (recurring friction becomes a fix); DR-0236 (nothing buildable waits)

## Context

`resolve-ledger-conflicts.mjs` refuses a DR-number collision rather than folding it, because folding silently deleted a real decision twice (DR-0644). The refusal is good: it names both files, says this is a renumbering job and not a merge, and carries the order that has to be followed. It also names **the number to renumber to** — and that number is `maxRowId(INDEX) + 1`, computed from what is on disk.

Disk cannot see a branch that has not landed. DR-1079 measured and recorded exactly this, built `claim-decision-number.mjs` to answer it, and deliberately left the resolver alone. What was left open is that the refusal still *states* a number, in the tone of an answer, at the moment an operator is looking for one to paste.

## Measured (DR-0076 §4)

On PR #2360, one record (`DR-1185-the-house-is-one-size-everywhere.md`) was told three different targets inside ninety minutes:

| the refusal said | why it was already wrong |
|---|---|
| **DR-1205** | claimed by `claude/the-way-must-be-prepared`, unlanded |
| **DR-1207** | claimed by #2391, unlanded, pushed minutes earlier |
| and 1206, 1208 went the same way | each taken by work of mine still in flight |

Every one of those was correct about disk and wrong about reality. I was the cause of all three: my own branches took the numbers while that PR sat in CI. The live tool, run at the same moments, answered 1207, then 1209, naming the branches it stepped over:

```
$ node scripts/claim-decision-number.mjs
next free decision number: DR-1209
  on disk:   1105 record(s), highest DR-1207
  in flight: 41 number(s) held by unlanded branches, 1 of them at or above DR-1208
```

The cost of following the guess is not small: a renumber rewrites a file name, an INDEX row and every citation, invalidates an already-verified tree, and buys another full CI cycle. DR-1021 measured that same compounding on 2026-10-15 and called it the real cost of a collision. Three times in ninety minutes is that cost, paid for advice that was never checked.

## The decision

**The refusal keeps its number and stops presenting it as verified.** The computation is untouched — it is right whenever nothing is in flight, and the suite pins it — but the message now says what it is and names the tool that actually knows:

```
CHECK THAT NUMBER BEFORE USING IT. DR-1186 is max-on-disk + 1,
and disk cannot see a branch still in flight. On 2026-10-22 this refusal named three
different targets for one record inside ninety minutes and every one was already
claimed by unlanded work. Run this and use the number IT reports:
    node scripts/claim-decision-number.mjs
```

And because the paste-ready line in step 2 is where a wrong number actually gets used, the caveat is repeated there rather than only above it:

```
  2. node scripts/renumber-decision-record.mjs 1185 1186 --file <the record that moves>
     (on a clean tree only ONE record holds the number, so it rewrites every
      citing file for you; mid-merge it must refuse them as ambiguous)
      — and use that target ONLY if claim-decision-number.mjs agreed; otherwise its number
```

**What this deliberately does NOT do.** It does not call `claim-decision-number.mjs` from the resolver. Two reasons, and the first is measured: in CI this script runs from a copied temp path (`file:///home/runner/work/_temp/resolve-ledger-conflicts.mjs`, visible in the stack trace of the refusal that prompted this), so a relative import would fail exactly where the advisory comment is generated — the one place it matters most. The second is DR-1079's own reasoning, unchanged: that tool scans refs and is left as something a person runs and reads, not something a merge step runs invisibly.

## Impact — what this obligates

**Unresolved, the cost is paid by whoever reads the refusal.** It is the clearest instruction in the repo for a collision, which is what makes a stale number in it expensive: it is trusted precisely because the rest of the message has earned trust.

**What the call obligates:**

- **A collision target is verified with `claim-decision-number.mjs` before the renumber**, not read off the refusal. That is now written where the renumber happens.
- **The refusal's number stays computed from disk.** Nothing downstream should start treating it as authoritative; this record is the reason it isn't.
- **This is not the convention change DR-1079 reserved.** The pointer is still one shared line, two sessions branching from the same main still read the same free number, and a shared reservation still touches every past record. That remains a Governor's call and is untouched here.

### Limits, named rather than left (DR-0076 §8)

- **It is a message, so it only helps a reader who reads it.** A session that pastes the number from step 2 without reading the paragraph above still collides — which is why the caveat is on the paste line too, and why nothing here claims the collision is prevented.
- **It does not reduce the collision RATE at all.** DR-1195 measured that rate and found it holding; this makes each collision cheaper to resolve correctly, nothing more.
- **`claim-decision-number.mjs` has its own blind spot, inherited unchanged:** it cannot see two sessions that both run it in the same minute before either pushes. DR-1079 names that, and only a shared reservation fixes it.

  **That blind spot then happened to this record, before it merged, and the timing was measured rather than assumed.** `dr-number-claim` reported DR-1209 contested between this branch and #2392 (`DR-1209-each-asset-works-end-to-end-its-address-and-its-money.md`). Git says this branch's record was committed and pushed at **04:03**; #2392's was committed at **04:10:57**, seven minutes later. The tool, run at 04:05, reported `next free decision number: DR-1209 … 41 number(s) held by unlanded branches, 0 of them at or above DR-1210` — **correct at the moment it was asked, and stale seven minutes later.** Nothing was wrong with the scan; the number was genuinely free when each side looked. That is the race, exactly as DR-1079 described it, caught on the record that documents it.

  **And nothing is renumbered here on that account.** DR-1136 makes merge order the only tiebreak, and the check's own words are *"renumbering into a number that is still moving is the treadmill this exists to end."* Whichever of the two lands second moves, on a clean tree, with the tool re-run at that moment — which is precisely the instruction this record just put into the refusal. The rule and the evidence arrived together.

## Proven to catch (DR-0076 §3)

The three new assertions sit in the existing refusal case, which already pinned the number and the order, so the whole message is now held by one test:

| assertion | what it pins |
|---|---|
| `/CHECK THAT NUMBER BEFORE USING IT/` | the caveat exists at all |
| `/claim-decision-number\.mjs/` | it names the tool that verifies |
| `/cannot see a branch still in flight/` | it says WHY the guess can be wrong, not just that it can |

Proven by deleting the caveat block from the refusal: **1 failed, 20 passed**, `expected [Function] to throw error matching /CHECK THAT NUMBER BEFORE USING IT/`. File restored from a byte copy and verified identical with `diff -q`, then 21 passed again — the restore discipline DR-1207 records, not `git checkout`.

The refusal was also read end to end as an operator meets it, by throwing a real collision through `normalizeLedger` and printing the message, rather than by reading the string concatenation and assuming how it renders.
