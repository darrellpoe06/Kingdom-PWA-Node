# DR-1099: Ten open-source tools weighed against our own stack. Five come home next under limits, one waits behind our own studio, four are declined, and the register shows on the Infra Plan

**Date:** 2026-10-18
**Status:** accepted
**Tier:** A (a pure register, its gate and a read-only Infra Plan section; nothing installed, nothing on the Funnel). Each pilot's install is its own later change.
**Type:** architecture
**Area:**
- `app/src/lib/open-source-candidates.js` (new): the register, `validateCandidates`, `summarizeCandidates`, `touchedGaps`
- `app/src/components/OpenSourceCandidates.jsx` (new), mounted in `app/src/components/ChurchInfraPlan.jsx`
- `app/src/__tests__/open-source-candidates.test.jsx` (new)

**Grounds:** SOVEREIGN-FIRST, VERIFICATION-DOCTRINE, THREE-BRAKES, TIER-C, APP-IS-PRIMARY, REALITY-TRACE, PERPETUAL-IMPROVEMENT

## Context

Darrell, 2026-10-18, forwarding Andrew Warner's video of ten GitHub repos offered as replacements for paid AI services: *"Go get all these repos and integrate them into our technology stacks so we can see how we can gain more control and visibility into our projects and productivity... opportunities and constraints..."* He added that the tools vary in Windows support and lean on NVIDIA GPUs and local disk.

"Integrate" was read as **weigh each one against the stack we already run and record the result where we look at our machines**. It was not read as copying ten codebases into this repo. Vendoring them would add an unreviewed dependency surface many times the size of the app, which the sovereign-first posture forbids.

## What was measured

**Our side.**
- Two RTX 4070 towers with 12 GB each, both on Windows. The left one, `dev-gpu-node-1` (tlcmediadpt), is standing up FLUX.1 schnell. The right one, `dev-gpu-node-2`, runs qwen2.5:14b and feeds the wall, and live work wins it (DR-0001, DR-0012).
- A Synology NAS with no GPU.
- An XTTS voice studio written for the 4070 and never armed (`infra/voice-studio`).
- The sovereignty-gaps ledger. All four of its gaps are past their re-review dates as of today: voice 2026-10-14, likeness 2026-10-13, big LLM 2026-08-07, video 2026-08-21.

**What the household pays for.** The inbox shows no paid receipt from ElevenLabs, Midjourney, Suno, Perplexity, Opus Clip, Lovable or Topaz. It holds one Manus account email and Perplexity promotions. So the gain is **control and capability, not cancelled bills**.

**The ten repos.** Each was shallow-cloned at the pinned release in the register and read, never run. Five verdict-deciding claims were re-checked by hand against the source:
- Upscayl's PostHog launch event fires inside an effect that runs before its opt-out is read.
- FreeLLMAPI keeps a "Round-robin index per platform" (`server/src/services/router.ts:263`), and its own guide says "one account per provider".
- OpenManus defaults `use_sandbox` to `False` (`app/config.py:97`) and runs `exec()` (`app/tool/python_execute.py:30`).
- Vane's single image appends `searxng ALL=(ALL) NOPASSWD: ALL` to sudoers (`Dockerfile:71`).
- VoiceStudio's default OmniVoice weights are CC-BY-NC (`LICENSE-NOTICE.md:54`).

## Decision

| Tool | In place of | Verdict | Machine | The deciding reason |
|---|---|---|---|---|
| Vane | Perplexity | Bring home next | NAS | `POST /api/search` returns the answer and its source URLs, on our own qwen. It has no login, so it sits behind a forwarder. |
| InvokeAI | Midjourney | Bring home next | Left tower | Apache-2.0, with a real job queue. Pinned to v6.14.2, not the 7.0 alpha main. SDXL, FLUX.1 schnell and FLUX.2 Klein 4B only for public work. |
| ACE-Step 1.5 | Suno | Bring home next | Left tower | MIT, and fits 12 GB with the 1.7B planner. The weight licence is not in the repo, so nothing is published until the model card is read. |
| OpenShorts | Opus Clip | Bring home next | Right tower, after services | Sermon clips, with moments chosen by qwen through `LLM_BASE_URL`. No cloud keys, no social posting. YOLOv8 is AGPL-3.0 through Ultralytics. |
| Upscayl, engine only | Topaz | Bring home next | Left tower | `upscayl-bin` takes a folder in and a folder out. Real-ESRGAN models only. The desktop app is never installed, because of its telemetry. |
| VoiceStudio | ElevenLabs | Hold | none | Arming our own written studio closes the voice gap. VoiceStudio's default weights and translator are non-commercial, and it has no XTTS. |
| Odysseus | ChatGPT | Decline | none | A second PoeTech, with chat, mail and calendar. Its admin route runs shell commands, and its agent can send email. |
| FreeLLMAPI | Claude Pro | Decline | none | It spreads prompts over dozens of providers, including unvetted proxies, and rotates keys to stay under free tiers. Its authors say it is not for production. |
| Dyad | Lovable | Decline | none | Desktop only, with no gates. Its shell tool runs on the host after a review by its own cloud. Our gated lane already does this work. |
| OpenManus | Manus | Decline | none | It runs `exec()` on the host, with the sandbox off and no token budget, so it fails the three-brakes rule as shipped. |

1. **A candidate carries its whole record or it is refused.** `validateCandidates` refuses each of these:
   - a pin that is not a 40-character commit;
   - a missing licence, egress, machine or next step;
   - a pilot with no machine, or with nothing standing in front of it;
   - an AGPL tool that does not say so;
   - a tool that can run code being piloted without a budget, a lock and a kill switch;
   - a re-review date before the record, or a gap reference that does not exist.
2. **The register is seen where the machines are.** The Infra Plan shows each tool's verdict, its reason, its machine and its next step. Licences, egress, opportunities and constraints open in place under each tool's own button. The sovereignty gaps these tools touch are shown with their re-review state, read live.
3. **One GPU job at a time.** Every tower pilot runs through the GPU scheduler. Nothing uses the presenter tower during services.
4. **Nothing here is installed.** No Docker daemon runs in this sandbox, and the towers are not reachable from it, so no install could be proven. Each pilot is its own later change, proven by a witness on the live machine.

## Impact

What this does NOT do, and what remains, stated honestly:
- No tool is running. Bringing each one home is a dated step: Vane on 2026-10-25, InvokeAI 2026-11-01, ACE-Step and OpenShorts 2026-11-08, Upscayl 2026-11-15.
- The voice studio's arming is the step that closes the voice gap. VoiceStudio is re-read on 2026-11-01, once that step is taken.
- The four sovereignty gaps are past their re-review dates. This record does not re-date them, because new dates without new evidence would paper over the gap. The Infra Plan now shows the voice gap's passed date beside the tool that touches it.
- AGPL tools are run unmodified and never distributed. Changing one, or offering it to people outside the household and church, triggers the licence's source-offer duty.
- The four declines are re-read on 2027-04-18. OpenManus is re-read on 2027-01-18, sooner, because a sandbox and a budget switched on by default would change its verdict.

## Verification

- `app/src/__tests__/open-source-candidates.test.jsx`: 16 tests. The real register passes. Every gate rule is broken on purpose and named. The verdict counts are pinned at 5, 1 and 4, and no tool that can run code is a pilot. The section opens one tool's detail in place and closes it. The section is mounted on the Infra Plan.
- The Infra Plan, sovereignty-gaps and infra-plan render suites still pass. Lint passes, along with the legibility, contrast, large-print, inline-colour, tab-overflow, table and module-boundary guards.
