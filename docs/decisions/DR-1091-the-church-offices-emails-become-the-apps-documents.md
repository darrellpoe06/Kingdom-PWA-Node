# DR-1091: The church office's emails become the app's documents, on the NAS

**Date:** 2026-10-17
**Status:** accepted
**Tier:** B (reads the church mailbox; files rows and files into the church's storage)
**Type:** way
**Area:**
- `infra/nas-church-mail/church_mail.py`, `test_church_mail.py`, `install.sh`, `place_church_mail_key.sh`, `README.md` (new)
- `infra/nas-loops/services.json` (the `church-mail` rider)
- `scripts/system-flow-registry.mjs` (the reader and the Team Docs node, with the `mail:church-office` source)
- `.github/workflows/ci.yml` (a CI step for the tests)

**Grounds:** Darrell, 2026-10-17: **"I don't want to need to bring over files!!!!! Why do we need to!!!?"** and **"Why make something have to work a way when an option that can get it done another way is available that works better?"**
**Principles:** DR-0236 (nothing waits); DR-0248 (the deterministic class: budget and lock); DR-0076 (§3 proven-to-catch); DR-0108 (account for every channel); DR-1085 (every document carries its own record)

## Context

The church office emails the weekly order of service, announcements, the calendar and the PROCLAIM sermon documents to Christina's mailbox. Two scripts on Darrell's PC read that mailbox and filed them on the old hosted server, whenever someone ran them. The 2026-08-19 move brought the rows across and left the 443 files behind. The only path offered was a key from the old server, placed by hand.

## What was measured

| | |
|---|---|
| Where the originals are | Christina's Gmail (the credential the PC scripts read: `C:\Users\dpoe\.poetech-secrets\gmail-mrspoe06.txt`). Darrell's own mailbox holds none: a search here for the office's calendar emails with attachments returned nothing |
| The path the PC script files at | `<church>/<safe(Message-ID)>/<safe(filename)>` (`import-team.mjs`), so a file can be put back where its row already points |
| A NAS mail reader | none. `nas-mail-archive` reads a Takeout export of Darrell's mailbox, by hand |
| A clock to ride | services-sync, already armed, every 15 minutes |

## Decision

1. **The NAS reads the church office's emails itself**, read-only, on the services-sync clock. A new team document is filed. A row whose file is missing is refilled at its own path, and so is a PROCLAIM sermon document. Anything else is left alone. New sermons stay with the sermon import, which names the sermon from the document.
2. **This is the better way, not a second one.** It brings the files back from their original source with no hosted key, and it ends the PC-run import: each new week lands within 15 minutes of arriving.
3. **Path parity is pinned** to values produced by the PC script's own JavaScript, including the UTF-16 count a character outside the BMP takes.
4. **Brakes.** Each pass handles at most 25 messages and runs at most 360 s, under a single-flight lock, with progress saved per message. A message that fails three times is set aside with its reason, and the cycle goes red.
5. **The credential is proven before it is written.** One PowerShell line pipes the existing password file over SSH. The NAS logs in to Gmail read-only, counts the office's emails, and writes the two lines to agent.env with `sudo -n`. A refused value writes nothing. The value never touches argv or the screen.

## Impact

The 322 team-document files and the sermon files the move left behind come back from the church office's own emails. Choir → Team Docs and the Order of Service starting point (DR-1088) fill themselves from then on. The hosted key line (DR-0317) stays available for the other private shelves.

## Verification

- **`test_church_mail.py` (11 tests), run in CI.** It covers JavaScript path parity, classify and dates, filing a new document, refilling at the row's own path, leaving a present file alone, the PROCLAIM refill, dry-run writing nothing, the message budget with resume, the time budget, and set-aside after three failures.
- **Proven to catch:**
  - dropping the two-underscore rule fails parity;
  - never checking presence fails the leave-alone test;
  - removing the set-aside fails the loop test.
- **`place_church_mail_key.sh` on this sandbox:**
  - an empty paste writes nothing (exit 2);
  - a refused login writes nothing (exit 3).
  - Its writer replaces the old lines and keeps every other setting. A bug found on the way, where Python's stdin carried its own script so the paste never reached it, was fixed.
- **Without a credential**, the reader names what is missing and exits 0, and the installer's gap stamp makes a too-early cycle a no-op.
- **Flow graph:** 185 nodes, 0 findings. Interconnect is green.

**re-review:** 2026-10-24: the first passes' tallies (filed, refilled, set aside) on the NAS cycle log, and Team Docs opening the June calendar's file.
