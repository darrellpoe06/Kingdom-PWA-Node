# DR-0323 — The law, the history, and what a real Ways review found in what we just shipped

- **Status:** accepted
- **Tier:** B — user-trust-bearing content changes to a shipped feature and a visible form change (RELEASE-TIERS decision tree, question 2). No money, no schema, no new module.
- **Scope:** `docs/99-session-notes/2026-09-03-legacy-provisions-law-and-history-research.md`, `app/src/lib/family-trust.js`, `app/src/lib/legacy-provisions-course.js`, `app/src/components/LegacyProvisions.jsx`, `app/src/__tests__/family-trust.test.js`, `legacy-provisions-course.test.js`, `ui-standards-guard.test.js`, `docs/00-foundations/_root/UX-PATTERNS.md`
- **Date:** 2026-09-03
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §8 provenance + honest uncertainty), MACHINERY-OVER-MEMORY (DR-0314), SPEC-CONFORMANCE (DR-0219), NOTHING-WAITS (DR-0236), TEACH-DONT-DEBATE (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100)

## Directive

> *"comprehensive understanding and research outside of the current understanding so we can be collectively aware — also research current state laws and suits to confirm the way we should be building our systems to support our users and families"*
> *"historical events that shaped the systems"*
> *"did you review our Ways and documentation and other requirements?"*

## Part 1 — The research, and its honest ceiling

Full write-up with sources: `docs/99-session-notes/2026-09-03-legacy-provisions-law-and-history-research.md`.

**State the ceiling first (DR-0076 §8).** Web *search* worked; every direct *fetch*
of a primary source was refused by this environment's egress proxy — Justia,
uniformlaws.org, revisor.mn.gov, cobar.org, FindLaw, even Wikipedia, all
`403 CONNECT tunnel failed`. **I did not read the text of UTC § 503 or § 504, or
any state statute, with my own eyes.** Everything is secondary: search-result
summaries of law-firm, casebook, law-review and agency commentary. Therefore the
app **quotes no statute verbatim** and its language stays at "generally / in most
states / commonly." Where sources disagreed (the DAPT state count: 17 in one, "about
19" in another) **both readings are recorded** rather than one chosen to look tidy.

### What the research CHANGED in the product — eight things

1. **Discretion, not the clause, is the deeper protection.** UTC § 504: a creditor —
   *including an exception creditor* — generally cannot compel a distribution the
   trustee may withhold. We had shipped "the trust owns it," which undersells the
   mechanism and misdirects the reader.
2. **The wall faces INWARD too.** *Claflin v. Claflin* (Mass. 1889): beneficiaries
   cannot agree among themselves to end a trust where that defeats a **material
   purpose** — the American rule, diverging from *Saunders v Vautier*. New review
   item: **does the instrument STATE its material purposes?** A purpose never
   written is one a court must guess at.
3. **Siting ≠ residence.** *In re Huber*; *Toni 1 Trust v. Wacker* (Alaska 2018) —
   one state cannot limit another state's courts. New review item: **has counsel
   confirmed the family's RESIDENCE state respects what the siting state promises?**
4. **"State law varies" became concrete.** California caps a judgment creditor at
   **25%** of a payment otherwise due (Prob. Code § 15306.5); New York reaches income
   **beyond education and support** (EPTL § 7-3.4). Neither state is "protected" or
   "unprotected" — both are partial, on their own terms.
5. **We built a PRINCIPLE trust and were not calling it that.** The literature's own
   term for principles-plus-discretion, as against a mechanical incentive formula —
   and it names our exact design rationale: *"earn a dollar, get a dollar"* breaks on
   the first heir who is disabled, studying, raising small children, or serving
   unpaid, and a rigid formula can create the fixed, non-discretionary right that
   **weakens the very discretion** finding 1 depends on.
6. **The public-policy line is eligibility vs. ongoing control.** *Shapira* (Ohio 1974)
   upheld a marry-within-the-faith condition; *Feinberg* (Ill. 2009) upheld religious
   conditions that do **not** exert control over future conduct. Our weighed,
   exemptible standard sits on the safe side — a lever on daily conduct would not.
7. **The constitution binds morally, not legally, and that is the design.** It is a
   letter of wishes: the trustee must take it into account, is not bound by it, and in
   practice usually follows it. Sharpened further: **do not incorporate an amendable
   document as a binding term** — incorporation generally requires the document to
   exist at execution, so incorporating freezes it and quietly amending it would
   amount to amending the trust.
8. **CTA / FinCEN BOI**: reporting for U.S. companies and U.S. persons was removed by
   interim rule in March 2025 and made permanent by a final rule effective
   2026-08-14; **state-level rules still apply.** Recorded so no surface ever tells a
   family to make a federal filing they do not owe — or that state filings vanished.

