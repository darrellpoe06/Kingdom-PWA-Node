# Research-Review — PoeTech Study Edition: sovereign base text + license, and the first build increment

**Date:** 2026-06-25 · **As-of (all license findings):** 2026-06-25 · **Branch:** `feat/poetech-study-edition`
**Driver (Darrell):** "Create our own Bible based on the Bible — for clarification and to use it as we want within the context of Yahweh." Full freedom to use, display, annotate, and build on it, with no licensing limits, plus a PoeTech / Yahweh-context clarification layer. Came right after ESV copyright friction.

> **The one-line answer.** Reproduce the **World English Bible (WEB, public domain)** as the modern-English base and the **KJV (US public domain)** as the traditional base; do original-language word study from **Robinson–Pierpont RP2018 (PD Greek)**, **OpenScriptures morphhb / STEPBible (PD Hebrew + CC-BY tags)**, and **Strong's 1890 (PD)**. **Avoid SBLGNT** (EULA / diglot hazard) and every copyrighted modern version (ESV/NIV/NLT). The base text is free; the **clarification layer is ours**; therefore the whole edition is sovereign and unrestricted.

This is a faithful **study / clarification edition** that illuminates the Word — **not a rewrite of it**. The integrity line (text is text, commentary is commentary, always labeled) is binding and machine-checked (see §4).

---

## 1. The licensing screen (verified, with sources)

Licenses verified 2026-06-25 against primary/authoritative sources. A separate verification agent did the survey; findings cross-checked against the canonical pages below. Re-confirm SBLGNT and WLC verbatim license text by direct read before any printed/legal licensing page.

| Source | License | Reproduce / modify / redistribute / commercial? | Source | Caveats |
|---|---|---|---|---|
| **World English Bible (WEB)** | **Public Domain** (explicit dedication) | **Yes / Yes / Yes / Yes** | worldenglish.bible · ebible.org/eng-web/webfaq.htm | TEXT is PD + modifiable; the **name "World English Bible" + logo are trademarks** — a *modified* text must be **renamed**. We reproduce VERBATIM and label it WEB, so the trademark is honored. WEBBE (British) + Messianic Edition also PD. Pin a dated revision. |
| **King James Version (1611)** | **Public Domain (US)** | **Yes (US)** | en.wikipedia.org/wiki/King_James_Version | UK only: the Crown holds a perpetual royal-prerogative right (Cambridge/Oxford), preserved by §171(b) CDPA 1988. **Does not affect US use.** UK distribution = a separate legal question. |
| **American Standard Version (1901)** | Public Domain | Yes | en.wikipedia.org/wiki/American_Standard_Version | Copyright expired. The WEB is itself a PD revision of the ASV. |
| **Young's Literal Translation** | Public Domain | Yes | (1862/1898, PD) | Hyper-literal; useful as a study cross-check. |
| **Darby Bible** | Public Domain | Yes | (1890, PD) | — |
| **Westminster Leningrad Codex (Hebrew)** | **Text PD** + morphology **CC-BY 4.0** | Yes, with attribution on tags | github.com/openscriptures/morphhb (LICENSE.md) | **Source from `openscriptures/morphhb`** (PD text + CC-BY tags). **Do NOT** source a WLC carrying **CC-BY-NC-ND** (some Groves-Center/Bible.com distributions) — NC-ND forbids our commercial + derivative use. |
| **STEPBible TAHOT / TAGNT / TIPNR** | **CC-BY 4.0** | Yes, with attribution | github.com/STEPBible/STEPBible-Data | Strong's-tagged morphology + proper-name linking. Usable in any software/publication without requesting permission. If reproducing **SBLGNT-specific** variant readings embedded in TAGNT, the SBLGNT EULA may attach to that slice — SME/legal question. |
| **Byzantine Majority Text — Robinson–Pierpont 2018 (Greek)** | **Public Domain** | Yes / Yes / Yes / Yes | github.com/byztxt/byzantine-majority-text | Cleanest free Greek. Use **RP2018** (2005 had accent errors). |
| **Textus Receptus (Greek)** | Public Domain | Yes | (Stephanus/Beza/Scrivener, PD) | Pick + pin a specific PD edition (e.g. Scrivener 1894). |
| **Strong's Concordance (1890)** | Public Domain | Yes | en.wikipedia.org/wiki/Strong's_Concordance | Use the **plain 1890** text; some modern "enhanced" Strong's adds copyrighted edits. |
| **SBL Greek NT (SBLGNT)** | **NOT PD — custom EULA** (marketed "CC-BY") | **Ambiguous → AVOID** | sblgnt.com/license | EULA bars **standalone sale**, requires a **license for any Greek-English diglot** (a study edition *is* one), and is **silent on modification**. Genuine ambiguity, not a yes. **Use RP2018 instead.** |
| **NET Bible translators' notes** | **Copyrighted — AVOID** | No | bible.org/permissions | Contrast/avoid example: the NOTES are fully copyrighted; do not bundle or reformat them. |
| **ESV / NIV / NLT / NKJV / AMP** | Copyrighted — AVOID as a base | No (quote within limits only) | publishers | Never base our text on these. Link out for reading (existing `readOnline()`); never reproduce. |

