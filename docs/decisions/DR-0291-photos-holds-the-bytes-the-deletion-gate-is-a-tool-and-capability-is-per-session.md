---
id: DR-0291
title: The DR-0238 re-review — Photos holds the bytes and had no tool, the deletion gate becomes a machine check, and "you have ssh/CLI" is a per-session fact that must be measured, never inherited
date: 2026-08-11
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0238 (its dated re-review; §3's gate now has an instrument for Photos)]
tier: A
entities: [all]
grounds: [VERIFICATION-DOCTRINE, SPEAK-ESTABLISHED-FACT, SOVEREIGN-FIRST, WAYS-REVIEW, DATA-AS-EMPOWERMENT, THREE-BRAKES, PERPETUAL-IMPROVEMENT, COST-DISCIPLINE]
source: 2026-08-11 session — Darrell, with the Gmail "Emails will stop in 7 days" screenshot: "Review the Ways and documentation fully and thoroughly then opportunities and constraints... of backing up my account or purging the storage for me after taking my data? etc... my data you already have ssh and cli access too."
---

## Context — this is DR-0238's own dated re-review, arriving on its date

DR-0238 carried a dated re-review commitment falling **today, 2026-08-11** —
"one week before the deadline: is the Takeout landed + verified, is the account
under quota, is the bridge needed?" This is that review, run on the day it came
due (and it CLOSES that date; the only date left open below is 2026-08-18),
prompted by Darrell's
screenshot of Google's 7-day notice (mail stops **2026-08-18**).

## Findings (measured this session, not recalled)

1. **The Takeout was never ordered.** A Gmail probe for Google's export mail
   (`from:google.com subject:(Takeout OR "data archive") newer_than:30d`)
   returns **empty**. The DR-0238 hand-steps did not run; 14 of the 21 days are
   spent and **7 remain**. No session note since 2026-07-28 records progress.
2. **DR-0238's measured premise HOLDS, and is now firmer.** Re-measured today:
   **9** mail threads exceed 25 MB (was ~11), **201** exceed 10 MB. Drive's own
   files are megabytes — the only large item in recent Drive is a 432 MB video
   **owned by another account** (shared in, so it does not consume this quota).
   **Photos is the ~200 GB.** Stated plainly, not hedged (DR-0100).
3. **The gap that mattered:** DR-0238 §3 forbids deleting anything until the
   archive shows "a measured, sane count." `mail_archive.py` gives mail that
   instrument. **Photos — holding essentially all the bytes — had none.**
   DR-0238's README explicitly waved it off: *"Not a Photos indexer (Takeout
   Photos lands as plain files; File Station browses them)."* That is wrong in a
   way that matters, and it is corrected here: a plain unzip of a Photos Takeout
   **loses every capture date** (Takeout stamps the export date; the true date
   lives only in a sidecar JSON), **mis-pairs sidecars** (truncated names, the
   moved `(N)` counter, `.supplemental-metadata.json`, `-edited` derivatives),
   and **silently double-counts** overlapping export parts. The family's
   irreplaceable history was one `unzip` away from being an undated, deduped-by
   -nobody heap — with a deletion gate that had nothing behind it.

## Decision

1. **`infra/nas-photos-archive/photos_archive.py` is the Photos counterpart to
   the mail tool** — same DR-0083 shape: plain deterministic Python on the NAS,
   stdlib-only, no network, no LLM, three brakes (single-instance lock,
   wall-clock budget, fail-after-N kill-switch), idempotent, ships INACTIVE.
   It indexes to JSONL, **restores the true `photoTakenTime`** to each file's
   mtime and year folder, **dedupes by content sha256** across overlapping
   parts, and measures `_stats.json` by year / type / album / camera. It reads
   Takeout zips directly — no 200 GB double-unzip.
2. **`--verify` IS the deletion gate, and it is a machine check, not a claim.**
   It re-hashes the archive and prints **GO** only when every indexed item is
   present and byte-intact; otherwise **NO-GO** and the names of what is wrong.
   Nothing is deleted from Google Photos until it prints GO. **Proven-to-catch
   (DR-0076 §3):** the selftest deliberately flips one byte and then removes a
   file, and requires the gate to flip GO → NO-GO both times. A gate that always
   passes is itself a lie — and for photos there is no second copy to recover
   from, so the anti-theater requirement is at its strictest here. **12/12.**
