# DR-0517 — The fleet witness was silent for fifteen days, and nobody could tell why

- **Status:** accepted
- **Tier:** B (the instrument that reports which machines exist)
- **Type:** verification
- **Date:** 2026-09-19
- **Scope:** `.github/workflows/node-availability.yml` (a `Record the run (rolling log, pass or fail)` step and a `log_disabled` job), `app/src/lib/witness-run-log-baseline.json` (4 → 3)
- **Principles:** UNKNOWN-NEVER-READS-FRESH (DR-0125), VERIFICATION-DOCTRINE (DR-0076 §2 §3 §8), REVIEW-OUR-WAYS (DR-0108)
- **Grounds:** DR-0514 (the class gate, built hours earlier), and Darrell 2026-09-18: *"Both cuda towers are operating so you have multiple paths and hardware options to choose from... tell me what you have access to and the capabilities based on checking now data driven review and actions to prove it"*

## The question that exposed it

Darrell reported both CUDA towers back online and asked for a **measured** capability review. The instrument that answers that question is `node-availability.yml` — the only one in the fleet that joins the tailnet and reads `tailscale status --json`, the coordination server's own view of which machines are reachable.

Its incident ledger (issue #1290) last spoke on **2026-09-03**. Fifteen days of nothing.

And nothing is unreadable, because the workflow filed **only on incident**. Silence meant either *the fleet is healthy* or *the witness stopped running*, and there was no way to tell them apart — on the one instrument that reports whether the machines exist at all. This is the identical defect DR-0514 fixed on `site-health.yml` hours earlier, and `node-availability.yml` was one of the four the same baseline recorded as debt.

## What shipped

The same two pieces, for the same reason:

- **A run log, `if: always()`** — one line per run to a rolling `node-availability: the pipeline fleet, run log` issue, carrying the verdict (all reachable / a declared always-on device is dark / an unusable reading that is a runner fault rather than a device fault / the probe crashed) and the `declared N | up N | down N` counts from the probe's own report.
- **A `log_disabled` job** — because the probe carries `if: vars.NODE_AVAILABILITY_ENABLED != 'false'`, and a skipped job takes its run-log step down with it.

The witness-debt baseline shrinks **4 → 3**. Healing is reported by name, which is how this one was found.

**The dangling-`needs` assertion earned its place a second time.** The copied `log_disabled` job said `needs: availability`; this workflow's job is named `probe`. A dangling `needs` invalidates the entire file — it would have silenced the fleet witness completely while the change claimed to make silence impossible. Caught by the gate written earlier tonight, on its second use.

## What the measurement found, recorded because it is the answer to his question

`infra/device-availability/pipeline-nodes.json` declares six nodes. Against Darrell's live Tailscale view:

- **tlcmediadpt** (LEFT tower, RTX 4070 12 GB, driver 595.95, torch cu124 proven 2026-07-08) — online, as recorded.
- **livestream-main-pc** (RIGHT tower, RTX 4070 12 GB) — **online, where the registry still reads OFFLINE, `required:false`, `expected_always_on:false`.** This is the reconnection.
- **poetech** (NAS) — online, and the record is emphatic that it has **no NVIDIA driver and no CUDA, and never did**.
- tlcrackstation — still dark, role unconfirmed.

**Two open items that are the Governor's, not mine:**

1. **`infra/gpu-scheduler/devices.json` is `[]`.** Both towers are reachable and the scheduler that would allocate them declares zero devices. `state/KILL_SWITCH` is also ENGAGED by design. The hardware is back and nothing can address it.
2. **Re-declaring `livestream-main-pc` as required/always-on** would make a dark presenter a paging fault. That is a real posture change and it is not mine to make.

## The correction DR-0012 forced, which is the reason this record exists

I told Darrell the towers represent **"24 GB of VRAM currently unaddressable."** The ari-guard then blocked the reply for citing **DR-0012 without opening it**, and reading it showed the figure was wrong in a way that matters.

DR-0012 §1 decides: *"Design for the conservative single-4070 envelope (~12 GB, 1 card assumed). 2× 4070 and 4070 Ti SUPER (16 GB) are documented as **upgrade paths only, never assumed**."*

So **24 GB was never the envelope**, and treating two cards as one pool is wrong twice over: it contradicts a standing decision, and the cards sit in two separate Windows boxes with no pooling between them. The honest capability is **one 12 GB envelope at a time**, with the second card an upgrade path the record says not to assume.

DR-0012 §3 does say creative apps and any non-Ollama CUDA process are an **absolute-priority preemption trigger** — but it is written about **Darrell's creative workstation**, not about `livestream-main-pc`. The presenter link comes from the device registry and the witness's own output, not from DR-0012 naming that box. I had attributed it to the wrong source.

DR-0012 §5 supplies the next real measurement rather than more argument: the exact card can be auto-detected with `nvidia-smi` **from a session on that box**. The last such reading was **2026-07-08**. Everything said about those GPUs since is that reading plus an assumption, and the run log now makes the gap between the two visible on every run.

**re-review: 2026-09-26** — for the empty `devices.json` and the stale `livestream-main-pc` declaration, both awaiting the Governor.
