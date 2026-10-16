# DR-1075: Our own probe is not a person — and the standard that says so, written down to be shown

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (the governor's own numbers, and a foundation document)
**Type:** word
**Area:**
- `infra/supabase/migrations-auto/0298-our-own-probe-is-not-a-person.sql` (new)
- `.github/workflows/rls-isolation.yml` (the replay leg, so 0298 is not reverted)
- `app/src/lib/signup-metrics.js` (`whatItIs`, the `our-probe` category, the tile's own disclosure)
- `app/src/components/AccessUsageMetrics.jsx` (the row says what it is)
- `app/src/__tests__/signup-metrics.test.js` (11 new cases)
- `docs/00-foundations/_root/HOW-WE-WORK-AND-HOW-WE-PROVE-IT.md` (new — the standard and its disqualifiers)

**Grounds:** Darrell, 2026-10-16, reading the Admin roster: **"(555) 555-0100 · signs in by phone / account created 1mo ago · active, last active today ... Who or what is this account? What is it doing daily?!!!!!!!!!!! Bot?!!!!!!!!"** Then: **"Exactly and.... solutions?!!!!!!"** Then: **"We want to have quality metrics and understanding... we need to know what is what about everything... make sense of it and documentation for how we work well and what constitutes as not that... both are important"**; and **"How we do what we do so I can explain and prove it."**
**Principles:** DR-1072 (counting our own instruments is the most flattering lie a surface can tell); DR-0076 (no claim without evidence; §3 proven-to-catch); DR-0061 / P15 (a surface is a live view of real state); DR-0100 (state established fact plainly); DR-0329 (say what is not built)

## Context

Darrell looked at the Admin roster and found an account he did not recognize:
a phone number in the 555-0100 block, created a month ago, signing in daily,
belonging to no space. He asked what it was and whether it was a bot.

It is ours. `.github/workflows/nas-health.yml` signs that account up through the
app's **real** signup shape and then signs it in, every six hours
(`cron '23 */6 * * *'`), to prove a real person can still create an account and
sign in on the live site. It exists because of 2026-08-19, when *"can't reach
our service"* and *"same PIN doesn't work"* were both true and nothing was
watching. 555-0100 is inside the block the NANP reserves for fiction, so it can
never be a real person's number.

He had to ask, and that is the defect.

## What was measured

**1. The count was wrong, and had been for a month.** `admin_signup_metrics`
counted every row of `auth.users` with no exception:

```sql
'total_accounts', count(*),
'active_7d',      count(*) FILTER (WHERE last_active_at >= now() - interval '7 days'),
```

So the governor's **"31 accounts"** included our own robot, and the **"7 active
(7d)"** did too — four sign-ins a day, forever. Every tile on that panel was
inflated by an instrument of ours, and the only reason anyone found out is that
the roster happened to show a phone number nobody recognized.

**2. Nothing in the app knew the probe existed.** `grep` for the probe's
address across `app/src/lib` and `app/src/components` returned **zero**
matches. There was no exclusion, no label, no note.

**3. A delete had already been tried, and could not work.** Migration
`0139-aud-authenticated-and-probe-user-retired.sql` deleted this exact account,
calling it *"the signup-witness's one deletable side effect."* The witness runs
on a clock, so the account returns within six hours. **A delete cannot win
against a cron.** The probe has to be named, not removed.

**4. It is the same failure DR-1072 guarded on a different surface, the same
day.** That record's own words: *"COUNTING OUR OWN INSTRUMENTS AS VISITORS is
the most flattering lie this surface could tell."* On the doors chip I built
four buckets so site-health could never read as a person. The accounts tile had
been doing exactly that the whole time, and I did not go looking.

## Impact

The governor's numbers now count people. The row that caused the question
answers it on the page. And the standard behind both is written down in a form
that can be shown to someone else and checked by them.

## Decision

**1. `our-probe` is a category, and it is decided FIRST** — before any
membership test, so a probe that somehow gains a membership row can never be
counted as a member of anything.

**2. Every PEOPLE count excludes it.** A `people` CTE (`category <> 'our-probe'`)
feeds `total_accounts`, `self_serve_signups`, `family_members`,
`church_members`, `other`, `unprovisioned`, `signups_7d`, `signups_30d`,
`active_7d`, `returned` and `never_returned`.

**3. The exclusion is VISIBLE, never silent.** A new `our_probes` count rides
in the summary, and the tile says it: `30 · 6 family · 0 church · 1 of ours not
counted`. A number that quietly drops rows is its own kind of lie, so the
subtraction is stated where the number is read.

**4. The row STAYS on the roster, labelled.** Hiding it would restore the
original defect in a better disguise — the next person to look would find
nothing and have nothing to find. The row now reads: *"Not a person — the
site-health check. It signs up and signs in every 6 hours to prove a real
person still can (.github/workflows/nas-health.yml). Counted in none of the
totals above."*

**5. Narrow on purpose.** One literal address, named beside the workflow that
creates it. A rule like *"any 555-01xx"* would quietly swallow a real test
account somebody else makes, and a promise this file cannot keep is worse than
the gap it patches. A second probe makes these rows in a table, not a wider
regex.

**6. The standard is written down.**
`docs/00-foundations/_root/HOW-WE-WORK-AND-HOW-WE-PROVE-IT.md` answers what he
actually asked for — *"how we work well and what constitutes as not that... both
are important"* and *"so I can explain and prove it."* Six standards of what
good looks like, each with the right and wrong version from this repository;
eight named disqualifiers, every one a real dated failure here rather than a
hypothetical; and a Part 3 that says what proof consists of and ends with the
only step that matters: **pick any gate, break what it guards, watch it go red,
restore it.** Anyone can claim a standard; two minutes shows whether the checks
catch anything.

## Verification

- **11 new cases.** The row's own sentence must answer the question that was
  asked (*not a person*, *every 6 hours*, *nas-health.yml*, *counted in none of
  the totals*); an ordinary account explains nothing; every category the server
  can emit has a label, so no row ever renders as "Unknown"; the tile says the
  exclusion happened, and says nothing when there is nothing to say; and the
  tile does **not** re-subtract, because two places computing one number is how
  they drift.
- **The migration is asserted on its QUERY, not its prose** — every people
  count must read `FROM people`, `our_probes` must read `FROM accounts` (or it
  would always be zero), the detail list must select from `accounts` so the
  probe still reaches the roster, and `our-probe` must be decided before
  `family` in the CASE.
- **THE REPLAY-ORDER GUARD CAUGHT A REAL ERROR OF MINE, AND IT WAS THE WORST
  KIND.** My first draft built on `0076`. The current definition is **`0257`**,
  which added the `member_presence` join behind "active now", the `spaces`
  count, and the ranked membership that makes the family outrank a person's own
  space — Darrell's own 2026-10-09 correction (*"Doesn't show the member has
  arrived based on the label after switching Christyn to family... End to
  end!!!"*). Shipping my draft would have **silently reverted all of it** on the
  next replay. The guard named the file, the function and the fix. 0298 is now
  0257's function with a category added and the counts filtered, and 0298 is
  listed in the `role-control` replay leg after 0257 so a replay cannot undo it.
- **A fourth self-matching test, caught and fixed in the same hour.** The check
  for `'our_probes'` matched the migration's own header prose describing
  `'our_probes'`. Comment lines are now stripped **and the stripping is asserted
  not to have blanked the file**. A sibling assertion that matched a comment
  (*"The probe STAYS here, labelled"*) was replaced with one on the query
  itself.
- 23 gates green by exit code; lint clean; **full suite run** — not the
  judgement-picked subset that failed this session twice (see DR-1072's
  amendment).

## What this does not do

- **It does not stop the probe.** It should not. The probe is why we would know
  within six hours if signup broke again, and 2026-08-19 is the reason it
  exists.
- **It does not sweep the other surfaces.** The accounts tile is fixed and the
  doors chip was fixed this morning, but no one has yet asked *"does this number
  count our own instruments?"* of every other count in the app. That question
  now has a written standard to be asked against. **`re-review: 2026-10-23`** —
  walk the surfaces that show a count and answer it for each, naming any that
  cannot be traced to real rows.
- **It does not make the standard document a gate.** It is a foundation doc, and
  the machinery it describes already exists. Turning any of its disqualifiers
  into a new machine check happens when one of them bites again — which is how
  all 23 of the current gates came to exist.
