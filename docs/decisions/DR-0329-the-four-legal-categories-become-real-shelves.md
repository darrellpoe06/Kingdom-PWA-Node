---
id: DR-0329
title: The four legal categories become real shelves — upload or pointer, privilege decided, and the encryption we do NOT have is said out loud
date: 2026-09-06
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0026]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, DATA-AS-EMPOWERMENT, SOVEREIGN-FIRST, PERPETUAL-IMPROVEMENT, SURFACE-PREMISE]
source: 2026-09-06 session — Darrell, screenshotting Books → Legal on his phone: "I need a section that I can upload legal documents for each of these categories."
---

## Context

The Legal tab showed four category boxes — Personal / family, Real estate,
Business, Tax & regulatory — each a list of the matters that belong there.

They were four hardcoded `<ul>` lists in `app/src/components/Legal.jsx`.
Orientation copy painted over nothing: no row, no file, no upload, no count.
The only real record on the tab was `accounts.filter(a => a.inLegal)`.

This is the P15 class exactly, on the worst possible surface for it. A painted
number on the Build board is embarrassing. A painted *shelf* invites a family to
believe their will is filed somewhere.

## The premise conflict, surfaced before building

`LEGAL-PRIVACY-BOUNDARY.md` binds documents as **"pointers only, not file
content."** That was a deliberate 2026-05-18 choice, not an oversight — and the
direction above asks for the opposite. Per `feedback-surface-premise-conflicts`,
that was stated before any code was written rather than silently overridden.

**The resolution keeps both.** A shelf record is one of:

- **FILE** — bytes in the private `legal-documents` bucket, path
  `<owner user id>/<slug>.<ext>`, read back only through signed URLs that expire
  in five minutes. Needs a session.
- **POINTER** — the original model: no bytes, `whereFiled` names where the paper
  actually is. Works signed out, offline, before the migration has applied.

The pointer path is not a fallback, it is first-class. A legal shelf that
refused to record anything while a phone had no signal would be worse than the
placeholder it replaced.

## Decision

1. **The four categories are real shelves** backed by `legal_documents`
   (migration 0168). Each category's bullet list, which used to be decoration,
   IS that shelf's document-type vocabulary — which is what makes the bullets
   true rather than illustrative.
2. **RLS is creator-scoped, not instance-scoped** — a deliberate divergence from
   DR-0321/0167. The family-trust ledger is shared *because* a trustee must read
   a beneficiary's standing; that sharing is the mechanism of the provision.
   Legal is the opposite: a household member must not read another's will,
   custody file, or immigration matter by default. `instance_id` is carried but
   grants nothing. Broadening later is a migration; narrowing after a leak is
   not a remedy.
3. **`privileged` is mandatory and starts undecided.** It is NOT NULL in the
   table and the form refuses to save `null`. This is the single mechanical
   guarantee behind the privileged-stripped export: strip `privileged = true`
   and what remains is safe to hand a non-counsel party. A pre-ticked default
   would produce rows nobody actually decided, which defeats the guarantee for
   the whole matter while looking complete. `true` is recommended, never
   automatic — over-marking is recoverable, under-marking can waive privilege
   irrecoverably.
4. **All four storage verbs are owner-only.** A read policy alone would leave
   anyone able to *overwrite* another person's will in place, which is worse
   than reading it.
5. **The surface states what is not built.** See below.

## The gap we are NOT papering over

Layer 2 of `LEGAL-PRIVACY-BOUNDARY` specifies AES-GCM-256 at rest, keyed from
the Legal PIN via PBKDF2. **It is not built, and it cannot be built as specified
on the current architecture:** `app/src/lib/pin.js:9` states the PIN is never
hashed, stored, or compared in the browser — it is verified server-side — so
there is no PIN-derived key material client-side to encrypt with. Building it
means a new key architecture, which is its own decision.

So the shelf says, in the user's own words on the screen: files are stored in a
private vault only your account can read, opened through links that expire in
five minutes, and are **not** yet encrypted with your own key at rest — *"treat
this as a private shelf, not a safe deposit box."*

Claiming that encryption would have been the exact failure DR-0076 exists to
prevent, and on this data it would be the most expensive lie in the system.
**re-review: 2026-10-15** (DR-0075: a non-improvement carries a why and a date).

## Proof

- `legal-documents.test.js` — 20 tests, every refusal proven-to-catch: an
  undecided privilege flag, a record with neither bytes nor a location, a
  traversal filename, an oversized or executable file, an empty category that
  reads 0 rather than vanishing, and `stripPrivileged` REMOVING rows rather than
  blanking them (a blanked row still tells the recipient a privileged document
  exists, which is itself privileged information).
- `legal-shelves-render.test.jsx` — 6 tests mounting the real surface. Each
  asserts behavior the painted version could not have had: a working
  category-scoped picker, the privilege refusal reaching the user as readable
  text, a pointer filing end-to-end with the count moving and the record
  persisting, and a pin that the screen does not claim encryption.
- The engine's own test caught a real bug in it before merge: `formatBytes(null)`
  returned `"0 B"` because `Number(null)` is `0` — a painted zero for an unknown
  size on exactly the pointer records that have none. Fixed in the engine.

## Consequences

- The Legal tab has its first real write path. `active-by-default-ledger.js` is
  corrected from "ships a placeholder" to what is now true, with what remains
  unbuilt named: matter CRUD, the privileged journal, key-date Calendar
  mirroring, the export tool, and the encryption above.
- `LEGAL-PRIVACY-BOUNDARY.md` is AMENDED in place — the pointer model is
  preserved beside the new file model, so the foundation is extended rather than
  contradicted.
- The bucket is born by migration (the 0078 lesson) and born clean with respect
  to DR-0317: it holds no legacy objects, so the blob-copy gap that broke the
  gallery cannot touch it.
