# 2026-11-13 — Sovereign A.I. sov80, Discovery is not permission

**Record:** `docs/decisions/DR-1472-discovery-is-not-permission-sov80.md`
**Module id:** `sov80-discovery-is-not-permission`
**Gate:** `app/src/__tests__/sovereign-ai-sov80-verses.test.js` (24 cases)
**Generator:** `scripts/sov80-fill.mjs`
**Gmail thread:** `1a18330341dec7b0` — forwarded 2026-10-28T15:49Z, built 2026-11-13

## His word, and the gap

The subject line was `Fw: How Uber Built A Gateway For AI Agents To Access Tools` and it says
nothing about a lesson. The ask was one word typed above the forwarded header: **Lesson**. That is
the whole instruction, and the article is the occasion. Judging by the subject would have thrown
this away as an engineering newsletter.

**Sixteen days** stood between his word and this build. The gap is on the record in all five
reader places rather than smoothed, per DR-0075.

Both DR-1414 witnesses were run before a line was written. The thread's own `labelIds` were
`UNREAD, CATEGORY_UPDATES, INBOX` on the original and `UNREAD, CATEGORY_PERSONAL, INBOX` on his
forward — no `Lesson-Captured` on either message. And
`node scripts/lesson-already-built.mjs --thread 1a18330341dec7b0` returned `NOTHING FOUND`.

The oldest uncaptured thread was found by the **label name**, not the label id: the search
`{from:darrellpoe06@gmail.com from:dpoe@illinois.edu} Lesson -label:Lesson-Captured newer_than:365d`
returned 18 threads, and his forward at 15:49 on 2026-10-28 was the oldest of them by eighteen
minutes over the next (`1a1837bf55922f04`, 17:08 the same day).

## Where the hour came from

The article is 3,000 words about one company's shared front door for AI agents — a registry, a
crawler, a proxy, and three tricks for a finite context window. Buried in the middle of it, in
about forty words the writer treats as housekeeping, is this: a newly discovered server or tool
starts **disabled**, and the team that owns the service must review it and enable it.

That sentence is the hour. It is Genesis 3 restated by an engineering team that had been bitten
enough times to arrive at it independently. The tree was in the middle of the garden from the
first day; it was discoverable the whole time; the serpent changed nothing about what Eve could
**see** and everything about what she believed she was **permitted**. Discovery is not permission.

**Word first, and it is not a borrowed anchor.** Isaiah 22:22 opens: the key of the house of David
is *laid upon his shoulder*. The four verbs in the two verses before it are all done **to** the
steward and none **by** him — called, clothed, strengthened, committed. That is what a real grant
looks like, and nothing in the article stands above it. The nine movements run from there to
Revelation 1:18, where the keys are held by the One who did not have to find them.

## Trust but verify — what the checking changed

**One road opened and one was shut.** `www.uber.com` and `modelcontextprotocol.io` both failed to
resolve from this session's egress (`getaddrinfo ENOTFOUND`, not a 403 CONNECT refusal — this one
is a DNS block). So **every** Uber-specific claim in the lesson is attributed to the newsletter and
never asserted on our own authority, named in all five teaching places with `re-review: 2026-11-27`.

The protocol itself **was** reachable, by a road the proxy allows: a sparse `git clone` of the
specification's own repository, read at commit `06e9234` of 2026-11-12. The GitHub REST API refused
the same repository (`GitHub access to this repository is not enabled for this session`), so the
git road is the one that worked, and it is worth recording as a Ways finding — `gh search` and
`git clone` reach what `gh api` does not.

**BIGGER (DR-0100 §5).** The newsletter tells disabled-on-discovery as one company's taste. The
specification carries consent as one of four **Key Principles** in all three current revisions, and
then says in the same section: *"While MCP itself cannot enforce these security principles at the
protocol level, implementors SHOULD"*. The standard names the duty and admits it cannot make
anybody keep it. A household gate is therefore not fussiness; it is the only place the rule can
live. Under-claiming that would have been a failure of truth as much as over-claiming.

**STRONGER.** The newsletter writes *"usually JSON-RPC 2.0"*. The specification: *"All messages
between MCP clients and servers MUST follow the JSON-RPC 2.0 specification."*

