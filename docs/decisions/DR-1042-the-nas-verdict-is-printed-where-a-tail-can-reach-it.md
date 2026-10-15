# DR-1042: The NAS verdict is printed where a tail can reach it — the fifth blindness was position, not measurement

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (additive, read-only output at the end of an existing read-only step; nothing measured changes)
**Type:** orchestration
**Area:**
- `.github/workflows/nas-health.yml` (a compact verdict block appended to the end of the observe step)

**Amends:** nothing. It re-prints facts `nas-health` already gathers, in a position a reader can reach.
**Grounds:** DR-0076 §2 (a machine check, not a memory) and §8 (provenance — a claim about the system cites a run); DR-1041 (the measurement was sound and the presentation defeated the reader — this is that lesson again); DR-1040 (the install this blindness left unverified); P53 (a finding nobody reads); DR-0108 (account for the whole team's reach, and challenge a stated "can't")
**Declared by:** me, after failing twice in one session to read a fact this workflow had already measured

## Concern

I shipped the sovereign bell (DR-1040) and then could not answer the only question that mattered about it — *is it installed and running?* — even though `nas-health` measures exactly that, and I had just run it successfully.

## Context

`nas-health.yml` is the read-only NAS observer: dispatchable, scheduled every six hours, and it mutates nothing. Its observe step is a single `ssh 'sh -s' <<'EOS'` heredoc, about 220 lines of probes. Its own header already records **four** prior blindnesses — each one a thing the box knew and the workflow did not print. This record is the fifth, and it has the sign flipped: the fact *was* printed. It could not be reached.

## What was measured

**Line 213 prints exactly what I needed:**

```sh
systemctl list-units --type=service --all --no-pager | grep -iE "poetech|ollama|whisper|voice"
```

That lists `poetech-announce.service` the moment services-sync installs it.

**And from this sandbox it is unreachable.** Measured three ways on run `38710371991`, job `116339982469`:

| route | result |
| --- | --- |
| `gh run view <id> --log` | `Forbidden` — `results-receiver.actions.githubusercontent.com` |
| `gh api repos/.../actions/jobs/<id>/logs` | `Forbidden` — the signed `productionresultssa13.blob.core.windows.net` URL |
| `get_job_logs` with `tail_lines` | works, but only from the **end** |

So a tail is the only reader, and the step ends with per-container `docker logs --tail 12` for five Supabase services, whose request lines are single JSON objects thousands of characters long. **A tail of 80 reached only the Supabase section. A tail of 205 reached only the UUID census.** Line 213's output sits further back still, behind the sign-in witness, the PIN witness, the storage census and the UUID footprint — and going deep enough would have cost tens of thousands of tokens of log noise to read one line.

**The consequence was concrete and already recorded.** DR-1040 shipped the bell and had to state, honestly, that whether the NAS installed it was **unverified** — not because nothing measured it, but because I could not read the measurement. That is a finding that reached its reader and told them nothing, which is P53's sibling and the exact failure DR-1041 corrected in CI an hour earlier.

**The four blindnesses already in that file were all the other direction** — the box knew something and nobody printed it (the cron log recording only *failing* installers is the clearest). Mine is the inverse, which is why it survived four rounds of this same lesson: every previous fix added a probe, and adding a probe is useless when the problem is where its output lands.

## Impact

**The questions this workflow is actually run to answer are now answerable from anywhere**, including a cloud sandbox with a short tail:

- every `poetech-*` unit and its `is-active` state, one line each, or an explicit "NO poetech-* units installed on this box";
- the mirror's `HEAD` and commit time — because services-sync pulls before it installs, so a stale mirror installs yesterday's code and that has silently happened before;
- services-sync's own last line.

**Nothing new is measured and nothing is mutated.** It re-prints the same reads, reusing `$REPO`, `$LOOPS` and `$SUDO` already set earlier in the same heredoc. The step stays read-only, the workflow stays dispatch-or-schedule, and no probe above it is touched or reordered — reordering would have risked a 220-line step I did not write, to save a few lines of output.

**It does not fix the log-blob block**, and it is not trying to. The sandbox still cannot download a full job log. This makes that limitation stop mattering for the facts people ask for.

## Decision

1. **Append a verdict block at the very end of the observe step**, immediately before the heredoc terminator, labelled "read this first; it is LAST on purpose" so its position reads as deliberate rather than as an afterthought.
2. **Print only what gets asked for** — unit states, mirror freshness, the last sync line. A verdict block that grows into a second copy of the step would re-create the problem.
3. **Write the reason into the file**, naming it the fifth blindness and naming DR-1040 as the cost, so the next person to add a probe here sees that position is part of the instrument.

## Verification

- **YAML parses.** The observe step keeps its name and its five-step job; the heredoc still opens `<<'EOS'` and there is **exactly one** bare `EOS` at column 0, as the last line, with the verdict block at lines 370–407 of the step immediately before it. Checked by parsing the YAML and asserting on the extracted `run` string, not by eye — a heredoc terminator at the wrong indentation is the failure mode that bit me three times on `cf-pages-diagnose` (DR-1038's sibling).
- **POSIX `sh -n` clean.** The block was extracted, de-indented and syntax-checked standalone, because the remote shell is `sh`, not bash: the `for` loop, the `printf`, the command substitutions and the `[ -n ]` guard all parse under `sh`.
- **All 20 guards PASS.** `decision-citation-guard` first refused the build for citing DR-1042 with no record written — the second time in one session that guard has caught me doing exactly that, and it was right both times. This file is that refusal satisfied.
- **Not claimed: that it has run.** It is a workflow change, so its first real exercise is the next dispatch. The honest proof is the next `nas-health` run's tail containing the block — and that same run is what will finally say whether the bell is installed.
- **Not claimed: that the bell is up.** Still unverified, and this record does not change that. It changes whether the *next* run can tell me.

**Not addressed:** the five Supabase container log tails that make the end of this step so expensive. They are genuinely useful when a leg is sick, and the guard against them is now that the verdict comes after them rather than before. `re-review: 2026-10-22` — if the verdict block itself proves unreachable because those tails grew, cap them.
