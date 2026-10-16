# How We Work, and How We Prove It

**For Darrell, to explain and to show.** Not a philosophy — an account of the
method, with the receipts attached. Every claim below names a real incident in
this repository, with its date and the machine check that now prevents it. If
someone asks *"how do you know your software is any good?"*, this is the answer,
and it can be checked by anyone who can run the tests.

**Status:** living. New incidents are added as they happen; nothing is removed.
**Date:** 2026-10-16
**Grounds:** Darrell, 2026-10-16 — *"We want to have quality metrics and
understanding... we need to know what is what about everything... make sense of
it and documentation for how we work well and what constitutes as not that...
both are important"*; and *"How we do what we do so I can explain and prove
it."*

---

## The one sentence

**Nothing is believed because it sounds right. It is believed because it was
measured, and because a check that has been shown to catch the failure is still
watching.**

---

## Part 1 — What good looks like

Six standards. Each one is a thing you can point at and verify.

### 1. A number says what it counts, and what it leaves out

A count that silently includes or excludes rows is not a measurement. It is a
claim with no definition.

- **What it looks like done right:** the Admin roster's "Total accounts" tile
  reads `30 · 6 family · 0 church · 1 of ours not counted`. The exclusion is
  stated on the tile, not hidden in the query.
- **What it looks like done wrong:** that same tile read `31` for a month,
  counting our own site-health robot as a person.

### 2. A row can be identified by the person looking at it

If someone has to investigate their own system to find out what a row is, the
surface failed, not the person.

- **Done right:** the probe row now says, on the row —
  *"Not a person — the site-health check. It signs up and signs in every 6 hours
  to prove a real person still can. Counted in none of the totals above."*
- **Done wrong:** `(555) 555-0100 · signs in by phone · active, last active
  today`, with nothing else, which is what sent Darrell asking *"Bot?!!!"*

### 3. Unknown is never reported as zero, or as no

The most dangerous number is the one that reads fine when the instrument is
broken.

- **Done right:** the "At the doors" surface, when the edge road does not
  answer, says so in the Worker's own words and **draws no bars at all**.
- **Done wrong:** drawing zeros, which reads as "nobody came" when it means
  "we could not look."

### 4. Our own instruments are never counted as people

We run probes against our own site on a clock. They are not visitors, members,
or accounts.

- **Done right:** the traffic mix has **four** buckets — browsers, **our own
  witnesses**, crawlers/scripts/AI, and unknown — and site-health is named on
  the screen as ours.
- **Done wrong:** folding our own curl runs in with browsers, which in the test
  fixture turns 58% people into 81% people.

### 5. A promise is kept at the size it can actually be kept

We say what we will do. We do not claim a guarantee we cannot hold.

- **Done right:** the member covenant reads *"The church will never **willingly**
  sell my record... What they promise is their will, not their perfection —
  they will say so when they find they were wrong, and they will not claim a
  safety they have not built yet."*
- **Done wrong:** *"never sent to... an advertiser"* — signed by members while
  the app's Google sign-in door had been open the whole time.

### 6. Every gate has been shown to catch the thing it guards

A check that has never failed has never been tested. A green check must mean
something.

- **Done right:** before a gate ships, the failure is deliberately introduced
  and the gate is watched to go red, then the file is restored byte-identical.
- **Done wrong:** shipping the gate and trusting that it works.

---

## Part 2 — What is NOT that

These are the disqualifiers. Each one is a real failure from this repository,
not a hypothetical, and each is named so it can be recognized again.

### "It passes" without saying what was run

**2026-10-16.** Two decision records claimed verification — 8 suites / 79 tests,
10 suites / 244 tests — and neither included the full suite, which had not been
run. It was red: 1 of 26,340. A pull request sat blocked for an hour and fifty
minutes while the cause was theorised about. **Picking which tests to run by
judgement is a tool for retargeting pins; it is not a substitute for the full
run,** because a baseline frozen over the whole tree fails in a file the change
never touched.

### A check that is satisfied by its own documentation