**CORRECTED.** The article names three roles — client, server, tool — and says the client sits
inside an AI application. The specification names four, and the container has its own name: Hosts
are *"LLM applications that initiate connections"*, Clients are *"Connectors within the host
application"*. It matters because the specification puts consent on the **host**.

**CORRECTED, smaller.** Cadence is not internal plumbing. It is open source at
`cadence-workflow/cadence`; its README still publishes `ubercadence/cli` images, which is the trace
of where it was born.

**Not checked at all**, listed so silence is not mistaken for a check: the Registry/Proxy split,
AutoCrawler, the heartbeat metric, `listTools`, the periodic refresh, the HTTP/gRPC/TChannel mix,
PII redaction, the third-party token exchange, Omni MCP, Response Projection, Code Mode, the
"1000s of tools" figure, the "within minutes" claim.

## The bands, and what failed first

All four from the first commit, each an independent composition rather than a shortened adult text.

| band | words | share | FK | floor / ceiling |
| --- | --- | --- | --- | --- |
| child | 1327 | 0.512 | 0.99 | 0.50 / 5.0 |
| youth | 1596 | 0.616 | 4.12 | 0.60 |
| teen | 1619 | 0.624 | 4.53 | 0.60 / 6.0 |
| senior | 2285 | 0.881 | 6.95 | 0.60 / 10.0 |
| adult | 2593 | — | 6.50 | — |

Ladder monotone; teen **1.47 under** its ceiling. Worst band-pair overlap **0.187** (youth~teen),
worst band-to-adult **0.203** (senior~adult), against the 0.25 near-copy line.

**What failed first, kept rather than smoothed (P60, DR-1306).** The first draft read child
**0.475**, under its floor. A child section on being under authority took it to 0.541. Then my own
gate found that the **adult lesson carried no blocked-road note and no TALK ABOUT IT TOGETHER close
at all** — the identical defect sov79 recorded the night before — and appending both grew the adult
denominator from 2299 to 2593 words, which pushed child **back under** to 0.479 and youth under to
0.589. Both were brought back **by hand**: a child section on the joints of a hand, and a youth
paragraph on reaching never having been the sin. Never a script on authored prose.

## My own gate, and where it was narrower than its name

The gate walks **every one of the 140 strings** in the module — benefits, story bodies, quiz
explanations, talking points, discussion prompts, the facilitator notes, the research/plan/execute
block, the anchor theme, the title — and not a hand-listed set of fields, because sov79's check read
five fields and let a bigIdea reciting two decision records pass. A case asserts the sweep actually
reaches quotations outside the reader places.

The book list is **derived** from the module's own parenthetical references and never typed, because
sov78's typed list omitted Revelation while Revelation 3:7 stood quoted in five places. A case
asserts Revelation is in the swept set and that a drifted Revelation quotation fails.

**And it was still narrower than its name on its first run.** The house writes `Psalm 141:3`; the
corpus file is `Psalms.json`. `scripts/sov80-fill.mjs` falls back to the plural form and my sweep
did not, so it reported **nine false faults against Psalm** — DR-1467's own shape appearing inside
the check written to avoid it. The resolution is now shared between generator and gate and asserted
by name (`bookFileName('Psalm') === 'Psalms'`).

**Residual gap, stated:** this file proves every quotation *is* the verse it names. It cannot prove
the lesson quoted the *right* verse for the point being made — that is the author's eye and the
reviewer's. And it reads only this module, so a collision with a sibling lesson's chapter census is
invisible here; the shared-ledger suites were run by name for that reason.

## What was run

`npm run lint`; `npm run lesson-dates:check`; every named guard step of CI's `app — lint + guards`
job, read fresh out of `.github/workflows/ci.yml` rather than from memory; and the shared-ledger
vitest suites that read the ledgers rather than the catalog — `decision-chain.test.js`,
`course-band-coverage.test.js`, `band-differentiation-gate.test.js`, `talk-together.test.js`,
`quoted-verse-is-the-verse.test.js`, `word-first-coverage.test.js`, `four-band-ladder.test.js`,
`course-four-bands-hold.test.js` — because sov79's 62-suite sweep missed two of those by reading
only catalog importers. Exit codes are in the delivery report.
