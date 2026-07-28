#!/usr/bin/env node
// =============================================================================
// cadence-guard-pretool-hook — catch the reflexive-hour check-in BEFORE it fires
// =============================================================================
// Declared by Darrell 2026-07-28: "60 minutes? Why does Ari allow claude to
// undermine our projects?" The ari-guard Stop hook reads the reply TEXT — it
// caught the re-ask phrasing, but it structurally cannot see a check-in
// INTERVAL, because that is a tool ARGUMENT (send_later's delay_minutes /
// ScheduleWakeup's delaySeconds), not reply text. So a reflexive 60-minute timer
// slipped past every gate.
//
// DR-0103 §3 is explicit: "watch in-flight work on a cadence matched to how fast
// it actually changes — minutes, never a reflexive hour. A poll-timer is ONLY
// for a genuine external wait (CI in flight, a deploy)." This PreToolUse hook
// ENFORCES that: a long check-in delay is blocked UNLESS its message/reason
// names a real external wait. It never touches any other tool.
//
// FAIL-OPEN, ALWAYS: any parse error / unknown shape exits 0 (allow). A broken
// guard must never wedge scheduling.
// =============================================================================
import { readFileSync } from 'node:fs';

// The tools that schedule a future wake-up / check-in.
const SCHED_TOOLS = new Set([
  'mcp__Claude_Code_Remote__send_later',
  'ScheduleWakeup',
]);

// Minutes above which a check-in must be justified by a real external wait.
// CI + deploy here complete in ~3 min; a fixed backstop is ~20 min of headroom.
const LONG_MINUTES = 20;

// Signals that a genuine external wait is in flight (DR-0103 §3's carve-out).
const EXTERNAL_WAIT = /\b(ci|deploy|deployment|build|migrat|pipeline|queue|soak|run(?:ning|s)?|workflow|cron|overnight|tomorrow|hours?|days?|weeks?|week|nightly|backfill|external)\b/i;

/**
 * Pure decision: given a tool call, should the cadence guard block it?
 * Returns { block: boolean, minutes?: number, reason?: string }.
 */
export function classifyCadence({ toolName, toolInput } = {}) {
  if (!SCHED_TOOLS.has(toolName)) return { block: false };
  const inp = toolInput || {};

  // ScheduleWakeup stop-calls carry no delay — never block them.
  if (inp.stop === true) return { block: false };

  let minutes = null;
  if (typeof inp.delay_minutes === 'number') minutes = inp.delay_minutes;
  else if (typeof inp.delaySeconds === 'number') minutes = inp.delaySeconds / 60;
  // An absolute `at` timestamp can't be range-checked without a clock (Date is
  // unavailable / non-deterministic here) — leave it to judgment, don't block.
  if (minutes == null) return { block: false };

  if (minutes <= LONG_MINUTES) return { block: false };

  const justified = EXTERNAL_WAIT.test(String(inp.message || inp.reason || ''));
  if (justified) return { block: false };

  return {
    block: true,
    minutes,
    reason:
      `cadence-guard (DR-0103 §3): a ${Math.round(minutes)}-minute check-in with no external wait named. ` +
      `Watch on a cadence matched to how fast the work actually changes (CI/deploy ~3 min), not a reflexive hour. ` +
      `Either shorten the delay, or name the genuine external wait (CI in flight, a deploy, a migration run) in the message/reason. ` +
      `If the work is already done, don't schedule a check-in at all.`,
  };
}

function main() {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  let verdict;
  try {
    verdict = classifyCadence({ toolName: input.tool_name, toolInput: input.tool_input });
  } catch { process.exit(0); }
  if (verdict && verdict.block) {
    // PreToolUse: exit 2 blocks the call; stderr is shown back to Claude.
    process.stderr.write(verdict.reason + '\n');
    process.exit(2);
  }
  process.exit(0);
}

// Only run the hook when executed directly (not when imported by the test).
if (process.argv[1] && process.argv[1].endsWith('cadence-guard-pretool-hook.mjs')) main();
