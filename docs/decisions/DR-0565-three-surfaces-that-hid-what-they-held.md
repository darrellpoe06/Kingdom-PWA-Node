# DR-0565 — Three surfaces that hid what they held: the session, the date, and the buried tab

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-22
- **Scope:** `app/src/components/VoiceStudio.jsx` (the local session decides who is signed in); `app/src/lib/entry-stamp.js` (new) + `app/src/components/CreationWorkspace.jsx` (every entry carries its own date); `app/src/components/shared.jsx` (`TabScroll` offers **All** when a strip genuinely overflows); three new test files, 50 checks
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — measured, never guessed), SURFACE-SAYS-TRUTH (DR-0239 §3), DR-0131 (the one tab-strip primitive), DR-0111
- **Grounds:** Darrell 2026-09-22 — "I'm signed in and it doesn't work!!!!!!!"; "Make sure each entry automatically adds a date and time stamp... like Christina is already doing"; "All buried tabs need to be able to be seen from the beginning of the top tab group"

---

## 1. The check I had just shipped called a signed-in man a stranger

His screenshot showed the new **Does it work?** panel reading `FAIL — You are signed in on this device`, with his own name, his persona pill and a **LOG OUT** button in the header directly above it.

`VoiceStudio` asked `supabase.auth.getUser()` — a **network** call to the auth server — swallowed any failure, and left `userId` null. So a slow or unreachable auth server rendered as *"you are not signed in"*, which is a different and far more alarming claim than the truth. The shell never had this problem because it works from the **stored session**.

Now the local session decides (`getSession()`), and `getUser()` is only a top-up for the profile metadata the display name reads. A network failure can no longer make a signed-in person read as a stranger.

The irony is the point: the panel exists to tell him which link is broken, and its very first row was reporting a fault in itself.

## 2. Every entry carries its own date, in Christina's format

His document's only ordering comes from lines **she types by hand** — `9.22.26`, `8.24.26`, `8.25.26`. Where she typed one, the entries under it are anchored; where nobody did, a block floats. *"Go to DMV for BG"* sits between two dated groups and belongs to neither.

So the app types it now, and the format is **hers exactly**: `M.D.YY`, no leading zeros. Not ISO, not "September 22" — a second shape would split one document into two chronologies and make the ordering worse rather than better, which is why the format is a tested property and not a preference.

**One stamp per day**, and the rule is *"does today appear at all"* rather than *"is the last stamp today"* — his page is newest-first, so a last-stamp rule would re-stamp every time he added a line under an older group. It fires on the **first input** of the day, never on open, because stamping a document the moment it opens would date entries he never wrote. A button places one by hand, with or without the time.

## 3. No tab stays buried

A tab past the right edge is a tab you have to already know about. That is what cost him the Voice tab for a day, and the app's answer at the time was a notice explaining where to swipe — a description of a hunt, not a fix.

`TabScroll` now offers **All**, which unwraps the strip into as many lines as it needs. Three properties make it safe on the shared primitive:

- **It appears only when something is genuinely buried** — measured with `scrollWidth` against `clientWidth` through a `ResizeObserver`, re-measured when the children change (tabs appear and disappear with role and sign-in state, so a one-time measurement would be wrong for exactly the people with the most tabs). A breakpoint would be a guess about width; `scrollWidth` is the answer.
- **The choice persists, per strip.** Someone who opens it is telling you their screen is too narrow for the default; re-collapsing on every navigation would be a small daily insult.
- **Collapsed behaviour is untouched**, so the nav he likes does not move.

It goes on the **one primitive** (DR-0131), so the main nav, Books, Church and the Voice studio's own five tabs inherit it together. Putting it on the nav alone would have left those five buried on the very screen where he was already lost.

## Verification

- **50 new checks** across three files; full suite **1161 files, 19,362 passed, 1 skipped, exit 0**; lint clean; ledger, consistency and monolith guards clean.
- **Dimension 4 measured in a real browser** (`chrome-layout-probe.mjs`, Chromium): `church@360 / 768 / 1440` — no overflow, no overlap; presenter bar capped at 360px and at Big Print. 3/3 chrome cases.
- The date rules are pure, so every case is deterministic without a clock.

## Limits, stated

1. **`namedByLocale` and the stamp regex are conventions, not parsers.** The stamp matcher recognises *her* shape on purpose; a date written another way is not detected and the day gets a second stamp. That is the right failure — visible, not silent.
2. **The `All` control is not yet measured at Big Print in the probe.** It carries `ts-chrome-region` so it should not scale, and the probe's 0 text-scale cases for this strip mean that is reasoned rather than measured. Carried by the layout probe in CI on the next chrome case added to it, not by a date.
3. **The auto-stamp fires once per mount.** Leaving the page open across midnight will not stamp the new day until it is reopened. Real, small, and visible the moment it matters.
