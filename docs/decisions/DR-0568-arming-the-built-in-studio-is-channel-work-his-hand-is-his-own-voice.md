# DR-0568 — Arming the studio for the built-in voice is channel work; his hand is for his own voice and face

- **Status:** accepted
- **Tier:** n/a (a clarification of which decision governs which step)
- **Type:** orchestration
- **Date:** 2026-09-22
- **Amends:** DR-0440 (line 4: *"the arming steps are Tier C by DR-0430 and stay in Darrell's hand"*) — narrowed, not reversed
- **Scope:** `.github/workflows/arm-voice-studio.yml`; `infra/voice-studio/install.sh`; this ledger
- **Principles:** DRIVE-DONT-DELEGATE, STARTED-BY-DEFAULT (DR-0247), BRAKES-ARE-BUILD-REQUIREMENTS (DR-0225), REVIEW-OUR-WAYS (DR-0108 — a "must-be-by-hand" is a premise to challenge), DR-0430 (consent and labelling are the bright lines)
- **Grounds:** Darrell 2026-09-20: *"You do it!!! Why would I be doing that when you can and should?!! No human being unless necessary!!"*; DR-0430 §5 ("his hand is the starter" for his enrolment and likeness)

## What was decided

DR-0430's bright line is **consent**: a real person's cloned voice and likeness render only on that person's own enrolment. That stands untouched.

Arming the studio to serve its **built-in speaker** is not that line. It is infrastructure — a container on the 4070 and a mount on the NAS — and DR-0108 says a step is the human's only when no channel can drive it. `arm-voice-studio.yml` drives it from CI (join the tailnet, build, bring up, prove by synthesis, mount the road), and `install.sh` mounts the road on the NAS's own clock. DR-0440's "stays in Darrell's hand" is therefore read as: **his enrolment and his consent stay his; the arming does not.**

## The one hand-step that remains, named exactly

CI's SSH key is authorized on the NAS and not on the 4070 (`Permission denied (publickey)`, run 35750012424). Authorizing it is a key placed on a machine CI cannot enter — a genuine DR-0108 exception (a secret onto a physical device). Once placed, nothing else in the chain needs a person.

## Verification

- `voice-road-home.test.js` pins the workflow's ceiling, the two-attempt synthesis proof, the read-only default, and the mount step (19 checks).
- This record does not change code; it changes which record a reader cites when asked whether arming may run unattended.
