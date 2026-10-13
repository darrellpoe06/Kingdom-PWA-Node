# nas-mail-archive — the sovereign Gmail archive (DR-0238)

Plain deterministic **Python on the NAS** (DR-0083 pattern; stdlib-only, no LLM,
no network calls). Turns a Google Takeout mbox into an **owned, searchable
archive**: a JSONL index of every message, extracted attachments by year, and a
measured `_stats.json` (counts + bytes by year / label / sender domain). The
mbox source is read-only; re-runs are idempotent (Message-ID dedupe).

**Why:** darrellpoe06@gmail.com sits at ~200 GB of a 15 GB quota; Google stops
mail delivery **2026-08-18**. The backup that makes emptying Gmail *safe* is the
mail landed on owned hardware — and an archive you can `--find` in is a backup
that stays useful after the account is emptied.

**The measured premise (2026-07-28, DR-0076):** the mail is NOT the 200 GB.
Only ~11 threads exceed 25 MB, ~54 exceed 10 MB, ~201 exceed 5 MB — the whole
mailbox is likely 10–15 GB. The bulk is Google Photos and/or Drive (check
https://one.google.com/storage for the per-service split). So: back up + empty
Gmail for hygiene and sovereignty, but the threshold is cleared by dealing with
**Photos**, which also rides Takeout and also lands on the NAS.

## Three brakes (build requirements — DR-0225; ships INACTIVE)
- **Single-instance lock** (`.mail_archive.lock`, PID-checked) — a second run SKIPS.
- **Wall-clock budget** (`--max-seconds`, default 3600) — aborts safely; resume by re-running (idempotent).
- **Fail-after-N kill-switch** (`--max-fails`, default 5) — writes `.mail_archive.paused` and refuses to run until the file is cleared.

Nothing schedules it. It runs by a human's hand; there is no timer to arm.

## Prove it, then run it
```
python3 mail_archive.py --selftest
python3 mail_archive.py --mbox "All mail Including Spam and Trash.mbox" --out /volume1/PoeTech/mail-archive --extract-attachments
python3 mail_archive.py --out /volume1/PoeTech/mail-archive --find "lease"
```

## The whole flow (Darrell's hand — values only he holds)

**Step 1 — order the export (browser, ~5 min; Google builds it over hours/days):**
1. Open https://takeout.google.com signed in as darrellpoe06@gmail.com.
2. "Deselect all," then check **Mail** (and **Google Photos** — same trip, same reason).
3. Export once · `.zip` · **50 GB** segments -> Create export. Google emails when ready (download links live 7 days).

**Step 2 — prep + prove, IN THE NAS SHELL (ConnectBot — the shell whose prompt
reads `dpoe@PoeTech:~$`; these are NAS commands, NOT PowerShell — corrected
2026-07-28 after the desktop block was pasted into the NAS shell). The repo is
already on the NAS via nas-build-loop, so nothing needs copying:**
```
mkdir -p /volume1/PoeTech/mail-archive/takeout
python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-mail-archive/mail_archive.py --selftest
```
(`selftest 6/6` proves the tool on the box before any real data. If the repo
path differs, `find /volume1 -maxdepth 4 -name mail_archive.py 2>/dev/null`
prints the real one.)

**Step 3 — land the Takeout zip(s) on the NAS. Pick the hand you have:**
- **Desktop (no ssh, no password): PowerShell to the SMB share** after the
  zips download:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
Copy-Item "$env:USERPROFILE\Downloads\takeout-*.zip" "\\192.168.1.26\PoeTech\mail-archive\takeout\"
```
- **Any browser (phone or desktop): DSM File Station** -> upload the zip(s)
  into `PoeTech/mail-archive/takeout` by tap. (Takeout's "Add to Drive"
  delivery is NOT usable here — the account is over quota, so Drive refuses
  new content; order download-link delivery.)

**Step 4 — archive + verify, back in the NAS shell (nothing is deleted anywhere
until this prints a sane count — DR-0076):**
```
cd /volume1/PoeTech/mail-archive/takeout
7z x -y takeout-*.zip
cd /volume1/PoeTech/mail-archive
python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-mail-archive/mail_archive.py --mbox "$(ls takeout/Takeout/Mail/*.mbox | head -1)" --out . --extract-attachments --max-seconds 7200
python3 -c "import json;s=json.load(open('_stats.json'));print(s['messages'],'messages,',s['bytes']//1048576,'MB,',s['attachments'],'attachments')"
python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-mail-archive/mail_archive.py --out . --find lease
```
(If `7z` is missing, File Station extracts the zip by tap; the mbox path stays
the same.)
The message count should be in the tens of thousands (the account holds ~70k+).
A count near zero means the wrong mbox path — stop and fix before deleting.

**Step 5 — empty Gmail (browser; only after step 4 verifies).** In Gmail search,
paste each line, Select all -> "Select all conversations that match" -> Delete:
```
category:promotions
category:updates older_than:1y
category:social older_than:1y
larger:5M older_than:2y
```
Then Trash -> "Empty Trash now" (space frees only after this). This clears at
most a few GB — hygiene, not the fix.

**Step 6 — the actual threshold fix:** open https://one.google.com/storage,
read the per-service split. If Photos is the bulk (expected): after the Photos
Takeout from step 1 is verified on the NAS, delete photos at
https://photos.google.com (select-by-month is fastest) and empty its trash.
The family photo serving already lives on the NAS (`nas-property-photos`
pattern); Photos-on-NAS is the same sovereignty move as mail.

## What this is NOT
- Not scheduled, not a sync — a deliberate export-verify-empty pass.
- Not a Photos indexer (Takeout Photos lands as plain files; File Station browses them).
- The `$1.99/mo 100 GB` Google tier is the honest *bridge* if Aug 18 arrives
  before the pass completes — a dated bridge, not the destination (COST-DISCIPLINE).
