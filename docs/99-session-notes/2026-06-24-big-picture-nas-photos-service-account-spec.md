# Big Picture photos — dedicated read-only Synology service account (spec)

**Date:** 2026-06-24
**Decision by:** Darrell
**Status:** SPEC. The app half is on PR #315 (`feat/big-picture-nas-album`, held). The
NAS half (`wf-album-photos` + the service account) is owned by the Synology-Photos
source lane (`local_3e75266b`). This document is the contract between them.
**Layer:** 4 (working artifact) per ICM.

---

## The decision

The Big Picture photo integration authenticates as a **dedicated, least-privilege
Synology service account** — **not** the main `dpoe` account. The account has
**read-only** access to **only the one designated photo album**, nothing else on
the NAS. Its credential lives **server-side**, in the NAS workflow's secret store —
**never** in client code, never in the repo, never logged. Claude and the
orchestrator never handle the password: Darrell creates the account in DSM, sets
the password himself, and supplies it to the workflow's credential store directly.

### Why a separate account (not `dpoe`)

1. **Decouples from the `dpoe` auth problem.** The `dpoe` Synology Photo Backup app
   is currently showing "invalid credentials -- update password." A separate photo
   identity means Big Picture is never coupled to that account's auth state.
2. **Least privilege.** A read-only, single-album, no-admin, no-write identity has a
   tiny blast radius. If its credential ever leaked, the exposure is *the photos in
   one album the owner deliberately chose to share* -- nothing else.
3. **Clean audit + revocation.** Photo reads show up as the `poetech-photos` user in
   DSM logs; revoking Big Picture's access is one toggle (disable the account or
   un-share the album), with zero effect on `dpoe`.
4. **Aligns the security posture** Darrell set for the platform: sovereign,
   sandboxed, scoped service identities -- not shared human credentials.

---

## Two trust boundaries (do not conflate them)

There are **two separate secrets**, gating **two separate hops**:

```
  PWA (browser)                NAS n8n                    Synology Photos
  -------------                -------                    ---------------
  fetchAlbumPhotos(album)
        |
        |  Authorization: Bearer <poetech-chat-bridge-token>   <-- SECRET #1
        |  GET /n8n/webhook/album-photos?album=<name>          (client bearer,
        v                                                        already exists,
   [ wf-album-photos ]                                           per-device)
        |
        |  login as poetech-photos / <password>                <-- SECRET #2
        |  SYNO.API.Auth -> SYNO.Foto.* (read the album)       (Synology service
        v                                                        account, NEW,
   { photos: [{ id, thumb, date, text }] }                      server-side only)
        |
        v
   back to the PWA (same fail-quiet envelope as the other bridges)
```

- **Secret #1 -- the client bearer (`poetech-chat-bridge-token`).** Unchanged. This
  is the app's gate to the webhook, stored per-device in `localStorage`. It is *not*
  the service account and never touches Synology auth.
- **Secret #2 -- the Synology service-account credential (`poetech-photos`).** NEW.
  Used only **server-side** by `wf-album-photos` to read the album from Synology
  Photos. The PWA never sees it, never stores it, never sends it. This is the
  credential this spec is about.

**The crux of the security posture:** the PWA client stores **nothing new**. The
service-account credential is added **only** to the NAS-side secret store.

---

## The least-privilege property: sharing IS the scope gate

The cleanest part of this design: **what the service account can read is exactly
what `dpoe` shares to it.** The account's own Personal Space is empty (it never
uploads). The only photos it can see are albums explicitly shared *to* the
`poetech-photos` account, view-only. So:

- **Owner controls scope by sharing.** To feature an album on Big Picture, `dpoe`
  shares it to `poetech-photos` (view-only). To stop featuring it, un-share it.
- **The app's album picker picks among the shared albums** -- it cannot reach
  anything not shared, because the account itself cannot.
- **Defense in depth:** account restricted to the Photos app only (Privileges) +
  view-only invitee on the album + the workflow performs read-only operations only +
  the workflow validates the app-supplied album name against the account's
  shared-with-me set. Four independent gates, each fails closed.

Default remains **off**: until `dpoe` shares an album to `poetech-photos` AND the
owner picks it in the app, Big Picture shows nothing. The personal camera roll
(`/home/Photos/MobileBackup`) is **never** shared to this account.

---

## (a) DSM setup steps for Darrell

These are Darrell's hands (an admin gesture + a password only he sets). Do them in
the DSM web UI at **https://192.168.1.26:5001** (LAN) signed in as the admin user.

### Step 1 -- Create the dedicated service account

