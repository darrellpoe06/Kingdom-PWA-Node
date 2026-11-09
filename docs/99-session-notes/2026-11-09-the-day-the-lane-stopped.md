# 2026-11-09 — the day the lane stopped

Narrative for **[DR-1379](../decisions/DR-1379-a-test-may-not-pin-today.md)**.

## Two days with nothing landing

`main` had not moved since `eede41f73` on 2026-11-06. Five pull requests sat
open with auto-merge armed. The account's weekly model limit was reached, so no
session ran to notice.

When I did look, every one of the five was blocked, and four were blocked by the
**same** leg — `app — vitest shard 4/4` — although their changes have nothing to
do with one another. Four unrelated branches failing identically is not four
defects. It is one defect in the thing they share.

## I got the measurement wrong twice first

**First read:** I listed each PR's failing checks and reported
`app — lint + vitest, app — vitest shard 4/4`. Then I queried those two checks
directly and both came back **`success`** — and I was briefly prepared to write
that CI was marking a passing shard as failed.

**Second read:** a script that grouped check runs by name and took the latest
per name said they failed. The two answers could not both be right.

The reconciliation was not subtle once I looked for it. My direct query used a
SHA I had hardcoded from the day before. The lane's `keep-prs-current` had
caught the branches up at 00:32 on 2026-11-07, so the head I was reading was
two days stale and had genuinely passed. The failures are real on the current
heads.

A second error compounded it: a loop of mine wrote each PR's checks to the same
temporary file with a heredoc inside the loop body, and the heredoc ate the
loop's stdin. Every iteration reported the same numbers. Both mistakes are the
same shape as the ones this repository keeps recording — **a read that did not
happen, reported as a clean result** — and the only reason either surfaced is
that two of my own answers contradicted each other and I did not pick the
convenient one.

## The actual cause

```
AssertionError: expected '$4,687.18 as of 2026-11-07 (available…'
                to match /\$4,687\.18 as of 2026-11-06 \(availa…/
```

The screenshot in that test carries no date. So the app asks, offers "the day
it was uploaded", and takes it from `doc.receivedAt`, which is `now()`. The
test pinned `2026-11-06` in three places — correct on the day it was written,
wrong from 00:30 UTC the next morning, and wrong by three days by the time I
read it.

This is the same class as DR-1363's literal lesson numbers, which bit five
times in one day: **a value that is true when typed and false exactly when the
thing it describes moves on.** There the moving thing was the next lesson. Here
it is the date. The repair is identical — derive it from the same source the
code reads.

Restoring the literal fails today with `2026-11-09` against `2026-11-06`, which
is what makes this a fix rather than a guess.

## What the container took with it

The four lesson builders launched on 2026-11-06 were killed by the weekly limit.
Three of them had done real work and had not pushed:

- `sov72` — the module complete, all 42 verses re-read from the KJV corpus, its
  gate 46/46 green, DR-1375 written. **Uncommitted.**
- `hl13` — the lesson written into three files. **Uncommitted.**
- `spm13` — two `wip` commits and DR-1373. **Committed locally, never pushed.**

The container was rebuilt. `app/node_modules` was gone, the build worktrees were
gone, and so was all of that. The only one of the four that still exists is
`origin/claude/sov73-ask-before-you-answer`, because it pushed.

spm13 is the sharpest lesson: it did the right thing by committing, and still
lost the work, because a commit that never left the machine is not saved. The
brief I hand the next builder says push a `wip` branch early, not commit early.
