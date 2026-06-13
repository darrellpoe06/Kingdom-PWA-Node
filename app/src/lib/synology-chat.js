// =============================================================================
// synology-chat — direct integration with Synology Chat NAS Agent Bot
// =============================================================================
// Native, sovereign-loop integration: PWA event → fetch → Synology Chat
// channel. No proxies, no Edge Functions, no third-party services. The bot
// URL is the only piece of state needed and it points at Synology Chat
// running on the family NAS.
//
// Contract:
//
//   await postToChat(text)
//     Posts a plain-text message to the #PoeTech-PWA channel as NAS Agent
//     Bot. Returns { posted: true } on success, { skipped } if config is
//     missing or text is empty, { error } if the HTTP call fails. Never
//     throws — callers can fire-and-forget after a write.
//
//   formatFeedbackMessage(item)
//     Builds a POE-bound, family-readable message string for a feedback
//     event. Caller passes already-known fields; helper composes phrasing.
//
// Configuration:
//   Set VITE_SYNOLOGY_CHAT_BOT_URL in Vercel env vars (or in app/.env.local
//   for development) to the bot webhook URL, e.g.:
//
//     VITE_SYNOLOGY_CHAT_BOT_URL=https://192-168-1-26.poetech.direct.quickconnect.to:5001/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=%22<TOKEN>%22
//
//   Unset = postToChat is a no-op. Useful for local dev or for tearing down
//   the chat integration without code changes.
//
// Design notes:
//   - Form-urlencoded payload avoids CORS preflight (simple-request rule),
//     so cross-origin POST from the PWA works without server config tweaks.
//   - The URL embeds a token. Token in client bundle = visible to anyone
//     using the deployed app via DevTools. Bounded impact (worst case:
//     someone posts in PoeTech-PWA channel that isn't really the family).
//     Rotate via Synology Chat -> Bots/Integration -> Edit -> Regenerate.
//   - POE binding: callers compose non-punitive, invitation-language
//     messages. This helper just transports the text.
// =============================================================================

const BOT_URL = import.meta.env.VITE_SYNOLOGY_CHAT_BOT_URL;

/**
 * Posts a message to the configured Synology Chat channel via the bot
 * webhook URL. Best-effort: returns a result object, never throws.
 *
 * @param {string} text  Plain-text message body
 * @returns {Promise<{posted?: true, skipped?: string, error?: string}>}
 */
export async function postToChat(text) {
  if (!BOT_URL) return { skipped: 'no-url' };
  if (!text || typeof text !== 'string') return { skipped: 'no-text' };

  try {
    const body = 'payload=' + encodeURIComponent(JSON.stringify({ text }));
    // no-cors mode: Synology Chat External webhook doesn't send CORS headers,
    // so we fire-and-forget. The POST reaches the server normally; we just
    // can't read the response from the browser. Acceptable for status posts —
    // failures would surface as missing messages, which is the dominant
    // signal anyway.
    await fetch(BOT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return { posted: true };
  } catch (e) {
    console.warn('[synology-chat] post failed:', e);
    return { error: e.message || String(e) };
  }
}

/** Quick check used by callers/tests — true if the bot URL is configured. */
export function isChatConfigured() {
  return !!BOT_URL;
}

// First name of the member if known, else the full generic fallback. (Before
// 2026-06-13 the fallback was run through .split(' ')[0] and truncated to 'A';
// now it survives intact.)
function leadName(displayName) {
  return displayName ? String(displayName).split(' ')[0] : 'A family member';
}

/**
 * Compose a feedback message for the channel. POE-bound, no punitive
 * vocabulary; the family member's first name (if known) leads.
 *
 * @param {object} args
 * @param {string} args.displayName
 * @param {string} args.text
 * @param {string} [args.sentiment]
 * @param {string} [args.activeTab]
 */
export function formatFeedbackMessage({ displayName, text, sentiment, activeTab }) {
  const who = leadName(displayName);
  const where = activeTab ? ' (' + activeTab + ')' : '';
  const tone = sentiment === 'positive'
    ? 'shared a win'
    : sentiment === 'negative'
      ? 'flagged something to look at'
      : 'shared a thought';
  return who + ' ' + tone + where + ': ' + text;
}

/** Compose a project-created message. */
export function formatProjectCreatedMessage({ displayName, name }) {
  const who = leadName(displayName);
  return who + ' opened a new project: ' + name;
}

/** Compose a change-request message. */
export function formatChangeRequestMessage({ displayName, title }) {
  const who = leadName(displayName);
  return who + ' proposed a change to review: ' + title;
}

/** Compose a cycle-item completion message. */
export function formatCycleItemCompletedMessage({ displayName, summary }) {
  const who = leadName(displayName);
  return who + ' marked complete: ' + summary;
}
