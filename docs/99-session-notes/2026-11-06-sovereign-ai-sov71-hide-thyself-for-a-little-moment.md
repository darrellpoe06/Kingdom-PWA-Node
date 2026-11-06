# sov71 — Hide thyself for a little moment (DR-1361)

**Date:** 2026-11-06 · **Branch:** `claude/sov71-the-silence-that-protects` · **Record:** [DR-1361](../decisions/DR-1361-hide-thyself-for-a-little-moment-sov71.md)

The narrative half of DR-1361: the measurements in full, every refusal quoted, and the
seven defects my own gate found in my own work before anything shipped.

---

## 1. The source, and the limit of what this build ever had

Gmail thread `1a163ce16938ed48`, a **1440 Daily Digest** of 2026-10-22, forwarded 13:30,
with **one word** typed above the forwarded header: `Lessons`.

**No Gmail tool was called.** The item's words reached this build as a verbatim quotation
of the forward. So two things are true and both are said out loud in the lesson:

1. **The digest itself was never opened by this build.** The item headed *Internet
   Insecurities* is the only part of it this build ever held.
2. **DR-0312 §6 was not completed.** That Way asks for the thread to be marked with the
   Gmail label `Lesson-Captured` so no send is built twice. The label was **not** applied,
   because this build was directed not to call a Gmail tool. The thread id carried in the
   record is the only marker left behind, and `one-thread-one-record-guard` is what will
   catch a second build from it. Flagging it here rather than letting it pass silently.

**One item of many, and the rest is not spent.** The digest also carried the Russia/Ukraine
talks, a Supreme Court order on transgender inmates, a circadian-depression study, a Meta
privacy fine, a chemical tank explosion and a run of culture items. **None was built.** The
rule is one TEACHING one lesson, never one SOURCE one lesson (DR-0610 as DR-1317 fixed its
meaning), so every one of them remains available to a later week. On the court item the
source supplies a second reason itself — *the high court did not sign or explain the order* —
so there is no reasoning in it to teach from, and what the Word says about who a person is
was never going to be derived from a stay of a prison regulation.

The gate pins this: the declaration paragraph must name each unbuilt subject, and each
unbuilt subject must appear **nowhere else** in the module. Named as unbuilt, never taught.

---

## 2. Trust but verify: every road, and what it returned

**Not one primary source was opened.** Quoted, never described (DR-0076 §8):

