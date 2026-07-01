---
id: DR-0087
title: Chase auto-pull vs sovereignty — no path is both zero-human AND zero-third-party; stay on file-export until trust reverses
date: 2026-07-01
status: proposed
supersedes: []
superseded-by: null
tier: C
entities: [poetech, family]
grounds: [SOVEREIGN-FIRST, NO-DATA-SALE, DATA-AS-EMPOWERMENT, RESEARCH-FIRST, VERIFICATION-DOCTRINE, GOVERN-EXECUTE-ADVISE, THREE-BRAKES, DATA-DRIVEN-LIVING]
source: 2026-07-01 research-review — "Can we connect to Chase for zero-human auto-pull without a third party seeing the data?"
---

## Context

Darrell asked whether the app can CONNECT TO the Chase account so transactions auto-pull with **zero ongoing human involvement** after a one-time connection (least-human, per the help-to-courses flywheel cap). His binding stance is **bank-connection-OFF-until-trusted**, and his sovereignty / no-leak posture (hybrid Supabase-as-shield, NAS canonical; `project-sovereign-aggregator-asymmetry`) means **a third-party aggregator seeing the data is a real problem**. This is a research-review, not a build. Nothing is to be wired. This is a trust-reversal decision that is HIS to make. **Not financial advice.**

## Decision

**Decided (research finding, ratified as a standing constraint):** In 2026 there is **no Chase data-access path that is BOTH (a) zero-human-after-connection AND (b) no third party ever sees the data.** Chase killed the only sovereign direct-pull (Direct Connect / OFX) on **2022-10-06**; every remaining auto-pull path routes the data through a third-party aggregator. You must trade one axis against the other.

**Decided (posture, now):** **Stay on the current file-export (QFX/CSV) verified-upload path.** It is the ONLY path that satisfies no-third-party + read-only-by-nature + NAS-resident-store. Its cost is a recurring human download (~monthly). While trust is OFF, we pay that cost rather than leak.

