# DR-0336 — The VAPID keys install themselves, and the public half has exactly one source

- **date:** 2026-09-08
- **status:** accepted
- **tier:** A (a dispatch-only workflow, a read-only public endpoint, and a client resolver; no schema, no money, no front-door identity)
- **decides:** how the push credentials reach production, and where the public half of the pair is read from
- **pairs-with:** DR-0334 (the push stack this activates), DR-0249 (the remote-hands channel — "credentials only he holds" is smaller than "his hands must type it"), DR-0108 (a stated must-be-by-hand is a premise to challenge), DR-0121 (one source), DR-0076 (verify; proven-to-catch), DR-0125 (prove the site, not only the pipeline)

## The trigger (the Governor's word)

Darrell, 2026-09-08, one word: **"Connectbot?"**

DR-0334 shipped the whole push stack and then recorded an honest gap: *"the VAPID keys in the Cloudflare environment... the feature is not live until those land and a phone buzzes."* That was written as **Darrell's** to do. His one-word question is the correction: he was looking for the road, and the road he had in hand was the phone SSH client he uses to reach the NAS.

**The literal answer is no** — ConnectBot reaches the NAS over the tailnet; the VAPID keys live on the Cloudflare Pages project, which the NAS has nothing to do with. **The useful answer is that the premise under the question was wrong**, and DR-0108 is explicit that a stated "must-be-by-hand" is an unverified premise to challenge rather than a place to stop.

## Decision 1 — The keys mint and install themselves

**`.github/workflows/push-vapid-keys.yml`** mints the pair and installs it, dispatch-only, with nobody's hands on the private key anywhere.

The verified fact that made this possible: **the repository already holds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`** — `deploy-cloudflare-pages.yml` uses both on every merge to `main`. That is the same shape DR-0249 established for the NAS bootstrap: the credential is his, the typing never had to be.

- The generator is **our own `generateVapidKeys`** (`webpush-crypto.js`, Web Crypto P-256) — no npm dependency, and the same function the suite already proves signs a VAPID JWT that verifies against its own public key.
- The private half is generated on the runner, written `0600`, uploaded by `wrangler pages secret bulk`, and shredded. It is **never printed** — not to the log, not to the step summary, not into this chat. `::add-mask::` covers the accident case.
- The public half **is** printed. It is public by design: it is handed to a push service on every subscription and to every browser that subscribes. It identifies the sender and authorizes nothing.

**The brake that matters here is not the timer class.** Nothing fires on a clock. The dangerous act is a **rotation**: a push service binds each subscription to the public key it was created with, so replacing a live pair permanently rejects **every existing subscription**, and no device is told — people simply stop being notified. So an already-configured project is a clean **no-op that changes nothing**, and an overwrite requires typing `ROTATE-AND-INVALIDATE-EVERY-DEVICE` into the dispatch form. It cannot happen by pressing "Run workflow".

**Verified, not claimed (DR-0076).** The job does not report success from an exit code. It reads the secret names back from Cloudflare and fails unless all three are present, then asks the **live site** — `GET https://poetech.us/api/push-key` — whether a key is actually being served, and says plainly which of the two states it found. Pages binds environment variables at deploy time, so a project-level secret reaches the running Functions on the next deployment; the summary says so rather than assuming either way.

## Decision 2 — The public half is served from the environment that signs

**`app/functions/api/push-key.js`** serves `{ configured, publicKey }`. **`app/src/lib/push-key.js`** is the client resolver. The build-time `VITE_VAPID_PUBLIC_KEY` survives **only** as a fallback for an unreachable endpoint.

This closes a silent-failure class that is invisible from inside the app. The two halves of the pair must come from the same pair. The original wiring set them in **two places at two different times** — the public half inlined into the bundle by CI, the private half in the Pages runtime environment — with nothing checking that they matched. Set one and forget the other, or rotate one alone, and:

- the control reads its live browser state and says **ON** — truthfully;
- the sender posts and reports success — truthfully;
- the push service answers **403** to every single request;
- **no phone ever buzzes, and nothing anywhere can say why.**

That is the exact shape of the gap Darrell reported on 2026-09-06 ("my phone didn't notify me"), reintroduced one layer up. One source removes it structurally: the key the browser subscribes with is read out of the same environment the signature is made from.

The subtle rule, and the one held by a proven-to-catch test: **an explicit `configured:false` from the server does NOT fall back to the build-time key.** The server is authoritative about its own environment; falling back there would reinstate precisely the drifted key this endpoint exists to prevent. An *unreachable* endpoint is a different fact and does fall back — the server said nothing, so the last known-good key beats no notifications.

The endpoint also **checks the key's shape before serving it** (87-char base64url, uncompressed P-256 point, leading `0x04`). A malformed key would otherwise throw inside `subscribe()` on someone's phone, where the only visible symptom is a button that will not turn on.

## Verification

- **`push-key.test.jsx` — 17 tests, green.** The shape check is exercised against a **really generated** key, not a fixture, and against the four things a mis-set variable actually looks like in the field — empty, a placeholder, a pasted PEM, and the *private* half pasted into the public slot (43 characters, not 87).
- **Proven-to-catch, the drift case:** a server answering `configured:false` while a stale build-time key is present resolves to `''`, not to the stale key.
- **The endpoint never returns the private half** even with it sitting in the same `env` object — asserted directly against the serialised body.
- **An unconfigured answer is never cached** (`no-store`), so the moment the key IS installed, clients see it; a configured answer caches for five minutes.
- `scripts/mint-vapid.mjs` run locally: 87-character public key, 43-character private scalar, correct file shape for `wrangler pages secret bulk`. **`wrangler pages secret put|bulk|list` was confirmed from the real CLI's own help output**, not from memory.
- Full push suite green (83 tests across push-key, the control, announce, subscribe, and messages).

## The honest remaining gap

**Push interop is still UNVERIFIED until a real phone receives a real notification.** DR-0334 recorded this and it does not close here: the RFC 8291 test vector host is blocked by the sandbox's egress proxy, so the crypto is proven self-consistent, not conformant. Installing the keys makes the first real attempt *possible*; it does not make it *proven*. `re-review: 2026-09-13`.

The one genuinely human step left is a **dispatch** — pressing "Run workflow" on *Push notifications — install the VAPID keys*. That is a decision, not typing, which is the right side of the DR-0249 line.

## Consequences

- The last blocker on DR-0334 stops being a paste job and becomes a button.
- A rotation is possible, gated, and honest about what it costs the congregation.
- `VITE_VAPID_PUBLIC_KEY` is no longer required for push to work. It is a fallback, and setting it is optional.
- A site with no keys renders no push control and reports `configured:false` — a state, not an error.