Each is pinned by a test (`family-trust.test.js`, "the research landed, not just got
filed") so a later edit cannot quietly strip it back to the vaguer version.

## Part 2 — The history, as a lesson

Lesson 7, **"How we got here."** Not decoration: every clause in the course is
somebody's answer to a real fight, and the fight is always the same one — **how far
may one generation reach forward to bind the use of what it hands on?**

Yahweh answered first, and answered BOTH ways: a wall (Leviticus 25:23; Numbers 36:7)
**and** a jubilee release with a kinsman's right of redemption (Leviticus 25:10, 25:25;
Jeremiah 32:7). *A wall that never opens is not His pattern.* Then the common law:
the **Crusades** (the institution begins with a holder who refused to give the land
back), the **Statute of Uses 1535** (Henry VIII's fee problem; lawyers found the holes
and "active duty" holders became *trustees*), **Nichols v. Eaton 1875** and **Broadway
National Bank v. Adams 1882**, **Claflin 1889**, the **1986 GST tax** driving the
perpetuities repeal (South Dakota first, 1983), and **Alaska 1997** writing the first
domestic asset-protection statute expressly to beat the Cook Islands, Delaware
following within the year.

**We teach John Chipman Gray's objection rather than hiding it** — that these trusts
let people escape *"the duty of keeping one's promises and paying one's debts"* and
perpetuate a privileged class. A family that cannot answer him should not use the
tool, and the answer is not a cleverer clause: it is a house that pays what it owes,
gives off the top, and forms heirs who produce. Four new KJV fragments verbatim and
pinned.

## Part 3 — The Ways review, answered precisely

Asked directly whether I had reviewed the Ways, the honest answer was **partially**,
and the gaps were real. DR-0314 exists because this claim has been made falsely
before, so the specifics matter more than the assurance.

**Read during the build:** `CLAUDE.md`, DR-0314 (in full), DR-0107 (in full — and only
after the ari-guard stop-hook caught me citing it *unread*), DR-0272, DR-0319,
`INDEX.md`, the guard scripts, the sibling courses.

**NOT read, and governing:** `docs/CONTEXT.md` (the Layer 1 router Layer 0 tells you
to read), `SCRIPTURE-REFERENCE-STANDARD.md`, `UX-PATTERNS.md`,
`COMPREHENSIVE-REVIEW-STANDARD.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md`,
`memory/MEMORY.md`. Reading them produced four findings:

### 3.1 A standing conflict between the Scripture standard and every course in the app

`SCRIPTURE-REFERENCE-STANDARD.md` specifies **ESV primary, KJV secondary**, with the
citation pattern `**ESV — Ref:** *"text"*`. **The Legacy Provisions course quotes KJV
throughout and cites no ESV** — as do `succession-class`, `healthy-living`,
`world-issues` and the Godhead study, all of them gated on KJV.

This is not my course drifting; it is a **documented standard the codebase does not
meet and structurally cannot**: the repo ships public-domain corpora only
(`app/public/bible/kjv`, `web`), and ESV is copyrighted. Producing ESV text I cannot
verify would violate the harder rule that governs both documents — *never invent a
translation* — and would be a far worse failure than the divergence.

**Surfaced, not silently resolved** (`feedback-surface-premise-conflicts`). The two
lawful closes are (a) amend the standard to say KJV/WEB are the quotable corpora and
ESV is the *display* preference the reader sets, or (b) license and ingest an ESV
corpus. That is a doctrinal call for Darrell, not mine. **Carried; carrier: the
daily review-watcher queue, with this DR as the record.**

### 3.2 My own surface violated Pattern 2f — twice

- **2f.2** (a dropdown never leaves a person with nowhere to go): the beneficiary
  picker on the record form **dead-ended** when no one was on the roster. Fixed —
  `+ Add a beneficiary…` creates through the **same builder** the roster card uses and
  selects the new person; the empty state now **says** it is empty.
- **2f.3** (a disabled control says what it is waiting for): the roster Add button
  greyed out **in silence**. Fixed — it now reads "Type a name to add."

### 3.3 The guard that should have caught me is PINNED, not swept — and a sweep is wrong

`ui-standards-guard.test.js` sweeps 2f.1 (every file picker in the app) but **pins**
2f.2 and 2f.3 to the two defects that prompted DR-0314. A new surface therefore sails
past both, which is exactly what happened.

