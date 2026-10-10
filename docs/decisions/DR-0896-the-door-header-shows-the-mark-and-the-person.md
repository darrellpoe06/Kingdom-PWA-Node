# DR-0896 — The Poe Properties door header shows the mark and the person

- **Status:** accepted
- **Tier:** A (additive chrome on one door; no schema, no money, no new external surface)
- **Date:** 2026-10-10
- **Type:** product (missing-parity — two staples every other face already had)
- **Scope:** `app/src/components/PropertiesDoor.jsx`, `app/src/modules/properties/config.js` (`brand.mark`), `app/src/lib/theme-css.js` (midnight remap for the properties green as text), `app/src/__tests__/the-door-header-shows-the-mark-and-the-person.test.jsx`
- **Principles:** REALITY-TRACE (DR-0061 — P15, a painted value is worse than none), VERIFICATION-DOCTRINE (DR-0076, incl. §3 proven-to-catch), PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-THE-PRIMARY-ARTIFACT (DR-0065)
- **Grounds:** **DR-0827** (the door looks like PoeTech, the tenants' version), **DR-0342** (profiles: one row per person, a thumbnail by id), **DR-0258** (disjoint door scopes, each with its own manifest)

## The concern, as spoken

Darrell, 2026-10-10, on the Poe Properties app:

> "Picture and users account information like PoeTech... should allow a photo to
> be represented by etc... make sense? Also the logo should be showing inside
> the Header... and other low hanging fruit..."

And, in the same sitting, the fence around it:

> "Not the header situation... I love PoeTech App header... don't undermine it!!!!!!!"

So: **add** the mark and the person to this door's header. Do not restructure
the header, and do not touch its sticky auto-hide behaviour.

## Evidence — both halves were already on disk, and neither was wired

Traced before writing any code (DR-0061), because the premise worth killing
early was "we will need to make a logo" and "we will need an upload pipeline."
Both were false.

**The mark already existed, and the app was the only place not using it.**
`app/public/properties-icon.svg` is the 2026-08-28 "two P's" glyph — the same
skeleton as PoeTech's `icon.svg`, with the properties green `#2F5D50` ring
instead of the rust, authored precisely so the two read as one family in the
app drawer. It is already an entry in `icons` of
`app/public/manifest-properties.webmanifest` (`sizes: "any"`), so it is the mark
the phone installs on the home screen. Measured by grep: **no door component
renders its own brand mark** — the only `<img>` tags in `PropertiesDoor.jsx`,
`TlcPublicDoor.jsx` and `MooreDoor.jsx` are listing, product and therapist
photographs. Darrell's observation was exactly right.

**The account photo already existed, with a real table behind it.**

| piece | where it already lives |
| --- | --- |
| the row | `profiles`, migration 0186 (DR-0342) — RLS to the owner, `photo_thumb` the picture |
| the read | `loadMyProfile()`, `app/src/lib/profiles-sync.js:86` |
| the renderer | `ProfileAvatar`, `app/src/components/ProfileCard.jsx:14` |
| the upload spot | `MyProfile.jsx` — `photoThumbFromFile()` shrinks a phone photo to a ~160px thumbnail *before it leaves the device* |
| the PoeTech header that uses all four | `HeaderAuthButton.jsx` |

`HeaderAuthButton` carries this on PoeTech because of Darrell's 2026-09-09 word:
*"All apps users profile shows and has login or out under it... so it is looked
at... or seen... And upload a photo spot."* **"For all apps"** — and this door
never received it. Today's request is that unfinished sentence, not a new one.

So nothing needed inventing. The gap was wiring, which is the work (P15).

## Impact

Two staples reach the people this door was built for — tenants, their families,
and 1099 workers — who until now met a text-only bar and no face at all.

The mark is the honest kind of parity: the glyph above the wordmark is the
*same file* the home-screen icon is, so a tenant who installed the app sees the
thing they tapped. The chip is the first time a person on this door is a
*person* rather than a session.

One thing the trace changed. The obvious move — mount `HeaderAuthButton` here
and be done — is wrong, and recording why matters more than the saving: its
`Log out` calls the **global** `signOut()`, which would collapse this door's
deliberate two-tier sign-out (*leave this door* / *leave everywhere*) built so
that signing out of Poe Properties does not throw the same phone out of
PoeTech. The parts came over; the door kept its own semantics. A test holds it.

A second thing the machinery changed, not me. `legibility-guard.mjs` failed the
first draft: `text-[#2F5D50]` measured **2.46:1** on midnight — the properties
green is a dark green, and I had used it as a text colour on a near-black
background. It now remaps to the same bright mint `#86EFAC` every other green
in `theme-css.js` remaps to, text and hover variant only; the `bg-[#2F5D50]`
fill is untouched because it already carries white text that passes, and
remapping the fill would have stranded that white. **This is the gate doing the
job claims cannot do** (DR-0076 §2) — I would have shipped it.

## The decision

1. **The header mark is read, never hardcoded.** `POE_PROPERTIES.brand.mark`
   joins the door's config (DATA, per that file's own stated pattern) and points
   at the manifest's own icon. The header renders it at a fixed 28px box —
   `alt=""` and `aria-hidden`, because it duplicates the wordmark beside it — in
   the compact bar that the hideaway never hides.
