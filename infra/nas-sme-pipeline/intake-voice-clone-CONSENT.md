# Consent + Provenance — voice cloning for the sovereign voice layer (Voicebox / Kokoro / XTTS)

**What this is:** the audit-trail consent record for cloning the BUILDING CIRCLE's own voices
to build and test PoeTech's sovereign voice layer (the Voicebox eval —
`docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-research-review.md`). Voice
cloning of a real person is an impersonation surface; per the binding guardrails it requires
explicit, scoped, dated consent recorded before any clone is made. This file is that record.

---

## Consent granted (build + test phase)

**Granted by Darrell on behalf of the building circle, 2026-06-24:**
> "we all consent — we're building it and testing it together."

**Who consented (the BUILDING CIRCLE — the trusted team):**

| Person | Relationship | Consent basis | Date |
|---|---|---|---|
| Darrell Poe | Principal / governor | Self, explicit | 2026-06-24 |
| Christina Poe | Circle / co-governor | Attested by Darrell; Christina to counter-attest | 2026-06-24 |
| Bishop Gwin (BG) | Circle / pastor, SME | Attested by Darrell; **BG to counter-attest in his own words** | 2026-06-24 |
| The keyboardist | Circle / music SME | Attested by Darrell; keyboardist to counter-attest | 2026-06-24 |
| The son (minor) | Circle (minor) | **Guardian consent** — Darrell + Christina, with child-safety care | 2026-06-24 |

*(Darrell-attested for the circle now so the build is unblocked today; each adult member's own
counter-attestation is captured as they confirm — same pattern as the SME consent files.)*

**Scope (binding) — what this consent DOES cover:**
- **The circle's OWN voices only**, cloned for **BUILDING + TESTING** the voice layer.
- Narration / TTS of **intended content** the person means to say (lessons, Scripture read-aloud,
  presenter cues, test phrases) — i.e. reading written text aloud in their voice.
- Sovereign + local: reference audio, voice profiles, and generated speech stay on the
  family/church hardware (the NAS / GPU box). Nothing is uploaded to any external cloud or used
  to train a third-party model (DATA-AS-EMPOWERMENT-NOT-EXTRACTION). The one cloud TTS engine
  (HumeAI TADA) stays DISABLED.
- Revocable: any member may withdraw consent; their voice profile is then deleted (immediate +
  verifiable).

---

## Guardrails that STILL hold (consent is scoped, not blanket)

1. **Outside the circle still needs explicit consent.** Congregants, TLC clients, guests, any
   non-circle person — their voice is NOT clonable until they themselves consent. Default is
   *don't*. Minors beyond the son need their own guardian's consent.
2. **The son is a minor → guardian (Darrell/Christina) consent covers him, with child-safety
   care.** A minor's voice gets extra caution; not used beyond the build/test purpose; deletable
   on request.
3. **Public / published in a cloned voice → clear "AI-generated voice" label.** Visible on any
   surface that plays cloned-voice audio outside the circle. No exceptions for "it's obviously us."
4. **NEVER deceptive.** Cloning is for narration/TTS of intended content. Do NOT make even a
   consenting person appear to say something they didn't, in any misleading way. No fabricated
   "BG said…", no putting false words in a circle member's mouth. Impersonation is the line and
   it is absolute, consent or not.
5. **Sovereign-only configuration.** Local engines on the LAN/Tailscale box; HumeAI (cloud) off;
   no public attack surface.

---

## Data handling

Reference audio and voice profiles live on the NAS / GPU box under the voice-layer working
directory; generated speech is local. Exportable and deletable on request, per person. This
consent record is the provenance trail referenced by the eval doc's §6 guardrails.
