// =============================================================================
// scribe-guide — turn a Scribe step manifest (+ optional transcript) into a
// step-by-step guide, the Scribe's Track-A deliverable (DR-0236 same-day build)
// =============================================================================
// Darrell 2026-07-27: "record workflows on a screen to get the required
// features and MVP." The operator marks steps while working; this module turns
// those markers into the written guide — pure and deterministic, so it runs in
// the browser TODAY on the real manifest (no NAS round-trip needed), and the
// same function runs NAS-side later to fold in the whisper transcript
// (narration spoken between two markers becomes that step's explanation).
import { validateManifest } from './workflow-scribe.js';
import { formatDuration } from './voice-recording.js';

/**
 * Narration segments that belong to a step: everything spoken from this
 * step's mark until the next step's mark (or the end). Pure.
 * @param steps    [{ index, label, atSeconds }]
 * @param segments [{ start, end, text }] whisper-style segments (seconds)
 */
export function narrationForStep(steps, segments, stepIndex) {
  const list = Array.isArray(steps) ? steps : [];
  const segs = Array.isArray(segments) ? segments : [];
  const step = list.find((s) => s.index === stepIndex);
  if (!step) return '';
  const next = list.find((s) => s.index === stepIndex + 1);
  const from = step.atSeconds;
  const until = next ? next.atSeconds : Infinity;
  return segs
    .filter((g) => Number(g.start) >= from && Number(g.start) < until)
    .map((g) => String(g.text || '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Build the guide from a workflow manifest. Returns { ok, problems, markdown }.
 * Refuses an invalid manifest and a step-less recording — a guide with no
 * steps would be a painted artifact, not documentation (reality-trace).
 */
export function buildGuide(manifest, { title = '', segments = [] } = {}) {
  const check = validateManifest(manifest);
  if (!check.ok) return { ok: false, problems: check.problems, markdown: '' };
  const steps = Array.isArray(manifest.steps) ? manifest.steps : [];
  if (steps.length === 0) return { ok: false, problems: ['no-steps'], markdown: '' };

  const name = String(title || '').trim() || `Guide from session ${manifest.sessionId}`;
  const lines = [
    `# ${name}`,
    '',
    `_Recorded ${manifest.startedAt} · ${formatDuration(manifest.seconds)} · ${steps.length} step(s). ` +
    'Generated from the operator\'s own step markers; timestamps link back into the recording._',
    '',
  ];
  for (const step of steps) {
    lines.push(`## Step ${step.index}: ${step.label}`);
    lines.push(`*At ${formatDuration(step.atSeconds)} in the recording.*`);
    const said = narrationForStep(steps, segments, step.index);
    if (said) {
      lines.push('');
      lines.push(said);
    }
    lines.push('');
  }
  return { ok: true, problems: [], markdown: lines.join('\n') };
}
