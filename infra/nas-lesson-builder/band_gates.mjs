#!/usr/bin/env node
// =============================================================================
// band_gates.mjs -- the repo's OWN lesson gates, run on a DRAFT (DR-0669)
// =============================================================================
// The NAS lesson builder gates every writer's draft twice: once in Python
// (lesson_gates.py, always available on the NAS) and once HERE, with the very
// functions the pinned per-lesson test and CI run -- so a draft that would fail
// CI is known before anything is pushed, and the two layers can be compared
// (parity). Reads one lesson module as JSON on stdin; prints one JSON verdict.
// Pure: no network, no writes. A gate that cannot measure says so; it never
// reads as passed.
import { scanQuotedVerses } from '../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts, elidedQuotations, recitedRecords } from '../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../scripts/full-levels.mjs';
import {
  measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING,
} from '../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../scripts/title-in-narrative.mjs';
// TALK ABOUT IT TOGETHER (DR-0733): every new lesson carries its own three prompts.
import { ownPrompts } from '../../app/src/lib/talk-together.js';

export function gateDraft(module) {
  const scan = scanQuotedVerses([module], quotedTexts);
  const verse = {
    passed: scan.spans > 0 && scan.faults.length === 0 && scan.verbatim === scan.spans,
    spans: scan.spans,
    verbatim: scan.verbatim,
    faults: scan.faults.slice(0, 40).map((f) => ({ kind: f.kind, where: f.where, ref: f.ref || '', names: f.names })),
  };
  const elided = elidedQuotations(module);
  const recited = recitedRecords(module);
  const quotation = { passed: elided.length === 0 && recited.length === 0, elided: elided.length, recited: recited.length };

  const f = measureFullness(module);
  const short = FULL_BANDS.filter((b) => !(f.bands[b].share >= FULL_FLOOR[b]));
  const fullLevels = { passed: short.length === 0, short, bands: f.bands };

  const m = measureLesson(module);
  const readingLevel = {
    passed: !isInverted(m) && !breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING),
    inverted: isInverted(m),
    childOverCeiling: breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING),
    bands: m.bands,
  };

  const d = measureDifferentiation(module);
  const differentiation = { passed: !!d && d.worst < DIFF_CEILING, worst: d ? d.worst : null };

  const unnamed = FULL_BANDS.filter((b) => !namesItsLesson(module.title, (module.levels || {})[b]));
  const title = { passed: unnamed.length === 0, unnamed };

  const own = ownPrompts(module);
  const missingTalk = ['parents', 'children', 'friends'].filter((k) => !own[k]);
  const talkTogether = { passed: missingTalk.length === 0, missing: missingTalk };

  const passed = [verse, quotation, fullLevels, readingLevel, differentiation, title, talkTogether].every((g) => g.passed);
  return { passed, verse, quotation, fullLevels, readingLevel, differentiation, title, talkTogether };
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const module = JSON.parse(raw);
  process.stdout.write(JSON.stringify(gateDraft(module)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });
}
