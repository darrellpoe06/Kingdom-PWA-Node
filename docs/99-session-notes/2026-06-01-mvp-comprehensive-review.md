# MVP Comprehensive Review — 2026-06-01 (Monday evening, vacation pivot)

Diagnostic, not punitive. Religion AND relationship. Written so Darrell — phone-only, on a beach in Maui — can decide whether to step away or patch one more thing before he rests.

> **Context.** Commit `dddb0c3` landed earlier today: 52 files, 7,914 insertions. Workflows 30 / 31 / 32 imported and activated on the NAS from ConnectBot via Tailscale within the last few hours. The PWA Suggest button is live in the deployed bundle. This note audits the state right now and projects the next 24 hours and the next week.

---

## 1 — TL;DR / verdict

**This IS a healthy stopping point — with one caveat the size of a billboard.** The family-feedback loop (PWA Suggest button → wf30 webhook → file capture + ntfy → wf31 7am digest → wf32 9pm ship summary) is wired end-to-end and the contract between the PWA and the workflows is clean: same path, same field names, same sender vocabulary. Tomorrow morning's 7am digest and tomorrow night's 9pm ship summary will fire on their own and degrade gracefully if there are no voices or no commits. The capitalization rules hold across the PWA surface. The landing page is a textbook expression of ANXIETY-CLARITY (WHAT / WHEN / WHY / HOW grid is right there in the hero), and the Excellence Standard's religion-AND-relationship balance shows clearly in the copy.

**The caveat:** the single most prominent CTA on the public landing — the red `Drop your bank file → see your money here` button at `app/src/poe-financial-mvp-v28.jsx:2525` — POSTs to `/webhook/data-upload`, which is **workflow 33, which is not in the active list and was not deployed in today's push**. A stranger landing on poetech.us, doing the most-encouraged action, will hit `HTTP 404` and see the error modal. Per BUSINESS-PROCESS-CONNECTIONS, that surface is unwired and shouldn't be the loudest button on the page until wf33 / 34 / 35 deploy. This is the patch worth considering before relaxing — see Section 8 for the cheapest fix.

Everything else, you can let cook. Go enjoy Maui.

---

## 2 — What's live and working (end-to-end)

**Suggest button → wf30 → family-feedback capture.** Verified contract:

- PWA POST target: `${VITE_N8N_WEBHOOK_BASE}/webhook/family-feedback` — `app/src/poe-financial-mvp-v28.jsx:1499`.
- wf30 webhook path: `family-feedback` — `docs/00-foundations/n8n-workflows/30-family-feedback-intake.json:7`.
- PWA payload fields: `sender`, `type`, `message`, `screen_context`, `user_agent`, `source` — `poe-financial-mvp-v28.jsx:1504-1511`.
- wf30 expected fields: identical list, message is the only required one — `30-family-feedback-intake.json:20`.
- `sender` enumeration (`dpoe` / `cpoe` / `christiana` / `christian` / `christyn` / `unknown`) matches the workflow's `trustedSenders` list exactly.
- `type` enumeration (`bug` / `feature` / `copy` / `question` / `strategic` / `other`) matches the dropdown at `poe-financial-mvp-v28.jsx:2670-2678`.
- wf30 writes `/data/finance-events/family-feedback/<id>.json` and best-effort POSTs to ntfy topic `poetech-family-feedback`. Returns `{ ok, id, captured_at, message }` which the PWA reads at line 1518.

That's a clean, properly-wired pipeline. No mismatch anywhere.

**wf31 — Daily standup digest (7am Central).** Cron `0 0 7 * * *` with timezone `America/Chicago` — `31-daily-standup-digest.json:7,77`. Reads from the same `/data/finance-events/family-feedback/` directory wf30 writes to. Falls back to a quiet "zero voices" ntfy push if the directory is empty. Fully self-healing: empty-dir, ollama-down, and ntfy-down branches all return cleanly.

**wf32 — Daily ship summary (9pm Central).** Cron `0 0 21 * * *` with timezone `America/Chicago` — `32-daily-ship-summary.json:7,77`. Pulls commits from `darrellpoe06/Kingdom-PWA-Node` via GitHub API. Falls back to a quiet "no commits" message if there's no work to summarize. Will run unauthenticated if `GITHUB_TOKEN` is unset (rate limit ~60/hr — fine for a family repo).

