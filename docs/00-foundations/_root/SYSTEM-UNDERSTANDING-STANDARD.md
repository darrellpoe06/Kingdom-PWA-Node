# SYSTEM-UNDERSTANDING-STANDARD — what a full understanding of the system contains

**Declared by Darrell, 2026-10-19** (DR-1111), in five messages:

1. *"Comprehensive understanding of the system..."*
2. *"What is outside of the 10 dimensions... give me the full understanding of the system"*
3. *"Inside and out..."*
4. *"Comprehensive meaning whatever we have currently... what changed and when exactly like logs... and also the ability to reverse any undermining processes because every system is interdependent... and our overall system goals so the vision is clear and we alignment is very effective and deliberate and intuitive"*
5. *"Standard code and sequences and jobs and workflows and critical paths wrapped with a systemic incentive structure and foundation placeholders for allowing flexibility in the development process for all necessary factors... Prudent evaluations"*

**How it relates to the review standard.** `COMPREHENSIVE-REVIEW-STANDARD.md` (ten dimensions) reviews a **surface and its flow**. This standard frames the **system around the surfaces**. A comprehensive review answers both. Neither replaces the other.

---

## The Word under it

**KJV — Proverbs 14:15:** *"The simple believeth every word: but the prudent man looketh well to his going."*

**KJV — Proverbs 22:3:** *"A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished."*

**KJV — Proverbs 14:8:** *"The wisdom of the prudent is to understand his way: but the folly of fools is deceit."*

(The repo's Bible corpus carries the KJV and WEB, not the ESV, so these are quoted from `app/public/bible/kjv` verbatim.)

The verses give three acts of prudence:
- **looking well** (check before you trust);
- **foreseeing** (see the harm before it arrives);
- **understanding one's way** (know where you are going).

They map onto the three questions every part below must answer.

## The eleven parts

| # | Part | The question it answers | Where it is produced or measured |
|---|---|---|---|
| 0 | **Goals** | What is every part for, in the repo's own words, and how is each goal measured? | foundation docs, quoted with `file:line`; one live measure per goal, or "none" stated plainly |
| 1 | **Inventory: inside** | What exists: app, transport, NAS, data, factory, night watch? | the flow graph (`system-flow-registry.mjs`), `RECORDED-STATE.md`, `services.json` |
| 2 | **Inventory: outside** | What do we stand on but not own, and is each piece answering today? | a dependency table with a live reading per row |
| 3 | **Standards** | What is all code written to, and what enforces each standard? | `CLAUDE.md`, the gates in `ci.yml` |
| 4 | **Sequences and critical paths** | Which chains must hold end to end, hop by hop, and which hop is weakest? | each chain traced to files; the witness that watches it |
| 5 | **Jobs and workflows** | What runs on a clock or on an event, with which brakes? | `.github/workflows`, the NAS loop registry |
| 6 | **Incentive structure** | What makes the right way the easy way, and what does it fail to reward? | gates, ratchets, baselines, the merge lane, the stop hooks |
| 7 | **Placeholders** | Which slots are declared but not yet built, each with an owner and a date? | declared loops, open resources, unactuated mounts, `re-review:` dates |
| 8 | **Change log** | What changed, exactly when, in which layer? | `node scripts/system-change-log.mjs --since=…` (DR-1111) |
| 9 | **Reversal** | How is each layer undone, and where can it not be? | per layer; the change log's per-entry reversal |
| 10 | **Interdependency** | What else breaks if this part breaks? | the flow graph's edges (`writers`/`readers`); blast radius by a walk downstream |

## Prudent evaluation — applied to every part, including this one

1. **Look well (Proverbs 14:15).** Every claim carries its evidence grade:
   - *verified*: re-read in the code or measured live this session;
   - *traced*: cited `file:line` from a read-only trace;
   - *not measured*: said plainly.

   A trace by another agent is checked by sampling before it is relayed. When the sample fails, the trace is re-done, not trusted.
2. **Foresee (Proverbs 22:3).** For every critical path and every reversal, name the harm before it happens:
   - the weakest hop;
   - the layer that cannot be undone;
   - the instrument that could be lying.

   An instrument that has cried wolf, or that counts a non-delivery as a success, is a finding of the first rank. The system steers by its instruments.
3. **Understand the way (Proverbs 14:8).** Every finding ends against a goal in part 0, with one of two states:
   - **DONE with evidence**;
   - **CARRIED by a named system or blocker** (DR-0236).

   A goal with no live measure, or a roadmap whose dates have passed, is itself a finding: it cannot steer alignment.

## The first application

`docs/99-session-notes/2026-10-19-the-system-inside-and-out.md`. It found and fixed four defects in the alarm and mount path (DR-1110), and named the missing backup of the sovereign database as the largest risk to reversibility.
