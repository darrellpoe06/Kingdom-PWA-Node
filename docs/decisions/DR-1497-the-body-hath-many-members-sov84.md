# DR-1497 — The body hath many members: sov84 from one word over Nemotron

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 84; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1497` and `refs/heads/reserve/sov84` on origin, and a skeleton branch pushed, before a word was written.

## Context

Darrell forwarded ByteByteGo's *How Nvidia's New Nemotron Model Works* (sent 2026-11-02 16:31 UTC) from his university mailbox at **2026-11-03 14:15:52 UTC, 8:15 AM CST**, with **one word** above the forwarded header: *Lesson*. No question, nothing lifted above the header — his word is the ask, the article the occasion. Gmail thread `1a19d26ba0e00ab4`. The intake lane fell behind; built from the backlog on 2026-11-13, a **ten-day gap** kept on the record in every reader place. `lesson-already-built.mjs --thread 1a19d26ba0e00ab4` returned MAYBE on the source name only (sov1–4, sov17, sov20, sov22, sov33, sov39, sov76, sov82 are ByteByteGo) and nothing on the thread. Unlike sov82 the email carried the **complete** article, conclusion and reference list.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| Hybrid per-layer design, grouped-query attention, select-k-of-n routing, LatentMoE projection, integrated MTP, NVFP4 | ESTABLISHED, verified | `raw.githubusercontent.com` + `gh api search/code`: NVIDIA-authored `huggingface/transformers` `configuration_nemotron_h.py` (`:30` explicit `layer_types`; `:53` `moe_latent_size`; `:60` `mtp_layers_block_type`; `:107-108` 32 query / 8 KV heads; `:133,:140` 8 routed / 2 per token), `vllm-project/vllm` `nemotron_h_mtp.py` (544 lines) and five NVFP4 kernel files |
| **A SHARED expert runs for every token** — the article never mentions it | VERIFIED, and BIGGER than the article | same config `:135,:137,:139` — `n_shared_experts: 1`, `moe_shared_expert_intermediate_size: 7688`, `moe_shared_expert_overlap: true` |
| Lightning 30B/3B, 128 experts/6 per token, 32/2 heads, 66 GB → 22 GB, Super 120B/12B, Ultra 550B/55B, GRPO, QAD | NOT CHECKED — told as the newsletter's claim | `developer.nvidia.com`, `huggingface.co`, `arxiv.org` all `curl: (56) CONNECT tunnel failed, response 403` |
| Our own house | MEASURED on this tree | KJV corpus 66 books / 1189 chapters / 31102 verses / 4.2 MB; `scripts/full-levels.mjs:29` floors 0.5/0.6/0.6/0.6; 1373 DR records — each read back in the lesson's test |

Checking made the teaching **bigger**: the config's numbers are class defaults, not Lightning's, so the article's figures were softened to "the newsletter's claim" — while the shared expert it omits became Movement Five, and the interleaving it calls emergent is a declared per-layer list.

All four bands failed the floors on the first commit and were extended **by hand** (DR-1306), never by a script on authored prose. Landed: shares 0.510 / 0.601 / 0.609 / 0.813; FK 1.55 < 4.39 < 5.40 < 9.81 (child ≤ 5.0, teen ≤ 6.0, senior ≤ 10.0); worst band overlap 0.111, worst band~adult 0.096. 168 quoted spans, 19 books, 55 anchor references, every one generator-filled from `app/public/bible/kjv` by `scripts/sov84-fill.mjs` and swept in the lesson's test.

## Impact

Word first on 1 Corinthians 12:12, 12:14, 12:11, 12:18 — one body, many members, the dividing His — quoted ahead of any of the article's own material in all five teaching places. Then eight movements: Isaiah 28:10 and Proverbs 15:28 (a word at a time); Hebrews 12:1, Ecclesiastes 12:12 (the weight of carrying everything); Exodus 17:14, Habakkuk 2:2, Deuteronomy 31:24, 31:26, Jeremiah 31:33, Psalm 119:11, Proverbs 3:3 (the running notes **and** the book, which He asked for in one verse); 1 Corinthians 12:15–12:25 and Romans 12:4-6 (many kept, few called, **necessary**, none discarded); 1 Corinthians 13:1-3, 13:13, Colossians 3:14 (the shared member — Love is the floor, never a specialty); James 1:5, 4:2, Matthew 7:7, Proverbs 2:3-5 (many ways of asking, one source); Luke 6:40, Hebrews 13:8, Philippians 2:5, 2 Corinthians 4:7, Deuteronomy 6:7 (the fixed Master, the lesser vessel, correction where the life is); Acts 17:11, 1 John 4:1, Proverbs 18:13, Revelation 2:5 (the draft that never promotes itself; repentance as returning to the last verified point). Closes on John 1:1, 1:14, Colossians 1:17, John 1:29, John 3:16, Hebrews 1:8 and 1 Corinthians 12:27 — Jesus the Lamb and the Eternal Son of Yahweh, not a draft to be checked but the standard every draft is checked against.

Course-band baseline 305 → 306. `sovereign-ai-class.js` ceiling raised 12957 → 13161 lines, the measured size, debt unmoved elsewhere.

## Decision

1. sov84 is placed in **Sovereign A.I.** (week 84), as prior ByteByteGo forwards were: a household running its own systems must understand what it pays to keep, what it calls on, and what is never switched off.
2. Specific vendor figures are reported **as the newsletter's claim** wherever the primary host is shut, and the one road that opened is named beside them so a reader can tell verified from merely read. `re-review: 2026-11-27`: retry the three hosts from a runner; if they read back, pin the figures and lower the third-pile GAP.
3. The frame gate is measured against the **article's own mechanism terms**, never a source name, so honest provenance standing before the frame can never fail it — the narrower-than-its-name defect seven builds shipped, with a proven-to-catch case for exactly that false fault.

## Verification

`app/src/__tests__/sovereign-ai-sov84-verses.test.js` (33 cases: quotations verbatim, only Scripture in double quotes, anchor exact both ways, the frame before the article's material, provenance present and before the frame, the ten-day gap, shut roads with the dated re-review in all five teaching places, the opened road and the shared expert in all four bands, corpus/floor/record figures read back from their sources, adversary never capitalised, Yahweh in our voice, the KJV's "God" left verbatim inside quotes, the TALK close, the ladder; **proven-to-catch** for a drifted verse, a wrong reference, a missing book, a quoted person, material before the frame, a Scripture-less place, a capitalised adversary, a stripped date, a thin band, a repeated band, a drifted figure — and a case asserting the frame gate does **not** fire on provenance). Guard chain, `lint`, `lesson-dates:check`, `decision-chain` and `course-band-coverage` run on this tree; the one gate my own first draft caught was three quoted words in Movement One.
