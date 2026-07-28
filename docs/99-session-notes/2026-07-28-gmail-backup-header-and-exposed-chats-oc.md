# Gmail backup-and-empty, the header defect, and the exposed-chats lesson: opportunities and constraints

> Layer 4 working artifact. Companion to **DR-0238** and REV-0209. Triggers, Darrell 2026-07-28, one sitting: (1) *"I need to backup my gmail account and empty it so I keep what I want and get rid of whatever has me over their thresholds etc opportunities and constraints"* + the Gmail screenshot (200.52 GB of 15 GB used; "Emails will stop on Aug 18, 2026"); (2) *"The PoeTech App Title or Header is always messed up cellphone or laptop... opportunities and constraints"* + the desktop screenshot (the wordmark collapsed to a one-letter-wide column, LOG OUT overlapping it); (3) The Neuron security item — private Claude chats indexed by Google/Bing.

## 1 · Gmail: the measured premise overturned the plan (DR-0076 / P15)

**The plan "empty Gmail to clear the threshold" rests on a wrong premise — surfaced before any deletion (feedback-surface-premise-conflicts).** Live probes of the real mailbox, 2026-07-28:

| Probe | Result |
|---|---|
| Threads larger than 25 MB | ~11 (oldest 2010, newest 2024 — family videos, church files) |
| Threads larger than 10 MB | ~54 |
| Threads larger than 5 MB | ~201 |
| Label counts (from the screenshot) | Promotions 35,012 · Updates 28,799 · Social 1,540 · Purchases 1,451 · Inbox 7,154 threads |

Even at generous averages the whole mailbox is **~10–15 GB**. Deleting every email ever received cannot bring 200.52 GB under 15 GB. The Google quota is shared across **Gmail + Drive + Photos**; a Drive sample showed mostly small and *shared* videos (shared files do not count against his quota) — so the bulk is almost certainly **Google Photos**. The per-service split reads in one tap at one.google.com/storage — that number decides the plan, and it is a screen only Darrell can see.

**What shipped (DR-0238):**
- `infra/nas-mail-archive/mail_archive.py` — the sovereign archive: Takeout mbox → JSONL index + attachments-by-year + measured `_stats.json` + `--find` search. Stdlib-only, deterministic (DR-0080), three brakes, idempotent, read-only over the source. **Selftest 6/6 proven-to-catch** (dupe caught, labels measured, attachment extracted, re-run adds nothing).
- The README's five-step runbook, paste-ready for his hand (Takeout → land on NAS → **verify with a measured count** → prune mail → fix the real hog after ITS Takeout verifies). The binding gate: *nothing is deleted anywhere until the NAS archive shows a sane measured count.*

**Opportunities:** the mail identity gets an owned archive that outlives any Google decision (SOVEREIGN-FIRST made concrete on his own data); the same Takeout trip carries Photos to the NAS — the bigger sovereignty win; the account comes back lean (the promotions/updates purge kills ~64k junk mails and most future noise); `--find` keeps a decade of leases/statements/church history answerable after the cloud copy is gone.

**Constraints (held, with whys):** the deadline is real — **Aug 18, 2026**, and an over-quota Gmail going deaf breaks CI notices, Synology alerts, and church mail (uptime-class risk, the DR-0107 posture applied to mail); Takeout ordering, downloading, and all deletion are **values/gestures only Darrell holds** — the agent's side ships 100 % complete as paste-ready blocks (DR-0236 §3); the $1.99/mo 100 GB tier is an approved dated *bridge* if the deadline arrives first, never the destination (COST-DISCIPLINE); the cloud sandbox cannot read one.google.com/storage or Photos — the split is his one-tap verification; the connector in this session can search/label mail but **cannot delete or export** — stated honestly rather than painted (DR-0076 §8).

## 2 · The PoeTech header: the defect named, traced, and fixed

**The reported reality (his screenshot, desktop 1920 px; "always messed up cellphone or laptop"):** the brand column collapsed to ~1 character wide — "PoeTech · LIFE, SOUL & MONEY" rendering one letter per line — with the LOG OUT button overlapping the wordmark, while the toolbar row (tier select · DARRELL · SUBSCRIBE · help · text-size A/A+/A++/A+++/A44 · voice · theme dots · build info) crowds the full width.

**The trace (reality-trace, `poe-financial-mvp-v28.jsx` header block):** at `lg:` widths the title/controls flex row put the brand column at `min-w-0` with **no floor** while the controls row carried `lg:flex-nowrap lg:shrink-0` — an unshrinkable toolbar (auth + tier select + profile chip + Subscribe + Install + Help + text-size A…A44 + voice picker + five theme dots) wider than the row forces the *only shrinkable sibling* — the brand — to ~zero width. The kicker line (`tracking-[0.3em]`, tiny font) then wraps letter-per-line, and the auth button (first control) lands over it: exactly the screenshot. The desktop app's wide-but-crowded window and a font-scaled laptop both cross the same threshold, which is why it read as "always."

**The fix (shipped this PR):** the brand column gets a floor (`lg:min-w-[13rem] lg:shrink-0`) and the controls row loses `lg:flex-nowrap lg:shrink-0` — the toolbar now **wraps to a second line** on crowded widths instead of crushing the name. The 2026-07-06 no-ellipsis rule rides along untouched. **Gate:** `header-layout.test.js` (4 tests, source-pinned the reviewer-mode way since jsdom can't measure layout) — the fix classes must stay, the bug classes must stay gone; a revert fails the build.

**Constraint held honestly:** a source-pin proves the *classes*, not the pixels — the DR-0104 live pass (phone + laptop, after deploy) is the human confirmation this layout class needs, and it is named below as the standing step.

## 3 · Exposed Claude chats: verified, and the lesson encoded

**Verified 2026-07-28 (live search):** ~600 shared Claude conversations were indexed by Google and Bing — not a breach; shared-link pages lacked a `noindex` tag, so "anyone with the link" meant the open web. Contents included API keys and work notes. Both engines have since de-indexed.

**The house lesson (DR-0238 §5):** a shareable link IS publication — the house already holds this posture (private surfaces behind auth/RLS, never "unlisted"; DR-0228 transparency-without-exposure), and it now carries the named external receipt. Operationally: no secrets, keys, family or church data in any shareable chat/artifact link, ever; anything already shared that touches sensitive ground gets unshared and rotated.

## Ways-review (DR-0108, answered)

1. *Capability not used?* The Gmail/Drive connectors were sitting in this session unused for measurement — the probes above are them doing real work (measure before advise).
2. *Unverified "can't"?* "Emptying Gmail fixes the threshold" was the unverified premise — probed and overturned before a single deletion; the connector's delete/export limits verified and stated, not assumed either way.
3. *Repeated friction absorbed?* The header defect had been met repeatedly ("always messed up") without a recorded trace — it now has one, plus a rendered-layout test class to hold it.
4. *Scoped to my limits instead of the team's?* No — the runbook rides Darrell's ConnectBot/PowerShell hands where only they can go; the agent built, proved, and handed over the rest.
5. *More streamlined way?* One Takeout trip carries both Mail and Photos; one PR carries the archive tool, the header fix, and the records.