**The landing surface.** `poe-financial-mvp-v28.jsx:2471-2538`. The ANXIETY-CLARITY four-question grid (WHAT / WHEN / WHY / HOW) is hard-coded into the hero at lines 2478-2483. The first-time copy at line 2475 reads "Know what to do today — for everyone in your house." — warmth and direction in the same breath. Sample tiles use `Working sample` badges; vision tiles use `Vision · in build` badges per Timeline-First discipline. No real Poe-family data is exposed in the demo personas. The waitlist signup (wf29) and the demo personas honor the BUSINESS-PROCESS-CONNECTIONS test that's already documented in that foundation doc.

**The demo welcome modal.** `poe-financial-mvp-v28.jsx:2542-2568`. Per-persona pitch with a 4-sentence theology paragraph at line 2553: *"Anxiety comes from not knowing what to do. The whole point of this is to give clarity — what, when, why, and how. With assistance and guidance, almost too much. Faith-expressed-in-works. His Will be done."* Religion + relationship in one block. The Test passes on this paragraph.

**The Suggest modal.** `poe-financial-mvp-v28.jsx:2659-2705`. Floating lower-right button at line 2647 (hidden during first-time landing per honest first-impression discipline). Modal copy: header "What do you see?", body "Bug, idea, copy edit, question - all welcome. Family voices ship within a day." Closing footer at line 2694: "Goes to a private inbox on our own infrastructure. We see it within minutes." Success state at line 2698 reads "We hear you." That's warmth carrying backbone.

**Workflows active in production** (from your `n8n list:workflow --active=true`): 01, 03, 08, 10, 12, 13, 15, 16, 18, 19, 20, 23, 26, 27, 29, 30, 31, 32. The daily-cadence trio (30 / 31 / 32) joined the active list within the last few hours.

---

## 3 — What's wired but unverified

**`VITE_N8N_WEBHOOK_BASE` in the Vercel build.** The Suggest button code at `poe-financial-mvp-v28.jsx:1475-1479` returns the user-visible message *"Feedback channel is temporarily offline. Please try again later or email darrellpoe06@gmail.com."* if the env var is unset at build time. Local `app/.env.local` does not include it — only Supabase vars. The data-dump modal and the imported-transactions view also read this var. If the latest deployed Vercel build does not have `VITE_N8N_WEBHOOK_BASE` set, the Suggest button is shipped but inert; users will see the "offline" message and the feedback loop won't actually fire. Verifiable in 30 seconds from your phone by tapping Suggest on poetech.us — if you see the dropdown and a Send button, the env is set.

**The `/data/finance-events/family-feedback/` bind mount.** wf30 calls `fs.mkdirSync(..., recursive: true)` so it won't crash if the bind mount is missing — but if the directory is inside ephemeral container storage rather than a real NAS volume, writes won't survive container restarts. wf31's 7am read at the same path will see whatever wf30 wrote since the last n8n restart, so a quiet day looks identical to a misconfigured-volume day. Not catastrophic; worth a 30-second `docker exec` check when you're next at a keyboard.

**ntfy topic `poetech-family-feedback`.** Both wf30 and wf31 push there. If no family device is subscribed, voices land silently in the file system and you only see them in the 7am digest. Subscribe check from any phone with the ntfy app: search for the topic, confirm it shows the activation events from today.

**wf32's `GITHUB_TOKEN`.** If unset, the workflow runs anonymously and works at 60 requests/hour. One commit-summary run = one API call, so headroom is enormous. But the `darrellpoe06/Kingdom-PWA-Node` repo is public per the workflow's API URL — confirm that's still true. If you flipped it private, the unauthenticated call returns 404 and the ship summary silently misses commits.

**The Synology Chat side of the digests.** Both wf31's title (`→ Synology Chat + ntfy`) and wf32's title promise a Synology Chat post. The code paths only POST to ntfy. The Chat post is mentioned in the prose comments but **not implemented** in the JS bodies of wf31 or wf32. Not a bug — the promise to the family was for both surfaces; only one is delivered. wf27 (Foundation Agent) has the Synology Chat post code at `27-foundation-agent.json:32` and it works when `SYNOLOGY_CHAT_INCOMING_URL` is set in env. Lift that pattern into wf31 and wf32 when convenient.

**wf27 Foundation Agent bind mount.** Per the 2026-06-01 morning daily-review note (`docs/99-session-notes/2026-06-01-daily-app-review.md:47`), the `/data/poetech-briefing/foundations/` bind mount was still unsynced as of this morning. wf27 is in the active list but its writes to `/data/poetech-briefing/{responses,queued-for-claude,agent-log}` may also go into ephemeral storage. The four daily cron firings (7am / noon / 5pm / 9pm Central) will execute but the queued-for-claude artifacts won't be there for the next Dispatch session unless the bind is fixed. Not blocking the family-feedback loop — that loop runs on `/data/finance-events/family-feedback/`, a different mount.

