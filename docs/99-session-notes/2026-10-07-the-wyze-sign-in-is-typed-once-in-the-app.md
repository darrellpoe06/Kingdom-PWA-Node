# 2026-10-07 — The Wyze sign-in is typed once, in the app (DR-0770)

**What Darrell asked:** "Is that the easiest way to build it so I don't have to do much work for it to work right away?" — about DR-0756's two PowerShell steps for the Wyze cameras.

**Answer:** No. Reviewing the way (DR-0108) against go2rtc 1.9.14's source: its WebUI's *Add > Wyze* is `POST /api/wyze` (logs in, persists the account, lists cameras) plus `PUT /api/streams` per camera (persisted). Both are reachable from the NAS-side forwarder over the locked `/cams` road the app already uses.

**What changed:**
- `infra/nas-cameras/cams_forwarder.py` — `POST /setup/wyze` (bearer): validate -> go2rtc `/api/wyze` -> register each camera -> `{ok, added, cameras:[{id,name,model,dtls,registered,existing}]}`; no url/enr/password/key leaves; one at a time (409); selftest section 8b (17 checks).
- `app/src/lib/cameras.js` — `WYZE_FIELDS`, `validateWyzeSetup`, `classifySetupResult`, `setupWyze`.
- `app/src/components/Cameras.jsx` — `WyzeSetup` form in the empty state; the PowerShell steps behind "Prefer a terminal?".
- `infra/nas-cameras/README.md`, `install.sh` — the easy way first, the terminal way kept.

**Evidence:** forwarder selftest ALL PASSED; `cameras.test.js` + `cameras-render.test.jsx` + `ui-standards-guard` 51 green; eslint clean.

**re-review:** 2026-11-15 (with DR-0756's Gwell review): an "Add a Wyze account" entry on the READY state.
