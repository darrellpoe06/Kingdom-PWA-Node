# DR-0455 — The push stack was live with zero subscribers, and an arrival in front of your eyes was silent

- **Status:** accepted
- **Tier:** B (touches the app's boot path and adds an app-wide surface every person sees; no money, no schema, no external publication)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/notify-readiness.js` (new, pure), `app/src/components/AppAlerts.jsx` (new, app-wide layer in its own root), `app/src/main.jsx` (mounts it in the normal boot only), `app/src/lib/dm-notify.js` (raises `poetech:dm-unread`; a stale header claim corrected), `app/src/lib/app-doors.js` (`messageLandingHere`), `app/src/__tests__/the-notification-reaches-the-person.test.jsx` (new, 38 checks, 22/22 breaks caught), `scripts/consistency-guard.mjs` + `app/src/__tests__/consistency-guard.test.js` (the width-cap rule learns what a fixed overlay is), `app/src/lib/legibility-health.json` (regenerated artifact)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — measure, do not claim; proven-to-catch), REALITY-TRACE (DR-0061 / P15 — name the real record before building the surface), SPEAK-ESTABLISHED-FACT (DR-0100), APP-IS-PRIMARY (DR-0065), PERPETUAL-IMPROVEMENT (DR-0075), NOTHING-WAITS (DR-0236), DO-THE-WORK (DR-0111)
- **Grounds:** DR-0334 (Web Push and an honest live signal), DR-0336 (the VAPID keys install themselves; one source for the public half), DR-0343 (notifications everywhere; a phone is found by its person), DR-0444 (a notification lands in the thread's own door), DR-0258 (PoeTech and The Love Corner are two doors on one origin)

## Why this exists

Darrell, 2026-09-17, with a photograph of his own phone's home screen — the Google app carrying a badge, PoeTech and The Love Corner carrying nothing:

> "Why doesn't it show notifications on the apps? We want that to be..."

Then:

> "Christina text me and I didn't realize it was a new one..."

And, decisively:

> "I was even inside the Love Corner App... I believe it should be able to give a better response."

He had asked for this **three times before** — 2026-08-22 ("do the users get notifications?"), 2026-09-06 ("fix that so users are prompted the sermon is live... and also to notifications from users who text us"), 2026-09-09 ("notifications must show on the app and in the notification list"). Each time something real was built. So the honest first question was not *what shall we build* but *what is actually wrong with what we already built.*

## What was measured, before a line was written

Queried against the live production database (DR-0076 — no claim without evidence):

| Query | Result |
| --- | --- |
| `select count(*) from push_subscriptions` | **0** |
| `select count(*) from push_sends` | **0** |
| `select count(*) from push_outbox` | **0** |
| `select count(*) from notifications` | **0** |
| `select count(*), max(created_at) from direct_messages` | **2 rows, latest 2026-07-27** |

**Zero subscribers. Ever.** And therefore zero send attempts, ever.

Everything DR-0334 and DR-0336 shipped is real and live: a `push` listener in `public/sw.js`, a `notificationclick` handler that prefers a window already in the target's door, RFC 8291 payload encryption in `webpush-crypto.js`, a same-origin sender at `functions/api/push-send.js`, the fan-out with its device budget and 404/410 pruning, and a VAPID pair minted and installed by a workflow with the public half served from the same environment that signs. None of it was ever reached, because **not one device was ever subscribed to reach.**

The cause is not the plumbing. It is the door:

```
$ grep -rn "PushNotifications" src --include=*.jsx | grep -v __tests__
src/components/DirectMessages.jsx:240:      <PushNotifications topic="message" />
```

**One render site, part-way down the Messages tab.** To become reachable by a notification you first had to go looking for the control — inside the very surface a notification exists to save you from having to open. And nothing anywhere else in the app ever said notifications were off. The off-state was never false; it was never *said*. That is the silent-failure class this house treats as a defect in its own right, and it is the same shape as the gap DR-0336 closed one layer up.

The second half of his report is a separate defect with the same root. `notifyDecision` in `dm-notify.js` deliberately never rings while the app is on screen — correct, because an OS notification for something you are looking at is noise. But **the app then showed nothing either.** The `"(N)"` title badge has no title bar inside an installed PWA; the launcher badge is behind the app you are in; the unread count only appears once you are already on Messages. So a message could land while Darrell was inside The Love Corner and the app would be, by design, completely silent. He is right that it "should be able to give a better response."

## The decision

**a. Three states are three different truths, and none of them gets a button that cannot work.** `readinessFrom` in `lib/notify-readiness.js` resolves the device from facts only — the browser's own permission string, whether a subscription genuinely exists *right now*, and whether this deployment serves a key at all — never a stored preference, because a saved "notifications: on" flag happily claims ON after the browser rotated the subscription away. `unsupported` / `unconfigured` / `blocked` / `on` / `off`, in that precedence. Only `off` can act. An unconfigured deployment says *the server has no key*, not that your phone is broken; a blocked browser is pointed at its site settings, never at a dead control. **Permission is not a subscription:** `granted` with no subscription row reads `off`, which is precisely the state the zero-row measurement could have been hiding.

**b. The offer lives where the person already is.** `components/AppAlerts.jsx` is an app-wide layer, mounted in its own React root from `main.jsx`, in the normal boot and in none of the standalone ones (a registrant filling in a conference form is not a person to offer a subscription to). Its own root for two structural reasons: the shell is frozen at 5355 lines by `scripts/monolith-budget-guard.mjs`, and the layer must not wait on the lazily-imported monolith when the whole point is to be noticed as something arrives. It reads nothing from the app's closure. It **hosts the existing `<PushNotifications>` control** rather than reimplementing it, so there is exactly one implementation of enabling and exactly one place permission is ever requested — from a press, never on load, because a prompt on load is how an origin gets permanently denied and after that nothing we ship can reach that person again.

**c. The in-app arrival signal is the exact complement of the doorbell.** `inAppSignal` fires when the unread count GREW and the app is VISIBLE — precisely the case `notifyDecision` refuses. Between them there is no overlap (never two alerts for one message) and, the defect Darrell actually hit, **no gap**. The pill names who and how many from the real rows, steps out of the way on its own after nine seconds, and its tap opens that thread **without dragging the person out of the door they are standing in** (`messageLandingHere` — `messageLanding` is for a notification arriving from outside, where nothing is open yet; sending someone from `/lovecorner/app/` to `/poetech-app/` to read a message would throw away the door they chose and reload the whole app to do it).

**d. One subscription in the page serves every listener.** `startDmNotifications` already ran app-wide at boot and already computed the count; it now raises a `poetech:dm-unread` event carrying `{prev, next, visible, newest}`. A second `subscribeDirectMessages` would have meant a second realtime channel and a second heartbeat over the same rows.

**e. "Not now" never becomes "never."** A dismissal is remembered for 14 days and then the offer returns. An absent or unparseable stamp is **not** a dismissal — that is how a person ends up unreachable for a year without ever choosing it.

## Verification (DR-0076)

- **38 new checks, green.** Full suite and `npm run lint --max-warnings 0` green (recorded in the commit).
- **22 breaks applied for real, 22 caught, 0 missed, 0 no-ops.** Every break was asserted to have landed before the gate was run — a no-op edit reads exactly like a passing gate.
- **The one break that was MISSED on the first pass, and what it changed.** Commenting out `startDmNotifications(window)` left the source regex perfectly green: the text still existed, it simply no longer ran. This is the session's recurring finding in its purest form — *a check that proves a line is PRESENT proves nothing about whether it EXECUTES.* Every wiring check now reads comment-stripped source, and the break is caught. The check that scopes the "never prompts by itself" rule to code also asserts the explanation is genuinely there in the raw file, so stripping cannot hide an absence.
- **Breaks that were caught include:** the layer never mounted; the layer mounted before the standalone boots are decided; the watcher stops telling the app; the event drops `visible`; a blocked browser reported as merely off; unconfigured stops outranking blocked; the offer ignoring sign-in; an unreadable stamp silencing the offer; the in-app signal firing on a shrink, ignoring visibility, or never firing at all; the pill naming one of my own messages; the pill dragging the person out of their door; a junk peer id written through into a dead link; the offer rendering with no key to subscribe with; the pill never stepping out of the way; and "not now" forgotten the moment it is pressed.

## A gate was wrong, and was corrected rather than worked around

The new alert layer was refused by `consistency-guard`: `components/AppAlerts.jsx: width-cap 2 > 0`. Two honest routes existed and one dishonest one. The dishonest one — re-freezing the baseline to grandfather a brand-new file — is exactly what the guard's own header forbids ("any NEW file (baseline 0) that introduces ANY — HARD FAILS"), and evading the regex with an inline style would have been the same move in nicer clothes.

**The count was wrong, not the code, and the rule's own words say so.** DR-0246's target is named in the violation's fix text: *"tab content stretches the full width... prose measure and modals live INSIDE the full-width container, **never as the tab wrapper**."* A `fixed` element is lifted out of the tab's flow and painted over the app — it is the modal/toast class the rule already allows, and it **must** carry a cap, because a banner stretched edge-to-edge on a 27" monitor is the defect rather than the standard. The tell: `PwaPrompts`' `UpdatePrompt` (`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm`) and `InstallPrompt` (`fixed ... max-w-xs`) are both grandfathered in the baseline for precisely this shape.

So the guard now counts a `max-w-` only when its own class span does not also carry `fixed`, and comment lines are stripped first for the same reason `fixedPx` already strips them. The exemption is deliberately narrow — **per class span** — so a tab wrapper one line away from a toast is still counted, and a cap written outside any quoted span still counts so the string form cannot be dodged. **Measured effect on the existing tree: 11 caps across 9 files are no longer counted, every one of them below its frozen baseline (green either way); no file's count rose.** Six new checks hold it, including one against the real `AppAlerts.jsx` that asserts its caps are genuinely present before asserting the count is zero — so a zero means the exemption worked, not that the read came back empty.

The alert layer was also rewritten to carry its cap on the fixed element itself, matching the two existing banners, so the gate can see what it is looking at.

## What is still NOT proven

**No real phone has yet received a real notification from this app.** DR-0334 recorded that and it does not close here. What closes here is the reason it was impossible: there was no subscriber and no reachable way to become one. The first genuine end-to-end proof needs one tap on the offer, on Darrell's phone, and then one message. Until that happens the interop claim stays open exactly as DR-0334 left it. **`re-review: 2026-09-24`** — by then either a `push_subscriptions` row exists and a `push_sends` row records a real delivery, or the offer is not being seen and that is the next finding.

**A stale header was corrected, not discovered by a gate.** `dm-notify.js` still described Web Push as "staged work" nine days after DR-0334 shipped it. It is corrected in this change and the correct measurement written in beside it, but nothing machine-checks a comment against the code it describes. Named here rather than quietly fixed.

## Files

- `app/src/lib/notify-readiness.js` — new
- `app/src/components/AppAlerts.jsx` — new
- `app/src/main.jsx` — mounts the layer in the normal boot
- `app/src/lib/dm-notify.js` — raises `poetech:dm-unread`; header claim corrected
- `app/src/lib/app-doors.js` — `messageLandingHere`
- `app/src/__tests__/the-notification-reaches-the-person.test.jsx` — new, 38 checks
- `scripts/consistency-guard.mjs` — `countWidthCaps`: the fixed-overlay exemption
- `app/src/__tests__/consistency-guard.test.js` — 6 checks on that exemption
- `app/src/lib/legibility-health.json` — regenerated (249 -> 250 pages, 236 -> 237 passing, 0 regressions, 0 new debt)
- `docs/decisions/INDEX.md` — row + pointer