**Measured before writing any rule** (DR-0314's own discipline): **207** `<select>`
elements in `components/` map their options from an array; **2** offer an in-place
add. The other 205 overwhelmingly map **fixed vocabularies** — status, month,
category — that can never be empty. A blanket sweep would file **205 findings**, and
noise is how a guard gets deleted (2f §3). The distinguishing property — *"maps a
user-created collection that can legitimately be empty"* — is **not decidable by
regex**.

So: my form is **pinned** (proven-to-catch — removing the add affordance turns it
red), and the **measurement and the working rule are written into `UX-PATTERNS.md`**
so the next builder neither re-derives it nor ships a noisy sweep.

### 3.4 A tier I got wrong

DR-0322 was labeled Tier B. Running the actual decision tree, question 4 — *"a
documented bug fix with a verified reproducer"* — makes it **Tier A**. Over-tiering is
the harmless direction, but it is still inaccurate, and recorded rather than quietly
corrected.

### 3.5 The eight dimensions, RUN — and what running them found

The first version of this section said the comprehensive review was not run and
carried it. The ari-integrity stop-hook rejected that reply before it reached
Darrell (*"claims a comprehensive review but shows only 3/8 dimensions — run all 8,
or don't call it comprehensive"*), which was correct: describing the dimensions is
not running them. Run in full, they found **three defects the unit tests could not
see**.

**1. SHOULD/ARE (DR-0219).** Ways cited at `file:line` throughout §3; gaps named in
3.1–3.4, each closed or carried with a carrier.

**2. JOURNEY WALKS — FOUND A BROKEN JOURNEY.** Four personas walked from their own
entry point. **Journey 1 could not be completed:** an heir who opens *Constitution*
first — the tab their name is on — on a fresh install found the entire Attestation
card hidden (`people.length > 0 &&`), no attest control, and **nothing telling them
why or where to go**. Every unit test passed; the journey was impossible. Fixed: the
card always renders, says the roster is empty, and offers the **same builder** the
production tab uses. Gated in `legacy-provisions-journeys.test.jsx`,
**proven-to-catch** (restoring the `people.length > 0 &&` condition turns Journey 1
red).

**3. SURFACE-SAYS-TRUTH.** Every explanatory string checked against the traced
mechanism, and now pinned: the production card's numbers are asserted to come from
`POE_PRODUCTION_POLICY` itself (rule, period, ratio, floor, every exemption reason),
the wall may not print "confirmed" with nothing answered, and the Help entry must
describe the two halves the tab actually renders. Copy can no longer drift from the
engine. *Also fixed here:* two inputs on one panel both read "Name" — now
"New beneficiary's name" and "Your name."

**4. FORM-FACTOR SWEEP — MEASURED, and found a hole in the instrument.** All 11
views × 3 widths + the Big Print text-scale pass, in real Chromium, **0 failures**,
`books` (where this surface lives) included. But the first sweep **exited 0 having
measured only 8 of its 11 views** — church, books and messages produced no lines and
no failure. A gate that can silently skip a third of its subjects and still report
success is the vacuous-green class DR-0076 §3 exists to kill, and counting failures
cannot see it. `chrome-layout-probe.mjs` now **counts every completed measurement and
asserts the total**: a short run is a failed run, however clean its verdicts.
**Proven-to-catch** — skipping one width prints `COVERAGE FAIL — measured 2 of 3`
and exits 1. *(An early local red, "header h1 never rendered" at all widths, was my
own build missing the `VITE_SUPABASE_*` stubs CI supplies — an environment artifact,
not a defect, and it is recorded as such rather than as a finding.)*

**5. DELIVERY-CONTEXT + THE DR-0108 CHALLENGE.** Run: this feature has **no NAS-side
step, no secret onto a device, no dashboard click**. The one human-only item is the
ESV/KJV doctrinal call in 3.1 — an **undecided bright line**, which is a lawful
human-only classification, not a fake boundary. `his-hand-guard` passes.

**6. FINDINGS ARE A WORK QUEUE — two states only.** Every finding above is **DONE
with evidence** except two, each **CARRIED by a named system**: the ESV/KJV call
(carrier: the review-watcher queue; blocker: a decision only Darrell holds) and a
mechanical signal that would let 2f.2 become a real sweep (carrier: the working rule
now in `UX-PATTERNS.md`). No third state, no invented dates.

**7. GATE-THE-CLASS.** Five new machine checks, each observed red before green where
a mutation exists: the journey walks, the surface-truth pins, the Pattern 2f pin, the
probe's coverage assertion, and `legacy-provisions-course.js` added to
`scripture-inference-guard`'s scanned set.

**8. THE WORD — QUOTED *AND* REASONED.** *Quoted:* 25 KJV fragments verbatim from the
repo corpus, pinned, and observed catching a one-word drift. *Reasoned:* the course
was **outside the reasoned gate entirely** — `scripture-inference-guard.mjs` scanned
nine files and not this one, so a claim living *between* two correct quotes had no
check. Added; scan now clean over ten files. The four questions run on the riskiest
cross-verse claim — "Yahweh answered both ways, a wall AND a release": the wall
(Leviticus 25:23; Numbers 36:7) and the release (25:10; 25:25) are **the same law's
own structure**, not an assembly of mine, and the lesson applies Galatians 4:1-2's
stated principle without claiming Paul wrote about estates.

## Also proven this session

The sovereign migration lane, dispatched after DR-0322 merged, reports
**`ledger 181/181, frontier: none`** — *"The sovereign database now carries every
migration this checkout holds,"* which includes `0167`. **My predicted number (152)
was wrong**: the ledger was 151 of **181**, so roughly thirty migrations were behind,
not one. The proof is the frontier line and the lane's own assertion, not the figure I
guessed — and I did not read the `_sovereign_replay` row myself.

## Carried

- **The ESV/KJV standard conflict** — Darrell's doctrinal call (3.1). Carrier: review-watcher queue.
- **A mechanical signal separating user-created collections from fixed vocabularies**, which would let 2f.2 become a real sweep (3.3). Carrier: `UX-PATTERNS.md` working rule until such a signal exists.