1. **Control Panel -> User & Group -> User -> Create.**
2. Name: **`poetech-photos`**  (description: "Big Picture read-only photo service --
   no admin, no write, one album").
3. Set a **strong, unique password** (a generated 24+ char passphrase). **Write it
   down for Step (b) only** -- it goes into the NAS credential store, nowhere else.
4. **Do NOT** add it to the **administrators** group. Leave it in `users` only (or a
   new `photo-svc` group with no extra grants).
5. Optional hardening: set **"Disallow the user to change account password,"** set a
   tiny storage quota, and (if offered) **disable the user's 2FA bypass** -- this
   account is for one machine-to-machine read.

### Step 2 -- Strip every app privilege except Synology Photos

1. **Control Panel -> Privileges** (a.k.a. Application Privileges).
2. For the `poetech-photos` user, set **Deny** on everything -- File Station, DSM
   desktop, Drive, Note Station, SSH/Terminal, etc.
3. Set **Allow** on **Synology Photos only**.
4. Confirm the account has **no SSH and no File Station** access (so it can never
   reach the filesystem, only the Photos app's own shared-album view).

### Step 3 -- Share ONLY the designated album to the account (view-only)

1. Open **Synology Photos** signed in as `dpoe` (the album owner).
2. Go to the curated album you want on Big Picture (e.g. an album named
   **`Big Picture`** -- create it and add the hero photos if it does not exist yet;
   do **not** share the whole camera roll).
3. **Share the album -> Invitee List.** From the user drop-down pick
   **`poetech-photos`**; set its permission to **view-only** (viewer/can-view, not
   editor). Save.
4. Note the album's **share passphrase** if Synology surfaces one -- the workflow may
   key on it (see the workflow spec below). If you prefer the no-account variant,
   the passphrase alone is enough (see "Simpler alternative").

### Step 4 -- Verify the scope is exactly one album (Darrell, 2 min)

1. Open a private browser window, go to **https://192.168.1.26:5001**, and sign in as
   **`poetech-photos`** with the new password.
2. Confirm: **only Synology Photos opens** (no File Station, no DSM apps), and inside
   Photos the account sees **only the shared `Big Picture` album** -- not `dpoe`'s
   other albums, not the MobileBackup camera roll.
3. Confirm it **cannot** add, delete, or edit photos in the album (view-only).
4. Sign out. The account is now a sandboxed, read-only, single-album photo identity.

---

## (b) Where the credential lives -- and how the workflow uses it

**Principle:** the credential is a **server-side secret on the NAS**, never in the
PWA, never in the repo, never logged. There are two acceptable homes; **n8n's
encrypted credential store is preferred.**

### Primary: n8n encrypted credential store (recommended)

n8n encrypts credentials at rest with `N8N_ENCRYPTION_KEY` (already set on the box,
see `infra/n8n/docker-compose.yml`). Darrell enters the service account once in the
n8n UI; the workflow references it by name, never by literal value.

1. In the n8n UI (on the NAS), **Credentials -> New**. Create a credential holding
   `account = poetech-photos` and `password = <the Step 1 password>`. Name it
   **`synology-photos-bigpicture-ro`**.
2. `wf-album-photos`'s Synology auth node (an HTTP Request / Code node performing
   `SYNO.API.Auth login`) references that credential. The password is read from the
   encrypted store at runtime; it is **never** written into the workflow JSON that
   lives in `infra/n8n/`.
3. **Never** `console.log` / `$json`-echo the password or the resulting `sid`. The
   `sid` cookie is held in-memory for the request and dropped.

### Alternative: a `_`-prefixed secrets file (matches the existing bearer pattern)

If the workflow reads the credential via a Code node instead of a native credential,
store it the same way the webhook bearer is stored:

- Host path: **`/volume1/PoeTech/photos/_secrets/synology-photos-svc.json`**
  (container: `/data/photos/_secrets/synology-photos-svc.json`).
- Contents: `{ "account": "poetech-photos", "password": "<...>" }`.
- **`chmod 600`**, owned by the n8n container uid (1000). The `_`-prefix means every
  directory walker in this repo skips it, so it can never leak into an aggregate
  response (same rule as `finance-events/_secrets/n8n-webhook-bearer.txt`).
- This file is on the NAS only. It is **git-ignored by construction** (it lives
  outside the repo) and must **never** be committed or pasted into chat.

**Either way:** Claude/the orchestrator never sees the password. Darrell types it
into the n8n credential (or writes the secrets file on the NAS) himself.

---

## The `wf-album-photos` workflow spec (for the NAS lane)

Same shape as the existing `wf-property-photos` / `wf-family-photos` bridges so the
app half (already merged-pending on PR #315) works unchanged.

- **Endpoint:** `GET /webhook/album-photos?album=<name>&limit=N`
- **Client gate (Secret #1):** Header Auth -- the same shared bearer the other photo
  bridges use (`poetech-chat-bridge-token`). Reuse the existing Header Auth
  credential; the device token already in the app works unchanged. Fail closed: 401
  if the bearer is missing/wrong (L16 pattern, `N8N-WEBHOOK-AUTH-PATTERN.md`).
- **Server identity (Secret #2):** authenticate to Synology Photos as
  `poetech-photos` via `SYNO.API.Auth` (`session=FotoStation`, `format=sid` or
  `cookie`). Hold the `sid` in-memory only.
- **Read the album (read-only):**
  - Resolve the app-supplied `album` name against the account's **shared-with-me**
    albums (`SYNO.Foto.Browse.Album` / the shared-album listing). If the requested
    album is not in the shared set, return `{ photos: [] }` -- the account cannot
    reach it, by design.
  - List items with **`SYNO.Foto.Browse.Item`**, `additional=["thumbnail"]`,
    `passphrase=<album passphrase>`, `limit`, `offset`, `sort_by=takentime`,
    `sort_direction=desc`.
  - Fetch each thumbnail via **`SYNO.Foto.Thumbnail`** (`size=sm`/`m`, `type=unit`),
    base64-encode -> `thumb` (a `data:image/jpeg;base64,...` URL), matching what the
    property bridge already returns so the app and `Lightbox` need no changes.
- **Return envelope (unchanged contract):**
  `{ photos: [ { id, thumb, date, text } ], total }`. `date` from item `takentime`;
  `text` from the item caption/filename. Items without a thumbnail are dropped (the
  app already filters `p.thumb`, but drop server-side too).
- **Read-only:** the workflow performs **only** `login` + `Browse` + `Thumbnail`. No
  create/edit/delete/upload API is ever called. (The Big Picture album is fed from
  Synology Photos by `dpoe`, not by this workflow.)
- **Resilience (PERPETUAL-PIPELINE-HEALTH):** try-catch the Synology calls; on any
  failure return `{ photos: [] }` (never a 500 that breaks the page); re-login once
  on an expired `sid`; rate-limit; health-check verb.

> **Verify against the live DSM 7.x box during build.** The `SYNO.Foto.*` API is
> unofficial; exact method names, `api` versions, and the shared-album-vs-passphrase
> path must be confirmed against the running NAS, not assumed from this spec. Pin the
> confirmed request shapes in `infra/n8n/README-album-photos.md` when built.

### Simpler alternative (if the account-API path is friction)

Synology Photos can mint a **private shared-link passphrase** for an album with **no
account at all**: `dpoe` shares the album as a link, and `wf-album-photos` reads it
via `SYNO.Foto.Sharing` + the `passphrase` (held as Secret #2 instead of a
username/password). This is even lower-privilege (no login, no account to manage) but
loses the named-identity audit trail Darrell asked for. **Default to the dedicated
account** per the decision; fall back to passphrase-only only if the account-scoped
API proves impractical on the live box, and record that as a decision with a reason.

---

## Verification (proven-to-catch -- the lane runs these at build)

Per the Verification Doctrine, the account's scope is *proven*, not claimed:

1. **Positive read:** as `poetech-photos`, the API returns items for the shared
   `Big Picture` album. (Green = the happy path works.)
2. **Negative -- other albums:** as `poetech-photos`, requesting any album NOT shared
   to it returns empty / 403. (Proves the account cannot see beyond the one album.)
3. **Negative -- write:** as `poetech-photos`, any create/delete/upload call is
   rejected. (Proves read-only.)
4. **Negative -- filesystem:** the account has no SSH / File Station, so it cannot
   reach `/volume1/homes/.../MobileBackup` at all. (Proves the camera roll is
   unreachable.)
5. **Secret hygiene:** grep the workflow JSON in `infra/n8n/` and the execution logs
   -- the password and `sid` appear in **neither**. (Proves no leak.)

A check that always passes is itself a lie -- #2/#3/#4 must be demonstrated to
*reject* before the integration is trusted (anti-theater).

---

## Net effect

- Big Picture reads photos from the **family's own NAS**, sovereign, via the existing
  tunnel -- not Google Photos / iCloud.
- It reads them as a **sandboxed, read-only, single-album service identity**, fully
  decoupled from the `dpoe` account and its auth issues.
- The owner curates scope simply by **sharing an album** to `poetech-photos`;
  un-sharing instantly removes it.
- No new secret touches the client or the repo; the service-account credential lives
  only in the NAS-side encrypted store, and only Darrell ever types it.
