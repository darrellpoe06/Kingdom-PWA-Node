# DR-0407 — "College was free until 1965": debt, access, and the Word's economics (World Issues 11)

- **Status:** accepted
- **Tier:** B (COLG/family-facing teaching content on a charged real-world claim)
- **Date:** 2026-09-15
- **Scope:** `app/src/lib/world-issues-class.js` (new issue `wi-tuition-and-the-1965-act`, `weeks` 8→11), `app/src/__tests__/world-issues-verse-integrity.test.js` (Issue 11 verse gate)
- **Principles:** WORD-FIRST, SPEAK-ESTABLISHED-FACT (DR-0100), VERIFICATION-DOCTRINE (DR-0076), TEACH-THE-WORD-DO-NOT-DEBATE-IT (CLAUDE.md), DECISION-RECORDS (DR-0011)
- **Grounds:** CLAUDE.md "Spoken Teachings Are Build Input — Always Add It"; the Worldview spine's *original business systems — biblical economics, the seven-year cycle, debt-jubilee patterns*; `SCRIPTURE-REFERENCE-STANDARD.md` (verbatim KJV, gated)

## The report

Darrell, 2026-09-15, pasted the transcript of a "Learning with Lindsay — Wait, Really?" video with the single word **"Lesson"** — build input. Its argument: colleges charged little or nothing under the 1862/1890 land grants; the Higher Education Act of 1965 (which the video calls part of the Civil Rights Act) expanded the student-loan program; tuition then appeared and spiked to "40 times" its old cost — "312%" inflation-adjusted; and, the creator's reading, college was free while students were mostly white and became expensive "as soon as Black and brown students were given better access." The transcript is cut off mid-sentence; only what it says is carried.

## Placement

The **World Issues** track (`world-issues-class.js`), not Living Lessons: it is built to examine real-world **claims** through the Word — labeled claims, sourced facts with as-of dates, steelmanned perspectives, the believer's lens, and a machine-checked safeguard gate (`auditIssue`). That is exactly the shape a charged historical claim needs.

## DR-0100's three tiers, applied (verified by live web search 2026-09-15)

1. **Established fact, stated plainly:** the Morrill Act of 1862 (57 land-grant institutions, a system that in practice served white students) and the Second Morrill Act of 1890 (states must admit Black students or found a separate Black land-grant — 19 HBCUs); the HEA signed **1965-11-08** by Johnson, whose **Title IV-B** created the Guaranteed Student Loan Program of government-backed private lending — precisely the mechanism the creator describes; and a **~312% inflation-adjusted** rise in public tuition since 1963 (NCES-derived) — **the creator's own number is right**. Sources: National Archives, USDA NIFA, Encyclopedia.com, Journal of American History, BestColleges/NCES, EducationData.org, Richmond Fed, NBER, Education Next, Cato — each carried with an as-of date the audit gate requires.
2. **Genuinely open, flagged narrowly:** *why* tuition rose is a real scholarly debate (the Bennett hypothesis of aid capture — mixed but real evidence; state cost-shifting — contested magnitude). The creator's **"because Black students got in"** is a claim about **motive** laid over a true coincidence of timing; no decree or court adjudicates it, and the lesson invents no verdict. It is carried as the creator's **opinion**, with the economists' explanations steelmanned — and what they answer (the mechanism) and leave standing (where the burden landed) both marked.
3. **Over-statements trimmed so the true claim survives:** "even the most renowned institutions were free" (elite privates charged tuition throughout); "in that same year it spiked" (the 1960s were modest; the 1980s were the steep decade); "part of the Civil Rights Act" (a separate Great Society statute of the same era and purpose). "40 times" is nominal and carried as the creator's figure.

## The Word settles what the debate cannot — the fruit

**Word first:** debt is bondage (Proverbs 22:7); usury on the poor is forbidden (Exodus 22:25); release is scheduled (Deuteronomy 15:1-2) and liberty proclaimed in the jubile (Leviticus 25:10); every system is measured by the just weight (Proverbs 11:1; 20:23); no respect of persons — hear the small as the great (Leviticus 19:15; Deuteronomy 1:17; Acts 10:34; Galatians 3:28); woe on decrees that fall on the needy (Isaiah 10:1-2); heavy burdens on men's shoulders named by Jesus (Matthew 23:4). **Nehemiah 5 is the template:** the cry, the mortgaged inheritance, the children in bondage, the leader who names the deed rather than litigating motive — "Ye exact usury" — and the remedy the Word always demands: "Restore, I pray you, to them, even this day," and they restored. Whatever any lawmaker intended, a system that finances access with decades of debt laid heaviest on the least-resourced is, by Yahweh's measure, a false balance and a heavy burden; the remedy is release and restoration, and the Body that raised the HBCUs is the one to build it.

## Verification

- **Audit gate:** `auditWorldIssues()` passes for the new issue with **zero violations** (labels, attribution, sources with as-of dates, ≥2 steelmanned perspectives, string lens fields, accountability with the two courts visible in benefits, child rendering screened).
- **Verse gate:** 31 verses / 33 fragments fetched from `app/public/bible/kjv` at authoring time and pinned in `world-issues-verse-integrity.test.js` — verbatim against the corpus, present in the issue, with a one-word-tamper proof (Proverbs 22:7 "servant"→"master" fails). DR-0100 tiers pinned: the causal claim's label is `opinion`, the 312% note says it matches NCES, `f-tuition-growth` is `documented`, `f-drivers-debated` is `partly-documented`; "WORD FIRST" leads the deep source; the grace note condemns no one.
- Full suite + lint run before push (result in the PR).

## Limits, stated

- The transcript is truncated; nothing beyond it is attributed to the creator. The video URL was not in the paste, so `source.url` is empty and the series is named; add the link when Darrell supplies it.
- The disproportionate debt load on Black borrowers is widely reported but was **not** independently verified in this session, so the lesson speaks of "the least-resourced" and "families with the least wealth to begin with" rather than asserting a specific racial statistic — honest reticence, not denial. **re-review: 2026-09-22** to add a sourced figure.
