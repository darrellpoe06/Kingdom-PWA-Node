# nas-photos-archive — the sovereign Google Photos archive (DR-0238 re-review)

Plain deterministic **Python on the NAS** (DR-0083 pattern; stdlib-only, no LLM,
no network calls). Turns a Google Photos Takeout into an **owned, correctly
dated, verified archive** — and carries the **deletion gate** that decides when
it is safe to empty Photos.

**Why this exists.** DR-0238 backed up *mail* and said Photos "lands as plain
files, File Station browses them." The 2026-08-11 re-review found that wrong in
a way that matters: **mail was never the 200 GB — Photos is** (re-measured
2026-08-11: only 9 mail threads exceed 25 MB, ~201 exceed 10 MB; Drive's own
files are megabytes). So the service holding essentially all the bytes had **no
tool and no verification**, while DR-0238 §3 forbids deleting anything until a
measured, sane count exists. This closes that gap.

## A Takeout of Photos is not a usable archive on its own

Three real defects this tool fixes — each one proven in the selftest:

1. **The capture date is lost.** Takeout stamps extracted files with the
   *export* date. The true date lives only in a sidecar JSON. Unzip naively and
   20 years of family photos collapse onto one day, unsorted forever.
2. **The sidecars are hard to pair.** Google truncates long names, moves the
   counter (`IMG_0002(1).jpg` pairs with `IMG_0002.jpg(1).json`), renames to
   `.supplemental-metadata.json` in newer exports, and gives `-edited` files no
   sidecar at all.
3. **The zips overlap.** Multi-part exports and re-runs after a failed download
   repeat the same media, so a plain unzip silently double-counts.

## What it does

- **INDEX** — every media file becomes one JSONL row in `media.jsonl`
  (sha256, true capture date, album, camera, type, source zip). Source read-only.
- **RE-DATE** — real `photoTakenTime` restored to the file's mtime and used to
  file it under `media/<year>/`. Falls back to the filename date
  (`PXL_20210101_...`) when a sidecar is missing.
- **DEDUPE** — by content sha256, so overlapping zips converge. Idempotent.
- **STATS** — `_stats.json`: counts + bytes by year, type, album, camera.
- **VERIFY** — the deletion gate. Re-hashes the archive, prints **GO / NO-GO**.
- **FIND** — `--find "beach"` searches the index without touching Google.

## Three brakes (build requirements — DR-0225; ships INACTIVE)
- **Single-instance lock** (`.photos_archive.lock`, PID-checked) — a second run SKIPS.
- **Wall-clock budget** (`--max-seconds`, default 21600 / 6h) — aborts safely; re-run to resume (idempotent).
- **Fail-after-N kill-switch** (`--max-fails`, default 5) — writes `.photos_archive.paused` and refuses to run until cleared.

Nothing schedules it. It runs by a human's hand; there is no timer to arm.

## Prove it, then run it
```
python3 photos_archive.py --selftest
python3 photos_archive.py --source /volume1/PoeTech/photos-archive/takeout --out /volume1/PoeTech/photos-archive
python3 photos_archive.py --out /volume1/PoeTech/photos-archive --verify
```
`selftest 12/12` proves the tool on the box before any real data — including
that the verify gate **catches a flipped byte and a removed file**. A gate that
always passes is itself a lie (DR-0076 §3).

## Which surface can do which step (MEASURED 2026-08-11 — read this first)

Darrell twice directed the cloud session to ssh to the NAS and to order the
Takeout itself. Both are impossible **from that surface** and possible from
others, so the capability is recorded per-surface instead of being re-litigated
every session (DR-0291 §4: a stated *"you can"* is a premise too).

| Step | Cloud session (claude.ai/code) | Desktop Cowork | Darrell's browser | The NAS |
|---|---|---|---|---|
| Order the Takeout | **NO** — `takeout.google.com:443` returns **403 to CONNECT** (egress policy), no Google session, and 2FA | no (same auth wall) | **YES — his hand** | no |
| Measure Gmail / Drive | **YES** (connectors) | yes | yes | no |
| Measure Google Photos | **NO** — no connector exists at all | no | yes (the UI) | no |
| Delete from any Google service | **NO** — no delete verb in either connector | no | **YES — his hand** | no |
| Reach the NAS (ssh / SMB) | **NO** — no `ssh`/`tailscale` binary; ports 22/5000/5001 no route | **YES** | yes (File Station) | n/a |
| Run these tools | no | yes (over ssh) | no | **YES** |
| Write/ship the code | **YES** | yes | no | pulls from main |

**The 443 trap, recorded so nobody repeats it:** probing `192.168.1.26:443`
from the cloud session *appears* to succeed with a real TLS 1.3 handshake. It
is NOT the NAS — the certificate is `issuer = O = Anthropic, CN = Egress
Gateway SDS Issuing CA`, minted seconds before the probe. The gateway answers
every CONNECT. **Check the certificate issuer before believing a port is open.**

## The whole flow (Darrell's hand — values only he holds)

**Step 1 — order the Photos export (browser, ~5 min; Google builds it over
hours-to-days, so this is the long pole):**

