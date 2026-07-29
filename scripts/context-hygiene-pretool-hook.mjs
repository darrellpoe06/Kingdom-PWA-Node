#!/usr/bin/env node
// =============================================================================
// context-hygiene-pretool-hook — block raw-transcript imports BEFORE they land
// =============================================================================
// DR-0244 rule 1 / LESSONS P36 (from "The Orchestrator's Tax", adopted
// 2026-07-29): the orchestrator's working memory is the scarce resource — a raw
// subagent transcript imported to answer a status question pollutes the context
// for every turn after. The harness WARNS about this ("do not Read or tail the
// task output file"); per DR-0239 dimension 7 (gate-the-class, machinery over
// memory) this hook makes it deterministic: a Read/Bash call whose target is a
// task transcript / agent JSONL output file is BLOCKED with the pointer to the
// right move (the completion notification carries the result; status is
// answered from what is already known).
//
// FAIL-OPEN, ALWAYS: any parse error / unknown shape exits 0 (allow). A broken
// guard must never wedge real file work.
// =============================================================================
import { readFileSync } from 'node:fs';

// Transcript-shaped targets: harness task outputs and per-agent transcript
// JSONL. Ordinary project .jsonl data files (docs/orchestration/*.jsonl, the
// reel) are NOT matched — only the agent/task transcript locations.
const TRANSCRIPT_PATH = /(\/tasks\/[^\s"']+\.output\b|\bagent-[a-z0-9]+\.jsonl\b|\/subagents?\/[^\s"']+\.jsonl\b)/i;

// Bash commands that would stream a matched file into context.
const READS_FILE = /\b(cat|head|tail|less|more|sed|awk|grep|strings)\b/;

/**
 * Pure decision: does this tool call import a raw subagent/task transcript?
 * Returns { block: boolean, reason?: string }.
 */
export function classifyTranscriptImport({ toolName, toolInput } = {}) {
  const inp = toolInput || {};
  let target = '';
  if (toolName === 'Read') {
    target = String(inp.file_path || '');
    if (!TRANSCRIPT_PATH.test(target)) return { block: false };
  } else if (toolName === 'Bash') {
    const cmd = String(inp.command || '');
    if (!TRANSCRIPT_PATH.test(cmd) || !READS_FILE.test(cmd)) return { block: false };
    target = cmd;
  } else {
    return { block: false };
  }
  return {
    block: true,
    reason:
      'context-hygiene guard (DR-0244 / P36): that target is a raw subagent/task transcript — ' +
      'importing it charges rent in the orchestrator context every turn after. ' +
      'Status is answered from what is already known or the completion notification; ' +
      'if the agent result is genuinely needed, continue THAT agent via SendMessage and ask it ' +
      'for the specific answer, or read the journal summary — never the raw transcript.',
  };
}

function main() {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  let verdict;
  try {
    verdict = classifyTranscriptImport({ toolName: input.tool_name, toolInput: input.tool_input });
  } catch { process.exit(0); }
  if (verdict && verdict.block) {
    // PreToolUse: exit 2 blocks the call; stderr is shown back to Claude.
    process.stderr.write(verdict.reason + '\n');
    process.exit(2);
  }
  process.exit(0);
}

// Only run the hook when executed directly (not when imported by the test).
if (process.argv[1] && process.argv[1].endsWith('context-hygiene-pretool-hook.mjs')) main();
