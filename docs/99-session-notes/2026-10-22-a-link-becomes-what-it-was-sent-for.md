# 2026-10-22 — A link becomes what it was sent for (DR-1202)

**Asked (Darrell, from the Research list):** an Instagram reel marked *Lesson* sat "Waiting to be looked into"; an earlier link "Could not be looked into". Make research become a lesson, Word first, as the new normal after this trial; the other link is for PoeTech features; build the whole process; why did no road turn a video's audio into words; all capacity, many paths, parallel, no bottlenecks, nothing overlapping, intuitive, tested.

## What was found (measured, not assumed)

- Run 39697937798 failed the 22:43 link: the lane read YouTube captions only.
- The lane's own comment skipped audio as "a decision to take on purpose" that nobody took.
- GitHub ran the 15-minute schedule three times in six hours; the reel had nothing looking at it.
- The NAS lesson builder already takes any `lesson` row the moment it lands (0243 trigger) and works Word first with every verse checked against the KJV; nothing filed one from research.

## What changed, and why

| file | change | why |
|---|---|---|
| `infra/nas-research/link_words.py` (new) | any public link's audio → the Whisper ladder; media handed from another road; two-slot CPU gate; volume work folder | the missing road; capacity without overloading the NAS |
| `infra/nas-research/research_bell.py` (new), `install.sh` | the NAS clock rings the lane | GitHub's schedule is throttled |
| `.github/workflows/research-inbox.yml` | pick (batch claim) → work (4 in parallel, own folders) → backlog; captions → audio → runner road; reading in the same pass; filing; re-open input | speed, parallel, no overlap, one pass |
| `scripts/research-inbox-waiting.sql` | claims up to six with SKIP LOCKED | two runs never take one item |
| `scripts/research-create.sh`, `research-create-text.mjs`, `research-create-waiting.sql` (new) | files a Word-first lesson row and/or a build request in one statement | becomes what it was sent for, never twice |
| `app/src/lib/research-create.js` (new), `research-items.js` | intents, the source in parts, what was filed; superseded failures ignored | one module for what is filed and what is shown |
| `ResearchSection.jsx`, `CreateFromWords.jsx` | *What is it for?*; the card in reading order; whole words + copy; *already filed* | easy to use; no duplicate lesson |
| `ci.yml` | both NAS selftests | proven in CI |
| DR-1202, `FROM-A-LINK-TO-WHAT-IT-WAS-SENT-FOR.md`, `docs/CONTEXT.md` | the decision and the process | the comprehensive process he asked for |

## Proof

- `link_words.py --selftest` 35 ok; `research_bell.py --selftest` 12 ok; each proven to catch.
- `a-link-becomes-what-it-was-sent-for.test.jsx` 24 ok (runs the real Python renderer); proven to catch twice.
- Local PostgreSQL 16: claim, backlog, build filed + record, refused a double, research only, lesson filed Word first.
- Lint 0; `verify:gates` 0; research, decision and ledger suites 226 green.

## Next (dated)

- On merge: re-open the 22:43 link for *build*, dispatch the lane, read the live rows for both items. The trial lesson is read for Word-first and verbatim verses.
- `re-review: 2026-10-29`: readings past 24k characters; Instagram login walls; the trial lesson.
