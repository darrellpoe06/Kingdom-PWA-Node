# Legal Matters — Privacy boundary, privilege awareness, and what the system tracks

> Founder direction (2026-05-18):
> *"We need to add legal matters to the system so users can also keep track of that, also it needs to be confidential."*
> *"I want this system to scale so you tell me what's possible and what is needed based on what's what in that area, but all these seem good as an option to put data in. If they never use an area, that's good; however, if you need to keep things in order this is the best place."*

This is the binding design for the **Legal** module. It is not a regular tab. Legal matters carry the highest confidentiality requirements in the system — higher than HIPAA in some respects, because attorney-client privilege can survive even subpoena attempts when the privileged/non-privileged boundary has been maintained.

**Note:** This document is system design, not legal advice. Users should have their attorney review the deployed module before storing live matter information in it.

---

## The boundary, in one sentence

**Mandatory under the hood, optional per user, isolated from everything else by default, and mechanically aware of attorney-client privilege.**

Same Connected Context principle (`CONNECTED-CONTEXT.md`) applied with the highest-rigor confidentiality posture in the system.

---

## Scope — four areas, all first-class, all optional per user

Each area is a top-level filter inside the Legal tab. A user who only has personal estate planning never sees the regulatory side. A user with a contractor business hits all four. A therapy-practice instance (TLC) gets regulatory pre-emphasized. Template-driven defaults; user override always wins.

### 1. Personal / family

Track for: a household, an individual, a couple.

- Wills, trusts, estate plans (existence, date executed, attorney, last review date)
- Powers of attorney — financial and healthcare, principal and agent
- Healthcare directives — advance directive, DNR, organ donor
- Beneficiary designations across accounts (with link to which account)
- Family law matters — custody, divorce, adoption, guardianship
- Immigration matters — petitions, naturalization, status
- Minor estate planning for children (UTMA accounts, education trusts, named guardians)

### 2. Real estate

Track for: every property the user owns or manages.

- Title issues — chain of title, encumbrances, easements, liens
- Lease disputes — non-payment, violations, code-compliance complaints
- Eviction proceedings — court date, filings, judgments
- Property tax appeals — assessment value, appeal date, outcome
- Code-enforcement actions from city/county
- HOA disputes — violations, fines, board actions
- Boundary disputes with neighbors
- Insurance claims that became disputes
- Construction-defect or contractor disputes
- Per-property folder so the matter cross-links (manually, never auto) to the property in the Real Estate tab

### 3. Business

Track for: every entity in `data.entities[]` (Poe Properties, PoeTech, TLC, etc.).

- LLC formation, registered agent, annual report status
- Operating agreements, partner/member disputes
- Contracts — vendor, contractor, employment, NDAs, lease (as landlord or tenant), service agreements
- 1099 and W-2 worker disputes — misclassification, unpaid wages, harassment
- IP — trademark filings, copyright, trade secrets, infringement actions (plaintiff or defendant)
- Insurance — claims, denials, coverage disputes, B&I, E&O, general liability
- Commercial litigation — small claims, civil, arbitration
- Bankruptcy / restructuring (own entity or a customer)
- M&A — buying, selling, merging
- Compliance — sanctions screening, OFAC, anti-money-laundering for any payment-handling business

### 4. Tax & regulatory

Track for: matters with government bodies (federal, state, local, professional licensing boards).

- IRS notices (CP2000, CP14, audit letters, etc.) with response deadlines
- State tax notices and appeals
- Sales tax / use tax matters
- Payroll tax matters (941, state UI)
- 1099 / W-9 compliance disputes
- Professional licensing — TLC's MSW licensing for Christina, contractor licenses, real estate licenses
- HUD / fair-housing complaints (often crosses RE + business)
- OSHA / safety complaints (employment + business)
- Government contracting bid protests
- Specific regulator actions — state insurance commissioner, securities, attorney general

---

## Data model per matter

