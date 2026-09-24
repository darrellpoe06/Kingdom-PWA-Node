# Hold the Hand of the Process

**Status:** Foundation (one of our Ways). Declared by Darrell 2026-09-24. Recorded as **DR-0621**. Principle ID **HOLD-THE-HAND** (see `docs/decisions/PRINCIPLES.md`).
**Pairs with:** DR-0076 (verification doctrine), DR-0219 (SHOULD → ARE → GAPS → CLOSE), DR-0236 (nothing waits), DR-0239 (comprehensive review; dimension 6, findings are work), DR-0108 (review our ways), and the continuous-loop rule being built on `claude/every-workflow-seeds-the-next` (every workflow's output seeds the next; the live data is the proof).

---

## In his words

> "We should have no reason why their interconnectivity of the application is not sound and solid. We should have rigorous connection points between the database and fields within the app that go through workflows that are in the end continuous loops that produce data. The data should be the proof of the end, whole end to end process. So we can actually see, and that data should seed the next process. And so that's what I mean when I say end to end, it is not to end with one workflow. All workflows will work, will flow into another workflow and all those will have a comprehensive overall solid sound workflow."

> "It's more than just flagged when it doesn't work. It's actually analyzed and iteratively fixed. So it's done. So we can use it now. This is called holding the hand of the process until the process is totally, completely done, working end to end, all workflows integrated. New workflows come in to come into the integration of the workflow. There's no reason to have code or workflows that are not working if they don't integrate into another one. There's a purpose for every workflow. That's standard. ... we want to make sure that we are iteratively developing our systems to guarantee outcomes right away."

> "We don't get rid of what doesn't work. What we do is we work on it until it works. But the things that do work, those things are live. ... when we have failures from feedbacks that come from users or from me directly or from anything, any direction you get it from intake, however it comes, it should go through our workflow system and be categorized in a way where if it's low hanging fruit, then we fix it. The system fixes it automatically ... but if it's something that we already we've already done we've already looked at we've already ascertained and said we're not doing then there's an explanation and then there's a reason why ... so there's processes that should produce outcomes so people can feel heard ... i don't want humans to have to communicate that i want the PoeTech whole ecosystem to do the work ... the leg work of guaranteeing high quality outcomes and hand holding stakeholders through processes and coming up with timelines and windows ... So actions speak louder than words. That's the type of app we're trying to build in Jesus' name. Just like the King is."

(Darrell, 2026-09-24, spoken, three teachings in sequence.)

---

## What "done" means

A process is **done** only when all of these are true:

1. **It works end to end.** It works in the live system people use, from the field where the data enters to the place where the result is used.
2. **The live data proves it.** Real rows with real timestamps show that it ran. A green check on a pipeline is not proof that the product works.
3. **Its output seeds the next process.** It is integrated into the whole. A workflow that ends without feeding anything is a dead end unless it is a named final sink with a stated reason.
4. **People can use it now.** It is not waiting on a later session, a switch someone has to flip, or a note that says "follow-up".

"Flagged" is not done, and neither is "named" or "tracked". A flag is where holding the hand starts.

---

## The Way: holding the hand of the process

When a process does not work, or does not yet join the whole, the one who found it carries it through this loop without letting go:

1. **Detect.** A gate, a monitor, a probe or a person sees that it is not working or does not connect.
2. **Analyze.** Find the root cause in the real code and the real data. Do not guess, and do not use "it's probably flaky". Measure it.
3. **Fix.** Change the thing that is wrong: the wiring, the query, the missing consumer, or the loop that doesn't close.
4. **Re-measure on the live data.** Run the same check again against the real system.
5. **Repeat** steps 2 to 4 until the live data proves it works.
6. **Integrate.** Confirm its output seeds the next process, and that the next process's proof now includes it.

Only after step 6 is it done. Then the same hand moves on to the next process.

**Worked example (2026-09-24).** The transcript harvest monitor raised a stall alarm. That was the Detect step. Holding its hand meant the following:
- **Analyze.** It was reading a retired database.
- **Fix.** It was moved to the live database.
- **Re-measure.** It still read "stalled".
- **Analyze again.** It measured retries on a column that never moves, and it counted "no captions" answers as owed.
- **Fix again.** Both counts were corrected.
- **Re-measure.** 754 transcribed plus 120 answered as no-caption made 874 of 874, with nothing owed.
- **Integrate.** The monitor closed its own incident.

The alarm was not simply silenced or left open; the process was carried until the data told the truth (DR-0618).

---

## We work on what does not work until it works

- **Nothing is discarded for not working.** A workflow that fails is worked on, held by the hand, until it works. What works is live and stays live.
- **Every workflow states its purpose, and the purpose is one Darrell has expressed.** Examples: uptime, lessons from every door, content harvest, repeatable governance, and store packaging.
- **Every workflow states its place in the whole:** what it reads, what it writes, and what its output seeds next. A workflow that joins nothing yet is connected to the whole. That connection is part of the work.
- **Similar workflows are combined, so the app stays lean and every option stays available.** Two or three that do nearly the same job become one working workflow that keeps all their options. Leanness comes from combining, never from dropping something because it failed ("Doesn't it cut down as we combine workflows that are similar so we have all options available while keeping the app lean?", 2026-09-24). The combined workflow is proven end to end before the old copies are switched off ("make sure it works end to end before dismantling anything", 2026-09-24).
- **A workflow is switched off only where Darrell has decided so,** such as n8n (DR-0132, DR-0617), and even then only after its replacement is proven.

---

## Every intake is carried to an outcome, and the ecosystem does the communicating

Feedback, failures and requests arrive from users, from Darrell directly, from monitors, and from any door. However they arrive, each one enters the same workflow system and is categorized. Each category has its own outcome:

1. **Low-hanging fruit: the system fixes it.** It is analyzed, fixed, proven and shipped through the lane, then the sender is told it is fixed.
2. **Already decided: the system explains.** Something already examined and decided is answered with the decision and its reason, citing the record. The sender hears why, plainly, and nobody has to write that reply by hand.
3. **Real work: the system carries it.** It becomes work on the board with an owner, a timeline window measured from the real delivery record (never invented), and updates to the sender as it moves.
4. **Needs something only a person holds: the system asks once.** It asks the right person for exactly that one thing, then carries on.

**People feel heard because the outcome reaches them.** The PoeTech ecosystem does the leg work:
- the acknowledgement;
- the categorizing;
- the fix or the explanation;
- the timeline and window;
- holding the stakeholder's hand through the process;
- governance over the project;
- bringing in the right people.

No human has to write those messages. Actions speak louder than words: the app proves itself by what it does, so people can taste and see that it is good.

---

## New workflows join the integration at birth

A new workflow, NAS job, table or app surface enters already connected:
- its reads, writes and seeds are declared;
- its live proof is defined;
- its place in the whole is visible in the app.

Being wired in "later" is the gap this Way closes. The enforcement is a build gate that fails when something new appears with no declared place in the flow graph. That gate is being built on `claude/every-workflow-seeds-the-next`.

---

## Iterate to guarantee the outcome right away

- **Ship the smallest increment that truly works end to end.** Then iterate. Every increment must be green and usable when it lands.
- **Never ship a large piece that works nowhere yet.** An increment that only flags is not an increment.
- **Every iteration is measured on the live data,** so each step is proven better, not only said to be better (DR-0075, DR-0076).

---

## The only honest stopping points

Holding the hand pauses only for one of these:
- a physical step no one on the team can reach from where they are;
- a value only Darrell holds;
- an undecided bright line (DR-0111).

Even then the process is not dropped. It carries:
- the exact blocker;
- a ready-to-paste step for whoever's hand it is, with the PowerShell block starting at `cd C:\Users\dpoe\Kingdom-PWA-Node`;
- a `re-review:` date.

"Later", "follow-up", and "flagged for review" are not stopping points (DR-0236).

---

## The closing test, every turn

Before ending a turn, whoever holds the work asks:
- **Is anything I flagged, found or named this turn still not working, and fixable right now?** If yes, the turn is not over.
- **Does everything I built this turn feed the next process, with live data that proves it?** If not, the turn is not over.

---

## The Word under it

**KJV — Philippians 1:6:** *"Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ:"*

Yahweh finishes what He begins. We reflect Him in small things when we carry a process to its completion instead of leaving it half-built.

**KJV — Luke 14:28-30:** *"For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it? Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him, Saying, This man began to build, and was not able to finish."*

A foundation laid and left is the flagged-but-unfixed workflow.

**KJV — Luke 13:8:** *"And he answering said unto him, Lord, let it alone this year also, till I shall dig about it, and dung it:"*

This is the dresser of the vineyard: he does not give up on the tree, he digs about it and works on it. We do the same with what does not work yet.

**KJV — 1 Corinthians 12:18:** *"But now hath God set the members every one of them in the body, as it hath pleased him."*

Every member has its place in the body. Every workflow has its purpose and its place in the whole.

**KJV — Nehemiah 6:15:** *"So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days."*

The wall was finished and counted: done, and measured.