**Decided (future, gated on Darrell's explicit go):** IF/WHEN Darrell declares trust earned, the recommended auto-pull path is **Akoya (pass-through aggregator), read-only, OAuth token stored NAS-resident behind the shield**; fallback **SimpleFIN Bridge** for a lighter/cheaper pilot. Plaid/MX/Finicity are **not** recommended for our posture (they store/process the data on their cloud).

**NOT decided / explicitly out of scope:** we are NOT wiring any bank connection, NOT signing an aggregator, NOT entering any credential. No trust reversal is asserted — this record only maps the terrain and pre-stages the reversible plan.

## Rationale

Verified 2026 terrain (citations in the research-review source; who-SEES-the-data is the deciding column):

| Path | Zero-human after connect? | Who SEES the data | Read-only? | Token/creds location | Recurring cost | Reliability |
|---|---|---|---|---|---|---|
| **Direct Connect / OFX (self-hosted)** | — | nobody (was direct) | yes | your machine | — | **DEAD at Chase since 2022-10-06** — not an option |
| **File export QFX/CSV → verified upload** | **NO** (human downloads) | **nobody** — Chase → your device → app | yes (a file) | none | $0 | high (manual) |
| **Akoya (pass-through aggregator)** | **YES** | **Akoya does NOT store data / doesn't know the consumer or the data** (tokenized OAuth pass-through) — but it IS in the transport path, and Chase co-owns Akoya | yes (read scope) | OAuth token → **can live NAS-resident** | aggregator/API terms (fee regime now forming) | high (API, not scraping) |
| **SimpleFIN Bridge** | **YES** | **third-party relay** (small; brokers the connection; app never sees creds) | yes (read-only relay) | access URL/token → **NAS-resident** | ~$15/yr | good (self-hosted community-proven) |
| **Plaid / MX / Finicity / Yodlee (direct)** | **YES** | **the aggregator STORES + processes the data on its cloud** | yes (read scope) | token on aggregator + your app | new Chase per-access fees (2025→) | high, smoothest DX |
| **Scrape the mobile/web app** | n/a | n/a | n/a | n/a | n/a | **NOT viable/safe — excluded** |

Three verified facts drive the finding:
1. **OFX Direct Connect is gone at Chase (2022-10-06).** The "most sovereign" mental model (direct read-only pull into your own software) no longer exists; Chase replaced it with aggregator-routed methods (e.g. Intuit's Express Web Connect+). So the sovereign auto-pull option is off the table structurally, not by our choice.
2. **Chase's sanctioned method is now OAuth-token, credential-free, read-only, per-account, revocable — but only via an approved aggregator** (Plaid, Yodlee, Finicity/Mastercard, Intuit, MX, Akoya, Morningstar). There is no consumer-direct token; an aggregator is always in the middle.
3. **The economics are actively shifting.** JPMorgan Chase began **charging aggregators** for data access (announced July 2025; ~$300M/yr proposed for Plaid; negotiated deals Nov 2025 with Plaid/Yodlee/Morningstar/Akoya). And the CFPB **Section 1033 open-banking rule is enjoined and under rewrite in 2026** — the legal right to free bank-data access is NOT settled. Wiring now buys into a moving pricing/terms regime; waiting costs nothing and de-risks.

Given `SOVEREIGN-FIRST` + `NO-DATA-SALE` + the no-leak posture, **no-third-party is senior to least-human** until Darrell says otherwise. File-export honors sovereignty fully; the human download is the acceptable price of OFF-until-trusted. Among auto-pull options, **Akoya is ranked first for us specifically because its pass-through model minimizes what a third party holds** — it doesn't store the data or know the consumer — which is the closest an auto-pull path gets to our standard.

## Consequences

- **Obligates nothing to be built or connected.** Current state (file-export verified-upload) continues unchanged.
- **Enables** a fast, fully reversible reversal later: the plan below is pre-staged so a "go" is a short, bounded step, not a new research cycle.
- **Forecloses** planning around self-hosted OFX (it's dead) and around Plaid/MX/Finicity as the default (they contradict no-leak).

**Hard constraints (binding on any future execution of this path):**
1. The one-time credential / OAuth connection is performed **BY Darrell or Christina** — Claude NEVER enters banking credentials.
2. **Read-only scope only.** No money-movement / payment scope, ever.
3. **Token NAS-resident, never exfiltrated;** stored behind the shield (Tier-S sovereign-sensitive per DR-0080), served over tailnet only.
4. **Nothing is wired until Darrell explicitly says go.** This is a trust-reversal decision reserved to him (GOVERN-EXECUTE-ADVISE).
5. **Not financial advice.**

**Phased, reversible plan (each phase gated on Darrell's go; STOP is always available):**
- **P0 (now):** keep file-export verified-upload. No change. — *current*
- **P1 (decision only):** Darrell declares whether/when trust is earned and picks lane (Akoya recommended, SimpleFIN fallback). No wiring.
- **P2 (sandbox, no live data):** stand up the chosen lane against its **sandbox/test data** only; prove read-only + token-NAS-resident + revoke works, on fake data. Fully removable.
- **P3 (one live account, read-only):** Darrell/Christina perform the **one-time Chase OAuth consent** for a single account, read-only; verify auto-pull lands on the NAS behind the shield; verify **revoke from chase.com** kills it.
- **P4 (widen or roll back):** expand accounts, or revoke and delete the token — either direction is a single reversible step.

**The one-time step Darrell/Christina would perform (P3, only after "go"):** sign in to Chase themselves and approve the read-only data-sharing consent for the chosen account (the OAuth "connect / allow" screen), then hand the resulting token to the app to store NAS-resident. Revocable any time from Chase's data-sharing settings. Claude never sees the login.

## Links
- DR-0080 (hybrid Supabase edge/shield + NAS sovereign canonical — where the token lives and the Tier-S rule).
- DR-0003 (isolation tiers — family financial is sovereign-sensitive).
- DR-0076 (Verification Doctrine — this record cites verified sources, flags the unsettled regulatory regime as uncertain).
- `project-sovereign-aggregator-asymmetry`, `project-db-home-primary-church-nas-backup`, `project-financial-data-flow-and-seed-resolution` (current file-export path).
- Research-review source (2026-07-01) with full citation list, this session.