```js
{
  id: 'lm-<random>',
  scope: 'personal' | 'real-estate' | 'business' | 'tax-regulatory',
  subType: 'eviction' | 'audit' | 'will' | …,  // narrows scope; free-text allowed
  title: '<user-private title, never seen outside Legal tab>',
  status: 'open' | 'monitoring' | 'in-progress' | 'resolved' | 'appealed' | 'closed',
  openedAt: '2026-05-18T…',
  expectedCloseAt: null | '2026-…',
  closedAt: null | '2026-…',
  outcome: '<user note when closed>',

  // Parties
  parties: [
    { role: 'plaintiff' | 'defendant' | 'opposing' | 'co-counsel' | 'witness' | 'other', name: '', contact: '', note: '' },
  ],
  court: '<court name>',
  venue: '<city, state>',
  caseNumber: '<docket>',

  // Counsel
  counsel: [
    { firm: '', attorney: '', email: '', phone: '', billingRate: 0, engagementLetterDate: '', representsUs: true | false },
  ],

  // Key dates (auto-mirrored to Calendar as PRIVILEGED-LABELED events)
  keyDates: [
    { kind: 'statute-of-limitations' | 'filing-deadline' | 'court-date' | 'discovery' | 'settlement-conference' | 'other', label: '', at: '2026-…', completed: false, note: '' },
  ],

  // Documents — pointers, AND (since 2026-09-06 / DR-0329) real uploaded files.
  //
  // AMENDED, not overwritten. The original 2026-05-18 rule was "pointers only,
  // not file content" — a considered choice, and it still holds for anything
  // the user would rather leave where it is. Darrell 2026-09-06, on the Legal
  // tab: "I need a section that I can upload legal documents for each of these
  // categories." Both now ship, and a record is one or the other:
  //   FILE    — bytes in the PRIVATE `legal-documents` bucket (migration 0168),
  //             path `<owner user id>/<slug>.<ext>`, creator-only RLS on the
  //             row AND the object, read back only via signed URLs that expire
  //             in 5 minutes. Requires a session.
  //   POINTER — the original shape below: no bytes, `whereFiled` says where the
  //             paper actually is. Works signed out and offline, which is why
  //             it stays first-class rather than becoming a fallback.
  // `privileged` remains mandatory on both, and is NOT NULL in the table — see
  // "Privilege awareness" below; that column is the export tool's guarantee.
  //
  // WHAT IS STILL NOT BUILT (stated here so this doc is not read as shipped):
  // Layer 2's AES-GCM-256 at-rest encryption. It cannot be built as specified
  // on the current architecture — the key is derived from the Legal PIN, and
  // app/src/lib/pin.js keeps the PIN out of the browser entirely (it is
  // verified server-side), so no client-side key material exists. A new key
  // architecture is its own decision. The Legal surface says so in words rather
  // than implying protection it does not have. re-review: 2026-10-15.
  documents: [
    { id: 'doc-…', label: '', whereFiled: '<location on user device / cloud / counsel office>', dateOf: '', whoHasCopies: ['user', 'counsel', 'opposing'], privileged: true | false, note: '' },
  ],

  // Financial — links to Books entries
  financial: {
    feesPaidToDate: 0,
    estimatedTotal: 0,
    settlementAmount: null,
    settlementDirection: 'paid' | 'received' | null,
    insuranceCoverage: null,
    linkedTransactionIds: [],
  },

  // Journal — phone calls, meetings, strategy notes
  journal: [
    { id: 'j-…', at: '2026-…', kind: 'call' | 'meeting' | 'email' | 'court' | 'research' | 'decision' | 'other', with: '', summary: '', privileged: true | false, mins: 0 },
  ],

  // Per-entry mandatory: privileged Y/N. Default Y. User must consciously
  // mark non-privileged. Export tool strips privileged=true entries.

  // Lifecycle log (same pattern as everything else, per LIFECYCLE-AND-HANDOFF.md)
  lifecycle: { phase, openedAt, closedAt, log: [...] },

  // Privacy — every legal matter carries these flags:
  excludeFromGlobalSearch: true,
  excludeFromActionQueue: true,
  excludeFromConnectedContext: true,  // can be overridden per-link manually
}
```

The privileged Y/N on every journal entry and every document is **mandatory, not optional** (per founder choice, 2026-05-18). The form refuses to save without an explicit selection. The mechanical guarantee — privileged content never leaves via the export tool — depends on the field always being filled.

---

## Four confidentiality layers — all four, not pick one

### Layer 1 — Tab gate

