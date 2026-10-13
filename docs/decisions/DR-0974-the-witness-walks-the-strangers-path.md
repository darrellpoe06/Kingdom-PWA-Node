---
id: DR-0974
title: The witness walks the path a stranger walks — its own first run read the wrong page
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0973]
tier: B
entities: [poetech, poe-properties]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, SURFACE-SAYS-TRUTH]
source: 2026-10-11 — public-shelf-witness run 38178556102, its first live outing
---

## Context

DR-0973 shipped the public shelf witness so Darrell would stop being the only
instrument that reads the page a stranger sees. Its **first live run**, within
minutes of merging, reported:

```
Base: https://poetech.us/properties/app/
Cards read: 0

**1 finding(s):**
- the shelf rendered NO cards at all — either nothing is advertised or the
  page is broken, and these must never read the same
```

**Zero cards, from a shelf holding three.** The witness was right to fail and
wrong about why.

## What was measured

The same run's **other** reading succeeded, and it is the one that matters:

```
shared doors checked: 2
the shelf agrees with what the doors are called.
```

So the shelf was correct. The browser had read the wrong page.

**The shelf is not the landing page.** `PropertiesDoor.jsx:321-330`:

```js
const [who, setWho] = useState(scanned ? 'applicant' : null);
useEffect(() => {
  if (who !== 'applicant' || vacancies !== null) return;
  loadPublicVacancies().then(...);
}, [who, vacancies]);
```

`/properties/app/` opens on **"Who are you?"** and only fetches
`public_vacancies()` once the visitor picks the one option that needs no
account — *"Looking for a place"* (`WHO_OPTIONS[0]`, `model.js:449`). Darrell's
own screenshot showed `← BACK` above *"Available now"*, which was the evidence
that he had clicked through and the witness had not.

**The witness had photographed the chooser and judged that.** Its rule "an
empty shelf fails" fired correctly on a page that genuinely had no cards — it
simply was not the page it was built to read.

**THE FAILURE IS THE POINT.** DR-0973 decision 4 made "unknown is not pass"
a rule precisely so a witness could never report healthy about a page it had
not understood. Had the empty case been written as a pass — "no cards, nothing
to check, green" — this would have become a **daily green tick over a page
nobody was reading**, and the next inert fix would again have been found by
Darrell. The rule earned its keep on the instrument's own first outing.

## Impact

Unresolved, the witness is worse than nothing: it would file an incident every
single day, and a guard that cries wolf is ignored within a week (P46) —
leaving the shelf unwatched while a green-looking instrument claimed
otherwise.

It also leaves the DOM half of the witness unproven against the real page,
which is half the reason DR-0973 exists. The database half already works
(`DOORS_CHECKED: 2`), so the loss is the second opinion, not the first.

Reversible: one navigation step in the browser shell and three source pins.
No rules changed, no database access changed, no product surface touched.

## Decision

1. **The witness clicks through the chooser before judging anything.** It
   finds the button by its **visible text** — `getByRole('button', { name:
   /Looking for a place/i })` — then waits for cards.
2. **By visible text, not a testid.** A testid would let the button be renamed
   out from under the witness in silence; the visible words are what a
   stranger reads and clicks, and if they change, the witness should notice.
3. **The click is best-effort.** If the chooser is absent — a scanned card
   link lands straight on the shelf — the witness proceeds rather than
   failing. The absence of a chooser is not a fault.
4. **Three source pins** keep this from being rediscovered on a live run at
   02:41: that the click happens *before* the card wait, that it clicks by
   role and visible text, and that `WHO_OPTIONS` still has exactly one
   no-account option whose label is the one being clicked.
5. **NOT changed:** the rules, the database reading, the brakes, the run log.
   The instrument was pointed at the wrong page; it was not wrong about what
   a truthful card looks like.

## Verification

- `the-public-shelf-has-a-witness.test.js` — **20 tests** (17 from DR-0973,
  3 added here).
- **Proven-to-catch:** the pin asserts the click sits between `page.goto` and
  the card wait, so reverting the navigation fails it. Reverting the *text* to
  a testid fails the second pin. Renaming the WHO option fails the third,
  against `WHO_OPTIONS` itself rather than a copy of the string.
- **The founding evidence is the run, not a reproduction:** run
  **38178556102**, `Cards read: 0` from the browser while
  `shared doors checked: 2` / *"the shelf agrees with what the doors are
  called"* from the database, in the same job.
- Lint clean; all 17 `verify:gates` green.
- **Not proven:** that the next live run reads three cards. That is the
  dispatch after this merges, and it is the only thing that closes this.
  `re-review: 2026-10-12`.

## Links

[DR-0973] (the witness this corrects — its decision 4, "unknown is not pass",
is what made the fault visible in minutes), `PropertiesDoor.jsx:321-330` (the
`who === 'applicant'` gate), `model.js:449` (`WHO_OPTIONS[0]`, the one option
needing no account), [DR-0958] (the `/properties/` path this reads).