| Host | Returned, verbatim |
|---|---|
| `www.php.net/ChangeLog-8.php` | `curl: (56) CONNECT tunnel failed, response 403` |
| `nvd.nist.gov` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.cisa.gov/news-events/alerts` | `curl: (56) CONNECT tunnel failed, response 403` |
| `php.watch` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.bsi.bund.de` | `curl: (56) CONNECT tunnel failed, response 403` |
| `www.php.net` (fetch tool) | `getaddrinfo ENOTFOUND www.php.net` |
| `www.csa.gov.sg` (Singapore's own advisory) | `getaddrinfo ENOTFOUND www.csa.gov.sg` |
| `itdaily.com` | `getaddrinfo ENOTFOUND itdaily.com` |

The agent proxy's own status endpoint confirms the first class as policy denial:
`"kind": "connect_rejected"`, `"detail": "gateway answered 403 to CONNECT (policy denial or
upstream failure)"`.

So **every** check below is a **mediated read** — a search over *secondary* coverage, not a
page opened. The lesson labels it a mediated read in all four non-child places, and the
child band carries the same claim in plain words. A mediated read never passes as a direct
one.

### The three tiers (DR-0100), as they actually came out

**DOCUMENTED** — corroborated across several independent secondary sources, and therefore
stated plainly rather than softened into some-people-say: two unauthenticated
remote-code-execution faults in core PHP, nicknamed **php2shell**, **CVE-2026-109618** and
**CVE-2026-109619**; **CVSS v4.0 9.2**, which is exactly the 9.2-out-of-10 the digest
reports; repairs published **2026-10-21** in PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35; cyber
agencies across Europe and in Australia, Japan, Britain and the United States telling
administrators to patch at once or take the server off the internet; and government services
switched off deliberately — the Dutch DigiD and MijnOverheid, local government sites in
France at **ANSSI's** request, the Belgian foreign ministry's pages, with **Belgium's cyber
centre reporting no attacks recorded against Belgian sites**, which is what makes the second
movement teachable: those services went dark **before** a blow landed, not after.

**ATTRIBUTED** — the publication's numbers carried as the publication's: roughly **70%** of
web sites, the discovery by a researcher using artificial intelligence in **August**, and the
named list of **six** countries.

**UNCHECKED, and staying unchecked** — that exact six-country list (the reachable sources
disagree, and several add the Czech Republic, Australia and Britain, which the digest never
names); whether any attack actually succeeded anywhere; and the 70% figure, repeated
everywhere and measured by nobody this build could reach. `re-review: 2026-12-06` — re-read
once either blocked host is allowed.

---

## 3. What the checking CHANGED (DR-0190 §5)

**It reversed the draft's core assumption, and that is the most useful thing that happened
in the build.**

The draft was written around a clean picture: a disciplined team held the fault quiet,
finished the repair, and released on its own schedule. The digest's own sentence supports
that reading — *Engineers did not publicize the issue to avoid highlighting vulnerabilities
hackers could exploit.*

The mediated read says otherwise. The **PHP Foundation's own account** is that it was
**caught off guard**; that the disclosure was **clumsy**; that the hold on the information was
broken **ahead of the planned hour by another company**; and that details **leaked** before the
announcement. Further: earlier evidence of one of the two faults surfaced in an **outside
audit during 2024**, after which the remedy **stalled for months**.

So the discipline this week teaches is right, **and in this very instance its execution
failed.** That is a stronger lesson than the tidy one, and it produced the sentence the gate
now pins at every site:

> **An agreement is not a mechanism.**

A quiet hold is a promise kept by every single person who was told, and it lasts exactly as
long as the least careful of them. We are not grading anyone's character; we are reading the
mechanism.

---

## 4. The same event, three landings

| Lesson | Source | Landing |
|---|---|---|
| **sov66** (DR-1322) | Morning Brew thread `1a163a78c1d14d84`, **the same day** | **unpriced protection** — a risk ranked low because the attacker was assumed weak |
| **spm11** (**#2570 / DR-1358**, in flight) | University of Illinois cPanel advisory | **the local operator's chair** — an unsupported version cannot be patched, a mitigation is not a fix, no road back |
| **sov71** (this one) | 1440 Daily Digest `1a163ce16938ed48` | **the disclosure ethic and sovereignty** — the two-sided test for silence, darkness chosen on purpose, a capability with no loyalty |

Measured, not asserted: **zero shared teaching references** between sov71 and sov66 outside
the seven standing Godhead-confession and growth verses every lesson in the course carries by
construction. The gate makes that claim and then proves the filter is excluding something
real, so an empty scan cannot pass as a result.

**Three references the taught catalog had never opened** — in no file of `app/src` or
`docs/decisions`, excluding `app/public/bible/xref/`: **Isaiah 26:20**, **Leviticus 13:46**,
**1 Timothy 1:8**. Isaiah 26:20 is the ground the second movement stands on, and the library
had never once taught it.

**One overlap worth naming rather than hiding:** Nehemiah 7:3 carries the phrase *every one
to be over against his house* that sov70 and sov66 take from **Nehemiah 3:28**. Different
verse, different reading — here it is the **gate shut on a timetable**, not proximity of
assignment (sov70) and not repairing your own exposure (sov66). Nothing was dropped for it.

---

## 5. The seven defects my own gate found in my own work

Every one of these was caught on the gate's **first run**, before anything was pushed. This
is the part of the build worth keeping.

1. **A quiz distractor named Bishop Gwin** — for a send that names nobody. The exact DR-0719
   fault sov70's record had already recorded and removed once. **Removed**, not left as a
   wrong answer.
2. **The youth band had no DOCUMENTED / ATTRIBUTED / UNCHECKED tiers.** Added in youth words.
3. **The teen band had none either.** Added.
4. **The senior band had none either.** Added.
5. **The senior band never said the rest of the digest was untouched** — it said the items
   were *left where they were*, which the check did not recognise and which was weaker prose
   anyway. The **lesson** was fixed, not the matcher.
6. **A case claimed sov71 and sov66 share NO reference at all.** It went red on the seven
   standing verses every sibling in the course carries. That was a wrong premise *in my own
   gate*, not a typo: the claim was corrected to the honest one (no shared **teaching**
   reference), the standing seven are named in the file, and the case now also proves the
   filter is excluding something real.
7. **A case forbade the words `inmate`, `circadian` and `reparation` outright** — and went
   red on the very sentence that **declares those items unbuilt**. Naming something as
   unbuilt is not the same as teaching it. The case now asserts each unbuilt subject appears
   **only** inside the declaration paragraph, which is what it should always have said.

Two more findings from the authoring rather than the gate:

8. **The band ladder had to be tuned twice, by measurement, not by feel.** The teen band first
   read **6.63** against its 6.0 ceiling. Shortening its sentences overshot to **3.15** —
   *below* the youth band, which inverts the ladder and is a different defect. Final, measured:
   child **1.33**, youth **3.26**, teen **4.48**, senior **8.19**, strictly rising, adult 7.67.
9. **Nothing in this gate asserts about the tree.** No git ref, no branch state, no neighbour
   having merged. Two cases elsewhere had passed in a worktree and gone red in CI that day
   for exactly that reason; the index claim here is pinned with `indexOf` plus a contiguity
   sweep over weeks 1–70, never with a last-element claim (DR-1316).

---

## 6. The numbers, measured

- **Modules:** 70 on `origin/main` at `3a073d0c3`, contiguous 1–70, ordered → sov71 at index 70, `[1..71]` contiguous.
- **Spine:** 35 references, each fetched from `app/public/bible/kjv` **before a word was written**, each pinned verbatim, each quoted in the adult lesson with its citation.
- **Bands (our prose only, quotes excluded):** adult 2222 words; child 1183 (0.532), youth 1575 (0.709), teen 1811 (0.815), senior 1942 (0.874), against floors 0.50 / 0.60 / 0.60 / 0.60.
- **Worst overlap:** 0.112 against the 0.25 near-copy line.
- **Gate:** 44 cases. **Whole Sovereign A.I. gate set:** 45 files, 1963 tests, green together.
- **lesson-dates:** regenerated, 896 of 896 dated, 0 undated.
- **Band baseline:** regenerated by `course-band-baseline-write.mjs` — total 460, allFour **286**, adultOnly 0, adultRegister 0. Sovereign A.I. row `{lessons: 71, allFour: 50}`. **The debt did not move.**
- **File budget:** `app/src/lib/sovereign-ai-class.js` 10289 → **10622**, the measured size, fifth recorded raise.
- **Record:** 50 lines against the 60-line ceiling (DR-1339).

---

## 7. Still open

- `re-review: 2026-12-06` — re-read the PHP advisory and the national agency notices at the
  source once either blocked host is allowed, and settle the six-country list and the 70%
  figure. Until then both stay where they are: attributed and unchecked.
- `re-review: 2026-11-27` — whether `digest` and `programming language` belong in
  `plain-before-the-term.js`'s `HARD_TERMS`. Measured today: both already appear un-glossed in
  neighbouring lessons, so a registry entry would turn red a lesson this build never touched.
- **DR-0312 §6 is incomplete for this thread**: no `Lesson-Captured` label was applied,
  because this build was directed not to call a Gmail tool. A later session with the Gmail
  lane open should apply it.