Entering the Legal tab requires a PIN distinct from any other authentication in the app. Auto-locks after 5 minutes of inactivity inside the tab (configurable 1–30 minutes). PIN is set on first use; can be changed; recovery is intentionally impossible (see "PIN loss" below).

### Layer 2 — At-rest encryption

The Legal data slice in IndexedDB is encrypted with **AES-GCM 256** via the Web Crypto API. The encryption key is derived from the PIN using **PBKDF2** with at least 250,000 iterations. The key is never persisted; it is held in memory only while the Legal tab is unlocked, and wiped on auto-lock.

Other slices of the app's data are unchanged. Only the legal slice is encrypted, so the rest of the app keeps its full local-first feel.

**PIN loss = data loss.** This is intentional. A recovery path (e.g., emailed reset, backup question) defeats the purpose. The user is warned of this on PIN setup with a confirm-typing prompt: *"I understand losing this PIN means losing access to my legal records."*

### Layer 3 — Cross-context isolation

Legal entities are explicitly excluded from:

- Big Picture Action Queue (no rows show up)
- Global search (when implemented)
- Connected Context auto-linking (`source: 'auto'` never points into Legal)
- Cross-instance feedback aggregation (Phase 2 backend never sees Legal data)
- Voice Ops Inbound routing (if a voicemail relates to a legal matter, the user converts it manually into a journal entry inside Legal)

The user can manually create a link from any record to a Legal matter (e.g., "this Real Estate property has 1 legal matter"). When such a link exists, the non-Legal side renders only: *"🔒 1 Legal matter linked — open Legal tab to view."* No title, no content, no leakage.

### Layer 4 — Export discipline

Two export modes:

1. **Privileged-stripped** — for sharing with non-counsel parties (insurance, opposing party, judge in some situations). All journal entries and documents with `privileged: true` are removed. Watermarked "PRIVILEGED CONTENT REMOVED — verify with counsel before relying." Sortable PDF or CSV.
2. **Full** — for counsel only. Watermarked "ATTORNEY WORK PRODUCT — Privileged & Confidential." Includes everything. Requires a re-entry of the PIN to generate (defense against shoulder-surfing).

Every export action writes to the matter's lifecycle log: timestamp, which mode, who generated it, optional note about recipient.

---

## Privilege awareness — the legal-specific feature most systems miss

The privileged Y/N field on every journal entry and every document is the mechanical implementation of attorney-client privilege awareness. Three rules apply:

1. **The form defaults to `privileged: true`.** Saving requires user to either accept the default or consciously mark non-privileged. This biases toward over-marking, which is recoverable; under-marking can waive privilege irrecoverably.
2. **Communications WITH counsel are by default privileged.** The system auto-suggests `privileged: true` when the journal entry's `with` field matches a `counsel[]` entry on the matter.
3. **The export tool is the single mechanical guarantee.** Hand-curated sharing — "I'll just paste this into an email" — bypasses the guarantee. Future-state, we may add a "share via system" affordance that routes through the export tool to make the privileged-strip the path of least resistance.

The system does not — and cannot — replace attorney judgment about what is actually privileged. The flag is a memory aid plus a mechanical safeguard, not a legal determination.

---

## Tier placement

**Family ($89) and above.** Rationale:

- Foundation (free) — locked. The privacy/encryption engineering is real work and should be paid for.
- PoeTech+ ($39) — locked.
- Family ($89) — unlocks Legal with all four scopes.
- Premium ($149) — same as Family for Legal (no new Legal features at this tier).
- Business ($249) — adds multi-user / counsel-shared Legal (read-only counsel access mode, future-state).

Existing tier system already supports gating via `VIEW_TIER_REQUIREMENTS`.

---

## Calendar integration — privileged-by-default

When the user adds a `keyDate` to a legal matter, it auto-mirrors as a Calendar event with:

- Title: "🔒 Legal matter" (never the actual matter title)
- Date and time
- Notification (per Calendar reminders)
- Click → opens Legal tab + auto-navigates to the matter (PIN gate first if locked)

So the user gets reminded about court dates without their Calendar leaking that they have a custody case.

---

## Lifecycle integration

Every matter uses the same `lifecycle.log` from `LIFECYCLE-AND-HANDOFF.md`:

- Status changes write entries
- Counsel changes (new firm engaged, prior firm withdrew) write entries
- Each export action writes an entry
- Each PIN change writes an entry
- Failed PIN attempts (3+ in 5 min) write entries