**Four times in one day, 2026-10-16.** A test asserted a colour and matched the
comment explaining the colour. A test asserted "no trackers" and matched the
header listing the trackers that do not exist. A test asserted a SQL key and
matched the paragraph describing the key. **Every such check now strips
comments first — and asserts that stripping did not blank the file**, because a
stripper that eats everything makes the check pass on anything.

### A probe that reads green while measuring nothing

**2026-10-16.** A health probe carried an SQL comment containing a double quote,
which closed the shell's argument. The command ran, printed the previous line,
and the half that mattered never executed. Not a crash, not a red check — the
exact silent-green failure, written one commit after citing the rule against
it. **The fix was not "be careful": it was to shell-tokenize the command and
assert the value is one token containing every count.**

### A mutation that does not mutate

**2026-10-16.** Testing whether an assertion really held, the "break" was
introduced in a place that did not change the behaviour. The suite stayed
green, and the assertion was nearly recorded as proven. **A mutation that
changes no behaviour proves nothing about the test — it proves the mutation was
wrong.**

### Built, shipped, and never reachable

**Three in one day, 2026-10-16.** A visitor-analytics library with zero callers
in 1,222 files. A tax-statement builder with zero callers while the data it
needed sat in the database. A promise in a signed covenant that the app's own
sign-in door had already broken. **The check is cheap: search for the module's
own name and see whether anything but its test imports it.**

### An alarm raised from one sample

**2026-10-16.** A single slow run was reported as a trend. The instrument added
in the same change then showed the steady state was 12% of the budget, not 90%.
**One sample is one sample. Say "one sample."**

### A number nobody can trace to a row

A painted percentage, a hardcoded list, a progress bar that cannot miss its own
target. **If the value displayed cannot be traced to a real row, a real run, or
a real timestamp, it does not ship** — on a surface whose whole value is trust,
a painted number is worse than none.

### A promise made larger than it can be kept

Claiming safety that has not been built. **Under-claiming a verified truth and
over-claiming an unverified one are the same failure pointed in opposite
directions.**

---

## Part 3 — How it is proven

This is the part that makes the rest checkable rather than aspirational.

### The machinery, and what each piece is for

| | |
|---|---|
| **23 deterministic gates** | run on every push; the build fails on any one. Each exists because a specific failure happened once. |
| **26,340 tests** | the full suite, run before a push, and again in CI on the real commit. |
| **A frozen UI baseline** | covers the whole component tree, so a regression is caught in a file the change never touched. |
| **Decision records** | one per decision, append-only, each answering Context / What was measured / Impact / Decision / Verification. |
| **An outside-in site witness** | hits the live site from a GitHub runner every 6 hours and proves a real person can still sign up and sign in. |
| **Dated re-reviews** | every deferral carries a date; nothing is parked forever. |

### The rule that generates the machinery

**Every "a human would have known" failure becomes a machine check.** That is
why there are 23 gates and not 3 — each is a scar. The list grows because the
method works, not because the code is getting worse.

### What proof looks like, concretely

When something is claimed done, these are attached:

1. the **command** and its **exit code** — not a grep for the word "FAIL", which
   misses a guard that prints `✗`;
2. the **mutation** that was introduced to prove the check catches, and the
   confirmation the file was restored byte-identical;
3. the **real artifact** the number came from — a run id, a row count, a log
   line, a `file:line`;
4. what was **not** verified, stated plainly.

### The honesty requirement

Every record above includes the author's own errors, by name, with their cost.
That is deliberate. **A method that only records its successes cannot be
trusted to find its failures** — and the failures are where the next gate comes
from.

---

## How to show this to someone

1. Open this document — it names the standard and the disqualifiers.
2. Open `docs/decisions/INDEX.md` — every decision, with what was measured.
3. Run `npm run verify:gates` from `app/` and read the exit code.
4. Pick any gate and break what it guards; watch it go red; restore it.

Step 4 is the one that matters. Anyone can claim a standard. The question is
whether the checks actually catch anything, and that takes about two minutes to
find out.
