# DR-1071: The promise is a will, not a perfection — measurement is disclosed, and the risk is said out loud

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (the words of two signed covenants, and a live surface under both)
**Type:** word
**Area:**
- `app/src/lib/church-member-intake.js` (the member covenant's signing statement)
- `app/src/lib/household-intake.js` (the household covenant's signing statement)
- `app/src/lib/household-covenant.js` (the document itself — a new section 4, "What we do count", and the honest frame on section 6)
- `app/src/components/ChurchMemberSpace.jsx` / `app/src/components/HouseholdSpace.jsx` (the footer each surface shows under the record)
- `scripts/measurement-carries-no-identity-guard.mjs` (new — the 23rd gate)
- `app/src/__tests__/measurement-carries-no-identity.test.js` (new — proven-to-catch)

**Grounds:** Darrell, 2026-10-16, in three moves. First, on whether to use Google Analytics at all: **"We will not personally sell data... we all have Google currently... we will build what we need to offload from these services in the meantime we will get all the value from our data!!! Just tell the users!!!!!!!! We are transitioning and need data to have clarity and understanding.... not to prey on our users... however without data... we have no analytics!!!!!!! Which we use to get better!!!!!!! Understanding is what we give and then know."** Then, correcting an assumption of mine: **"We allow them to use Google to log in already?!!!!!!!!!! What?!!!! Your assumptions are annoying...."** Then, correcting the covenant I wrote from the first two: **"Count what makes sure we build solid solutions... period... dont add constraints for fake values... we won't willingly sell data... period... however we are still learning and researching and don't know everything yet... so its a risk... period!!!!!!!!! Grow with us or don't!!?!??!!!!!"**
**Principles:** DR-0076 (no claim without evidence; §3 proven-to-catch); DR-0100 (speak established fact — under-claiming is as much a failure of truth as over-claiming); DR-0329 (say what is not built); DR-0008 (the analytics posture this amends); DR-1070 (the visitor stage, and the measurement of what is actually installed)

## Context

DR-0008 settled the analytics question four months ago in one direction —
self-hosted and explicitly **not** Google Analytics — and the member covenant
carried a sentence that matched it: the member's record is *"never sold, never
sent to an employer, a lender or an advertiser."* A member signs that sentence
to join the roll.

Darrell reopened it because the first half of DR-0008 never happened. Nothing
was self-hosted. DR-1070 measured the result: zero third-party trackers in
`index.html`, ten home-grown usage libraries, none of DR-0008's named engines
installed, and `recordView()` returning false without a session — so the
visitor stage **never existed at all** for four months. The refusal was kept
perfectly and the capability was never built, which left the app with no way to
see what helps.

His direction was not "install Google Analytics." It was: stop refusing our way
into blindness, take the value from the data we already generate, **tell the
users plainly**, and build the sovereign replacement while we do.

## What was measured

**1. The covenant was already false, and nobody had noticed.** My first draft
of this change assumed Google was not involved in the app at all. He corrected
that, and the correction is the finding. `app/src/lib/supabase.js` calls
`supabase.auth.signInWithOAuth({ provider: 'google' })`, surfaced in
`AuthModal.jsx` and `PasswordAuth.jsx`. **The Google sign-in door has been open
the whole time.** Google is an advertiser. So every member who joined through
that door signed a sentence promising their record is never sent to an
advertiser, while the act of signing in told one. The clause was not a promise
we were about to break; it was a promise already broken on the day it was
signed, by a door we built and never mentioned.

**2. What the counting would actually carry.** The sovereign usage libraries
write `usage_events` rows on our own Supabase under RLS. Nothing third-party
receives anything today — there is no sink to receive it. That is the honest
state, and it is why this was the cheap moment to add a gate: *before* the
thing it governs arrives.

**3. What a guard can and cannot hold.** His third message is the one that
reshaped the design: *"dont add constraints for fake values."* A guard cannot
make a system safe. It cannot see a dependency, a header, a referrer, an IP, or
a mistake nobody has thought of. A constraint that implies otherwise buys a
feeling of safety with none of the substance — and its green check then stands
in for a safety nobody built, which is precisely the silent-green lie DR-0076
§3 forbids. What a guard **can** hold is our own source, and *"willingly"* is a
statement about intent — which in software is what the source says.

## Decision

**1. Measurement is allowed and DISCLOSED, in the sentence people sign.** Both
covenants now say the app counts how its PAGES are used, why (to see what helps
and fix what does not), and that the counting is being moved onto our own
equipment. The household covenant gains a whole section for it — **4. What we do
count** — ending *"We would rather tell you we count than let you find out."*

**2. The advertiser clause is STRUCK, not softened.** It cannot stand while the
Google sign-in door exists. In its place the door is named plainly: *"If I sign
in with Google, then Google knows I signed in here — that is what choosing that
door means, and I can use the phone-and-PIN door or an email and password
instead."* A member now chooses the door knowing what it costs.

**3. Every refusal becomes a statement of WILL.** *"The church will never
**willingly** sell my record, my giving or my prayer requests."* The promise
also gains a subject — the church — because a promise has to name who is making
it. This is not a weakening. It is the difference between a promise we can keep
and one we cannot.

**4. The risk is said out loud, in the covenant itself, where it cannot be
missed:** *"the people building this are still learning and still researching,
they do not know everything yet, and so there is real risk in it. What they
promise is their will, not their perfection — they will never willingly hand
over what is mine, they will say so when they find they were wrong, and they
will not claim a safety they have not built yet. I can grow with them on those
terms, or not."* The last clause is his — *"Grow with us or don't"* — put
where the person deciding can read it.

**5. The one constraint worth adding is the one that holds our own hands.**
`measurement-carries-no-identity-guard.mjs` refuses exactly one thing: a
third-party measurement call that carries **who the person is** or **what they
gave**. It does not forbid measurement. It does not forbid the Google sign-in
the covenant now names. It does not touch our sovereign `usage_events`, which
are governed by RLS rather than by a grep. And it claims nothing beyond its
reach — the limits are written in its own header, and the covenant states the
risk in words rather than letting the gate's green check imply it away.

The hazard it exists for is not a decision anyone will make. It is a convenient
extra argument added for a good reason six months from now: a user id *"so we
can segment"*, an email *"to match the CRM"*, an amount on a giving event. Each
is one line. Each is a **willing** hand-over. Each would break a sentence
somebody put their name to.

## Verification

- **Proven to catch, on the real tree, twice** (DR-0076 §3). A
  `gtag('event','gave',{ user_id: session.user.id })` appended to a real shipped
  file → **exit 1**, named at `app/src/lib/visitor-funnel.js:141`. A
  `plausible('Gave',{ props:{ amount_cents } })` with **nobody named at all** →
  **exit 1** as a protected subject, which an identity-only check would have
  waved through. File restored byte-identical after each (`git diff --stat`
  empty); clean run **exit 0**, 1222 files.
- **12 cases**, weighted at the two ways this gate could be worthless: crying
  wolf (a page count, our own `recordView`, a `usage_events` insert and the
  Google sign-in call all pass) and always passing (the sink regex is asserted
  to actually match, and `index.html` is read from disk to confirm no tracker is
  installed).
- **The stripper cannot blank a file into a pass.** The first version of that
  protection was itself wrong — it flagged a legitimately all-comments file as
  unreadable, and the test caught it. The rule is now narrow and correct: raw
  text held a sink call **and** stripped text holds nothing.
- **Four places pinned the old wording and all four were retargeted, not
  deleted** — `church-member-intake.test.js` (two cases), `giving-statement.test.js`
  (three), `household-record.test.js`, plus the two surface footers. The whole
  tree was searched for `advertiser` and `none of it` **before** the first test
  run this time, which is the fix from this session's own repeated miss. Nine
  suites, 174 tests, green.
- **New cases that pin the posture rather than the prose**, so a later tidy-up
  cannot quietly restore a guarantee: the covenant must match `never willingly`,
  `their will, not their perfection`, `still learning`, `real risk`, and `say so
  when they find they were wrong`; it must **not** match `advertiser` or any
  `we guarantee` / `completely secure` / `100%` claim.
- The household covenant's sections are asserted to number 1..n in order — the
  insertion first shipped as `n: 3.5`, which the renderer would have printed as
  *"3.5. What we do count"*.
- 23 gates green by **exit code** (not by grepping for "FAIL" — `interconnect-guard`
  prints `✗`, which that grep misses; this session already reported "gates clean"
  once when they were not). Lint clean. Build green.

## What this does not do

- **It does not install Google Analytics, or any third-party tracker.** Nothing
  is added to `index.html`. This decision changes what we *say* and what the
  code is *allowed* to send; adding a sink is a separate decision, and the gate
  is now in place first.
- **It does not build the sovereign replacement.** The counting is still ten
  scattered home-grown libraries with no surface, and DR-1070's visitor funnel
  is written but not yet wired to Access & Usage. That is the *"build what we
  need to offload from these services"* half of his direction, and it is work,
  not words. **`re-review: 2026-10-20`** — wire the funnel, and name the one
  place a steward reads the count.
- **It does not make the system safe, and says so.** The guard sees our source
  and nothing else. The covenant now carries that limit in plain words instead
  of leaving a member to infer a safety from a silence.
- **It does not retroactively re-sign anyone.** Members who signed the old
  sentence signed the old sentence. Versions are pinned and server-stamped
  (DR-0356), so the change is visible rather than overwritten — and the next
  signature is on words that are true.