The audit trail is itself privileged content and lives inside the encrypted Legal slice.

---

## Anti-patterns this rule forbids

- **Plain-text "secret" storage.** Without Web Crypto at-rest encryption, the Legal data is one IndexedDB browse away from being read. Tab gate alone is theater.
- **Recovery escape hatches.** No "Forgot PIN? Email me a reset link." Either the data is encrypted with a key only the user holds, or it's not encrypted. Choose one; the user chose encrypted.
- **Privileged content in unencrypted memory longer than necessary.** When the tab locks, the decrypted slice is wiped from memory.
- **Surfacing matter titles on the home screen.** Never. The lock icon says "1 Legal matter exists" — that's it.
- **Auto-linking Legal into Connected Context.** Never auto. User can manually link with full awareness.
- **Sharing the PIN as a feature.** The PIN is per-device per-user. Multi-user counsel access (future Business tier) uses a separate read-only token, not the user's PIN.

---

## Sustainability check

| Item | Cost |
|---|---|
| Web Crypto API (browser native) | $0 |
| IndexedDB encrypted slice storage | $0 (same DB as everything else) |
| PIN entry UI | $0 (single component) |
| Export tool (PDF/CSV generation) | $0 (jsPDF or similar via CDN; only loaded when used) |
| Calendar auto-mirror with privileged labels | $0 (reuses existing Calendar) |

No new paid dependency. Rule held.

---

## Roll-out sequence

Each step independently shippable.

1. **Foundation.** This doc. ✓
2. **Tier gate + tab scaffold.** Add Legal to nav, tier-gated, with a "coming soon" placeholder body. Gives the visible commitment without exposing real data yet.
3. **PIN + encryption layer.** Web Crypto setup, PIN entry, decrypt-on-unlock, wipe-on-lock, auto-lock timer.
4. **Matter data model + CRUD.** Add / edit / delete matters across all four scopes. Privileged Y/N enforced on every save.
5. **Journal + documents per matter.** With the privileged flag and the privileged-by-default for counsel communications.
6. **Key dates + Calendar auto-mirror.** Privileged labels in Calendar.
7. **Export tool.** Privileged-stripped and Full modes, with watermarks.
8. **Manual cross-context links.** From any record → "Link to Legal matter" with the redacted display on the non-Legal side.
9. **(Business tier) Counsel read-only mode.** Separate token system; out of scope for initial launch.

Steps 2–3 are non-trivial engineering (real cryptography). Steps 4–6 are normal CRUD modeled on existing patterns. Step 7 introduces jsPDF (or similar) only when invoked. Step 8 reuses Connected Context.

---

## Cross-references

- `CONNECTED-CONTEXT.md` — same mandatory-under-the-hood, optional-on-surface pattern, applied at the highest confidentiality posture.
- `LIFECYCLE-AND-HANDOFF.md` — Legal lifecycle.log shape is identical to every other entity.
- `MULTI-INSTANCE-STRATEGY.md` — Phase 2 backend never receives Legal data; the boundary is parallel to TLC HIPAA boundary.
- `SITUATIONAL-PEACE.md` — Legal matters cause stress. The system reduces it by ensuring nothing falls through the cracks (statute of limitations, court dates, fee tracking) and by providing the privileged-stripped export so the user is not improvising redaction the morning of a settlement conference.
- `FOUNDERS-CONFESSION.md` — Honor and truth. Legal matters are areas where temptation to shade the truth is highest; the system supports the user keeping it straight.

---

## How to recognize when it's working

- A user storing a real eviction matter has every court date in their Calendar with a privileged label, every fee paid linked back to Books, every call with counsel journaled as privileged — and can hand the privileged-stripped export to the judge's clerk without re-reading the entire matter for redactions.
- A user with no legal matters has a Legal tab that takes one tap to confirm "0 matters" and is gone from their attention for months.
- A user who forgot their PIN does not get their data back. They re-create the matter from scratch. This is unpleasant and correct.

---

**End of document.** Binding. The Legal module ships with all four confidentiality layers, mandatory privileged Y/N, full four-scope coverage, and tier-gated availability at Family and above. No exceptions. No shortcuts to a recovery backdoor. The boundary is the feature.
