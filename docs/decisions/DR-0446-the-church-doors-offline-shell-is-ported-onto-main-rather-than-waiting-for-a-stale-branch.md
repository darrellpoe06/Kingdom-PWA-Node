# DR-0446 — the church door's offline shell is ported onto main rather than waiting for a stale branch

- **status:** accepted
- **date:** 2026-09-16
- **extends:** DR-0258 (disjoint install scopes), DR-0444 (the door a space lives behind), DR-0111 (do the work — do not park it on a human), DR-0125 (the site has its own witness), DR-0076 (verification doctrine)
- **credits:** the diagnosis, the design and the fallback ladder are **PR #1405's** ("The church's door gets its own offline shell — and its own witness"), authored by Darrell 2026-08-30. This record is about where the fix LANDS, not about re-deciding it.

## The correction that produced this

DR-0444 listed the per-door offline fallback as an open item, dated
`2026-10-07`, and called it "real but narrow." **Both halves were wrong**, and
reading the existing work rather than trusting the note is what showed it:

- **Not narrow.** For a `/lovecorner/app/` navigation,
  `caches.match(BASE + '/index.html')` resolves to the WRONG app's shell when
  that entry exists and to **`undefined`** when it does not — and
  `respondWith(undefined)` IS a network error, which Chrome renders as
  **`ERR_FAILED`**. On 4G one transient failure is enough. That is a dead front
  door, not an offline inconvenience. Darrell photographed exactly that on
  2026-08-30 while `site-health.yml` reported "UP. Fresh." across every
  dimension.
- **Not unaddressed.** PR #1405 had already diagnosed and fixed it.

And then I compounded it: my first instinct was to hand the item back as "your
call — rebase #1405." That parks a LIVE defect on a human, which is the
DR-0111 failure in its plainest form. The `hold` label and the governor's word
are the brakes; a stale branch is not a decision.

## Measured before acting (DR-0076 §1)

Against `main@a2078515` on 2026-09-16 — the defect was live, not historical:

| checked | found |
|---|---|
| `app/public/sw.js:70` | still `caches.match(BASE + '/index.html')` |
| `SCOPE_SHELLS` in the shipped worker | absent |
| `site-health.yml` probing any door face | **none of the four** |
| #1405's own files present in main | none |

So the door the congregation taps had no scope-aware shell AND no witness of
its own, four weeks after both were written.

## Decision

1. **The fix is PORTED onto current `main`, not rebased from #1405.** Rewriting
   history on someone else's branch is forbidden, and waiting for a 17-day-old
   base to be rebased is waiting. Porting needs no permission, touches nobody
   else's branch, and gets the defect out of the product today. #1405's
   diagnosis is credited in the worker, in the test and here.
2. **ONE door list serves both features.** DR-0444 added `DOOR_PATHS` to the
   worker for notification routing; #1405 added `SCOPE_SHELLS` for the offline
   shell. Carrying two lists of the same doors is exactly the drift this repo
   has paid for before, so `FACE_SHELLS` now derives from `DOOR_PATHS`, and a
   selftest fails if a second copy ever appears. That unification is the duty
   the two changes owed each other, and it is discharged here rather than left
   to whoever merged second.
3. **The ladder can never end in `undefined`:** this face's shell → the PoeTech
   shell → a real offline page. Face shells are precached **best-effort**, so a
   face that 404s degrades one fallback instead of rejecting install and leaving
   the device with no worker at all — which would be strictly worse than the bug
   being fixed.
4. **Every face gets a witness.** `site-health.yml` now probes
   `/lovecorner/app/`, `/moore/app/`, `/tlc/app/` and `/properties/app/`, and a
   face that 404s or serves 200 without a `#root` mount fails the probe like any
   other dimension. A congregation's door being dark IS the site being down.

## Receipts

7 cases in `app/src/__tests__/sw-scope-shell.test.js`. Re-applying the original
one-line fallback turns **3** of them red, including the mechanism itself:

```
× a CHURCH navigation offline falls back to the CHURCH shell, not PoeTech's
× the other installable faces each get their own shell
× with NO cached shell at all, a navigation still gets a real Response
```

Two of the seven are drift guards rather than behaviour: one fails if a second
door list appears in the worker, one fails if `site-health.yml` stops probing a
face.

## What this does NOT claim, and what is left

- **Not proven on hardware.** This is the structural fix, exactly as #1405 said
  of itself. Devices with the old worker installed keep it until the next
  controller swap. On-device confirmation on Darrell's fold is outstanding.
  **re-review: 2026-09-23.**
- **A device stuck right now** still needs the interim door
  `poetech.us/poetech-app/?view=church`, or a one-time clear of site data.
- **#1405 also carries an unrelated change** — the Learn course picker moved
  above the browse shelf (Darrell 2026-09-01, "The courses drop-down should be
  at the top"). That is a real request and is NOT ported here, because it is a
  different concern and this port is deliberately minimal. It stays #1405's to
  land, or becomes its own item. **re-review: 2026-09-23.**
- **#1405 itself is now largely superseded** on the outage half. Closing or
  rebasing it is the author's, and nothing in the product waits on that any
  more — which was the whole point of porting.
