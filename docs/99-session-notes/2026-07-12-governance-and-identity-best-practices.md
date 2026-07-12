# Governance & identity — what it is, and "easy AND secure" at the highest level

**Recorded:** 2026-07-12 · **Source:** DP (two Google account-switcher screenshots —
the family + org identities: personal `darrellpoe06`, org `poetech.us`, Mrs. Poe,
the twins, the kids): "Governance etc — what are they and what should/can we do at
the highest level, and best practices for intuitive design and easy while being
secure." Research-grounded; maps to our existing spine.

## Governance is two layers

1. **Platform governance — who DECIDES.** Already ours: **GOVERNANCE-EXECUTION-ADVISORY**
   (Darrell governs / the Foundation executes / Claude advises), the **Governor** holds
   the bright lines, **Tier C** gates the high-stakes (money, doctrine, COLG-facing,
   minors), the **`hold` label** is the governor's brake, and the deterministic gates
   are the safety net (DR-0076). Surfaced in-app (Governor Review / OpsBoard, DR-0061/0065).
2. **Identity governance — who IS who, and who can ACCESS what** (what the screenshots
   show). This is the ungoverned edge today: a sprawl of Google accounts blends
   *persons* (family), a *role/org* identity (`poetech.us`), and *minors* (the kids).

## What we already have (reality-trace)

- **RBAC + tenancy wall:** `user_in_instance()` roles **owner / admin / member**, the
  family email allowlist, per-instance RLS (DR-0060), now with the index + defense-in-
  depth gate (DR-0179).
- **Separation of duties:** the two-person giving count (shipped), Bishop Gwin's doctrine
  gate on publish (DR-0003), destructive/money actions are the governor's hand.
- **Consent-gated data + audit posture:** DATA-EMPOWERMENT (opt-in, audit-log-on-access,
  no extraction), DR-0161 consent-gated profile sharing.
- **Easy, low-stakes entry:** phone + PIN, no email, no Google (DR-0172).

## What the research says (2025 IAM best practice) — and our move

| Best practice | What it means | Our move |
|---|---|---|
| **Least privilege / RBAC / JIT** | Each identity gets only what its role needs; no standing over-access | Keep owner/admin/member tight; a giving-count steward gets the giving tab, not the whole admin |
| **Separation of duties** | No one identity can do a "toxic combination" (record + approve money) | Two-person count (done); approver ≠ counter |
| **One person = one identity; separate ROLE accounts from PERSON accounts** | Don't blur personal Gmail with the org/service identity or a child's | `poetech.us` = the **org/role** identity; personal Gmails = people; **minors under Family Link** |
| **Adaptive / risk-based (context-aware) auth** | Match the friction to the RISK — step up only for sensitive actions | Frictionless to read the prayer wall (PIN); **step-up** only to touch giving/admin. This is the answer to "why the heavy Google 2FA?" — reserve strong MFA for high-value, not for everything |
| **Passkeys / biometrics (FIDO2/WebAuthn)** | Easier *and* stronger than passwords | We already offer biometric enroll; lead with passkeys/biometric + phone-PIN, de-emphasize passwords |
| **Audit logging + anomaly monitoring** | Every access/change logged; watch for odd device/time | Extend the audit-log posture; surface it on the Governor board |

## The design principle DP keeps returning to: EASY *and* SECURE

Not a trade-off — **match the security to the value at risk (adaptive auth):**
- **Low stakes (most of the congregation):** phone + PIN / passkey — one tap, no email,
  no Google challenge. Never gate reading a devotional behind match-the-number.
- **High stakes (money, admin, publishing):** step-up to strong MFA / a second approver,
  *only at the moment of the sensitive action* — not at the front door for everyone.
- **Passkeys/biometrics over passwords** everywhere (the modern easy+secure default).
- **Role-appropriate surfaces:** show each person only what their role needs (reviewer-
  mode, staff-gating) — less to learn, less to get wrong, smaller blast radius.
- **No lockouts, clear recovery** (our phone+PIN no-lockout).

## The concrete gap + recommendation

The **account sprawl** is the ungoverned edge. Highest-level cleanup:
1. **Name each identity's role** — `poetech.us` is the **org/service** identity (not a
   person); personal accounts are people; **the kids' accounts go under Family Link**
   (parental governance). Don't sign into org/church tooling with a personal Gmail.
2. **Lean on the app's OWN identity** (phone+PIN / passkey + our RBAC), not on personal
   Google accounts, for church/org roles — so governance lives in *our* wall (DR-0060),
   not scattered across Gmail logins.
3. **Adaptive auth**: frictionless entry, step-up only for money/admin. Close the earlier
   finding — the no-email phone+PIN belongs on the *general* sign-in too, not only the
   church door (offered; awaiting DP's go).
4. **One Governor board** that shows who-has-what-role + the audit trail (extends DR-0061/0065).

## Governance rails

This is advisory (Claude/Ari advise; Darrell governs — GOVERNANCE-EXECUTION-ADVISORY).
Identity/role changes are Tier C. Recorded as a Way (DR to follow); pairs with DR-0060,
DR-0172, DR-0179, DATA-EMPOWERMENT, GOVERNANCE-EXECUTION-ADVISORY.

## Sources

- securityscorecard.com/blog/iam-in-2025-identity-and-access-management-best-practices · okta.com/identity-101/identity-and-access-management-best-practices-for-enhanced-security · strongdm.com/blog/iam-best-practices · idsalliance.org/blog/six-identity-governance-trends-to-follow-in-2025 · apono.io/blog/8-identity-access-management-iam-best-practices-to-implement-today
