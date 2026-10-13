# DR-0538 — Agreeing must silence the offer: the notification nag measured the wrong thing

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** bug
- **Relates to:** DR-0076 (proven-to-catch), DR-0455 (the push stack was live with zero subscribers), DR-0381 (a hollow surface renders its empty state over real content)

## What Darrell reported

> *"I get a lot of requests for getting notifications however why does it keep asking after agreeing to?"*

With a screenshot: the offer card sitting over a lesson he was reading, on a phone, signed in as himself.

## The cause

`readinessFrom()` reported the settled state **`on`** only for `subscribed && permission === 'granted'`. Every other combination fell through to a single `off` branch carrying the headline *"Turn on notifications so you know when someone messages you."*

So this sequence produced an endless ask:

1. He taps the button. **The browser GRANTS.**
2. The subscribe step does not complete — a failed registration, a dropped row, a service-worker hiccup.
3. `subscribed` is still `false`, so readiness falls through to `off`.
4. The identical card returns on the next load, **asking him to do the thing he had just done.**

**Agreement was never what the offer measured.** Nothing recorded that he had acted, so nothing could quiet it. And the copy was a lie to a person who had already said yes.

## The fix

**1. `permitted` is its own state.** Granted-but-unregistered is not *"turn on notifications"* — it is *"you said yes, this device just is not registered yet,"* with the honest detail that the browser already allows it and the step that registers the device did not finish. The failure is **ours**, so the card says so rather than sending him around the same loop. A retry is still offered (`canAct: true`).

**2. An attempt quiets the offer the way a dismissal does.** `shouldOfferNotifications` now honours `attemptedAt` alongside `dismissedAt`, and the component stamps `ATTEMPT_KEY` **when the person acts, before the outcome is known** — because the failure being fixed is exactly the one where the attempt does not complete. Stamping only on success would leave the nag in place.

Two windows, neither forever: a dismissal stays quiet **14 days** (`NOTIFY_SNOOZE_DAYS`), an attempt **1 day** (`NOTIFY_ATTEMPT_QUIET_DAYS`) — shorter, because the person wants this and we owe them another try, but never zero, because zero is the nag.

## Proven to catch

With the `permitted` branch reverted and the new test kept, two assertions fail — *"expected 'off' not to be 'off'"* and the headline check — and both pass on the fix. The suite also carries its own **control**: with no attempt recorded the offer *does* still appear, so the silencing test cannot pass for the wrong reason.

Unparseable and absent stamps are pinned as **never** silencing the offer, so a storage-blocked browser still gets asked.

10 tests in `notify-offer-stops-asking.test.js`.