Fastest path — this deep link opens Takeout with **Google Photos already the
only thing selected**, skipping the "Deselect all, scroll, find Photos" dance:

    https://takeout.google.com/settings/takeout/custom/photos

**VERIFIED 2026-08-11** by Darrell's screenshot from the laptop: the page opened
reading *"Select data to include — 1 of 1 selected."* (It was shipped labeled
"best-known, unverified" because the host returns 403 to CONNECT from the cloud
session; his screenshot is the verification that closed it — DR-0076 §1, a claim
becomes fact when evidence arrives, not before.)

The sibling link for Mail, same behavior:

    https://takeout.google.com/settings/takeout/custom/gmail

**Settings that matter, confirmed on the real page:** Transfer to =
*Send download link via email*; Frequency = *Export once*; File type = *.zip*;
File size = *50 GB*. Then **Create export**, and the page shows
*"Google is creating a copy of data from Google Photos ... hours or days."*

**Order Photos and Mail as SEPARATE exports** (the "Create another export"
button on the progress card). Two reasons: Mail is ~10-15 GB and finishes far
sooner than the ~200 GB Photos haul, so it can be archived and Gmail emptied
while Photos is still building; and a failed part in a combined export costs
both. `run-archive.sh` handles either or both, whichever landed.

1. Open https://takeout.google.com signed in as darrellpoe06@gmail.com.
2. "Deselect all," then check **Google Photos** only (mail is a separate,
   already-tooled pass — keep the exports small enough to finish).
3. Export once - `.zip` - **50 GB** segments -> Create export.
4. Choose **download link** delivery, NOT "Add to Drive" — the account is over
   quota, so Drive will refuse the delivery.

Google emails when ready; **download links live 7 days.** At ~200 GB expect
several 50 GB parts. Download all of them before any expire.

**Step 2 — prep + prove, IN THE NAS SHELL (ConnectBot — the shell whose prompt
reads `dpoe@PoeTech:~$`; these are NAS commands, NOT PowerShell). The repo is
already on the NAS via nas-build-loop, so nothing needs copying:**
```
mkdir -p /volume1/PoeTech/photos-archive/takeout
python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-photos-archive/photos_archive.py --selftest
df -h /volume1
```
(`selftest 12/12` proves the tool. `df -h` must show **~450 GB free** — the zips
plus the extracted archive both land before the zips can be removed. If it is
tight, archive one part at a time and delete each zip after it verifies.)

**Step 3 — land the Takeout zips on the NAS. Pick the hand you have:**
- **Desktop (no ssh, no password): PowerShell to the SMB share** after the zips download:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
Copy-Item "$env:USERPROFILE\Downloads\takeout-*.zip" "\\192.168.1.26\PoeTech\photos-archive\takeout\"
```
- **Any browser (phone or desktop): DSM File Station** -> upload the zip(s) into
  `PoeTech/photos-archive/takeout` by tap.

**Step 4 — archive (NAS shell). Feed the zips directly; no unzip step needed —
the tool reads inside them:**
```
cd /volume1/PoeTech/photos-archive
python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-photos-archive/photos_archive.py --source takeout --out . --max-seconds 43200
```
It prints the measured count by year. **Sanity-check it against what Photos
says you have** (open https://photos.google.com and compare the rough total).
A count far below expectation means a missing part — stop and fix.

**Step 5 — THE GATE. Nothing is deleted from Google until this prints GO:**
```
python3 /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-photos-archive/photos_archive.py --out . --verify
```
Every indexed item must be present and byte-intact. `GO` = the bytes are on
owned hardware and deletion is safe (DR-0238 §3 satisfied). `NO-GO` = do not
delete anything; the printed lines name what is missing or corrupt.

**Step 6 — only after GO: free the storage.** At https://photos.google.com
select-by-month is fastest; then **empty the Photos trash** (space frees only
after that, and Google's trash holds 60 days otherwise). Re-check
https://one.google.com/storage to confirm the quota actually moved.

**Step 7 — spot-check the archive like a human, not a script.** Open
`media/2015/` and `media/2019/` in File Station. The photos should be *there*,
*viewable*, and *in the right year*. The gate proves bytes; your eyes prove it
is the family's actual history (DR-0076 §7 — independent verification).

## The bridge, if Aug 18 arrives first
The **$1.99/mo 100 GB tier is a pre-approved BRIDGE, not a destination**
(DR-0238 §4). ~200 GB exceeds even that tier, so if the deadline is close,
the honest sequence is: take the bridge to keep mail flowing, finish the
verified archive without deadline pressure, delete, then cancel. Paying for a
month to avoid rushing an irreplaceable-photo deletion is the cheap side of
that trade.

## What this is NOT
- Not scheduled, not a sync — a deliberate export-verify-delete pass.
- Not a photo *server*. Serving the family's photos from the NAS is the
  `nas-property-photos` / sovereign photo-server pattern; this produces the
  owned, dated, deduped tree that such a server can point at later.
- Not a mail tool — that is `infra/nas-mail-archive` (DR-0238).
