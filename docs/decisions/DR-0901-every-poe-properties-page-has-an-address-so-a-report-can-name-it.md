# DR-0901 — Every Poe Properties page has an address, so a report can name it

- **Status:** accepted
- **Tier:** B (the app-issue channel, and the module's navigation)
- **Date:** 2026-10-10
- **Type:** product (defect + capability)
- **Scope:** `app/src/modules/properties/addressing.js` (new), `app/src/modules/properties/use-address.js` (new), `app/src/modules/properties/model.js` (the three face tab lists exported), `app/src/modules/properties/PropertiesApp.jsx`, `app/src/components/FeedbackCenter.jsx`, `app/src/poe-financial-mvp-v28.jsx`, `app/src/__tests__/every-poe-properties-page-is-reportable.test.jsx` (new), three existing properties suites (a fresh address per mount)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076, incl. §3 proven-to-catch and §8 honest uncertainty), APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0376 (every door gets a way to say "this is broken"), the feedback-area coverage gate (the same class, twice before: Inbound/Notes and the Choir sub-tabs), DR-0877 (Guest Ready's own subtabs, whose area is the third level of this address)

## The word, as spoken

Darrell, 2026-10-10, naming the split:

> "Feedback? Should be inside for app issues... workorders for property
> issues... make sense?"

and then the requirement that decides the shape of it:

> "It's alread built into the PoeTech App... use discretion and make sure thr
> fields and pages are all able to be linked to as the page with said issue/s...
> make sense?"

## What was measured

Two faults, each of which made the other impossible to fix.

**1. Twenty-one pages could only report as one.** `FEEDBACK_AREAS`
(FeedbackCenter.jsx) carried a single entry for the whole module —
`['properties', 'Properties · work orders, tenants, 1099 workers']` — while the
**older** Real Estate tab the module replaces carried **eleven** sub-entries
(`rentals-rooms`, `rentals-lease`, `rentals-maint`, …). So the newer surface was
the *less* reportable one: a reviewer standing on Guest ready, Dispatch, or the
People roster could file only against "the Poe Properties module", and the
triage reading it could not tell which of 21 pages was broken.

That list's own header says: *"when a tab or sub-tab is added there, add a
matching entry here so this list never goes stale again."* **That instruction is
the defect.** It is a hand-maintained mirror of the nav, and it has now gone
stale three times — the Inbound and Notes tabs, the Choir sub-tabs, and this.
A gate was built for the first two; the module was never in its scope.

**2. The module had no addressing at all.** Every one of its 21 surfaces lived
in one React state variable — `const [tab, setTab] = useState('')`
(PropertiesApp.jsx:244) — the door in `activeId`, and the Guest Ready area in
its own local state. The URL never changed. Measured consequences, all four
real and all four invisible as separate reports:

- **No page in the module could be linked to, by anyone.** So "linked to as the
  page with said issue" had nothing to link *to*. The deep link had to exist
  before a report could point at it.
- **A reload always lost your place** — back to the landing tab, door dropped.
  On a PWA on a phone, where the OS reclaims and reloads the tab, that is a
  surface that forgets what you were doing every time you take a call.
- **Back left the app from every tab.** Nothing was ever pushed to history. On a
  Fire TV, where the remote's back button is the only navigation gesture there
  is, pressing back on Guest ready exited the module.
- **A report could not say where it came from**, because there was no where.

## Impact

What this obligates, stated rather than implied:

- The URL is now part of the module's contract. A link someone saves has to
  keep working, so `p` / `door` / `area` and the surface ids they carry are
  stable names from today. A tab renamed in `model.js` breaks saved links; the
  gate counts the surfaces (21) so that rename is a decision, not a surprise.
- `FEEDBACK_AREAS`' own stability rule is kept exactly: *"Existing keys are
  STABLE (stored feedback rows reference them); only add, don't rename."* The
  bare `properties` key **stays**, so every report already filed against it
  still means what it meant. The 21 page keys are added beside it, and the
  entry moves group without changing its key.

**NOT PROVEN FROM THIS SANDBOX, and it is the half that matters most to the
person who asked:** that a report filed from the live build arrives carrying
the page and the link, and that a pasted link opens on the right page on his
phone. Everything here is proven on the mapping, the guards and the wiring;
none of it has been exercised against the deployed app with a real signed-in
landlord. `re-review: 2026-10-17`.

**A boundary deliberately NOT crossed.** The control is shown only where
`onFeedback` is passed — the PoeTech shell. The Poe Properties **door** mounts
this same module for tenants and 1099 workers, and that channel's writer
enrols its author into the `poe-family` instance
(`lib/feedback-sync.js`, `ensureTenantMembership` → `join_default_instance`).
Showing it there would quietly make a tenant a member of the family's space in
order to report a typo. That is a tenancy boundary, not a layout question. It
is left for its own decision rather than crossed here — and the tenant is not
without a channel meanwhile: property issues are work orders, which is
Darrell's own split. `re-review: 2026-10-24`.

## The decision

1. **`addressing.js` — pure.** A Poe Properties page is three query parameters
   (`p` = page, `door` = uuid, `area` = sub-page) beside the `?properties=1`
   that already boots the module. Query parameters and **not** path segments,
   because Cloudflare Pages serves this as a static SPA and `/properties/app/board`
   would 404 at the edge unless every tab were added to the rewrite rules. A
   query parameter cannot 404.
2. **The surface list is DERIVED from the three face definitions**, not
   re-listed. `propertiesSurfaces()` reads `MANAGER_TABS` / `WORKER_TABS` /
   `TENANT_TABS` and returns 21 surfaces, each carrying the faces that show it
   — because the manager's "History" and the worker's "Property history" are
   one tab id showing different things, and a report wants to say who was
   looking.
3. **The feedback list is built from that**, so a tab added to `model.js`
   appears in the form with no second edit. The hand-listed groups above it
   keep their shape; only the one that measurably drifted is derived.
4. **The URL is never trusted.** A page id that is not a real surface, a door
   that is not a uuid, and an area that is not a short slug are all **dropped**,
   and the app lands on its own default. A forged link can only ever reach a
   page this face has — checked a second time against `face.tabs` on the back
   gesture.
5. **A tab PUSHES; a door or area REPLACES.** Pressing back is how a person
   says "I meant the thing before this", and on a remote it is the only way to
   say it. Refining a door inside one tab is not travel, and pushing it would
   make back feel like it does nothing.
6. **The first render never writes.** A person arriving on a plain
   `?properties=1` link has not navigated anywhere; writing the landing tab
   into their URL would make their first back press land on the page they are
   already on — a back button that appears broken.
7. **Nothing in the browser half may throw.** `pushState` throws on an opaque
   origin, and this runs in a PWA, in an iframe, and on a Fire TV browser. The
   module must render with every one of these calls failing silently.
8. **The report hands over the area key AND the link**, and the page is seeded
   into the *visible* "what's not working" box rather than attached as hidden
   metadata — so the reporter can see what is being sent on their behalf, and
   edit or delete it.

## Outcome

`every-poe-properties-page-is-reportable.test.jsx` — **38 green**.

**Proven-to-catch, in the required order.** Removing the one derivation line
(`...propertiesPages()`) — i.e. restoring the shape that shipped this morning —
fails three cases, and the first names **all 21** uncovered surfaces by id:

```
surfaces with no feedback area: doors, board, dispatch, thread, rent, history,
timeline, rooms, gallery, files, systems, readiness, people, cameras,
documents, plan, jobs, document, door, work, notices
```

Also pinned: every surface round-trips through a query string; `?properties=1`
and any reviewer flag survive a navigation; a null field removes its parameter
so a stale door cannot linger; a non-surface page id, a non-uuid door
(`?door=1 OR 1=1`), an over-long area and a malformed search are all dropped
rather than trusted; `writeAddress` returns false rather than throwing with no
history, no window, and a `pushState` that raises; the hash is preserved; a tab
pushes and an unchanged address writes nothing.

**Three existing suites changed, named rather than quietly adjusted.**
`properties-work-on-any-door`, `properties-work-inside-the-door` and
`properties-owner-sees-doors` now reset the URL in their `mount` helper. This
is a true consequence of the change, not a workaround: one jsdom document is
shared by every case in a file, so without it case 2 opens at the address case
1 navigated to and lands on a door-scoped tab pointing at a door that only
existed in case 1's fixture. A real page load always starts from the link that
was opened.

Re-run together: **16 green** across those three, **75 green** across the
feedback suites and `properties-door`, `feedback-area-guard` CLI reports
`OK — every gated nav surface is selectable` at 157 areas (was 156). eslint
clean at `--max-warnings 0`.

`re-review: 2026-10-17` (the live report and the live deep link), and
`re-review: 2026-10-24` (the tenant-facing app-issue channel).
