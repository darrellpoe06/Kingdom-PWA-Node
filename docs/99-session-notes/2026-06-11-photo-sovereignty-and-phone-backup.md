# 2026-06-11 — Photo sovereignty + the phone→NAS backup question

Source: Darrell, 2026-06-11. His values statement + a direct architecture
question, answered as the expert. Applies DATA-AS-EMPOWERMENT-NOT-EXTRACTION
to photos specifically.

## The value (Darrell, verbatim intent)

> "People are tired of platforms that take their images and exploit them.
> It's almost not safe or responsible... they can share with their real
> friends and families and not worry about internet issues."

This is the moat, stated plainly. The extractive-platform photo model
(upload → mined for ads → used to train models → effectively theirs, not
yours) is the thing PoeTech is the opposite of. Per
DATA-AS-EMPOWERMENT-NOT-EXTRACTION: sovereign, no advertising model, no
engagement optimization, exportable, family-owned, deletion immediate.
Photos are the most emotionally load-bearing version of that promise.

**Shipped this session (verified):** the Life Gallery now carries the honest
promise in-app — "Your photos are yours. They live on your devices and your
own NAS — never an ad network, never sold, never used to train a model." Plus
a per-photo **⬇ Save** (real file download) as PROOF of no lock-in — you can
take any photo out anytime. The over-claim "safe from any phone change" was
corrected to be truthful (see durability below).

## The direct question: "auto pull photos to their nas for room on the phone and space for the phones?"

**Honest expert answer, in three parts:**

### 1. The phone→NAS auto-backup he wants ALREADY EXISTS — and PoeTech should ride it, not rebuild it.
The Synology Photos / Synology Drive mobile app already auto-pulls the
camera roll to the NAS. Evidence on this NAS:
`/volume1/homes/cpoe/Drive/PhotoBackup/Christina's Note20 Ultra/DCIM/Camera/2024/12/...`
— Christina's phone is already backing up, sovereignly, to the family's own
NAS. That IS the "photo backup like the Photos app" he wants, and it is
already more capable and more sovereign than a web app could be. PoeTech's
job is the **organizing lens on top** (by room / property / family /
project), not a second backup that duplicates gigabytes.

### 2. A PWA fundamentally CANNOT auto-pull the camera roll or free phone space — and that's the honest limit.
PoeTech is a PWA (installable web app). Browsers sandbox photo access for
exactly the safety reason Darrell is championing: a web page cannot read your
whole camera roll in the background, cannot run a background sync of new
photos, and **cannot delete photos from your phone to free space**. Those are
native-OS / native-app capabilities. So "auto-pull + free phone space" from
PoeTech-the-PWA is not possible. The realistic routes:
  - **(Recommended) Lean on the Synology mobile app for backup + space.**
    It already auto-backs-up; freeing phone space (delete-after-backup) is a
    setting/action in that app. PoeTech organizes the result. Zero new risk,
    fully sovereign, available today.
  - **(Later, if needed) A native PoeTech wrapper** (Capacitor / native
    shell) could request photo-library permission and offer in-app
    backup-to-NAS + space management. That's a real project, not a PWA tweak,
    and it would still just be re-implementing what Synology's app does — so
    the bar to justify it is high.

### 3. The durable, sovereign home for PoeTech photos is the NAS — not localStorage, not an ad-funded cloud.
Today the Life Gallery + room photos persist in the device's localStorage
(compressed data URLs). That means: private and un-mined (good), but NOT yet
safe across a phone change or a second device (the honest gap — copy now
corrected). The target architecture, matching his values:
  - **Hero + room photos → the family's NAS** (sovereign storage they own),
    referenced by the app; for users without a NAS, their own Supabase
    instance (sovereign tenant, RLS, exportable, deletable) is the fallback.
  - **Never** a PoeTech-owned ad/training/sale pipeline — there is none, by
    design, and the in-app copy now says so plainly.

## The no-NAS reality (Darrell, 2026-06-11: "if they have a backup of some kind")

The sharp correction: the NAS answer is the POE FAMILY's setup. Most PoeTech
users — a church member, a single parent, a small landlord — have NO NAS and
often no backup at all. The sovereignty + durability promise must hold for
them, or it is only true for us. Three user tiers, and PoeTech's duty to each:

- **Has a NAS** (us, some power users): photos → their own NAS. They own the
  hardware; best case. PoeTech references in place.
- **Has cloud backup already** (Google Photos / iCloud / Dropbox): already
  backed up — but to an extractive platform, the exact thing we oppose.
  PoeTech can't move where their existing backup lives, but it is the
  sovereign organizing layer and offers a path OFF those platforms into a
  space they own.
- **Has NO backup** (the scared-parent persona, the COMMUNITY-FIRST user):
  the dangerous case — one cracked screen from losing the kids' baby photos.
  Here PoeTech's responsibility is real: provide a sovereign durable home
  (their own Supabase instance / a private PoeTech space that is THEIRS —
  exportable, deletable, never mined) so they are not unprotected. This is a
  genuine value-add, NOT extraction, *only if* it stays DATA-AS-EMPOWERMENT-
  clean: no mining, exportable, deletable, user-owned, transparently funded
  (ties to community-free-via-sponsors or a storage tier).

**Two binding duties that fall out of this:**
1. **Never fake safety.** The app must tell each user the TRUTH about whether
   their photos are backed up — "on this device only" vs "backed up to your
   NAS" vs "backed up to your private space." A user must never *believe*
   they're safe when a lost phone would wipe everything. (In-app copy
   corrected this session to "today these live on this device"; the per-user
   backup-status indicator ships with the write-path project.)
2. **No assumed NAS in copy.** The never-sold/mined/trained pledge is
   absolute for everyone; the where-it-lives claim is per-user and honest.

## Project: sovereign photo home (the durability fix)
1. Photo write target, TWO sovereign backends behind one app interface:
   (a) **NAS** (for users who have one): POST leg on the property-history
   bridge writes under `/volume1/PoeTech/photos/<scope>/`, token-gated;
   (b) **own Supabase instance** (for users without a NAS): Supabase Storage
   bucket scoped to their instance, RLS-protected, exportable, deletable —
   the sovereign fallback so the no-backup user is still protected.
2. App: galleries store a reference (NAS path or storage URL) instead of a
   data URL once a backend is configured; localStorage stays the offline
   cache. A per-user **backup-status indicator** tells the truth: device-only
   vs backed-up-where.
3. Result: true phone-change / multi-device safety for EVERY user — NAS or
   not — with bytes living only in storage they own. Then a precise
   "backed up to <your space>" claim is earned and can appear in the copy.

## Project: sovereign sharing ("share with real friends and family")
Share a photo / album / project to a named person already in the family or
loved-ones cohort (the rails already modeled in
project_loved_ones_cohort_includes_chosen_family), delivered through the
family's own infrastructure — not a public link an ad network indexes.
"Not worry about internet issues" → offline-first PWA cache + sync-when-
connected; the share resolves over LAN/NAS when both parties are local.
Tier C (sharing + access control + privacy). Pairs with the referral project
(showing your people IS the advertising — but on your terms, never by
harvesting the image).

## Connection to the foundation
This note is the photo-specific application of
DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md. If the photo features grow, promote a
short "Photo Sovereignty" subsection into that foundation doc so future
sessions inherit the binding: photos live in the family's own storage, are
exportable and deletable on demand, and never touch an ad/training/sale path.
