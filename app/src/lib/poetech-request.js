// =============================================================================
// poetech-request — a PoeTech request reaches the people who build, and the
// sender hears where it stands (DR-0622: connected is not the same as answered)
// =============================================================================
// Measured 2026-09-24: the 💡 PoeTech chip relayed each request to agent_inbox
// tagged `tell-poetech`, and NOTHING in the repository reads that tag — not a
// screen, not a NAS job, not a routine. The sender was told "it's on the build
// inbox" and the request went nowhere, for every audience.
//
// Now the same words ALSO become a feedback note (lib/feedback-sync.js
// uploadFeedback, area "PoeTech request"): they land in the steward's Feedback
// queue, where each note is triaged, promoted to work, marked fixed by the
// change that ships it (feedback-fixed.yml), and the sender reads its status
// under "Your feedback" (lib/feedback-receipt.js). The agent_inbox relay stays
// (it is the record the build sessions may read); it is no longer the only road.
// Best-effort and honest: signed-out, the request stays on this device and the
// result says so.
// =============================================================================
import { relayThought } from './agent-inbox-sync.js';
import { uploadFeedback } from './feedback-sync.js';

export const POETECH_REQUEST_AREA = 'PoeTech request';

/** { relayed, filed, reason } — filed = it reached the steward's feedback queue. */
export async function sendPoeTechRequest({ body, directiveId = null, relay = relayThought, upload = uploadFeedback } = {}) {
  const text = String(body || '').trim();
  if (!text) return { relayed: false, filed: false, reason: 'empty' };
  let relayed = false;
  let filed = false;
  let reason = '';
  try {
    const r = await relay({ body: text, tags: ['tell-poetech', 'poetech-app'], source: 'thinking-space', directiveId });
    relayed = !!(r && r.ok);
    if (!relayed) reason = (r && r.reason) || 'not relayed';
  } catch (e) { reason = e?.message || 'relay failed'; }
  try {
    const u = await upload({ text, currentView: POETECH_REQUEST_AREA, category: 'feature-request' }, { activeTab: 'poetech' });
    filed = !!(u && u.uploaded);
    if (!filed && !reason) reason = (u && (u.skipped || u.error?.message)) || 'not filed';
  } catch (e) { if (!reason) reason = e?.message || 'upload failed'; }
  return { relayed, filed, reason };
}
