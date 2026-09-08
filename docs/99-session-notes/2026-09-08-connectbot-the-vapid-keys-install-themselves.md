# "Connectbot?" — the VAPID keys install themselves, and the pair stops being able to drift

**Date:** 2026-09-08
**Branch:** `claude/lesson-you-have-destiny-fabf09` (restarted from `main` @ `842aba7` — the previous PR for this branch was merged, so this is a fresh change, not a stack on merged history)
**Decision record:** DR-0336
**Rules in force:** DR-0108 (review our ways — a stated must-be-by-hand is a premise to challenge) · DR-0249 (the remote-hands channel) · DR-0121 (one source) · DR-0076 (verify; proven-to-catch) · DR-0125 (prove the site) · DR-0111 (do the work, do not re-ask)

---

## The question, and the honest answer

Darrell, one word: **"Connectbot?"**

Yesterday's session ended by naming the VAPID keys as the one thing still outstanding and calling it **his**. The question is him reaching for the road — ConnectBot is the SSH client he uses to reach the NAS from his phone.

**Literally, no.** ConnectBot reaches the NAS over the tailnet. The VAPID keys live on the Cloudflare Pages project, which the NAS has nothing to do with. Routing them through the NAS would be a longer path to the same place.

**But the premise underneath was the thing worth attacking**, and DR-0108 says so in as many words. The verified fact that changes the answer: **`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are already repo secrets** — `deploy-cloudflare-pages.yml` uses both on every merge to `main`. DR-0249 already drew this exact line for the NAS bootstrap: *"credentials only he holds" is smaller than "his hands must type it."* Same shape, different provider.

So the answer is neither ConnectBot nor a desktop paste. It is a button.

## What was built

**1. `.github/workflows/push-vapid-keys.yml` — dispatch-only.** Mints the pair with our own `generateVapidKeys` (Web Crypto P-256, no npm dependency), installs all three values with `wrangler pages secret bulk`, and shreds the file. The private half is generated `0600`, uploaded, and deleted **without ever being printed** — not to the log, not to the step summary, not into this chat.

The brake that matters here is not the timer class; nothing fires on a clock. It is the **rotation**: a push service binds every subscription to the public key it was created with, so replacing a live pair permanently rejects every existing subscription, and **no device is ever told** — people just quietly stop being notified. An already-configured project is therefore a no-op that changes nothing, and an overwrite requires typing `ROTATE-AND-INVALIDATE-EVERY-DEVICE` into the form. Pressing "Run workflow" cannot do it.

**2. `app/functions/api/push-key.js` + `app/src/lib/push-key.js` — one source for the public half.** This is the larger fix, and it was not asked for; it was found while looking at the first one.

The original wiring set the two halves of the pair **in two places at two different times**: `VITE_VAPID_PUBLIC_KEY` inlined into the bundle by CI, `VAPID_PRIVATE_KEY` in the Pages runtime environment, with nothing checking they came from the same pair. When they drift:

- the control reads its live browser state and says **ON** — truthfully;
- the sender posts and reports success — truthfully;
- the push service answers **403** to every request;
- **no phone buzzes, and nothing anywhere can say why.**

That is the same shape as the gap Darrell reported on 2026-09-06, reintroduced one layer up — a silent failure invisible from inside the app. Serving the public half from the environment that signs removes it structurally.

## Verification (DR-0076)

- **17 new tests, green.** The shape check runs against a **really generated** key, not a fixture, and against the four things a mis-set variable actually looks like: empty, a placeholder, a pasted PEM, and the *private* half pasted into the public slot (43 characters, not 87).
- **Proven-to-catch, the drift case:** a server answering `configured:false` beside a stale build-time key resolves to `''` — the server is authoritative about its own environment. An *unreachable* endpoint is a different fact and still falls back.
- **The endpoint never returns the private half** with it sitting in the same `env` object — asserted against the serialised body.
- **`wrangler pages secret put | bulk | list` confirmed from the real CLI's own help output**, not from memory. `scripts/mint-vapid.mjs` run locally: 87-char public key, 43-char private scalar, correct file shape.
- Full suite **855 files / 12,377 passed / 1 skipped**; `npm run lint` clean at `--max-warnings 0`; real `npm run build` clean.
- `functions/` is outside the repo's lint scope (`eslint src`) — `push-send.js` reports the same `no-undef` on `fetch` when linted directly. Noted rather than silently accepted; not introduced here.

## What is still NOT proven

**Push interop remains UNVERIFIED until a real phone receives a real notification.** DR-0334 recorded this and it does not close here — the RFC 8291 vector host is egress-blocked from the sandbox, so the crypto is proven self-consistent, not conformant. Installing the keys makes the first real attempt *possible*; it does not make it *proven*. `re-review: 2026-09-13`.

## The one step that is genuinely Darrell's

Not typing — **a dispatch.** Actions → *Push notifications — install the VAPID keys* → Run workflow. Leave the rotate box empty. The job then reads the secret names back from Cloudflare and asks the live site whether it is serving a key, and its summary says which of the two states it found. Cloudflare Pages binds environment variables at deploy time, so if the summary says "not live yet", the next merge to `main` carries it.

## Files

- `.github/workflows/push-vapid-keys.yml` — new, dispatch-only
- `scripts/mint-vapid.mjs` — new
- `app/functions/api/push-key.js` — new
- `app/src/lib/push-key.js` — new
- `app/src/__tests__/push-key.test.jsx` — new, 17 tests
- `app/src/components/PushNotifications.jsx`, `app/src/components/DirectMessages.jsx` — resolve the key at runtime
- `docs/decisions/DR-0336-*.md` + `docs/decisions/INDEX.md`

---

## Post-merge: the install ran, and using it found a defect in it

**Merged** as `6e36f7b`. **Deploy #977** on that exact SHA: **success**, 02:57:32Z (DR-0107 — merge did reach the site).

**Dispatched `push-vapid-keys.yml` (run #1) — success, 28 seconds.** Every step ran the intended path: the project held no `VAPID_PRIVATE_KEY`, so the no-op branch was skipped, the pair was minted, `wrangler pages secret bulk` installed it, and the VERIFY step read all three names back from Cloudflare and passed. Public key installed:

```
BK5TsyKY6IOLmGfB2KjuSZGtazmKDQlGSINUjwXr2Altb4TgStHluSqa8V4RWKTNSqmP-CF50pKOPLyE7vIoHDI
```

87 characters, leading `B` — the uncompressed P-256 point the browser requires. The private half was never printed.

**The live probe came back HTML, not JSON** — the SPA's `index.html`, via the `_redirects` catch-all. Read honestly, that is the expected timing: the probe ran at **02:56:32** and the deploy carrying the Function finished at **02:57:32**, so it asked one minute too early. It is *not* evidence of a routing fault. But it exposed two real defects in the workflow I had just shipped, and both are fixed here:

1. **The witness was gated on the mint having run**, so it would **never fire on the "already configured" path** — that is, on every run after the first, which is precisely when someone dispatches this job to ask *"is push actually working?"* An instrument that goes quiet in the state you most want it is the DR-0125 failure wearing a different face. It now runs unconditionally.
2. **It collapsed two different facts into "not live yet."** JSON saying `configured:false` means the Function is running and its environment has no key — a real deploy is owed. Anything that is *not JSON* means the Function is not being served on that path at all — a **fault**, not a wait. Conflated, a genuine routing break could hide behind a deploy-timing excuse forever. The three states are now reported apart, with the HTTP status and the first 400 bytes of whatever actually came back.

**The sandbox cannot measure this itself** — `curl https://poetech.us/...` returns `CONNECT tunnel failed, response 403` from the egress proxy, confirming DR-0125's finding that the GitHub runner is the team's only eye on the live site. That is why the witness lives in the workflow and not in a local check.

A deploy was dispatched after the install so the binding certainly post-dates the secret, and the corrected witness reads the result.