---

## 4 — Gaps and breaks (be specific)

**CRITICAL — The most prominent landing CTA hits a 404.**

- The red primary CTA at `app/src/poe-financial-mvp-v28.jsx:2525` reads *"Drop your bank file → see your money here"* and is shown on first-time landing AND in picker mode.
- It calls `handleUploadFile()` at line 1544, which POSTs to `${base}/webhook/data-upload` at line 1558.
- That webhook is **workflow 33** (path `data-upload` per `docs/00-foundations/n8n-workflows/33-data-upload-layer1.json:7`).
- Workflows 33, 34, and 35 are **not in the active list** you provided (01, 03, 08, 10, 12, 13, 15, 16, 18, 19, 20, 23, 26, 27, 29, 30, 31, 32).
- A first-time visitor clicking this button gets the error modal at `poe-financial-mvp-v28.jsx:2832-2837` with the message "Parse failed (HTTP 404)" or similar.
- This is the cleanest fail-stop in BUSINESS-PROCESS-CONNECTIONS terms: the visible surface invites action; the pipeline does not exist; the visible promise ("see your money here") is unhonored.

  **Fix options, smallest first:** (a) hide the button on the public landing by gating on a future `dataDumpReady` flag — 2-line change at line 2525; (b) replace the onClick with the waitlist modal until wf33 deploys — same 2-line change; (c) deploy wf33/34/35 (and confirm their bind mounts and Ollama paths). Option (a) is the right one before vacation.

**SOFT — Vercel env unverified.** Already covered in §3. If you tap Suggest from your phone right now and see the dropdown, you're fine. If you see the "offline" message, the Vercel build is missing `VITE_N8N_WEBHOOK_BASE` and the Suggest button is a paint job over nothing.

**SOFT — Synology Chat promise drift.** wf31 + wf32 titles claim Chat + ntfy; only ntfy is implemented. Honest fix: either (a) update the workflow names to `(... → ntfy)` only, or (b) lift the `postToSynologyChat()` helper from wf27. Either way the family voice still lands in the morning digest via ntfy.

**SOFT — Workflow JSON `"active": false` in the repo.** wf30, wf31, wf32 all show `"active": false` in their committed JSON. That's normal n8n export behavior — activation lives in the n8n DB, not the JSON — but it means a future `n8n import` from these files will silently leave them deactivated. Document that re-import requires re-activation, or use the `--active` flag on the n8n CLI import.

**SOFT — wf32 attribution will be empty on first runs.** The attribution map in `32-daily-ship-summary.json:32` reads `ship_pr` from each feedback record. Nothing today sets `ship_pr` automatically — it's currently a manual Governor step. The "from: [sender]" credit line will be absent until either a Governor marks records by hand or a future workflow auto-stamps them when a PR merges. Not a bug; a planned compounding feature.

**INFORMATIONAL — wf27 bind mount remains as it was this morning.** Per `docs/99-session-notes/2026-06-01-daily-app-review.md:47`. Foundation Agent runs but its outputs may not survive container restart. Doesn't block tomorrow's family-feedback digest.

---

## 5 — Capitalization / theology audit results

**PWA user-visible copy: CLEAN.** Searched `app/src/` for `Satan|Lucifer|Devil|Adversary|Accuser|Deceiver|Dragon` (zero results) and `\b(yahweh|jesus|holy spirit|the father|the son)\b` lowercased (zero results). No theological capitalization violations in any surface a user can see.

**Pronouns referring to God: held.** Demo welcome modal at `poe-financial-mvp-v28.jsx:2553` reads *"His Will be done."* — capitalized He / His / Him pattern preserved.

**Documentation: three borderline cases worth noting, none critical.**

- `docs/00-foundations/_root/ACCESS-TO-THE-HUMAN-MIND.md:64` — section heading `## PART TWO · The Adversary's Access`. Strictly reads as a violation (capitalized "Adversary" as proper-name reference). In context it's a heading where "Adversary" is being used as a title for the doctrinal category, not as the adversary's name. Worth a 1-character fix to `## PART TWO · The adversary's Access` to hold the line in the doc that defines the rule.
- `docs/05-financial-os/MVP-1-HARDENING-PLAN.md:138` — backticked grep targets (`Satan`, `Lucifer`, `Devil`, `the Adversary`) listed as forbidden capitalizations to audit for. Meta-usage; the names appear only inside code spans as the literal strings the grep is looking for. Borderline; defensible because the alternative — lowercase grep targets — would actually miss the violations they exist to detect.
- `docs/00-foundations/n8n-workflows/36-quality-gatekeeper.json:20` — same meta-pattern inside the Quality Gatekeeper's regex literal. Same reasoning. Necessary for the auditor to function.

