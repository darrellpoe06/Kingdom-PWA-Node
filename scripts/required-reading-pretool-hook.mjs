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
//
// DON'T-REPEAT POINTERS (DR-0697, 2026-09-30). The same moment now also hands
// over the failures this area already had (required-reading.js DONT_REPEAT):
// one line each, with the LESSONS-LEARNED principle number. For workflows,
// the lesson catalogs and the orchestration docs they also arrive on an EDIT
// of an existing file, because that is where the day's failures landed. Each
// area's pointers block ONCE per session (a marker per area), then stay quiet.
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

// Where the once-per-session markers live. Overridable so a test never writes
// into the working tree's own state.
const STATE_DIR = process.env.REQUIRED_READING_STATE_DIR || join(ROOT, '.claude', '.required-reading');
const keyOf = (sessionId, name) => join(STATE_DIR, `${(sessionId || 'session')}-${name.replace(/[^a-zA-Z0-9]/g, '_')}`);
function seenOnce(key) {
  try {
    mkdirSync(STATE_DIR, { recursive: true });
    if (existsSync(key)) return true;
    writeFileSync(key, new Date().toISOString());
  } catch { /* state is a nicety; never block on it */ }
  return false;
}

async function main() {
  let input;
  try { input = JSON.parse(readStdin() || '{}'); } catch { return done(); }

  const tool = input.tool_name || '';
  if (!/^(Write|Edit)$/.test(tool)) return done();

  const filePath = input.tool_input && input.tool_input.file_path;
  if (typeof filePath !== 'string' || !filePath) return done();

  let lib;
  try {
    lib = await import(join(ROOT, 'app', 'src', 'lib', 'required-reading.js'));
  } catch { return done(); }

  const rel = filePath.replace(`${ROOT}/`, '');
  const isEdit = existsSync(filePath);

  // The don't-repeat pointers: new files in any mapped area; edits only where
  // the area says so. Each area blocks once per session.
  let pointerGroups = [];
  try {
    pointerGroups = (lib.dontRepeatFor ? lib.dontRepeatFor([rel], { edit: isEdit }) : [])
      .filter((g) => !seenOnce(keyOf(input.session_id, `dont-repeat-${g.id}`)));
  } catch { pointerGroups = []; }

  // The required reading: only on the creation of a new file, as before.
  let reading = null;
  if (!isEdit) {
    try {
      const evidence = input.transcript_path ? evidenceFrom(input.transcript_path) : '';
      const result = lib.outstandingReading([rel], evidence);
      if (result && result.missing.length && !seenOnce(keyOf(input.session_id, rel))) reading = result;
    } catch { reading = null; }
  }

  if (!reading && !pointerGroups.length) return done();

  let reason;
  try {
    reason = [
      reading ? lib.requiredReadingMessage(reading.missing, reading.reasons) : '',
      pointerGroups.length ? lib.dontRepeatMessage(pointerGroups) : '',
      reading ? '' : 'Continue with the same write once you have them in mind; this block does not repeat this session.',
    ].filter(Boolean).join('\n\n');
  } catch { return done(); }

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
