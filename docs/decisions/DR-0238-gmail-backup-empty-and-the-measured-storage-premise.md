---
id: DR-0238
title: Back up Gmail to the NAS and empty it — but the measured truth is that Photos, not mail, holds the 200 GB; the archive ships today, the deletion follows verification, and shared-chat links are treated as public
date: 2026-07-28
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [all]
grounds: [SOVEREIGN-FIRST, VERIFICATION-DOCTRINE, SPEAK-ESTABLISHED-FACT, COST-DISCIPLINE, DATA-AS-EMPOWERMENT, THREE-BRAKES, WAYS-REVIEW]
source: 2026-07-28 session — Darrell ("I need to backup my gmail account and empty it so I keep what I want and get rid of whatever has me over their thresholds... opportunities and constraints"), with his Gmail screenshot (200.52 GB of 15 GB used; "Emails will stop on Aug 18, 2026") and The Neuron security item on exposed Claude chats.
---

## Context

darrellpoe06@gmail.com — the address the whole operation rides (GitHub/CI
notices, Synology alerts, church mail, the app's SIGNED IN AS identity) — is at
200.52 GB of a 15 GB quota, and Google stops mail delivery **2026-08-18**
(~3 weeks). The stated plan was "empty Gmail to get under the threshold."
The reality-trace (live Gmail probes, 2026-07-28) found the premise wrong:
only ~11 threads exceed 25 MB, ~54 exceed 10 MB, ~201 exceed 5 MB — the entire
mailbox (~70k+ messages) is plausibly 10–15 GB. **Deleting every email ever
received cannot bring 200 GB under 15 GB.** The bulk is Google Photos and/or
Drive (the shared-quota siblings); the per-service split reads in one tap at
one.google.com/storage. Surfaced per feedback-surface-premise-conflicts before
any deletion.

## Decision

1. **Back up to owned hardware FIRST, verify, then empty — never the reverse.**
   The lane is Google Takeout (Mail + Photos in the same export) landed on the
   NAS. `infra/nas-mail-archive/mail_archive.py` (built this session, selftest
   6/6) turns the Takeout mbox into an owned archive: JSONL index, extracted
   attachments by year, measured `_stats.json`, `--find` search, three brakes,
   idempotent, stdlib-only, no network. The mail stays useful after the account
   empties.
2. **The deletion order is: verify archive → prune mail (hygiene) → fix the
   real hog (Photos/Drive) after ITS Takeout verifies.** Mail pruning
   (promotions/updates/social + large-old) is worth a few GB and a cleaner
   account — it is not the threshold fix and is never presented as one
   (DR-0100: under-claiming and over-claiming are both failures).
3. **The verification gate is binding (DR-0076):** nothing is deleted from any
   Google service until the corresponding Takeout on the NAS shows a measured,
   sane count (`_stats.json` messages in the tens of thousands; Photos files
   browsable in File Station). A backup that was never verified is not a backup.
4. **The $1.99/mo 100 GB tier is an approved BRIDGE, not a destination** — used
   only if Aug 18 arrives before the pass completes, cancelled once the NAS
   holds the data (COST-DISCIPLINE; sovereignty is the destination).
5. **Shared-chat links are public — treated as such from today.** Verified
   2026-07-28: ~600 shared Claude conversations were indexed by Google/Bing
   (share pages lacked noindex; both engines have since de-indexed). No secrets,
   keys, family or church data in any shareable chat/artifact link; PoeTech's
   own posture is unchanged but re-affirmed — private surfaces stay behind
   auth/RLS, never "unlisted."
6. **NOT decided:** no Google Workspace migration, no custom-domain mail move,
   no automated mail sync — the archive is a deliberate export pass, unscheduled.

## Rationale

The account going deaf on Aug 18 would silently break CI notices, NAS alerts,
and church correspondence — an uptime-class risk (DR-0107's "worst outcome"
posture applied to mail). The fix that respects the Ways is measured (probe
before delete), sovereign (owned archive before emptied cloud), and honest about
where the bytes actually are.

## Consequences

- Obligates Darrell's-hand steps, shipped paste-ready in the README: order the
  Takeout, land it on the NAS, run the verify lines, then the deletion passes.
- The archive tool is on the NAS automatically once merged (nas-build-loop pulls
  this repo).
- **re-review: 2026-08-11** — one week before the deadline: is the Takeout
  landed + verified, is the account under quota, is the bridge needed?

## Links

`infra/nas-mail-archive/mail_archive.py`, `infra/nas-mail-archive/README.md`,
[DR-0083] (the NAS-Python pattern), [DR-0076] (verify before trust),
[DR-0100] (state the measured truth), [DR-0237] (the same session's research
pass), `docs/99-session-notes/2026-07-28-gmail-backup-header-and-exposed-chats-oc.md`.
