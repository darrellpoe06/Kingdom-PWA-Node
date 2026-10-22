# DR-1202: A link becomes what it was sent for — its words on our own machines, its reading, then a lesson or a feature, side by side and never twice

**Date:** 2026-10-22
**Status:** accepted
**Tier:** B (a lane that writes rows the lesson builder and the build queue act on; deterministic class, budget + lock; nothing new is public)
**Type:** orchestration
**Area:**
- `infra/nas-research/link_words.py` (new): any public link's words on the NAS, through yt-dlp and the Whisper ladder the spoken lessons ride
- `infra/nas-research/research_bell.py` (new) + `install.sh`: the NAS clock rings the lane
- `.github/workflows/research-inbox.yml`: pick → work (in parallel) → backlog; captions, then audio, then a second road; reading in the same pass; create
- `scripts/research-inbox-waiting.sql` (now claims a batch), `scripts/research-create-waiting.sql`, `scripts/research-create.sh`, `scripts/research-create-text.mjs` (new)
- `app/src/lib/research-create.js` (new), `research-items.js`, `components/ResearchSection.jsx`, `components/CreateFromWords.jsx`
- The process: `docs/00-foundations/_root/FROM-A-LINK-TO-WHAT-IT-WAS-SENT-FOR.md` (new)
- Tests: `a-link-becomes-what-it-was-sent-for.test.jsx` (new, 24), `research-reading.test.jsx` (the lane's new contract); `link_words.py --selftest` (35) and `research_bell.py --selftest` (12) in `ci.yml`

**Grounds:** DR-1172 (the research lane), DR-1200 (the reading, one-press Create), DR-0097 (WORD-FIRST), DR-0076 (verification; unknown is not a no), DR-0098 (teach the Word, do not debate it), DR-0248 (deterministic class: budget + lock), DR-0247 (agreed work starts itself), DR-0111 (do the work), DR-0236 (nothing waits), DR-0075 (a non-improvement carries a why and a date), DR-0768 (the claim tag is the lock).
**Declared by:** Darrell, 2026-10-22, from the Research list:

> *"This shows another way to get a lesson... just create a lesson after research and Word first processing... I want this to be the new normal after we see how it does with this lesson."*
> *"The other one is to create features for the PoeTech App... We need the comprehensive process created that reflects the process so we can proceed further."*
> *"No automated road turns a video's audio into words yet... why not?!!!!!!!!!!"* · *"Fix it!!!!!!!"* · *"We wanted all capacity and capabilities why limitations are built into the system does NOT make sense!!!!!!!!!!!!!"*
> *"Can or do we have the capacity to have multiple paths to do it the same way that is perfect?"* · *"All content that can give context to the subject we are learning about and from need to be easy-to-use."*
> *"Building capabilities and multiple paths to make the lines move faster when we need to... parallel processes for the bulk aspects that happen often."* · *"Make sure to anticipate the bottlenecks."* · *"After testing of course..."* · *"Prudence engineering..."* · *"Intuitive Design"* · *"The processes should be separate end to end unless that isn't necessary... there should be no reason for overlapping anything."*

## Context

**SHOULD.** A link sent for a lesson becomes a lesson, Word first, without anyone carrying it; a link sent for features becomes a build request; everything that gives the subject its context travels with it and is easy to use; more than one road reaches the same result; items move side by side; nothing overlaps.

**ARE, measured before building.**

- **The 22:43 link "Could not be looked into."** research-inbox run 39697937798 (00:09 UTC) wrote exactly why: *"the item held a link that is not one this road can reach (only a video id can be read from it)."* The lane read YouTube captions and nothing else (`research-inbox.yml`, the `else` branch of the look step).
- **Audio was never tried, by a sentence, not a decision.** The lane's own comment: *"Audio transcription was NOT attempted: that spends the GPU and is a decision to take on purpose, not quietly."* Nobody took the decision and no date was set to — a DR-0075 violation that quietly failed every non-YouTube link. Whisper already turned his spoken recordings into words on our own machines (`infra/nas-lesson-voice`, the tower then the NAS CPU); it had never been wired to a link.
- **The reel at 00:42 sat waiting with nothing looking.** The lane is scheduled every 15 minutes; GitHub ran it **three times in six hours** (runs 39649684705 18:06, 39679980650 21:35, 39697937798 00:09).
- **Nothing turned research into a lesson.** A `lesson` row in `agent_inbox` is what the NAS lesson builder takes (`lesson_builder.py` `eligibility()`, armed), and migration 0243's trigger rings it the moment the row lands; the only bridge from research was a box a person had to tick by hand (DR-1200).
- **"Word first" is real, and where it lives.** The builder's writer opens WORD FIRST, KJV only, verbatim (`lesson_writer.py` STANDARD), and every quoted verse is checked word for word against the local KJV (`lesson_gates.py` `verse_gate`, `quoted-verse-is-the-verse.mjs` in CI). Nothing finds Scripture for a text that names none except that writer; the filed request now tells it so in its first lines.
- **One item per run, one runner, one lock.** The workflow-wide concurrency group held one running and one pending run, so a link sent while another item transcribed would wait behind it.

## Decision

**One process, every road in, each item end to end on its own.** The full process is `FROM-A-LINK-TO-WHAT-IT-WAS-SENT-FOR.md`; in short:

1. **Sent, with what it is for.** The Research box asks *"What is it for?"* (a lesson; features for the PoeTech App; nothing ticked = research) and writes `create:<intent>` on the one `research` row. His own word beside the link ("Lesson", "features") counts the same; a word inside the URL never does.
2. **Rung.** The NAS's own 15-minute clock (`research_bell.py`, run first in the research installer so a dark search road cannot silence it) sends ONE `repository_dispatch research-waiting` when work waits — again only when the waiting set changes or an hour passes, sixty a day at most. GitHub's schedule stays as the second clock.
3. **Claimed, as a batch.** One statement claims up to six waiting items (`FOR UPDATE SKIP LOCKED`), so overlapping runs can never take the same item. A claim carries its time; one older than 90 minutes with no answer (its runner was lost) is released and tried again, at most three times, after which the card says plainly that it was not tried again (*never* "being looked into").
4. **Worked side by side.** Each claimed item gets its own runner, four at once, its own folder on the NAS volume, and runs words → answer → reading → create in one pass.
5. **The words, by more than one road to the same result.** YouTube captions first. Else — any public https link, YouTube without captions included — the audio through the same Whisper ladder the spoken lessons ride (`link_words.py`: the NAS's pinned yt-dlp, then the 4070 tower, then the NAS CPU). A site that turns the NAS's address away is fetched from the runner's address and handed to the same ladder. A post with no speech still gives its caption. Every result is the same shape: title, who posted it, length, the link, the caption, the words, and which rung wrote them.
6. **Read** into what it is, opportunities, constraints, next step, where it lands (DR-1200) — in the same pass now, not a later run.
7. **Filed as what it was sent for**, in one statement that cannot happen twice (`research-create.sh`): a `lesson` row for the lesson builder, opening *"WORD FIRST. Open with what the Word says about this subject... The post below is material to study and to test against the Word. It is never the authority"*, carrying every piece of context and the reading; and/or a `tell-poetech` build request carrying the reading first. A record row says what was filed, by id.
8. **Shown, easy to use.** The card reads in the order a person thinks: what it was sent for; the source (title, poster, length, *Open the post*); the caption; the words (first part, *Show all the words*, *Copy the words*); the reading; *Created from this*. An intent already filed is shown *(already filed)* on the Create row and never offered twice.

**Capacity, not gates** (his "all capacity"): any public host, four hours of video, a gigabyte of audio, 400,000 characters of words. What stays is security and the bottleneck guards, never a capability limit: no link inside the house or the tailnet is read; at most two transcriptions run on the NAS at once (a held file lock, so a crash frees its slot); media lands on the volume, never the NAS's small system partition, and is deleted after.

## What was measured

| what | before | after |
|---|---|---|
| link hosts the lane can read | YouTube with captions | any public https host, YouTube without captions included |
| roads to a link's words | 1 (captions) | 7 (captions, NAS audio, runner audio, the caption under the post, the page's own words from the NAS, then the runner, then rendered in the runner's browser) |
| clocks that start the lane | 1 (GitHub's, measured 3 runs in 6 h) | 2 (the NAS clock every 15 min, and GitHub's) |
| items worked per run | 1 | up to 6, four side by side |
| runs to go from a link to a filed lesson | 3 (answer, then reading, then a hand) | 1 |
| what research becomes without a hand | nothing | a lesson, a build request, or research only |

## Impact

- The reel marked Lesson becomes a lesson request the builder takes the moment it lands; the 22:43 link, re-opened for features, becomes a build request. Each says on its card what was made of it.
- A long video no longer queues a link behind it: the claim is the lock, and the short pick and backlog jobs carry their own groups.
- The lesson builder's own budget, lock and three-parallel build are unchanged; this lane only files the row it already takes.

## Verification

- `link_words.py --selftest`: **35 checks**, proven to catch (a lookalike host let through → `FAIL lookalike host refused`).
- `research_bell.py --selftest`: **12 checks**, proven to catch (ringing for a claimed row → `FAIL waiting and create-due rows are work`).
- `a-link-becomes-what-it-was-sent-for.test.jsx`: **24 cases**, running the REAL Python renderer so the NAS's text and the app's parser are pinned to each other; proven to catch twice (the card's doubled "Transcribed by transcribed by" restored → red; a workflow-wide lock restored → red).
- **Real PostgreSQL 16** (local, through a stand-in for `live-sql.sh`): the claim took the one unclaimed item and a second claim took none; a 100-minute-old dead claim was released and re-claimed while a one-minute-old claim and a thrice-released one were left alone; the create backlog listed the two answered items; `research-create.sh` filed a build request and its record (`claim|lesson|build|record = 1|0|1|1`), refused to file it twice (*"already has what it was sent for"*), marked a question research only, and filed a lesson row created by the sender with the Word-first opening and every part of the source.
- The research suites (71 → 95 with this file), lint 0, `verify:gates` green.
- **THE LIVE TRIAL, on his own reel (dispatched from this branch before merge, as he asked: "After testing of course").**
  - **Run 39704781328 failed, and the failure was mine:** the files were carried with `scp`, which wrote into the NAS's SFTP view rather than its real filesystem, so the NAS said `can't open file ... link_words.py` for both items. The fix: files travel over the ssh shell (`cat >`), each copy is confirmed, and the work root is asked of the NAS instead of assumed.
  - **Run 39705185863, on the fix, did the whole process on the live system.** The NAS's own yt-dlp fetched the reel from Instagram. Whisper wrote **3,874 characters** of its words on **the NAS CPU**, because the tower was asleep (`{"ok": true, "site": "Instagram", "rung": "the NAS CPU", "model": "small"}`). The answer row landed. The reading came back `503: No AI tower was answering`, which the item says in words and the backlog retries, and it did **not** hold up the filing. `research-create.sh` filed the lesson: `intents [lesson] -> claim|lesson|build|record = 1|1|0|1`.
  - **The live tags showed one more defect of mine, now fixed and pinned:** a re-open had left the earlier claim's time beside the new one, which could have let the release free an item still in flight. A claim now keeps one time, and a re-open clears it (proven on PostgreSQL 16).
  - **Run 39705324897 found a capability gap, now closed:** the features link was an mt27.org message page, not a video, and yt-dlp said `Unsupported URL` on both addresses. A fifth road reads a web page for its words (title, description, visible text; never its script or style), from the NAS and then the runner, with every redirect re-checked by the same door as the link (proven to catch: with the redirect check removed, the selftest fails).
  - **Run 39705941254 found the next gap, now closed:** the mt27.org page draws its words with script, so its HTML held almost none. A sixth road renders it in the runner's own headless Chrome and the same page reader reads it, while the runner's firewall refuses every connection over the tailnet and to any private or link-local address, so a page's script can never reach the NAS. Proven locally: a page whose words appear only by script rendered to *"Who built the ark, and how many cubits long was it?"*.
- **Still to be read:** the lesson the builder writes from that row (whether the Word leads and every verse is verbatim) is the trial's second half, read when the builder reports — `re-review: 2026-10-29` at the latest.

## Not closed, each with its why and date

- **A long transcript's reading covers its first 24,000 characters** (the forwarder's `/read` budget); the whole transcript still travels into the lesson request. Reading it in parts is the next capacity step — `re-review: 2026-10-29`.
- **Instagram may refuse both addresses** for a post behind a login. The item then says why in words. A signed-in road needs an account's cookies on the NAS, which is a credential decision — `re-review: 2026-10-29`, with the first measured refusals in hand.
- **The trial.** The first lesson built from the reel is read for whether the Word led and every verse is verbatim; whatever it shows is fixed in the same lane — `re-review: 2026-10-29`.
