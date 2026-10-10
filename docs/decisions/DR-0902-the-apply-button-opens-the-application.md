# DR-0902 — The Apply button opens the application

- **Status:** accepted
- **Tier:** B (the public front door; the only path a prospective tenant has, and the one printed on cards in windows)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/public/properties/redirect.js` (new), `app/public/properties/index.html`, `app/src/modules/properties/Storefront.jsx` (`VacancyCard` gains `onApply`), `app/src/components/PropertiesDoor.jsx` (`applyFor`, `ApplyForm` gains `openFor`), `app/src/__tests__/apply-opens-the-application.test.jsx` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §6 reality-trace), REALITY-TRACE-BEFORE-BUILDING (DR-0061/P15), COMMUNITY-FIRST-MISSION
- **Grounds:** DR-0313 (the shareable front-door link and why the static page exists), `apply-link.js` (the QR contract: an id and nothing else), DR-0152 (applying needs no account), DR-0901 (the module's addressing, the sibling of this query problem)

## The word, as spoken

Darrell, 2026-10-10, on the public listing for 805 North Prospect Avenue Apt 2,
at `poetech.us/properties/app/?properties=1`:

> "The image has an apply button that should open the application!!!?!!! It
> does not do that currently!!!!!! Fix it!!!!"

## What was measured

Three defects sit in this one journey. He could only see the first.

**1. The card's Apply went nowhere.** The control under the photograph was an
anchor to `applyUrl(unit.rentalId)` (`Storefront.jsx:165`), which builds
`https://poetech.us/properties/?apply=<rentalId>`. `/properties/index.html` is
a **static** page whose only job is to carry a link preview (DR-0313), and it
forwarded with:

```html
<meta http-equiv="refresh" content="0; url=/properties/app/?properties=1" />
```

**A meta refresh cannot see the query it was reached with.** The destination is
a fixed string, so the `apply` id was destroyed exactly one hop before the app
could read it. The far side was correct the whole time —
`readApplyTarget(window.location.search)` → `resolveScan` → `preselect`
(`PropertiesDoor.jsx:292, 310, 409`) was simply never handed anything. So the
person left the page they were already standing on and arrived back at it with
nothing opened, which is precisely what he reported.

**2. Every printed QR code had the same fate, and that is the bigger half.**
`apply-link.js` exists so that *"someone standing at the door of a vacant unit
points a camera at a card in the window and lands on the application FOR THAT
UNIT — no typing an address, no hunting a listing."* Every card already printed
encodes that same `/properties/?apply=<id>`, so every scan has been landing on
the generic front door. Those cards are physical and cannot be recalled, which
decides where the fix belongs: at the hop they all pass through, not only in
what new links look like.

**3. Even a scan that worked still demanded a tap.** `ApplyForm` opened at
`useState(false)` and rendered its own "Apply — no account needed" button,
while the comment three lines below said preselecting the unit *"is the whole
point of the code"*. So a person who scanned a code **on the door of the unit
they want** was shown a button and made to ask again. That is the same extra
tap he named on the lessons the same day: *"users have to click again!!!
Why?"*

## Impact

Unfixed, the public front door has no working path from a listing to an
application except the one general button at the bottom of the page, and every
QR code in every window points at the wrong screen. This is the surface a
stranger meets first and the only one a prospective tenant has; a dead control
on it reads as a business that does not work, and there is no signed-in
fallback because applying deliberately requires no account (DR-0152).

What the call obligates: `/properties/` is now a **forwarder**, so its
behaviour is load-bearing rather than cosmetic. Its destination path is fixed
in code and never read from the URL, and the gate below pins that, because a
forwarder that took its path from a parameter would be an open redirect on the
one page strangers are most likely to reach.

**Not proven from this sandbox:** that a real phone camera, on a real printed
card, lands on the open application. The forwarder is executed for real in the
gate against a fake `window` and round-trips the id through `applyUrl` and
`readApplyTarget`, and the deploy is proven on its SHA — but the physical scan
is Darrell's to try. `re-review: 2026-10-17`.

## The decision

1. **`/properties/redirect.js` forwards the query.** It reads
   `location.search`, forces `properties=1` (the flag `main.jsx` boots the door
   on), and `location.replace()`s to `/properties/app/`. `replace`, not
   `assign`, so the back button returns the person to the text message or the
   camera they came from rather than to a waypoint that bounces them forward
   again.
2. **A separate FILE, not inline.** The page's own header says "No inline JS
   (CSP: `script-src 'self'`)", and the measured policy
   (`app/public/_headers:23`) confirms it. An inline script would be blocked
   and silently do nothing; a same-origin file is `'self'` and runs. The gate
   asserts the page contains no inline `<script>` at all.
3. **The meta refresh stays, at 3s, as the fallback.** If the script 404s the
   page must still move. The delay lets the script win normally; the no-JS case
   costs three seconds and reaches a React app it could not have used anyway.
4. **The destination path is a constant.** Only the query and hash are carried.
   This cannot become an open redirect, and the app validates everything it
   then reads — `readApplyTarget` returns null for anything that is not a
   well-formed id, so a mangled scan degrades to the ordinary door.
5. **The card asks instead of travelling.** `VacancyCard` takes `onApply`.
   Given one it renders a button that calls it; given none it keeps the plain
   link, because a card rendered on a QR sheet or outside the door genuinely
   has nowhere local to open. Both carry the same `data-testid`.
6. **`openFor` is a counter, not a flag.** A person comparing two units taps
   Apply on one card and then another. With a boolean the form is already open,
   nothing visibly happens, and the selection changes silently under a form
   they are no longer looking at. A counter re-opens, re-selects and
   re-scrolls. A tapped card also wins over a stale scanned id.
7. **A named unit opens the form**, scrolled into view on the next frame with
   the reader's own `motionBehavior()`. The effect fires only on a *change*, so
   a page that merely loads with a scanned unit does not also fire a scroll.

## Outcome

`apply-opens-the-application.test.jsx` — **22 green**.

**Proven-to-catch.** Restoring the previous `index.html` (no script, hardcoded
`content="0; …"`) fails the first case immediately: *"the front door loads a
forwarder — a bare meta refresh cannot carry a query"*. The forwarder is then
**executed for real** against a fake `window` and asserted end to end: the id
survives (`readApplyTarget(to) === UNIT`), `properties=1` is forced and never
duplicated, a hash is carried, a junk `apply` value lands harmlessly, a plain
visit still reaches the door, and the exact string `applyUrl()` builds
round-trips through it.

Also pinned: the card is a button with a caller and a link without one; the
counter re-opens on a second card; a tapped card beats a stale scan; the form
opens on a named unit; the scroll uses `motionBehavior()` on the next frame;
and the load-with-a-scan case does not fire a scroll.

Re-run together: **598 green** across 27 Properties suites, including
`properties-door` (whose own assertion on the meta-refresh url still holds) and
`properties-door-render`. eslint clean at `--max-warnings 0`.

`re-review: 2026-10-17` — the physical scan on a printed card.
