# Role-scoped Admin console — build spec (2026-06-16)

**Status:** SPEC / QUEUED. Heaviest monolith item — lands **LAST** in the monolith
serialized lane, after: the conference stack (#192, merged) → the in-app
Operations surface (session `local_edab489e`) → the BG/Choir space changes (PR
#200, the rename + The Word — Migdal + Admin top entry). Depends on the Operations
surface existing (to **embed, not rebuild**). Allocate any migration number
against ALL open branches.

This is the contract for the build; it is not yet built. Darrell approved the
shape; the role-model framing below is his (2026-06-16).

## The "System levels" ontology (servant-leadership inversion)

Higher tier = **more service + accountability**, never power over people.

- **King / Owner = Christ = Builder/Creator** — NOT an account. The immutable
  mission/governance root no role overrides (CLAUDE.md Layer 0 / the Worldview).
- **Family (builder-creator tier)** — full build/configure/govern rights. The Poe
  family. **Covenant, not bloodline:** family = those who choose the Kingdom of
  Yahweh and do the Father's will (Mark 3:35 / Matt 12:50; "one Father," Matt
  23:9). Darrell AND Christina are Family tier (one flesh — "we are one"); their
  domain consoles are stewardships they carry, not their rank.
- **Servant-king = Steward-Admin (domain-scoped; serves, does not rule)** — a
  steward over one domain. Darrell stewards the SYSTEM; **BG** stewards MINISTRY;
  **Christina** stewards the CHOIR. A steward sees ONLY their domain.
- **sheep = users** — served, **never surveilled**. Their private data stays
  theirs. No servant-king ever sees another domain's people or a user's private
  data. (RLS / no-leak / the TLC firewall ARE servant-leadership enforced in code
  — DR-0060 tenancy guard, P14.)

**System consequence for gating:** MEMBERSHIP = Kingdom-choice (whoever chooses in
is family — model as covenant membership, NOT a hardcoded blood whitelist that
locks others out as a lower caste). PERMISSION = stewardship scope (the domain a
servant-king stewards). The sheep are family on the Way, served into the same
household — not a surveilled lower class.

**BG is also KING-PRIEST.** His servant-king tier carries a priestly office
Darrell's technologist tier does not: spiritual stewardship of the Word +
shepherding the sheep (royal priesthood, 1 Pet 2:9; Ezra the priest on the migdal,
Neh 8). His ministry console is framed with that priestly identity. Same servant
footing — he serves, does not rule or surveil; his domain is souls + the Word, not
the system.

## The three role-scoped consoles (one pattern, scoped by role)

Visible-but-locked top entry (🔒 Admin — SHIPPED in PR #200) is the discoverable
door. Behind it, the console renders **only the viewer's domain**:

1. **SYSTEM console** — Family/Darrell (operator). Embeds the **Operations
   surface** (orchestration-loop observability — `local_edab489e`'s component;
   integrate, do not rebuild) + the Decisions/governance ledger + user & instance
   management + data controls (seed reset, imports) + build-freshness + KPI status
   + feedback inbox + the conflict-map / land queue.
2. **MINISTRY console** — BG (king-priest), rendered **inside The Word — Migdal**:
   manage his sermon corpus, see engagement (who is studying / watching), his
   schedule. HIS domain only — no system internals.
3. **CHOIR console** — Christina (Family tier; stewards the choir), rendered
   **inside Choir**: manage songs / schedule / roster / availability + engagement.
   HER domain only.

## Gating rules (no-leak)

- Each role sees ONLY its domain; no system internals leak to ministry/choir
  roles; no cross-domain or user-private data crosses a steward boundary.
- Enforce server-side (RLS / role RPCs), mirror client-side for what renders.
  Proven-no-leak test required (service-vs-role), per DR-0060 precedent.
- Visible-but-locked entry stays; access gated by role/auth (multi-point / PIN per
  the auth model). WCAG AA on every state.

## Proof bar (DR-0076)
Served-build evidence per role: each console rendering REAL, scoped data on that
role's signed-in session + deploy SHA. No "done" without it. New gates for any
"looked-fine-but-wasn't" class found.

## Open dependency
The Operations surface must land first. Coordinate the exact embed point + props
with `local_edab489e` so there is ONE Operations component, surfaced inside the
System console.