**Recommendation (base text):** reproduce **WEB + KJV** in full; build the word-study layer from **RP2018 + morphhb/STEPBible + Strong's 1890**. This is what the build increment implements (WEB + KJV live; the original-language datasets registered + cleared, ingest next).

---

## 2. Sovereign-mesh-compatibility screen

| Dimension | Result |
|---|---|
| **Runs off-cloud / sovereign** | **Yes — fully.** The reproduced text ships as static JS modules in the PWA bundle (no API, no key, no per-request call). Already works on the NAS Caddy deployment and offline (PWA). No external dependency at read time. |
| **No external licensing tether** | **Yes.** Base text is PD/CC-BY; clarification is ours. Nothing phones home; nothing can be revoked. This is the structural point of the whole effort. |
| **Generation pipeline (text ingest)** | One-time `bible-api.com` fetch at build/generation time only (how `scripture-kjv.js` was already built). Verbatim text is then committed; the fetch is never on the read path. For full-Bible ingest, source bulk PD text from ebible.org (whole-Bible USFM/JSON downloads) rather than per-verse API calls. |
| **Mesh / multi-instance** | Compatible. Static text + pure resolvers (`editionText`, `buildStudyEntry`) are instance-agnostic; no per-instance state. Clarification is platform content (like `scriptures.js`), not user data. |
| **Word-study datasets** | morphhb / STEPBible / RP2018 are Git repos — clone + vendor into the build, sovereign. No runtime service. |

## 3. Cost screen

| Item | Cost |
|---|---|
| **Licensing** | **$0, perpetual.** PD = no fee ever; CC-BY = $0 + attribution. This is the whole point: no recurring license, no cap, no revocation. |
| **Generation (one-time)** | WEB seed: 180 verses fetched verbatim in one run, **$0** (free public API, rate-limited ~6 min). Full-Bible ingest later: bulk PD download, **$0**. |
| **Runtime** | **$0 marginal.** Static modules in the existing bundle. Seed adds ~the same size as the KJV file (180 verses, gzip a few KB inside the lazy-loaded Scripture chunk). |
| **Clarification authoring** | Human/SME time (Bishop/Darrell) + optional local-LLM drafting on owned hardware (sovereign, $0 marginal). No paid API required. |
| **Vs. the rejected path** | Licensing a copyrighted modern version for app use = recurring fees + usage caps + display restrictions + revocation risk. Sovereign PD = none of that. |

---

## 4. The integrity architecture (binding) — what makes it a study edition, not a rewrite

Two layers, **structurally distinct, clearly labeled, never merged**:

- **SCRIPTURE TEXT** (`scripture-kjv.js`, `scripture-web.js`): public-domain base text, **reproduced verbatim**, version + license labeled. **Not ours to reword.** Resolved through one place (`editionText()` in `scriptures.js`).
- **CLARIFICATION** (`study-edition.js`): plain-language + the 4D frame (deep source → plain → benefits) + Yahweh-context + Strong's word study + honest textual notes + evenhanded doctrine. **Ours**, marked commentary, never presented as the inspired text.

