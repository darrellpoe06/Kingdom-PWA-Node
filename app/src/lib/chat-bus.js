// =============================================================================
// chat-bus — the unified pane's pure core: @prefix parsing + the privacy line
// =============================================================================
// Green-lit 2026-08-15 through the ensemble seam (docs/ops/SECOND-OPINION-BRIEF
// .md): ONE pane in PoeTech reaching Claude, Gemini, and local — on the DECIDED
// architecture (DR-0132 P1: Supabase-bus + outbound-poll box agent; the router
// already exists), NOT an inbound middleware container. The submit action ONLY
// writes an agent_tasks row (migration 0137); nothing here calls any LLM API.
//
// PURE (no React, no supabase import) so the gate proves the two rules that
// must never regress:
//   1. @local is the DEFAULT — no prefix means sovereign, free, private-safe.
//   2. PRIVATE input routes local REGARDLESS of prefix (DR-0073 private ->
//    local-only). The DB CHECK (agent_tasks_private_is_local) is the
//    suspenders; this is the belt; both are tested.
// =============================================================================

export const CHAT_TARGETS = ['local', 'claude', 'gemini'];

// Vendor targets stay listed even while their keys are absent: the UI shows
// them dark-with-why instead of hiding them (surface-says-truth), and they go
// live the moment the box agent holds keys — no client change.
export const TARGET_META = {
  local:  { label: 'Local (sovereign)', vendor: false },
  claude: { label: 'Claude',           vendor: true },
  gemini: { label: 'Gemini',           vendor: true },
};

// "@claude fix this" -> { target:'claude', message:'fix this' }. Only a prefix
// at the START counts — an @ mid-sentence is just prose. Unknown @words are
// left in the message untouched (never silently swallow a user's text).
export function parsePrefix(raw) {
  const text = String(raw ?? '').trim();
  const m = /^@(\w+)\s*/.exec(text);
  if (m && CHAT_TARGETS.includes(m[1].toLowerCase())) {
    return { target: m[1].toLowerCase(), message: text.slice(m[0].length).trim() };
  }
  return { target: 'local', message: text };
}

// The one function every submit MUST pass through. Returns the row to insert.
// Privacy outranks the prefix, silently is NOT ok — the caller gets `rerouted`
// so the UI can SAY "sent to local because this is private" (a surface that
// quietly ignores the user's @claude teaches a wrong model of the system).
export function buildTaskRow(raw, { isPrivate = false, tenantId, userId } = {}) {
  const { target, message } = parsePrefix(raw);
  if (!message) return null;
  const rerouted = isPrivate && target !== 'local';
  return {
    row: {
      instance_id: tenantId,
      created_by:  userId,
      kind:        'chat',
      message,
      target:      isPrivate ? 'local' : target,
      private:     !!isPrivate,
      status:      'queued',
    },
    target: isPrivate ? 'local' : target,
    rerouted,
  };
}

// Row status -> what the pane shows. The async-row pattern's whole UI contract:
// a queued/running row IS the loading state; failed rows say why; nothing
// spins forever silently (statusNote gives the honest wait explanation —
// a cold local model loading for 15s is a NAMED state, not a freeze).
export function paneStateFor(row) {
  const s = row?.status;
  if (s === 'queued')  return { phase: 'pending', note: 'Queued — the box agent picks this up on its next poll.' };
  if (s === 'running') return { phase: 'pending', note: 'Running — a local model may take a few seconds to load the first time.' };
  if (s === 'done')    return { phase: 'done', note: null };
  if (s === 'failed')  return { phase: 'failed', note: row?.error || 'The agent reported a failure with no detail.' };
  if (s === 'cancelled') return { phase: 'failed', note: 'Cancelled.' };
  return { phase: 'unknown', note: 'Unrecognized task state — treat as not delivered.' };
}

// Vendor availability is a fact about the AGENT's keys, not the client. The
// client only knows what the register says; absent knowledge reads as OFF
// (unknown never reads as available — DR-0076).
export function targetAvailable(target, vendorKeysPresent = {}) {
  if (target === 'local') return true;
  return vendorKeysPresent[target] === true;
}
