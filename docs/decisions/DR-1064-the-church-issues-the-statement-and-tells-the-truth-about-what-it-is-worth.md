# DR-1064: The church issues the statement — and tells the truth about what it is worth

**Date:** 2026-10-16
**Status:** accepted
**Tier:** C (the church's name on a document a member files with the IRS; the membership agreement's own words)
**Type:** word
**Area:**
- `app/src/lib/giving-statement.js` (new — the statement, anonymous giving, the tithe teaching)
- `app/src/lib/church-member-intake.js` (the covenant sentence, corrected)
- `app/src/__tests__/giving-statement.test.js` (new)

**Grounds:** Darrell, 2026-10-16, with the membership agreement open on *"it holds no giving amount and no giving total"*: **"The church has will need to have recorded records for giving for tax purposes..."** — then: **"They will have to accept that we do keep these types of records in the signin for the app when they give something... they can also give anonymous... however we need to know all possible data... make sure people know the tax benefits of their church tithe... make sense?"**
**Principles:** DR-0100 (state established fact plainly — and do not over-claim it); DR-0076 §8 (honest uncertainty, flagged narrowly); DR-0098 (teach, do not debate); DR-0356 (the signed agreement is version-pinned); Matthew 6:3-4 (giving is not on the roll)

## The gap is exact: not a wrong promise, a missing record

Three giving roads already exist, and **not one of them is the document a member
needs at tax time.** The two that come close say so themselves:

| road | its own words |
|---|---|
| `giving-records.js` — the giver's own ledger, owner-only, Matthew 6:3-4 | *"The church's official contribution statement comes from the church office."* |
| `giving-reports.js` — the office's working record from Cash App history | *"a working record for the church office — **not** a church-issued tax statement."* |
| `church-member-intake.js` — the member record | holds no giving figure at all, deliberately |

One points at the office. The other says it is not the office's document. **The
document itself was never built.**

## The promise was not in conflict — it was ambiguous

*"This record holds no giving amount and no giving total"* is **true and must
stay true.** Giving never appears on a member card, so nobody reading the roll
can see what anyone gives — Matthew 6:3-4 carried in the schema rather than in a
policy. That protection is kept word for word.

What it must not be read to mean is *"the church keeps no record of your
giving"* — because the church **must** keep one, and the member **needs** it.
The sentence now names which record it is speaking about, and says the other
one exists and is theirs. **Changing it is safe:** `signChurchCovenant` stores
the attestation text **with each signature**, so a past signer's record still
holds exactly what they read.

## What the rules require, stated plainly

**IRS Publication 1771**, *Charitable Contributions — Substantiation and
Disclosure Requirements*:

- A donor cannot claim a deduction for a **single contribution of $250 or more**
  without a **contemporaneous written acknowledgment** from the church —
  in hand by the earlier of the date they file or the filing due date.
- It must carry: the **organization's name**, the **amount** of cash, a
  **description but not a value** of any non-cash gift, and either **no goods or
  services were provided** or a description and good-faith estimate of them.
- A **quid pro quo** payment over **$75** needs a written disclosure that only
  the excess over the value received is deductible.

The church's accountant signs off on the form the church issues. This builds it
and **refuses to build one it cannot stand behind** — a statement missing a
required element is worse than none, because the member relies on it and finds
out at an audit.

## Decision

1. **The statement is issued from the church's own records**, with every Pub
   1771 element **decided from the data** rather than pasted onto every copy.
2. **A non-cash gift is described and never valued.** The church pricing a
   donated piano is the church signing a number it did not verify.
3. **Anonymous giving is kept, and what it costs is said BEFORE the choice.**
   Both halves of his sentence hold and they do not fight: the church records
   every gift, *and* a giver may keep their name off theirs. An acknowledgment
   must name the donor, so an anonymous gift cannot be substantiated — stated up
   front, never discovered in January. A year of only anonymous gifts says
   exactly that, never *"no gifts are recorded"*, which would be a lie to
   someone who gave all year.
4. **Money is never a float.** Integer cents throughout.
5. **It refuses** on a missing legal name or address, an unnamed member, a bad
   year, or an empty year — *a statement reading $0 reads like a denial*. A
   missing EIN **warns** and does not block: Pub 1771 does not require it, but
   every preparer will ask.

## The teaching — where it would be easy to do harm by being encouraging

He asked that people know the tax benefit of their tithe. **The flat sentence a
congregation usually hears — "your tithe is a tax deduction" — is false for most
households, and the ones it is least true for can least absorb the surprise.**

- **The fact (DR-0100 tier 1):** a gift is deductible **only if you itemize**,
  which happens when your itemized deductions together exceed the standard
  deduction. Since 2018 most households take the standard deduction, and for
  them the tithe changes the tax bill by nothing.
- **Genuinely open, flagged narrowly (tier 2):** the figures move every year and
  the rules for non-itemizers have changed more than once. **So no dollar figure
  for the standard deduction is printed anywhere** — a number typed from memory
  would be read off a church surface by a family making a real decision, and a
  stale one is worse than none. The teaching carries the **test** and names who
  holds the current figure. **`re-review: 2027-01-15`** — source the filing
  year's figures and surface them from a dated record, not from prose.
- **The one figure that does not move is named:** the $250 written-acknowledgment
  rule.
- **And the order, which only this platform will say:** the deduction is real
  and it is **second**. *"Take heed that ye do not your alms before men"*
  (Matthew 6:1, KJV); *"God loveth a cheerful giver"* (2 Corinthians 9:7, KJV),
  both quoted verbatim. Nobody tithes for the write-off. Knowing what the law
  allows is stewardship; making it the reason is something else. Both are said,
  in that order, and neither is debated (DR-0098).

## Verification

- **33 cases**, weighted at the ways a statement can **harm** the person holding
  it — a different list from the ways it can be untidy.
- **The over-claim is pinned as a test**, not left to good intentions: an
  assertion fails if a standard-deduction dollar figure is ever printed in the
  teaching prose.
- **An anonymous gift is asserted never to reach a total** on a document that
  names a donor.
- **Money:** 300 gifts of $33.33 total exactly $9,999.00.
- **The $250 boundary is asserted inclusive**; the $75 boundary asserted
  exclusive, with the arithmetic still honest below it.
- **One of my own assertions was wrong and the test said so.** The rewrite
  turned *"never sold, never sent to…"* into *"**none of it** is ever sold, ever
  sent to…"*, and the antecedent is now **both** records — a real strengthening.
  The assertion was written against the old wording; a second case now pins that
  every refusal sits **inside** the "none of it" clause, so a later tidy-up
  cannot narrow it back to the member card alone.
- **Every original protection is pinned individually**, because the easiest way
  to do harm here is to lose one while adding a sentence.

## What this does not do

- **Nothing is wired into a surface yet, and nothing is issued.** This is the
  pure core and its proof. The office's issue-and-send control, the stored
  `anonymous` flag on a gift row, and the church's legal name / address / EIN
  fields are **a schema change and a Tier-C send**, which belong in their own
  record with the Governor's hand on them. **`re-review: 2026-10-20`.**
- **It does not give tax advice and says so on the document.**
- **The $250 rule is about a SINGLE contribution**, not a yearly total. The
  statement counts gifts over the threshold rather than claiming the year total
  needs one.
