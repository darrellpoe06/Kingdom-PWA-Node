# DR-1472 — Discovery is not permission: sov80 from one word over an engineering newsletter

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 80; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Narrative:** `docs/99-session-notes/2026-11-13-sovereign-ai-sov80-discovery-is-not-permission.md`

## Context

Darrell forwarded a ByteByteGo issue, `Fw: How Uber Built A Gateway For AI Agents To Access Tools`, from his university mailbox on **2026-10-28 at 15:49 UTC** with **one word** above the forwarded header: *Lesson*. Gmail thread `1a18330341dec7b0`. Both DR-1414 witnesses agreed it was unbuilt: no `Lesson-Captured` in the thread's own `labelIds`, and `lesson-already-built.mjs --thread 1a18330341dec7b0` returned `NOTHING FOUND`. **Sixteen days** stood between his word and this build, kept in every reader place. The occasion was one company's tool gateway; the lesson is about none of its architecture.

## Decision

Sovereign A.I. **week 80**, `sov80-discovery-is-not-permission`, all four age bands from the first commit. **Word first:** Isaiah 22:22 — the key of the house of David **laid upon a shoulder**, so the one who holds it opens and none shuts — then Genesis 3:6, where the woman *saw* that the tree was good and treated an accurate catalog as a grant. The article's forty-word aside (a newly discovered tool starts **disabled** until its owner enables it) is the occasion; Genesis is the foundation.

Nine movements: the key laid rather than found (Isaiah 22:19-22, Revelation 3:7, Job 12:14); the tree that was discoverable from the first day, with Achan's own *saw, coveted, took*; the owner who appoints while the crawler only finds (Luke 12:42, 1 Corinthians 4:2, Matthew 25:15); the **porter** of John 10:3 and the man condemned by his route, not his inability; the centurion who begins with the authority **above** him; the outbound gate (Proverbs 4:23, Psalm 141:3, Proverbs 11:13, Proverbs 25:9-10); the finite room that makes *take heed what ye hear* an architecture; the **joints** Yahweh called the hard part first; and the keys held by the Lamb.

Every verse is filled from `app/public/bible/kjv` by `scripts/sov80-fill.mjs` and **none typed**; `anchor.ref` is derived from the placeholders that occur in reader places. Household application is bounded on purpose: write the list of everything that is turned on, mark who decided it, turn **one** thing off.

## What was measured — trust but verify (DR-0190 / DR-0100 / DR-0076 §8)

**The protocol was read at its own source; the company was not.** `www.uber.com` and `modelcontextprotocol.io` both failed to resolve from this session's egress (`getaddrinfo ENOTFOUND`), so **every** Uber-specific claim is attributed to the newsletter and never asserted. Named in **every** reader place with `re-review: 2026-11-27`. The Model Context Protocol specification was read in its own repository at commit `06e9234` (2026-11-12). Checking changed four things.

**BIGGER, and this is the whole teaching:** the newsletter tells disabled-on-discovery as one company's design taste. The specification carries consent as one of **four Key Principles** in all three current revisions — *"Users must explicitly consent to and understand all data access and operations"*, *"Hosts must obtain explicit user consent before invoking any tool"* — and then admits *"While MCP itself cannot enforce these security principles at the protocol level, implementors SHOULD"*. A house that starts everything disabled is doing what the standard says it cannot do for itself. **STRONGER:** the newsletter's *"usually JSON-RPC 2.0"* is a **MUST** in the specification. **CORRECTED:** the specification names **four** roles where the article names three — Hosts are *"LLM applications that initiate connections"*, Clients are *"Connectors within the host application"* — and it places consent on the **host**. **CORRECTED, smaller:** Cadence is open source at `cadence-workflow/cadence`, not internal plumbing; its README still publishes `ubercadence/cli`, which is the trace of its origin.

Not checked at all, listed so silence is not mistaken for a check: the Registry/Proxy split, AutoCrawler, the heartbeat metric, `listTools`, the periodic in-memory refresh, the HTTP/gRPC/TChannel mix, PII redaction, the third-party token exchange, Omni MCP, Response Projection, Code Mode, the "1000s of tools" figure and the "within minutes" claim.

## Impact

The congregation's Sovereign A.I. class gains the week its phones most need: the difference between what a person can reach and what a person was given. A reader in any of the four bands meets the whole teaching, the blocked host with its date, and the counterweight that **reaching is not the sin** — the centurion, the shepherd and Eliakim could all reach. One lesson's worth of debt did NOT move: `adultOnly` and `adultRegister` are both still 0.

## Verification

Ladder **0.99 / 4.12 / 4.53 / 6.95** monotone, child under 5.0 and teen **1.47 under** 6.0; adult 6.50; shares **0.512 / 0.616 / 0.624 / 0.881** against floors 0.50 / 0.60; worst band-pair overlap **0.187** youth~teen and worst band-to-adult **0.203**, against 0.25. **45** anchor refs, every one quoted to a reader and nothing more; **203** quoted spans (193 in the seven reader places) swept verbatim against the **21 books the module itself names**, 0 faults.

**MY GATE WAS NARROWER THAN ITS NAME AND ITS OWN FIRST RUN SAID SO.** The house writes `Psalm 141:3` and the corpus file is `Psalms.json`; the generator falls back to the plural and my first sweep did not, so it reported **nine false faults against Psalm** — DR-1467's exact shape appearing inside the check written to avoid it. The resolution is now shared and asserted (`bookFileName('Psalm') === 'Psalms'`). The book list is **derived** from the module's own references, never typed, which is why Revelation could not be missed as it was on sov78. The sweep walks **every one of the 140 strings** in the module, not a hand-listed few, and a case proves it reaches quotations outside the reader places — the sov79 defect.

**Still narrower than its name, stated rather than smoothed:** this file proves every quotation *is* the verse it names; it cannot prove the lesson quoted the *right* verse for the point, and it reads only this module, so a collision with a sibling lesson's chapter census is invisible here. `re-review: 2026-11-27`.

**My own gate caught four real defects in my own authored text before CI saw them:** the adult lesson shipped with **no blocked-road note and no TALK ABOUT IT TOGETHER close at all** (the sov79 defect, repeated); the Psalm resolution above; a frame-verse assertion wrongly demanded of the summary cards; and, once the close was appended, the child and youth bands fell **under their floors** (0.479 / 0.589) and were brought back to 0.512 / 0.616 **by hand, never by script** (DR-1306).