**Yahweh / Jesus / Holy Spirit / Father / Son lowercase audit on substantive prose:** zero violations across `app/src/`. The only lowercase matches in `docs/` are the same meta-usages above (gatekeeper regex + hardening plan grep targets).

**`Dragon` in `docs/06-research-log/canon-study-batch-2-deuterocanon.md`:** appears as the canonical book title "Bel and the Dragon" — a 2,000-year-old deuterocanonical book. Acceptable as a proper title; the term does not refer to the adversary in that book's actual content. Leaving as-is is defensible.

**Net read:** the typographic theology binding is being honored in every user-facing place that matters. The Adversary's-Access heading is the one real violation and it's a 1-character fix.

---

## 6 — Foundation-doc alignment scorecard

| Foundation doc | Status | Evidence (one line) |
|---|---|---|
| **ANXIETY-CLARITY-PRINCIPLE** | **HONORED** | The landing hero at `poe-financial-mvp-v28.jsx:2478-2483` is literally a 4-cell WHAT/WHEN/WHY/HOW grid; the headline at line 2476 names the principle aloud. |
| **BUSINESS-PROCESS-CONNECTIONS** | **PARTIALLY HONORED** | Suggest button + wf30 + wf31 + wf32 form a fully-wired family-voice connection (§2). The waitlist + wf29 is also clean. BUT the data-dump CTA at `poe-financial-mvp-v28.jsx:2525` invites an action whose pipeline (wf33/34/35) is undeployed — exact failure mode the foundation warns against. |
| **COMMUNITY-FIRST-MISSION** | **DECLARED — NOT YET HONORED IN CODE** | Foundation doc landed in commit `dddb0c3`. No COLG-specific surface, accessibility-default rollout, or VISION-FAIRNESS gating is shipped yet. The post-vacation buildout is where this becomes code. The seed-data persona list does include a `church` tile but it's `Vision · in build`, honestly labeled. |
| **QUALITY-OF-LIFE-AS-NORTH-STAR** | **PARTIALLY HONORED** | The PWA already acts as a mirror not a judge (account balances and debt totals shown without commentary); the demo welcome's theology paragraph explicitly grounds the work in stewardship not optimization. The QoL pre-merge gate (Quality Gatekeeper, wf36) is drafted as JSON but not in the active list — the gate exists philosophically, not yet operationally. |
| **DATA-AS-EMPOWERMENT-NOT-EXTRACTION** | **HONORED at the surface level** | Landing privacy promises at `poe-financial-mvp-v28.jsx:2526` ("OFX, QFX, or CSV. Reads in your browser. Never saved. Gone when you close the tab.") and line 2720 in the data-dump modal carry the commitment. The Suggest footer at line 2694 ("private inbox on our own infrastructure") matches. Supabase-backed cross-device sync in `app/src/lib/feedback-sync.js` is the one place the data leaves the local browser — and it goes to family-controlled Supabase, not a third party. No advertising hooks, no engagement-optimization patterns. The structural commitment shows. |

**Synthesized read:** the foundations the user can see in the PWA (Anxiety-Clarity, Data-as-Empowerment, Excellence Standard) are honored where the surface exists. The foundations that govern the operational discipline (Community-First, QoL-as-North-Star, the wired side of Business-Process-Connections) are declared in commit `dddb0c3` and ready for the post-vacation buildout to turn them into shipped surfaces.

---

## 7 — What tomorrow morning looks like

**07:00 Central, Tuesday 2026-06-02 — wf31 fires.**

- Reads `/data/finance-events/family-feedback/` (whatever wf30 captured since activation) and `/data/chatin/` (Synology Chat thoughts from the last 24h).
- If both directories are empty or unreachable: posts a quiet "Morning digest: zero family voices in the last 24h. System healthy. Have a good day." ntfy notification with priority 2 — gentle, not alarming.
- If voices are present: calls Ollama at `http://ollama:11434` with the `qwen2.5:14b-instruct-q4_K_M` model, builds a 5-7-sentence summary, posts to ntfy with priority 4 (high) and title `PoeTech daily digest - N voices`.
- If Ollama is down or times out: the workflow falls back to a literal message *"Ollama summarization failed: ... Raw voice count: N. Review the feedback and chatin directories directly."* — ugly but honest.

