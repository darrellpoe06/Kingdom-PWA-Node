# DR-0944 — An application is corroborated, not credentialed

**Date:** 2026-10-10
**Status:** Accepted
**Declared by:** Darrell
**Supersedes / extends:** DR-0903 (the application was a dead letter), DR-0101 §7 (fair-housing guardrail), DR-0313 (no SSN in the payload)
**Code:** `infra/supabase/migrations-auto/0272-an-application-is-corroborated-not-credentialed.sql`, `app/src/modules/properties/ApplicationsTab.jsx`, `model.js` (`CORROBORATION_ITEMS`), `cloud.js`
**Gates:** `infra/supabase/tests/0272-application-corroboration-smoke.sql`, `app/src/__tests__/an-application-is-corroborated.test.jsx`

---

## What was asked

Darrell, 2026-10-10, looking at the short-stay booking form's line *"I am 21 or
older and will show a photo ID at check-in"*:

> We should get licenses uploaded? Or not? Opportunities and constraints?

Then, once shown why an applicant's ID is the one document we must not hold:

> How can we verify people without ID?

And then, naming the model himself:

> Same as rent a center...

## The answer on licences: three different things, two different answers

**Yes, upload** — a contractor's trade licence and insurance certificate.
Public records the state already publishes, near-zero exposure to hold, and the
risk runs the other way: an uninsured worker hurt at a door lands on the owner.
`0264` (proof before paid) and the `contractor-1099` document already exist.

**Yes, upload** — the family's own rooming-house / boarding licence.
`coliving.js:51` asks whether the municipality requires one and `lease-by-room`
is *gated* until the co-living checklist clears. The licence is what clears it.

**No** — an applicant's or guest's driving licence or photo ID. Already refused
in three enforced layers, none of them a promise:

| Layer | Mechanism |
|---|---|
| Field model | `intake.js` marks the social-security and licence fields `collect:'out-of-band'` |
| Validation | `validateApplication` returns them in `refused`, `ok:false` |
| Database | `0152` `CONSTRAINT rental_applications_no_ssn` refuses the payload |

`0272` extends the bar to free text so a phone note is not the back door.

The decisive reason is not only breach exposure. **A photo ID reveals race,
approximate age and often national origin.** Holding one *before* a decision
means a declined applicant can show we possessed protected-class information at
decision time — which is why `screenDecisionReason` already refuses a decision
recorded on any of those terms. Not holding it is the safer posture, both ways.

## Why Rent-A-Center is the right model

They run no credit check. What they do is call four to six personal references,
take a utility bill or lease proving the address, take a pay stub, and know
where the person physically is. **Corroboration instead of credentials.** It
transfers to a landlord *better* than to them, because the asset never leaves
his possession — the tenant lives in it.

A forged licence costs about eighty dollars. Six people who answer the phone and
know your name, a gas bill at an address, and an employer whose number the
landlord looks up himself are expensive to fake — and they verify the thing that
matters. **An ID proves WHO someone is. It has never predicted whether they will
pay the rent or keep the place.** References, employment and payment history do.

The app's own fair-housing message already named exactly those criteria. This
finishes the sentence it started.

## The gap, measured

The application already collects `landlordName`, `landlordPhone`, `employer`,
`supervisorName`, `supervisorPhone`, `monthlySalary` and two emergency contacts.
**Nothing is ever checked, and there is no record of whether anyone tried.** We
gather the numbers and never dial them. Rent-A-Center's entire edge is that they
make the calls.

## The decision

A fixed corroboration list — `phone-answers`, `prior-landlord`, `employer`,
`income-shown`, `address-shown`, `reference` — worked for every applicant, with
each attempt recording **who checked, when, and what they heard**. A decision
cannot be recorded until every item has been **attempted**.

Two properties are load-bearing and both are gated:

**It is not a score.** No total, no threshold. A score is an exclusion engine
wearing arithmetic, and the people it would exclude — the first-time renter, the
recently-arrived, the unbanked, the person leaving a household rather than a
lease — are exactly who the no-ID posture exists to keep a door open for.
`not-applicable` is a first-class outcome, and six `could-not-reach` rows is a
complete list: he tried, nobody answered, and that is what gets written down.

**It is not discretion either.** The same list for everyone. A landlord who
calls one applicant's references and not another's *is* the fair-housing
exposure; working a fixed list for all of them is the defence, and far better
evidence than a note written afterwards.

**Append-only.** A second attempt is a new row, never an edit — "called Tuesday,
no answer" then "called Thursday, reached her" IS the record, and the sequence
is the part a dispute turns on. No UPDATE and no DELETE is granted, to anyone.

**It ships with the Applications surface, not after it** (DR-0903). A screen
that shows a stranger's answers and offers Approve / Decline and nothing else is
the most legally dangerous thing we could build: pure discretion, no record of
diligence, no evidence the next applicant was treated the same. The list is what
makes the decision safe to record at all.

Both ends also join `door_events` (Darrell: *"Logs for who did what and when for
all users including me"*) — applications were outside the clock, the same hole
DR-0903 found in the timeline.

## Proven to catch

Measured on a local PostgreSQL 16 replaying the `door-work` leg, and in vitest:

| Break | Caught by |
|---|---|
| corroboration trigger dropped | `a decision was recorded with NO checks at all` |
| append-only grant widened | `a check was EDITED after the fact` |
| free-text SSN guard dropped | `an SSN-shaped string was ACCEPTED in a call note` |
| decision gate removed from the control | 2 cases fail |
| **gate reads outcomes instead of attempts** (the exclusion-score bug) | **3 cases fail, including the first-time renter and the unreachable-references applicant** |

That last row is the most important one in the build: the two cases that fail
stand for real people the arithmetic would have shut out.

Also caught, by existing gates, on my own work: `properties-intake.test.js`
refused the three-letter token in a comment in my `.jsx` (complied rather than
allow-listed — an exception is how the next real one gets through);
`legibility-guard` measured my inline `#B85838` at **3.94:1** against the 4.5
floor on midnight/card; `migration-replay-order-guard` refused `0272` until it
was added to the live `poe-properties` leg, where a replay of `0266`/`0269`
would otherwise have silently reverted the `door_events` read policy.

And the behavioural test found a real defect no source-grep would have: the
SSN refusal reached the person as a generic *"that did not save"*, because
`cloud.js`'s `no()` folds an explanatory `{message}` into `.error`.

## Not proven from this sandbox

A real application submitted from the live build, on his own door, reaching this
surface; and the corroboration list worked on his phone. **re-review: 2026-10-17.**

## Still open

A payment rail or third-party identity verifier (Stripe Identity, Persona) would
let a short-stay guest be verified without us holding anything — the vendor
holds the ID, we hold a pass/fail token. That is real money and a vendor
relationship, so it is the Governor's call, not a default.
**re-review: 2026-11-07.**
