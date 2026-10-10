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

`apply-opens-the-application.test.jsx` — **19 green, and every one of them
uses the button.**

**THE FIRST VERSION OF THIS GATE WAS NOT A GATE, and Darrell said so:**
*"Testing needs to be respected!!! Undermining ways!!!"* He is right. It
proved the fix with `expect(source).toMatch(/onClick=\{\(\) => onApply\(…\)\}/)`
— grepping my own diff back at myself. That asserts I typed certain
characters. It would have passed with the handler wired to the wrong unit,
with the form never opening, with the button disabled. A gate that cannot fail
for the reason the user is complaining about is not a gate (DR-0076 §3). The
file now MOUNTS THE DOOR AND CLICKS.

**How the defect survived a suite that already covered this screen.**
`properties-door-render.test.jsx` has had *"an APPLICANT can apply with NO
account"* passing throughout. It clicks `/Apply — no account needed/`, and
**two controls carry that exact label** on that page: the dead one on the unit
card and the working green one at the bottom. The test found the working one.
A label is not an identity. Every case here addresses a control by
`data-testid`.

**Proven-to-catch, by restoring the `<a>`:** six cases fail, and the first
one's message is his sentence back in the runner —
`tapping the card's Apply did not open the application: expected null to be truthy`.

**THE BEHAVIOURAL TEST THEN FOUND TWO BUGS THE SOURCE-GREP VERSION HAD
PASSED**, which is the clearest argument for writing it this way:

1. **A scan yanked the view a second after paint.** `scan.matched` only
   becomes true once `public_vacancies` answers, so driving the scroll from it
   fired late — a delayed, unasked-for jump, the exact thing the guard was
   written to prevent. Split: `openOnLoad` opens (a scan still belongs on the
   form), `openFor` opens **and** scrolls (a deliberate tap).
2. **A scanned unit opened an EMPTY picker.** `useState(preselect)` seeds at
   first render, and at first render the scan has resolved to nothing. So the
   person who scanned that unit's own door was handed a list to pick it out of
   — precisely the failure `preselect` exists to prevent. Now synced when it
   arrives, and only into an untouched picker so a choice already made is never
   overwritten.

Both were real, both were invisible to the first version, and neither would
have been found by reading the diff again.

The forwarder is **executed** against a fake window rather than read for
shapes: the id survives, `properties=1` is forced and never duplicated, a hash
is carried, `applyUrl()`'s exact output round-trips, `replace` is used and not
`assign`, and three hostile queries (`?next=https://evil.example`,
`?apply=../../etc`, `?properties=0`) all stay inside `/properties/app/`.

Two cases legitimately read a file instead of rendering: the CSP and the
absence of an inline `<script>` are facts about bytes a server sends, which no
amount of rendering can exercise.

Re-run together: **79 green** across this gate, `properties-door-render` and
`properties-door`; **598 green** across 27 Properties suites. legibility,
business-systems and monolith-budget guards green. eslint clean at
`--max-warnings 0`. Build clean, `redirect.js` confirmed in `dist/`.

`re-review: 2026-10-17` — the physical scan on a printed card, which this
sandbox cannot do.

## What happens AFTER you apply — measured, and it is a hole

Darrell, immediately after: *"What happens when you apply!???!!! End to end
documentation inside the records for the users!!! Obviously!!!"*

Traced rather than assumed. `submitApplication` inserts into
`rental_applications` (`cloud.js:58`) and returns the new id. Then:

- **Nothing in the app ever reads that table.** `grep -rn rental_applications
  app/src` returns the one `.insert(...)` and test files. There is no loader,
  no tab, no list, no badge, no count.
- **The database has permitted the read since 0152.**
  `rental_applications_read … FOR SELECT TO authenticated` grants it to the
  instance's owner/admin/member and to a manager holding
  `application.review`, and `rental_applications_update` grants the decision
  with a reason (`rental_applications_decision_has_reason`). The permission
  was built. The app never asks.
- **It never joins the door's record.** `buildHistory` folds requests,
  messages, notes, documents, rent and notices — not applications. So the
  timeline built for "historical accuracy and events" (DR-0876) has a hole
  exactly where a prospective tenant's first contact with the family is.
- **The applicant is told nothing further, and that part is deliberate**
  (0152: "the decision reaches them from a human, not from a database read").

So today an application is a dead letter: someone applies for 805 Apt 2 and
nobody is ever told. Fixing the Apply button makes that path *reachable*, which
makes the silence on the other side matter more, not less. Tracked as the next
change — a surface that lists them, the decision with its reason, and the
application as an event on the door's own timeline. **DR-0903.**
