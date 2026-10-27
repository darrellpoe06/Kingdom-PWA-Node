# DR-1240: The reviewer lens has two modes — as yourself with privileges hidden, and as a new user — and each says plainly what it hides

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (additive and strictly narrowing: a second value on the lens's existing per-device key, four modules handed it on their existing mount lines; no schema, no money, no route; the shell did not grow — 5193 lines)
**Type:** fix + surface
**Area:**
- `app/src/lib/reviewer-lens.js` (new: the key, the two modes, `reviewerLensMode`, `isReviewerModeOn`, `isReviewerSelf`, `isReviewerStranger`, `reviewerLensLine`)
- `app/src/lib/reviewer-mode.jsx` (re-exports the lens; `enterReviewerModeAs`, `switchReviewerMode`, `REVIEWER_LENS_COPY`; the banner names its mode and switches)
- `app/src/modules/properties/PropertiesApp.jsx`, `app/src/components/Vault.jsx`, `app/src/components/Messages.jsx`, `app/src/components/ResearchSection.jsx` (each honours the stranger mode at its own cloud boundary)
- `app/src/poe-financial-mvp-v28.jsx:970` (the second flag, on the first flag's line), `:4333`, `:4734`, `:4743`, `:4744` (the four mounts)
- `app/src/lib/admin-console.js`, `app/src/components/AdminConsole.jsx` (two actions: as yourself; as a new user)
**Follows:** DR-0104 (review the live production push), DR-0060 (RLS is the data gate), DR-0076 (verification doctrine)

## Context

Darrell, 2026-10-27, in reviewer mode on his phone, under the banner *"You are seeing this build exactly as a signed-in user sees it. Your family books, profile, and cloud snapshot are untouched"*, on Properties → Landlord → "805 North Prospect Avenue · Apt 4" → Pictures ("37 pictures", the Add a Picture form):

> "How is the new person or users able to see our assets and not just their own or what we allow?!!!!!!!!!"

And, once the cause was shown, the direction:

> "I want both... as myself and as a new user... a toggle or choices... etc... make sense?"

## What was measured

**The database did not leak.** RLS is the real gate (DR-0060); the 0150/0309 smokes prove a stranger reads 0 doors. **The lens's honesty leaked.** `lib/reviewer-mode.jsx` states THE ONE LAW — the lens can only hide privilege — and, under WHAT STAYS REAL, that *the reviewer remains signed in as themselves*. The shell honours that at every point it DERIVES: `isFamilyMember`, `isChurchStaff`, `isStudyCircle`, `isGov` are false under `reviewerMode` (`poe-financial-mvp-v28.jsx:1238-1252`), the books boot `EMPTY_WORLD`, the snapshot pull and every write are suppressed. Then it mounts four modules with the real session, and each reads the signed-in person's OWN rows through RLS as him:

| Module | Mount (shell) | The read, as him |
|---|---|---|
| Properties | `:4333` `<PropertiesApp surface="poetech" …>` | `PropertiesApp.jsx` boot: `claimPropertyAccess`, `loadMyDoors`, `loadMyGrants`, `loadMyHousehold`, `loadMyRentals`, `loadMyLandlordSeat`, `loadInvites`, `loadAllPhotos`, `loadDoorPhotoOrders`, `loadDoorArchives` — his seat, his doors, his 37 pictures |
| Vault | `:4743` `<Vault />` | `Vault.jsx` load: `store.readCache(uid)`, `store.loadHeader()`, `store.listItems()` — his header and the count of his records ("Locked · N records") |
| Messages | `:4734` `<Messages …>` | `Messages.jsx`: `publishDmPublicKey`, `loadDmContacts`, `loadDmInvited`; `AddContact`: `listMyAdminInstances`, `listPendingClaims`, `readContacts`, `pullMyContacts`; `GroupsPanel`: `getInstanceId` → `loadGroupMessages` — his contacts, the spaces he leads, his family's group threads |
| Research | `:4744` `<ResearchSection />` | `ResearchSection.jsx` → `fetchMyResearch` → `agent_inbox` — his own research rows |

Narrowed already and left alone: Cameras (`canSeeCameras` — the lens is never a key, DR-1237), Real Estate (reads `data.inflows.rentals`, which is `EMPTY_WORLD` under the lens; its syncs are suppressed), Books (`demo={isAnyDemoMode || reviewerMode}`; the table syncs return early). Library's shelf is device-local by email, not a cloud row, and is unchanged here.

So the strip claimed a user's view over the steward's own doors. Neither "hide everything" nor "show everything" is the fix: reviewing as himself with privileges hidden is a real review (it is how Darrell checks a landlord's own screens), and reviewing as a person with no invite is a different real review. He asked for both.

## Impact

Two modes on the one existing key, `poe-reviewer-mode`: **`self`** — as yourself, privileges hidden: signed in as the steward, the family / Governor / staff flags false, his own rows still read through RLS as him, and the strip SAYS so (*"Your own doors, vault, contacts and research still show; only family, Governor and staff privileges are hidden"*); **`stranger`** — as a new user: no landlord seat, no doors, no grants, no household, no vault, no contacts, no research — each module's own nothing-here face with one line (*"Reviewer lens: your own doors are hidden here; a person with no invite sees this"*), and the strip says *"A person with no invite sees this"*. The legacy value `'1'`, which every device that ever entered the lens already holds, reads as `self` — exactly what it did. Both modes are strictly narrowing: a stranger is a smaller view than self, self is smaller than the steward, and neither can grant (an unknown value is OFF; an unknown mode on entry falls to `self`). Entry is a choice in Admin → Actions (two guarded actions), and the strip switches between the two without leaving the lens; enter, switch and exit all reload, because the modules read their rows at boot. Writes under the lens stay as the lens states — deliberate submissions are real — with one narrowing: the Vault's create is off in stranger mode, because it is an upsert on his real header, which the strip promises to leave untouched.

## Decision

1. One stored value, one source: `lib/reviewer-lens.js` holds the key, the two modes and their reads, light enough for a module bundle (the Poe Properties App mounts `PropertiesApp` too); `reviewer-mode.jsx` re-exports every name, so there is never a second flag. The shell derives `reviewerMode` (any mode) and `reviewerStranger` on the same line and hands `stranger={reviewerStranger}` to the four mounts; a mount that is not handed it asks the one read itself.
2. The strip names its mode and says what each hides; the old sentence *"exactly as a signed-in user sees it"* is gone from `self`, where it was false.
3. Any module that reads the signed-in person's own rows honours the stranger mode at its cloud boundary, never by painting over data it already read.

## Verification

- `reviewer-mode.test.js` (44): the modes and their reads, `'1'` → `self`, junk → off, the re-exports are the same functions, enter/switch/exit reload, the strip per mode and its switch, both Admin actions, and the shell pins — the first flag's line, the second flag, and all four mounts (`stranger={reviewerStranger}`); the unwired-shell check strips both flags.
- `the-reviewer-lens-is-a-stranger-in-properties.test.jsx` (7): lens off and `self` (and the legacy `'1'`) read his seat and doors and show the Landlord face with his address; `stranger` never calls `claimPropertyAccess` / `loadMyLandlordSeat` / `loadMyDoors` / `loadMyGrants` / `loadMyHousehold` / `loadMyRentals` / `loadInvites` / `loadAllPhotos` / `loadDoorPhotoOrders` / `loadDoorArchives`, still reads the public shelf, renders Places to Live with the honest line and his address nowhere; the device value alone drives it; a non-mode value is the normal app.
- `the-reviewer-lens-is-a-stranger-everywhere.test.jsx` (8): Vault, Research and Messages each with a baseline that reads his rows and a stranger case that never does, with the honest line, and the Vault's create disabled.
- **Proven to catch, eight ways**, each anchor asserted present first and each file restored and checked with `cmp`: the Properties stranger branch off (3 fail); `'self'` read as stranger (2 fail — the legacy `'1'` would hide his doors); the Vault read-skip off (1); the Research read-skip off (1); Groups asking for his space anyway (1); the Vault mount dropping the mode (1); the strip's `self` copy reverting to "exactly as a signed-in user" (2); the switch not reloading (1).
- Lint clean; `monolith-budget-guard` OK at 5193; 18 neighbouring suites green (198 tests); `research-section-render` pins the new mount.
- **Not done, named:** no live screenshot of the strip on Darrell's phone in each mode — the cloud sandbox has no route to poetech.us; the DR-0104 live review pass after merge is the step that closes it. `re-review: 2026-11-03` — enter each mode on the phone, open Properties and Vault, confirm the strip's sentence matches what is on the screen.
