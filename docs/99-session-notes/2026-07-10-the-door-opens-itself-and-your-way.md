# The door opens itself, and opens your way — three live reports, and self-healing part 2

> Layer 4 working artifact. Companion to **DR-0143** and REV-0031. Triggers, Darrell 2026-07-10 (live, from his devices): *"The one tap refresh doesn't work... I can't even download the PoeTech App unless I have a password... I only use my PIN — can I do that only and/or my fingerprint?"* — *"Why do we only have 135 videos or whatever and not 335 for every area needing data from YouTube?"* — and, for the second time in one day: *"Why doesn't the PoeTech App seem like it's self-healing yet?"*

## The three reports, each verified before fixing

1. **The one-tap loop (real defect).** The manual heal screen appears only AFTER the ladder auto-ran a plain reload and a cache-clear reload — yet its primary button repeated the plain reload that had just failed. And no rung ever cache-busted the URL, so an HTTP/edge-cached `index.html` (the one holder the SW/cache clear cannot touch) kept winning. **Fixed:** the primary tap is now the strongest heal — full clear + a cache-busted fresh URL (`bustReload`); the auto clear-rung busts the same way; a test fails the build if the primary tap ever degrades to a bare reload again.
2. **The password that was never required (presentation defect).** Installing the app has no auth gate. Password-free sign-in (Google, the emailed Royalty Link) and the complete PIN + fingerprint + device-trust machinery were already live and audited — but the visible form led with email + password, against the binding COMMUNITY-FIRST commitment 2 (*"No required password-typing"*). **Fixed:** the default door is name + email + **"Email me my sign-in link"** — no password field exists on it; the password form is behind an explicit choice; the door states the promise: *after the first sign-in, this device unlocks with just your PIN or fingerprint.* PIN-only, answered honestly: identity is proven once (link or Google — never a password), then PIN or fingerprint is all that device asks — the designed 2-of-3 model, now visible.
3. **The ~138 videos (the instrumented gap, heal dispatched).** The corpus still holds the 125-dated seed + RSS additions; the reconcile workflow was dispatched (drive-don't-delegate). Its first live run proved the important half — **the full channel listing works from the runner** — then failed on plumbing: the `SUPABASE_DB_URL` secret carries trailing whitespace (psql saw a database named `postgres\n`). Fixed with the migrate lane's own strip pattern; the re-dispatch after this merge loads all ~335 (dated + undated) into the live corpus that the Choir history, Harvest ledger, and Call-to-Give archive all read.

## Self-healing, part 2 — why the question recurred and its structural answer

The DR-0135 review built probes, readouts, and actuators — but every actuator still **waits for a human dispatch** by the three-brakes law. That is honest and safe, and it is also exactly why the app doesn't *feel* self-healing yet: the family still discovers gaps by screenshot, then someone fires the heal. The closing moves, both routed:

- **Arm the watched schedules (the governor's Tier C call, `re-review: 2026-07-17`):** corpus-reconcile weekly and transcript-backfill hourly — both already carry budget + lock + kill-switch; arming them, watched, is what turns "the heal exists" into "the heal runs without me photographing the problem."
- **The announce path (already routed, 2026-07-31):** failures push to the family instead of waiting to be found. The screenshot retires as the alerting mechanism.

## Also in this batch

The deploy verify now boots **the Church tab** (`?view=church`) in a real browser on every deploy (merged as #721) — the white-screen class from tonight's first screenshot is machine-watched. Ari's record carries all of it by construction: DR-0143 lands in his derived notes this build.