**The guardrail is machine-checked** (`checkSeparation()`, DR-0076 proven-to-catch): it verifies every displayed Scripture string is **byte-equal to the verbatim PD source** (so no clarification can be substituted in), that no commentary key leaks into the text layer, and that the clarification layer is labeled as ours. The test suite **tampers** (drops clarification into a text field) and asserts the guardrail **catches** it — a green check that means something. The UI runs the same check before render and refuses to show an entry that fails, rather than blur the line.

> This is the difference between an **amplified study Bible** and **altering Scripture**. We hold it in code, not just in intent.

**The honest-text proof, visible in the seed:** `1 John 5:7` — the **Comma Johanneum** ("the Father, the Word, and the Holy Ghost: and these three are one") is **present in the KJV** (from the Textus Receptus) and **absent from the WEB** (and the earliest Greek). Our edition shows **both base texts side by side** so the reader sees the difference directly, and flags it in an honest textual note — we don't hide it or pick for them. Likewise `John 3:16`: KJV "only begotten" vs WEB "one and only" (both translate μονογενῆ / G3439) — shown side by side, explained, never reworded.

---

## 5. What was built (first increment)

- **`app/src/lib/bible-editions.js`** — the sovereign edition registry: license metadata encoded as enforceable data; `verifyLicenses()` asserts nothing is reproduced in full unless its license is genuinely free; an `AVOID` list (SBLGNT, ESV/NIV/NLT, NET notes) so a future contributor doesn't reach for them by habit.
- **`app/src/lib/scripture-web.js`** — **180 WEB verses fetched verbatim** (the same reference set the KJV file carries; 0 failures), generated by `app/scripts/gen-scripture-web.mjs`. Public domain, modern English. The sovereign modern base.
- **`app/src/lib/scriptures.js`** — extended (not forked): `webText()` + a generic `editionText(versionId, ref)` resolver, so any PD edition is added once, in one place.
- **`app/src/lib/study-edition.js`** — the clarification layer + the integrity-separation primitive (`buildStudyEntry`, `checkSeparation`, `CLARIFICATIONS`). Seed clarifications: `John 3:16`, `Acts 4:12`, `2 Corinthians 5:17`, `1 John 5:7` (the Comma flagship), each with plain + 4D + Yahweh-context + Strong's word study; `1 John 5:7` carries the Comma note + evenhanded Trinitarian/Oneness views flagged for SME.
- **`app/src/components/ScriptureLibrary.jsx`** — a **Study Edition reader** built into the live Scripture surface: side-by-side PD editions (version + license labeled) above a visibly-distinct, dashed-bordered clarification block headed "study notes, not Scripture." Live-verified in the browser.
- **`app/src/__tests__/study-edition.test.js`** — proven-to-catch gate (license invariant, verbatim equality, separation tampering caught 3 ways, Comma present-in-KJV/absent-in-WEB, evenhanded views + SME flag).

---

## 6. SME questions flagged (doctrine = Bishop / Darrell, not invented)

1. **Godhead emphasis on `1 John 5:7` and across the edition.** Both Trinitarian and Oneness are stated as their adherents hold them, Word-first and evenhanded. *Which framing the edition emphasizes, and how, is a doctrinal call for the SMEs* — the system presents, it does not settle.
2. **How prominently to surface the Comma Johanneum note** (pastoral framing vs. textual-critical detail) — honesty is held either way; the tone is an SME call.
3. **Translation philosophy for any future PoeTech-rendered readings** — the current edition reproduces existing PD translations verbatim; if we ever produce our *own* English rendering from the original languages, that is a new, larger decision (and per the trademark caveat it must not be called WEB).
4. **UK distribution of the KJV** (Crown prerogative) — legal, not doctrinal; flagged if we ship to the UK.

## 7. Next increments

- Ingest the full WEB + KJV Bibles (bulk PD download from ebible.org), beyond the curated 180-verse seed.
- Vendor RP2018 + morphhb/STEPBible + Strong's 1890 and wire Strong's-tagged word study from real datasets (replacing the hand-seeded word entries).
- Expand the clarification corpus theme-by-theme, SME-reviewed.
- Surface the Study Edition in lessons / presenter / discernment via the same `buildStudyEntry()` primitive.

---

*Sources as-of 2026-06-25. King James Version + World English Bible — Public Domain, reproduced verbatim. Original-language datasets PD / CC-BY, attributed. Clarification © PoeTech. Truth in love, no condemnation — for the soul's sake.*