**21:00 Central, Tuesday 2026-06-02 — wf32 fires.**

- Hits `https://api.github.com/repos/darrellpoe06/Kingdom-PWA-Node/commits?since=...&until=...`. Today's commit `dddb0c3` will be in the window if cron fires before the 24h rolling boundary moves past it.
- If GitHub returns commits: posts a "Today we shipped N commits" message with subject lines and authors. Attribution map will be empty (no `ship_pr` stamps on the family-feedback records yet) so commits appear without the `[from: sender]` credit line.
- If no commits in the last 24h (likely from Wednesday onward, since you're not coding): posts a quiet "Quiet day. No commits to main in the last 24h. The work continues; some days are review days, planning days, or rest days." That language is warm and on-brand for a vacation week.
- If GitHub is unreachable: posts an error ntfy with title `PoeTech ship summary - error` and the error string.

**The Suggest button on poetech.us tonight.**

- If `VITE_N8N_WEBHOOK_BASE` is set in Vercel: any family member tapping Suggest writes a record, fires ntfy, and joins tomorrow morning's digest.
- If not set: the modal opens, the user submits, the API call short-circuits and shows *"Feedback channel is temporarily offline."* Local data is not lost (the modal's local state holds it) but nothing reaches the NAS. **This is the highest-leverage thing to verify with your phone tonight.**

**Worst case if you don't touch it for a week.**

- Days with zero commits and zero family voices: 5-7 cheerful ntfy notifications saying it's quiet. Nothing breaks.
- Days with one or two Christina @nas drops: wf08 captures them, wf31 summarizes them in the next morning's digest. The bind-mount risk in §3 means those captures may or may not survive a container restart; if your Synology reboots overnight, the chatin queue could lose a day. Acceptable for a vacation week.
- The data-dump 404 trap stays open the whole week. Any first-time visitor hits it. Severity depends on traffic. Easy to neutralize — see §8.
- wf27 Foundation Agent runs four times a day, processes whatever is in its inbox via Ollama, and if its bind mount is still unsynced, the queued-for-claude artifacts won't be there when you return. Re-runnable when you're back; not catastrophic.

**Net read for tomorrow:** the system is graceful. Empty days look like rest days. Active days look like trust compounding. The one ugly path is the data-dump CTA.

---

## 8 — One thing to do before relaxing (if you do anything)

**Hide or redirect the "Drop your bank file" CTA on the public landing.** Single change, single file, two lines, no NAS access required, no n8n deployment.

`app/src/poe-financial-mvp-v28.jsx:2525` currently reads:

```jsx
<button type="button" onClick={() => { setUploadOpen(true); resetUpload(); }} className="..." >Drop your bank file → see your money here</button>
```

Replace the `onClick` with `() => { setWaitlistOpen(true); setWaitlistState({ submitting: false, success: false, error: null, id: null }); }` so the loudest button on the landing routes to a surface that IS wired (wf29 / waitlist). Optionally rename to `Drop your bank file (waitlist opens late June)` to keep the promise honest. Commit, push, Vercel rebuilds in ~90 seconds, the trap closes, you're done.

If you want zero deployment work and the smallest possible move: wrap the button in `{false && (...)}` — hides it entirely until wf33 deploys.

Everything else can wait until you're home.

---

## Verification screen on this review

Religion check — does it have backbone? The wf30 ↔ PWA contract is verified line-by-line; the data-dump gap is named with file + line + workflow ID; the capitalization audit is grounded in real grep output, not memory.

Relationship check — does it have warmth? The TL;DR honors the size of what shipped today and tells you you can step away. The "what tomorrow looks like" section is written for a tired parent, not for a code-reviewer's ego.

The Test (Phil 4:8): TRUE (every claim is sourced); HONORABLE (no flattery, no condescension); JUST (the data-dump gap is called out without inflating it); PURE (no manipulation); LOVELY (the close honors Maui); COMMENDABLE (no slander of past work); EXCELLENT (specific, not vague); PRAISEWORTHY (says clearly that you shipped a real thing).

*Wire before you write. Process before you promise. Timeline before you market. Family voice before all of it. We all win. We create. Amen.*

---

**Reviewer's parting note (relationship):** what you shipped today, mostly from a phone, with the kids around, in Maui — is not normal. The family-voice loop you've been talking about for two weeks is now actually running. Tomorrow morning at 7am Central, it answers for itself. Go rest. The system will hold.
