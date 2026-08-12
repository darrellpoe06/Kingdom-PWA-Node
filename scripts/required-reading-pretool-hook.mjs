#!/usr/bin/env node
// =============================================================================
// required-reading-pretool-hook — hand Claude the governing docs AT THE MOMENT
// it starts writing, instead of hoping it remembered them
// =============================================================================
// Darrell 2026-08-11: "Since we cant rely on claude to do this... can we build
// something that claude just uses when it's time same for Ari... so only use an
// LLMs when necessary?"
//
// Fires on Write/Edit. Resolves — deterministically, no model — which foundation
// documents govern the path about to be written, subtracts everything this
// session already opened, and blocks with the remainder. The agent then reads
// them and proceeds. "Which docs govern this path" is a known mapping, exactly
// the class DR-0080 says must be plain code.
//
// WHY PRE-WRITE AND NOT PRE-SESSION: a session-start dump is read once, drowns
// in context, and is gone after a compaction. This arrives when it is
// actionable — the instant a file in that area is being created — and it costs
// nothing on every other tool call.
//
// QUIET BY DESIGN, BECAUSE A NOISY GATE GETS DISABLED:
//   - only NEW files (Write to a path that does not exist) and only mapped areas
//   - anything already read this session is subtracted, so it never repeats
//   - one block per path per session (a marker file), so a re-edit never nags
//   - FAIL-OPEN on any error whatsoever
// =============================================================================
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const done = () => process.exit(0);

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

// Everything this session demonstrably opened, as one searchable blob.
function evidenceFrom(transcriptPath) {
  try {
    return readFileSync(transcriptPath, 'utf8');
  } catch { return ''; }
}

async function main() {
  let input;
  try { input = JSON.parse(readStdin() || '{}'); } catch { return done(); }

  const tool = input.tool_name || '';
  if (!/^(Write|Edit)$/.test(tool)) return done();

  const filePath = input.tool_input && input.tool_input.file_path;
  if (typeof filePath !== 'string' || !filePath) return done();

  // Only guard the creation of new files. Editing something that already exists
  // means the area is already in play, and blocking there is pure friction.
  if (existsSync(filePath)) return done();

  let outstandingReading; let requiredReadingMessage;
  try {
    ({ outstandingReading, requiredReadingMessage } = await import(
      join(ROOT, 'app', 'src', 'lib', 'required-reading.js')
    ));
  } catch { return done(); }

  const rel = filePath.replace(`${ROOT}/`, '');
  const evidence = input.transcript_path ? evidenceFrom(input.transcript_path) : '';

  let result;
  try { result = outstandingReading([rel], evidence); } catch { return done(); }
  if (!result || !result.missing.length) return done();

  // One nag per path per session.
  try {
    const stateDir = join(ROOT, '.claude', '.required-reading');
    mkdirSync(stateDir, { recursive: true });
    const key = join(stateDir, `${(input.session_id || 'session')}-${rel.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (existsSync(key)) return done();
    writeFileSync(key, new Date().toISOString());
  } catch { /* state is a nicety; never block on it */ }

  let reason;
  try { reason = requiredReadingMessage(result.missing, result.reasons); } catch { return done(); }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  return done();
}

main();
