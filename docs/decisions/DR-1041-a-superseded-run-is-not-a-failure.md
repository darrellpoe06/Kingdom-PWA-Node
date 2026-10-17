# DR-1041: A superseded run is not a failure — the required check said "did not pass" and cost an investigation

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (wording of a required check's error; its exit codes are byte-for-byte unchanged)
**Type:** orchestration
**Area:**
- `.github/workflows/ci.yml` (the `app` roll-up: `failure` and `cancelled` are now told apart in what it prints)

**Amends:** DR-0617 (which set this job's name as the required check) in its reporting only. Not its name, not its `needs` list, not one exit code.
**Grounds:** DR-0076 §3 (proven-to-catch, anti-theater — a check whose red does not mean "broken" is the same lie as a gate that always passes); DR-1038 (the fault can live in a printed English sentence rather than in a comparison); DR-0075 (a rough edge gets a fix or a why and a date); P53 (a finding nobody reads — and its sibling, a finding that misleads the reader it reaches)
**Declared by:** me, after the check woke me and I spent a full investigation on a non-failure

## Concern

The required check reported **failure** on #2186 and nothing had broken. I was woken by it, read the job log, traced the legs, and found the run had simply been superseded. That is an expensive way to learn nothing.

## Context

`.github/workflows/ci.yml`'s `app` job is a roll-up over fourteen legs. Its name is what branch protection requires, which DR-0617 records: removing the job once left every PR waiting on it forever, so the name is load-bearing.

## What was measured

**The comparison could not tell "broke" from "stopped".** One line did all the judging:

```bash
bad=$(echo "$NEEDS" | jq -r '[to_entries[] | select(.value.result != "success") | .key] | join(", ")')
if [ -n "$bad" ]; then
  echo "::error::required legs did not pass: $bad"
```

`!= "success"` is true of `failure` and of `cancelled` alike, and both printed the same sentence.

**The live case, on this session's own PR.** #2186 head `c5960aaa6`, check run `116321206329`, `conclusion: failure`. Its log:

```
guards: cancelled      lesson-shares: success
vitest: cancelled      arrivals-push: success
probes: cancelled      contacts-walls: success
layout: cancelled      voice-enrollments: success
curriculum: cancelled  dm-device-keys: success
learner-records: cancelled   vault-walls: cancelled
door-work: cancelled         door-journeys: cancelled
##[error]required legs did not pass: guards, vitest, probes, layout, curriculum,
         learner-records, vault-walls, door-work, door-journeys
```

**Not one `failure` in it.** Every named leg is `cancelled`, because I pushed the base merge `fd98b58e4` while `c5960aaa6`'s run was still going and the concurrency group cancelled the superseded run. Five legs that had already finished read `success`.

**The newer commit's run was entirely green.** Run `38704637167` on `fd98b58e4`: all four vitest shards, lint + guards, build + probes, chrome-layout, curriculum, door journeys, every wall — success, and this same roll-up green at 08:27:22. #2186 merged at 08:25:55 on that evidence. So the red check was reporting on a run that had been correctly abandoned in favour of one that passed.

**The cost is the point.** A red check woke an agent, which read the log, listed the PR's 43 check runs, and confirmed the final head was green — to establish that nothing was wrong. A reader who does that twice stops doing it a third time, and starts discounting red. That is the same failure DR-0076 §3 names from the other direction: a gate that always passes is a lie, and a gate whose red does not mean "broken" trains people out of reading it.

## Impact

**The signal now says which thing happened.** A genuine failure names the failed legs as FAILED. A run that was stopped says it did not finish, says nothing failed, says the usual cause is a newer commit, and says the newer commit's own run is the one that counts.

**No gate moved. This is the part that matters, and it was checked rather than assumed.**

| legs | old exit | new exit |
| --- | --- | --- |
| all `success` | 0 | **0** |
| any `failure` | 1 | **1** |
| any `cancelled`, none failed | 1 | **1** |
| any `skipped`, none failed | 1 | **1** |

**It still exits 1 on a cancelled run, deliberately.** Making a superseded run report success would let it satisfy branch protection with its tests never having run — a required check that passes without measuring anything. That is a far worse defect than the one being fixed, and it is the reason only the words changed.

## Decision

1. **Tell `failure` and `cancelled` apart in the output.** Failures are named as failures; anything else incomplete is named as not having finished, with the likely cause and where to look instead.
2. **Both still exit 1.** The required check's behaviour as a gate is unchanged.
3. **When a run both fails and has cancellations, the failure wins** and the cancellations are printed as a `notice`, not folded into the error — so a real break is never buried under the noise this record is about.

## Verification

- **YAML parses; the job keeps its exact name (`app — lint + vitest`) and all 14 `needs`.** The name is the required check (DR-0617), so a rename here would hang every PR.
- **The real `jq` programs were dry-run against five `needs` payloads**, not reasoned about:

| case | result |
| --- | --- |
| the #2186 payload (success + cancelled) | `EXIT 1  DID NOT FINISH (nothing failed): guards, vitest, door-work` |
| one genuine failure | `EXIT 1  FAILED: vitest` |
| a failure **and** cancellations | `EXIT 1  FAILED: guards` + `note  did not finish: vitest` |
| all green | `EXIT 0  All legs passed.` |
| a `skipped` leg | `EXIT 1  DID NOT FINISH (nothing failed): vitest` |

- **The no-loosening claim is proven by the table above, not asserted:** every case that exited 1 before exits 1 now, and the only case that exits 0 is all-success.
- **Not claimed:** that this has run in CI yet. It is a workflow change, so its first real exercise is this PR's own run — and the first time a run of mine is superseded after this merges is when the new wording gets read in anger.
- **Not claimed:** that cancellation is always supersession. A human cancel and a timeout land in the same bucket, which is why the message says "the usual cause" and tells the reader to check the current head rather than asserting why.

**Not addressed:** the concurrency cancellation itself, which is correct and should stay — abandoning a superseded run is the right behaviour and saves real runner time. The defect was never the cancelling; it was the reporting.
