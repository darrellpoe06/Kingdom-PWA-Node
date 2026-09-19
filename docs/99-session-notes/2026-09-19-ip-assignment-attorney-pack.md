# IP Assignment — the attorney pack

**Date:** 2026-09-19 · **For:** the business-formation attorney engagement
**Purpose:** everything the attorney needs, gathered, so the drafting visit is short.
**NOT legal advice, and NOT an executed instrument.** This is preparation material.
Nothing here is signed, and nothing here substitutes for counsel drafting the
actual assignment. Every fact below is measured from the repository on
2026-09-19, not recalled.

---

## The ask, in one sentence

**Draft a written assignment transferring all intellectual property Darrell Poe
created personally in the PoeTech / SKOS work to a newly formed Illinois LLC,
with Schedule A (below) attached — plus an IP-assignment clause for the
contractor agreement that subject-matter experts will sign before contributing.**

---

## Why this is unusually simple (and worth saying out loud to counsel)

Most IP assignments are hard because the chain of contributors is tangled and
each one owns their contribution absent a signed instrument. **That problem does
not exist here**, and it is measured, not asserted:

| Fact | Measured 2026-09-19 |
|---|---|
| Human collaborators on the repository | **1** — `darrellpoe06`, admin |
| Distinct human authors in the git record, all branches | **1** |
| Non-Claude co-author trailers across 21 co-authored commits | **0** |
| Repository created | 2026-04-27 |
| Files in the tree | 4,486+ |

**One human author. Zero contested contributions. Clean title.** The assignment
is therefore a single signature over an undisputed chain — not a reconstruction.

**This is a wasting condition.** The moment a subject-matter expert contributes,
they own their contribution by default. That is why the contractor clause
(§3 below) belongs in the same engagement, not a later one.

---

## The AI-authorship fact counsel must be told (do not omit this)

A large share of this work was expressed by an AI assistant under Darrell's
direction. **Counsel must know this before drafting**, because it affects what
the assignment can accurately claim and what any future copyright registration
may assert.

The honest sort, which the IP register already encodes:

- **Strongest — human-authored:** Darrell's declarations and directives, the
  doctrinal rules, the worldview spine, the spoken teachings, and the
  **selection and arrangement** of the 500+ decision records.
- **Mixed — human-directed, AI-expressed:** the foundation docs, specs, and much
  of the code. Assignable; disclose the AI portions on any registration.
- **Not claimed at all:** the public-domain biblical texts (WEB, KJV) and the
  third-party open-source components, both already carved out in `LICENSE` §4
  and credited in `NOTICE`.

**Do not let the assignment over-claim.** An instrument that sweeps in the
public-domain Scripture or the BSD/MIT dependencies is false on its face, and a
knowingly inaccurate registration can be invalidated.

---

## Schedule A — the assets to be assigned

The live, computed register is at `docs/00-foundations/_root/IP-REGISTER.md`
(engine: `app/src/lib/ip-register.js`; surfaced in-app on Books → Legal). It is
generated from measurement rather than typed by hand, and it **refuses** any row
claiming a protection the facts foreclose.

**25 rows at time of writing:** 8 candidate marks · 8 copyright works ·
9 methods already outside trade-secret reach because the repository is public.

> **Attach the register itself as Schedule A** rather than a copy pasted here.
> A pasted copy goes stale the moment the register moves; a reference does not.
> Print it on the day of signing and attach that dated printout.

### The marks, with their measured in-repo usage

| Mark | Uses | Note for counsel |
|---|---|---|
| **PoeTech** | 203 | The house mark. File this one first. |
| **SKOS** | 196 | **Clearance risk — collides with an established W3C standard.** Screen before spending. |
| Ari | 75 | Short mark, crowded class. |
| Council Chamber | 58 | |
| Quality Gatekeeper | 40 | Distinctive; names a real mechanism. |
| The Root | 23 | Descriptive-leaning; weaker. |
| Behavioral Mirror | 19 | Distinctive method name. |
| The Love Corner | 13 | Church-facing; has its own branded door. |

**Deliberately excluded — do not add "The Way" to any filing.** It is the Word's
own language for the early believers (Acts 9:2; 19:9; 24:14). It is used as
Scripture uses it and is not claimed. This exclusion is recorded in `NOTICE` and
machine-held by a test so no later pass adds it.

### One asset needing its own paragraph

`store/android.keystore.enc` is the **real store signing key** for five Android
packages (`us.poetech.app`, `.lovecorner`, `.tlc`, `.moore`, and Poe Properties).
It is AES-256 encrypted and committed to a **public** repository; its
confidentiality rests entirely on one passphrase. The packageIds become permanent
after first Play upload. Counsel should know this exists and that custody of the
passphrase is what custody of the signing identity means.
See `store/README.md` and the DR-0152 drift note.

---

## §3 — The contractor IP clause (the second document, same engagement)

**Needed before the first SME contributes anything.**

What it must do:
1. Assign to the entity all work product the contractor creates in the engagement.
2. Cover code, documentation, curriculum, lesson content, designs, and data.
3. Include a present assignment, not only an agreement to assign later.
4. Sit alongside — not inside — the worker-classification terms, which route to
   **employment counsel, not real-estate counsel** (recorded as DR-0021/DR-0026).

**The framing that matters, and it is not defensive:** a clear assignment is what
makes it possible to **pay and credit contributors properly**. Ownership that is
written down can be shared on purpose; ownership that is murky gets disputed by
accident. The clause protects the SME as much as the enterprise — it states in
writing what they give and what they get, instead of leaving both to be argued
later. (Grounds: DR-0191, honour to whom honour; DR-0038's dignity-and-fair-pay
guardrail governs the commercial terms.)

---

## What this is FOR

> **KJV — Proverbs 13:22:** *"A good man leaveth an inheritance to his children's
> children: and the wealth of the sinner is laid up for the just."*

Not children — **children's children**. An inheritance must be **owned** to be
left. Every register row failing the *Owned* test is a row that cannot be handed
down; it would dissolve into the commons the day the work stops.

The assignment is not corporate hygiene. It is the instrument that turns a labor
of Love into something that can be handed to people he will never meet.

---

## Checklist for the visit

- [ ] LLC formed (Illinois SOS) and EIN issued — **do this first**
- [ ] Operating agreement adopted
- [ ] **Assignment executed**, with the dated register printout as Schedule A
- [ ] Contractor agreement carries the IP clause — **before any SME contributes**
- [ ] Counsel told about the AI-authorship split (do not over-claim)
- [ ] `SKOS` clearance question raised before any trademark spend

---

*Prepared under `CLAUDE.md` Layer 0. Repository facts measured 2026-09-19 from
the working tree, the GitHub collaborator list, and the full git record.
Legal-doctrine framing is flagged for counsel confirmation per DR-0076 §8, not
asserted as verified law. Nothing here is executed or binding.*
