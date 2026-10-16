# DR-1062: A tap that opens a file actually opens it — the gesture was gone before the tab was asked for

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (every document road on the church and household doors)
**Type:** word
**Area:**
- `app/src/lib/open-document.js` (new — reserve, deliver, say why)
- `app/src/components/Choir.jsx` (Team Docs — the one he reported)
- `app/src/components/Pulpit.jsx` (a message's document)
- `app/src/components/ChurchMemberSpace.jsx`, `app/src/components/HouseholdSpace.jsx` (the shelves)
- `app/src/__tests__/open-document.test.js` (new)

**Grounds:** Darrell, 2026-10-16, with Choir → Team Docs on screen and the focus ring sitting on an OPEN that had done nothing: **"Can't open team documents!!!!! Fix it please..."**
**Principles:** DR-0076 §5 (characterize before you change); DR-1053 (a thing that could not be done is not a no); DR-0330 (a control that does nothing is not a control)

## Context

Choir -> Team Docs holds the team's weekly get-ready material -- the order of
service, the announcements, the calendar -- and every row carries an OPEN
button. Darrell tapped it on his phone, on the installed app, and nothing
happened: no document, no error, no sign that anything had been attempted.

## What was measured

**One line, two independent silent failures** (`Choir.jsx:782` as shipped):

```js
const open = async (d) => { const u = await openTeamDocument(d.documentUrl); if (u) window.open(u, '_blank', 'noopener'); };
```

1. **The gesture is gone by the time it opens.** A browser permits
   `window.open` only while it is still handling the tap. `createSignedUrl` is
   a network round trip, so by the time this line runs the user activation has
   expired and the popup is refused. This fails **every** time, not
   intermittently — and an installed PWA is stricter than a browser tab, which
   is where he met it.
2. **Every failure returns `null` and says nothing.** `openDocument` returns
   `null` for a missing url, an RLS refusal, a deleted object or a renamed
   bucket, and `if (u)` then does nothing at all.

**Four surfaces carried that exact order** — Choir Team Docs, Pulpit's message
document, the church member shelf, the household shelf.

## The cure was already in this repo — for the sixth time this week

`TlcOnboardingReadout.jsx:23` keeps the resolved url on screen as a real link,
with the comment *"the link below still works"*. `ColoringSheet.jsx:110` opens
its tab **first** (`window.open('', '_blank')`) and fills it after. Both
patterns were written by earlier sessions, in this repository, and neither had
been carried to the four surfaces that needed them.

That recurrence is now itself the finding. The habit this record adds: **when a
surface fails at something, search the tree for a surface that already
succeeds at it before designing anything.**

## Decision

**The order is the fix, and it is held in one place so four surfaces cannot
drift into four orders:**

1. `reserveTab()` is the **first line of the tap handler**, before any `await`.
   It opens a blank tab while the gesture is live and severs `opener` by hand
   (what `noopener` would have done, which cannot be passed when a handle is
   needed).
2. `openResolved(tab, resolve)` awaits the url and sends the reserved tab there
   with `location.replace`, leaving no history entry.
3. **A refused reservation is survivable.** The url comes back to the caller,
   and the surface renders it as a real link — **the person's own tap carries
   its own gesture**, which is the one thing that can never be blocked.
4. **Nothing fails in silence.** `openFailureMessage` gives every path words:
   the browser blocked it (with the link), or it could not be found and *nothing
   was changed*.

## Verification

- **15 new cases.** The weight is on the ORDER, because that is the whole
  defect and jsdom has no popup rules to catch it.
- **Proven-to-catch:** a fake window whose `open()` only works while a
  `gesture` flag is true — the real rule, modelled. Reserving first opens;
  the previously-shipped order is refused, and the assertion fails loudly if it
  somehow succeeds (*"the model of the bug is wrong"*). Even in the refused
  case the url survives for the link fallback.
- **A source pin across all four surfaces** asserts the broken shape — an
  awaited `*Document(...)` followed by `window.open` — appears in none of them,
  and that each uses `reserveTab(`.
- **`ColoringSheet` is pinned as the precedent it is**, so a later
  "standardisation" onto the broken shape cannot quietly remove the one surface
  that always did it right.

## What this does not do

- **It does not touch why a url fails to resolve.** `openDocument` still
  returns `null` for an RLS refusal and for a deleted object alike, so the
  sentence says *"removed, or your account may not have access"* rather than
  which. Separating those means giving `choir-sync`'s `openDocument` the same
  three-valued answer `church-access.js` gave the predicates (DR-1053).
  **`re-review: 2026-10-23`.**