3. **Both selftests now gate merge in `ci.yml`.** The photos selftest is new;
   **`mail_archive.py`'s selftest had never been wired into CI at all** since
   DR-0238 — a proven-to-catch gate that no one ran. Both run every push now.
4. **Capability is a PER-SESSION fact, measured at the start, never inherited.**
   Darrell's *"my data you already have ssh and cli access too"* is **true of the
   desktop Cowork sessions and false of this one**, and the difference is not
   cosmetic. Measured here: `tailscale` not installed, `192.168.1.26:22` **no
   route** — this is an ephemeral cloud container with no path to the LAN or the
   tailnet. Anything downloaded into it dies with it, so **nothing this session
   could fetch would be a backup.** DR-0108 says a stated *"can't"* is an
   unverified premise to challenge; this records the **inverse and equally
   binding** half — a stated *"you can"* is also a premise, and assuming an
   access path that is absent would have produced confident work that silently
   went nowhere. The agent probes its actual reach before planning around it.
5. **"Purge the storage for me" is not available through the connectors — as a
   measured fact, not a preference.** The Gmail connector exposes search / get /
   label / draft verbs and **no delete or trash verb**; the Drive connector
   exposes copy / create / download / read / search and **no delete verb**;
   there is **no Google Photos connector at all** — the service holding the
   200 GB is entirely out of reach. Google Takeout has no API; it is a browser
   flow. So the deletion is Darrell's hand by necessity, not by caution, and the
   agent's honest job is to make that hand-pass short, ordered, and safe.
6. **The bridge is now the recommended move, not a contingency.** DR-0238 §4
   pre-approved the $1.99/mo tier as a **bridge, not a destination**; invoking it
   is executing an approved decision, not a new ask (DR-0111). With 7 days left,
   a ~200 GB export that Google builds over hours-to-days, download links that
   live only 7 days, and multi-part zips to land and verify, the deadline is
   genuinely tight. Stated plainly: **~200 GB exceeds even the 100 GB tier**, so
   the bridge buys *time and calm*, not compliance — it keeps mail flowing while
   the verified archive finishes without deadline pressure. Paying for one month
   to avoid rushing an irreversible deletion of the family's photo history is
   the cheap side of that trade (COST-DISCIPLINE reads the risk, not only the
   invoice). Cancel once the NAS holds the data.
7. **NOT decided / unchanged:** no Workspace migration, no custom-domain mail
   move, no automated sync, no photo *server* (serving from the NAS stays the
   `nas-property-photos` pattern — this produces the owned tree such a server
   could later point at). Nothing here is scheduled; there is no timer to arm.

## Consequences

- Obligates Darrell's-hand steps, shipped paste-ready in
  `infra/nas-photos-archive/README.md`: order the Photos Takeout (download-link
  delivery — Drive delivery **fails** while over quota), land the zips, archive,
  **verify to GO**, then delete and empty the Photos trash.
- The tool reaches the NAS automatically once merged (nas-build-loop pulls this
  repo), so no copying step is needed.
- Free-space constraint stated plainly: the zips **and** the extracted archive
  both land before the zips can be removed — `df -h /volume1` should show
  ~450 GB free, or the parts are archived one at a time.
- **re-review: 2026-08-18** — the deadline itself: is the Photos archive
  verified GO, did the quota actually move, was the bridge taken, and is it
  cancelled once the NAS holds the data?

## Links

`infra/nas-photos-archive/photos_archive.py`, `infra/nas-photos-archive/README.md`,
`.github/workflows/ci.yml` (both selftests), [DR-0238] (the pass this reviews),
[DR-0083] (the NAS-Python pattern), [DR-0076] (verify before trust;
proven-to-catch), [DR-0100] (state the measured truth), [DR-0108] (review our
Ways — access paths), [DR-0111] (do the work; the bridge is already decided).
