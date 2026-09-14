# DR-0394 — The client asked a question no server could answer

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (the read-aloud path every lesson uses)
- **Type:** orchestration

## What was asked

Darrell, 2026-09-14, answering the question this session had carried for three turns — *should the built-in voice reach the church's own studio by default?*

> "Yes."

## The answer he was owed

**The code already did it, and it could never have worked.** Both halves are true, and the second is the finding.

`app/src/lib/use-read-aloud.js:281` already routes the System voice — the default nobody changes — to the sovereign studio whenever one is configured and has not refused. No toggle, no opt-in. **DR-0382 shipped that on 2026-09-13.** So the Yes authorised nothing new; the agent had mislabelled a *measurement gap* as a *pending decision* and put it to the governor four times.

## Why it could never have worked

Three facts, each measured from the repo rather than inferred:

1. **No endpoint is configured in production.** The deploy build (`deploy-cloudflare-pages.yml`) sets neither `VITE_VOICE_SERVICE_URL` nor `VITE_VOICE_BRIDGE`, and there are no `.env` files. So `activeVoiceEndpoint()` returns `null`, `sovereignVoiceReady` is `false`, and line 281 never fires on the live site.
2. **The studio is in no manifest.** `infra/nas-loops/services.json` carries eleven services; `voice-studio` is not among them, and `infra/voice-studio/` holds only a `Dockerfile` and `server.py` — no installer. That is precisely the first cause DR-0330 records for the `/taxes` hop: *"appeared in no manifest, so nothing on the NAS had ever started it."*
3. **AND THE DECISIVE ONE — no server could serve a built-in voice at all.** `infra/voice-studio/server.py` returned `400 reference-required` the moment no sample arrived. `app/functions/api/voice-speak.js` does the same. **Both endpoints were clone-only by construction.**

So DR-0382's runtime probe — the careful `'unknown' | 'yes' | 'no'` machinery that asks the deployment what it can do and remembers the answer — was guaranteed to learn **`'no'` on its first request, forever.** The client was taught to ask. No server was ever taught to answer.

## The claim that was carried for two months

DR-0382 recorded its own limit honestly *in form* and wrongly *in fact*:

> "The sovereign built-in voice probe is unanswered until a real read happens on a real device."

**That was never true.** The repo *is* the deployment. Reading our own `server.py` answered it in under a minute. An unverified claim was carried from 2026-09-13, and the sovereignty ledger's `gap-voice-clone` re-review date (`2026-07-24`) sat **52 days overdue** with nothing surfacing it — the exact DR-0075 failure a date exists to prevent.

The lesson is sharper than "verify more": the honest-sounding hedge (*"we can't know until a real device tries"*) **read as diligence and functioned as a blocker**. It deferred a check that cost one file read.

## The decisions

1. **THE STUDIO SERVES ITS OWN VOICE.** With no reference sample, `/speak` now synthesizes from the model's built-in speaker bank (`VOICE_BUILTIN_SPEAKER` picks one; otherwise the first). A reference is required for a **clone**, never for the service's own voice.
2. **HONEST FAILURE IS PRESERVED, DELIBERATELY.** If the loaded model exposes no speaker bank, `/speak` still returns the same `400 reference-required`, so the probe's `'no'` stays **true** for a deployment that genuinely cannot do it. Papering that over would be worse than the original bug: the probe would be told yes by a studio that cannot deliver.
3. **THE CLONE PATH IS UNTOUCHED.** A person's voice still requires their sample, and a missing one is still a real error the reader is told about.
4. **THE VENDOR BRIDGE STAYS CLONE-ONLY,** correctly: it forwards to Replicate's XTTS, which needs a sample. Sovereign already outranks the bridge (DR-0138), and a System-voice read that finds only the bridge falls soft to the device voice.

## Proof

- **Behavioural, against the real handler.** `infra/voice-studio/test_speak_contract.py` stubs FastAPI so the shipped `speak()` actually runs: a built-in request returns `audio/wav` with `speaker=` set and no `speaker_wav`; a model with an empty speaker bank still returns `400`; a clone still passes its `speaker_wav`; the `VOICE_BUILTIN_SPEAKER` override is honoured; empty text still `400`.
- The JS suite shells out to it (`voice-studio-serves-the-built-in-voice.test.js`) because the repo has no Python runner, and **fails loudly rather than skipping** if `python3` is absent — an unrun check must never read as a passing one.
- **Proven-to-catch:** restore the unconditional `400` and **all 3 tests fail**.
- `npm run verify` green.

## Limits stated plainly

- **This does not make the voice play.** It removes the reason it *couldn't*. Two steps remain, neither of them code: the studio must be armed on the 4070, and the build must point at it. Until then the System voice still reads on the device engine — correctly, and with no false claim anywhere.
- **Whether it SOUNDS better is still unmeasured,** and this record makes no claim about it. What changed is that the question is now *answerable*: before, the answer was structurally "no."
- **The 4070 has no self-deploy loop.** `services.json` targets the NAS; the GPU node is hand-deployed, so `voice-studio` cannot simply be added to the manifest. Closing that is the DR-0330 pattern applied to the GPU node and is not attempted here. `re-review: 2026-10-14`, matching the re-dated `gap-voice-clone`.
