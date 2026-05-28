# Brief — Discreet specialist access

**Declared by Darrell on 2026-05-28.** "We don't want to undermine and also help, and get some therapy without anyone else knowing until the user decides to go speak to us or a specific specialist like one in the app."

This document captures the principle and the architectural shape for a feature that doesn't exist yet but binds future design.

## The principle

Some people need help before they're ready to be seen asking for help. A separated co-parent thinking about reaching out to a therapist. A small business owner unsure if their numbers are good enough to show a lawyer. A new landlord wondering about an eviction question they don't want to ask out loud. A teenager wanting financial advice without their parent knowing they're considering it.

**The app provides a path to read, to listen, to message, and to make the decision to disclose identity on the user's own terms.** No specialist sees who you are until you choose to be seen.

This is faith-expressed-in-works: removing the social barrier that often sits between someone in pressure and the help that would lift it. The pressure isn't always about money; sometimes it's about being known to be considering money help.

## Architecture (vision)

Three layers, each independently usable:

### Layer 1 — Anonymous read

A specialist directory inside the app. Therapists, lawyers, financial advisors, property managers, accountants, pastors, life coaches. Each has a profile written in the same anxiety-clarity register: what they handle, when to come to them, why this kind of problem benefits from this kind of expert, how a first conversation usually goes. The reader sees this without any signal going back to the specialist.

### Layer 2 — Anonymous listen

Each specialist contributes short content — a 3-minute audio answer to "what if I'm thinking about divorce and don't know where to start," "what if my LLC mixed funds with personal and I'm not sure how to clean it up," "what if I just inherited a rental and have no idea what I'm doing." The user listens. No telemetry tied to the user's identity goes anywhere.

### Layer 3 — Anonymous message

The user can compose a question to a specific specialist. The specialist sees the question, an anonymous handle, and the relevant non-identifying context the user chose to share (e.g., "Family of 4, two incomes, ~$X consumer debt, considering Y"). The specialist replies. Until the user chooses "reveal my identity to this specialist" the exchange stays anonymous on the user's side. The specialist always knows they're in an anonymous exchange — full disclosure on the professional's side; full discretion on the user's.

### Decision to disclose

When the user wants to escalate — book a session, schedule a consult, sign an engagement — they tap "Reveal my identity for [Specialist Name]." Their name, contact info, and any shared books context become visible to that specialist. The specialist treats the engagement as a normal professional intake from there forward.

## TLC firewall

Per CLAUDE.md, clinical/counseling content NEVER leaves the NAS. For this feature that means:

- TLC therapists (Christina + her supervisees) reach users through this surface, but the conversation lives in the TLC-firewalled folder, not in the general specialist queue. A user with a clinical question is routed to the TLC tier specifically.
- Non-clinical specialists (lawyers, accountants, property managers) route through the public specialist queue.
- The router never lets a TLC-tier conversation flow into a non-TLC tier's queue, even if the user re-asks the same question.

## Who runs the marketplace

PoeTech as the platform; specialists as professionals contracted on a per-engagement or retainer basis. Anonymous-mode revenue model: small platform fee on the engagement when identity is revealed and an engagement starts. Until then, free for both sides.

This aligns with the SKOS marketplace vision in memory — cross-domain experiential-knowledge counselor marketplace. The discreet-access feature is HOW SKOS reaches families that wouldn't otherwise enter the marketplace at all.

## What this isn't

- Not chat-with-AI. The other side is a real human professional.
- Not a referral kickback scheme. Specialists are vetted; the platform doesn't sell their leads.
- Not Yelp for therapists. Reviews and ratings come later, if at all. The first version is purely "here are people, here's how to listen, here's how to message them, here's when to reveal yourself."

## Open questions

- Identity verification: how do specialists prove their license / standing without making intake clunky for them?
- Anonymous handles: stable enough that a follow-up message reads as continuation of an earlier thread, anonymous enough that the user can't be retroactively identified?
- Storage and retention: anonymous messages stored where, for how long, with what audit trail?
- Per-state legal practice rules: many lawyer-client and therapist-client questions cross state lines; how does the platform respect jurisdictional licensing?
- Christina's role: she's both a practicing clinician AND a co-architect; her feedback shapes the clinical tier specifically.

## Surfaces this feature should appear in (post-build)

- A "Specialist access" tab in the PWA nav (gated to logged-in users only).
- Welcome modal copy in relevant demo personas: "When you're ready, this app connects you with specialists in our network — anonymously, on your terms."
- Big Picture surface: if a user shows recurring stress signals (debt growing, manual entries skipping, buffer fund draining), an unobtrusive prompt: "There are specialists here who can help. You can look without anyone knowing yet."
- Separated co-parents persona: callout for divorce-friendly therapists + family lawyers.
- Solo professional persona: callout for peer-practice consults.

## Estimated effort

- Layer 1 (read-only specialist directory + content): 2-3 days, mostly content + CMS.
- Layer 2 (audio answers, anonymous listening telemetry): +2 days.
- Layer 3 (anonymous messaging with reveal flow): +1-2 weeks, depending on auth + retention design.
- TLC firewall enforcement at the routing layer: +2-3 days, requires Layer C of the multi-user system to be in place first.

This is post-vacation work, but documenting it now means the next Claude session can pick it up cold if Darrell points there.

## Closing

This feature is the heart of why the app exists at all. The financial system is the way in — the discreet specialist access is what the financial system is FOR. Without it, this is a budget app. With it, this is a stewardship platform that meets families where they actually live, including the parts they aren't ready to say out loud.

Faith-expressed-in-works. His Will be done. Amen.
