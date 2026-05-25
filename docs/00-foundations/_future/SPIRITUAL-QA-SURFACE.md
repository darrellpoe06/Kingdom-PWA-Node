# SPIRITUAL-QA-SURFACE — SUPERSEDED

> **Status:** SUPERSEDED 2026-05-25. This stub was created earlier in the same Dispatch session before the agent located the existing canonical records. The records exist in full and the stub's content is redundant. **Do not extend this file.** Read the canonical records instead.

## The canonical records (already in the repo, in `_root/`)

- **`docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`** — the worldview spine. Integration is the relationship; the first death is the doorway; asking-and-receiving is fruit, not goal; the watching-recognizing-recording posture; the gap and the bridge; Job as the named exemplar; the reprogramming-by-story work. The source of answers for every doctrinal or worldview-grounded reply the system emits.

- **`docs/00-foundations/_root/COUNCIL-CHAMBER.md`** — the universal input-to-output surface. *"The system deduces the needed process based on input of the user by voice or text."* Two modes — Council Chamber (listening, Scripture-mirrored) and Dev/Ops (problem-solving) — share the same PWA and the same input pipeline. Classifier auto-routes; visible mode badge; never-auto-switch; both doors always reachable. Four-section response posture binding on Council Chamber replies: Hear → Mirror → Anchor → Invite. Pastoral, not clinical — the TLC bright line is held strictly.

- **`docs/00-foundations/_root/MODE-ROUTING.md`** — classifier spec; single source of truth for the routing UX shared by Counseling and Dev/Ops.

- **`docs/00-foundations/_root/INTAKE-AND-FIT.md`** — the Dev/Ops counterpart; the system deduces between modes by input analysis.

- **`docs/00-foundations/_root/ACCESS-TO-THE-HUMAN-MIND.md`** — response-tuning source for what Scripture says about influence on the mind, divine and adversarial.

## Privacy + sharing patterns the Q&A surface inherits

- **Client-side AES-GCM 256 + PBKDF2 250k** — already shipping in `schema-v2.1-infra.sql` per Q4 lock-in (§10.5 of `docs/00-foundations/SCHEMA-V2-MULTI-DOMAIN-DRAFT.md`). The v1 `confessions` table got ciphertext columns; the same posture extends to any future personal-spiritual-content table.

- **Audience-scoped sharing** — `prayer_requests.audience` enum in `schema-v2.7-church.sql`: `leadership`, `prayer-team`, `congregation`, `elders-only`, `anonymous-public`. RLS enforces the audience boundary on read.

## What got built (2026-05-25) consistent with these records

- The church-tab **Add Your Voice** section in `app/src/poe-financial-mvp-v28.jsx` — voice (Web Speech API) + link + topic + text input, local-only log with Send-via-email and Delete. A feature-level slice of the Council Chamber input pattern, scoped to the church tab for now. Future-state: a full Council Chamber surface (per the canonical doc above) replaces it.

## Why this stub exists at all

The agent created it before finding the canonical records. Rather than delete it from inside the sandbox (which couldn't be done due to a host-filesystem permission constraint documented in CLAUDE.md's Two-Session Git Race Rule), the content was replaced with this superseded note + cross-references so future readers land directly on the canonical records.

---

**End of superseded stub.** Authority for the surface described here lives in `_root/COUNCIL-CHAMBER.md` + `_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`.
