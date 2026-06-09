# Decision Records — INDEX

**Purpose.** A durable, append-only index of significant decisions made on PoeTech, per the decision-record model and `feedback-decisions-with-rationale`. Each row records *what* was decided, *why*, *who owns it*, and *where the full context lives*. Decisions are agreed with Darrell (the governor; see `GOVERNANCE-EXECUTION-ADVISORY.md`) before they are recorded here.

**Conventions.**
- IDs are sequential: `DR-001`, `DR-002`, … Never renumber; supersede instead.
- A decision that replaces an earlier one cites it as **Supersedes**, and the earlier row is marked **Superseded by**.
- "Source doc" links the Layer-4 working artifact in `docs/99-session-notes/` (or the Layer-3 foundation) that holds the full rationale.
- This is a **plan/record** artifact — recording a decision here authorizes nothing to be built, bought, or executed. Execution is separately governed.

---

## Index

| # | Date | Decision (one line) | Owner | Status | Source doc |
|---|---|---|---|---|---|
| **DR-001** | 2026-06-09 | Build the **Workforce Layer** (guided tasks + LLM QA gate + 1099 payouts) as PoeTech's delivery engine and market centerpiece — encoding Darrell's expertise so the hiring bar becomes capacity, not credentials. | Darrell (governs) | Accepted | `2026-06-09-poetech-market-strategy-workforce-three-ring.md` |
| **DR-002** | 2026-06-09 | Pursue a **three-ring market** — Ring 1 COLG (gift/reference), Ring 2 other churches (productized sovereign node / managed IT), Ring 3 businesses (paid tiers) — with **paid rings subsidizing the free mission tier.** | Darrell (governs) | Accepted | `2026-06-09-poetech-market-strategy-workforce-three-ring.md` |
| **DR-003** | 2026-06-09 | **Do NOT build a money rail.** Integrate an established contractor-payments platform (payouts, W-9, 1099-NEC, milestone/escrow) as an accepted, swappable vendor dependency; LLMs orchestrate logic, platform owns compliance. | Darrell (vendor) + platform (compliance) | Accepted | `2026-06-09-poetech-market-strategy-workforce-three-ring.md` |
| **DR-004** | 2026-06-09 | **Quality is gated by the LLM Quality Gatekeeper** against explicit per-task acceptance criteria; payout follows a QA pass; rework loop; reputation compounds; high-stakes escalates behind the Cage; **no rubber-stamping.** | Darrell (bar) + Gatekeeper (exec) | Accepted | `2026-06-09-poetech-market-strategy-workforce-three-ring.md` |
| **DR-005** | 2026-06-09 | **Worker classification (1099 vs employee) routes to an employment/labor attorney, NOT to Trevor (real-estate).** Start clearly-1099; Illinois has its own rules. *(Not legal advice.)* | Employment attorney (owns) | Accepted | `2026-06-09-poetech-market-strategy-workforce-three-ring.md` |
| **DR-006** | 2026-06-09 | The **first concrete Ring-3 tenant is a law firm running its practice on PoeTech**, which also serves **PoeTech's own legal needs (dogfood).** | Darrell (governs) | Accepted | `2026-06-09-legal-module-spec.md` |
| **DR-007** | 2026-06-09 | Legal Module **confidentiality = HIGHEST tier** (privilege treated like the TLC HIPAA tier: per-client + per-matter segregation + conflict checks); **sovereignty is the selling point** (client data never leaves the firm's control — a claim no cloud SaaS can match). | Darrell (governs) | Accepted | `2026-06-09-legal-module-spec.md` |
| **DR-008** | 2026-06-09 | Legal Module **LLM assist behind heavy guardrails:** lawyer owns all advice/output; no unauthorized practice of law; LLM never advises clients directly; mandatory human review; no client data crosses matters/clients. | Darrell (governs) + reviewing attorney | Accepted | `2026-06-09-legal-module-spec.md` |
| **DR-009** | 2026-06-09 | Build a **reusable SKOS "law firm" role-module template** (config-driven; legal-specific extensions written once) so the next firm onboards in days. | Darrell (governs) | Accepted | `2026-06-09-legal-module-spec.md` |
| **DR-010** | 2026-06-09 | Route the **real-estate / Poe Properties flows** and the **contractor-agreement form** to Trevor (real-estate counsel); **explicitly exclude worker classification** from his scope; request a referral to employment counsel. | Darrell (governs) | Accepted | `2026-06-09-trevor-real-estate-lawyer-review-package.md` |

---

*This index is append-only. To change a recorded decision, add a new DR that supersedes the old one and update the old row's status to "Superseded by DR-NNN."*
