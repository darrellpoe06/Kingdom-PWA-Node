// =============================================================================
// create-from-words — words you can see become what you tick, in one press
// (DR-1200)
// =============================================================================
// Darrell, 2026-10-21, on a spoken lesson's card in Your prompts: "why do we
// need to do anything other than say make a lesson or build or research...
// when we can see the words transcript... we can say create and have a check
// box for what is possible then it will create." And: "I shouldn't have to put
// it in the box 15,000 times... there's nothing that allows me to just push it
// through."
//
// The words already on the screen (a transcript, a prompt) go straight to the
// roads that already exist, one row per box ticked:
//   lesson   -> agent_inbox tagged `lesson` (the lesson door, DR-0608), with no
//               name tag: the default the composer keeps (DR-0639)
//   build    -> sendPoeTechRequest (the build queue AND the steward's Feedback,
//               DR-0622) -- the same road the PoeTech chip takes
//   research -> agent_inbox tagged `research` (the Research section, DR-1172)
// Nothing new is written anywhere; this is the box and its Send, without the
// box. Each road answers for itself, and the line says which ones took it.
// =============================================================================

export const CREATE_TARGETS = Object.freeze([
  Object.freeze({ id: 'lesson', label: 'A lesson', goes: 'to the lesson builder, for Learn' }),
  Object.freeze({ id: 'build', label: 'A build for PoeTech', goes: 'to the build queue and the steward’s Feedback' }),
  Object.freeze({ id: 'research', label: 'Research', goes: 'to Research, where it is looked into' }),
]);

const WORD = Object.freeze({ lesson: 'a lesson', build: 'a build for PoeTech', research: 'research' });
const SOURCE = 'your-prompts-create';

/** What is ticked to begin with: a lesson's words start as a lesson; anything else starts empty. */
export function defaultTargets(destination = '') {
  return String(destination || '').toLowerCase().includes('lesson') ? ['lesson'] : [];
}

/** Why Create cannot run yet, or '' when it can (UX-PATTERNS 2f.3: a disabled control says why). */
export function createProblem(body, targets = []) {
  if (!String(body || '').trim()) return 'There are no words here to create from yet.';
  if (!(Array.isArray(targets) && targets.some((t) => WORD[t]))) return 'Tick at least one to create.';
  return '';
}

/**
 * Send the words down every ticked road, in the list's order. Returns one
 * result per road: {id, ok, reason}. A road that refuses never stops the next.
 */
export async function createFromWords({ body, targets = [], relay, poetech } = {}) {
  const text = String(body || '').trim();
  const out = [];
  for (const t of CREATE_TARGETS.map((x) => x.id).filter((id) => targets.includes(id))) {
    try {
      if (t === 'build') {
        const r = await poetech({ body: text });
        out.push({ id: t, ok: !!(r && (r.relayed || r.filed)), reason: (r && r.reason) || '' });
      } else {
        const r = await relay({ body: text, tags: [t], source: SOURCE });
        out.push({ id: t, ok: !!(r && r.ok), reason: (r && r.reason) || '' });
      }
    } catch (e) {
      out.push({ id: t, ok: false, reason: (e && e.message) || 'unknown' });
    }
  }
  return out;
}

const join = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

/** One plain line for what happened: what was sent, and what was not, with why. */
export function createdLine(results = []) {
  const sent = results.filter((r) => r.ok).map((r) => WORD[r.id]);
  const not = results.filter((r) => !r.ok).map((r) => `${WORD[r.id]} (${r.reason || 'no reason given'})`);
  const parts = [];
  if (sent.length) parts.push(`Sent as ${join(sent)}.`);
  if (not.length) parts.push(`Not sent as ${join(not)}; the words are still here to try again.`);
  return parts.join(' ') || 'Nothing was ticked, so nothing was sent.';
}