2. **The person is the real row or nothing.** The chip renders only when signed
   in, from `loadMyProfile()`, and is re-read when the editor closes so a
   picture shows the moment it is saved. Three honest states and no fourth: a
   picture → the picture; a row without one → the initials of the name the
   account actually carries, plus a visible `+ photo` invitation so the gap is
   **said** rather than faked; no row or a failed read → the same initials path,
   because `loadMyProfile` returns `null` instead of throwing. **No stand-in
   face exists anywhere in this change.**
3. **The face is the upload spot.** Tapping it opens `MyProfile` in the shared
   `Modal`, so a tenant adds their picture from the header of the app they
   actually use. Naming goes through the shared `preferredName` helper, so this
   door names a person the way every other surface does.
4. **The header's own chrome is untouched.** No change to
   `use-auto-hide-header.js`, the sticky classes, or the hideaway. The sign-out
   pair is unchanged and still distinct.

## Outcome

Evidence attached, measured on the real artifact (DR-0076 §1/§4):

- **`npx eslint src`** — clean, exit 0 (incl. `react/jsx-no-duplicate-props`).
- **11 new tests** in `the-door-header-shows-the-mark-and-the-person.test.jsx`,
  on the real component in jsdom, against the real manifest on disk.
- **106 tests green** across every PropertiesDoor suite plus the new one;
  **47 green** across the five theme suites.
- **`node scripts/legibility-guard.mjs --check`** — PASS, no new violations
  (it FAILED first, at 2.46:1, and the remap is the fix).
- **`node scripts/contrast-guard.mjs`** — PASS, every theme AA including midnight.

**Proven-to-catch (DR-0076 §3), three breaks deliberately introduced and caught:**

| break introduced | what failed |
| --- | --- |
| `brand.mark` → `/properties-logo.svg` (nothing on disk) | `/properties-logo.svg exists in app/public: expected false to be true` |
| `brand.mark` → `/icon.svg` (real file, but PoeTech's mark, not in this manifest) | `expected [ '/properties-icon-192.png', …(4) ] to include '/icon.svg'` |
| a placeholder `photoThumb` painted into the no-row fallback | 2 tests: `no image is invented — expected <img> to be null` |

The first two are the tie that keeps the header mark and the installed icon one
asset: rename the file, or point the header at another app's glyph, and CI fails
rather than a phone showing one mark and the header another. The third is the
P15 guard — the painted avatar this change refused to ship cannot be
reintroduced quietly.

**What this does NOT claim.** It is not verified on the live build; the cloud
sandbox has no route to poetech.us (DR-0125), so the live-push review on
`/properties/app/` is the named next step after merge and deploy (DR-0104) —
specifically that the SVG renders crisply at 28px on a real phone, which jsdom
cannot measure. And "other low hanging fruit" in Darrell's message is broader
than these two items; this record covers the two he named explicitly, and the
rest stays in the queue rather than being quietly claimed as done.
