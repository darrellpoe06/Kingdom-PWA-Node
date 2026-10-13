// =============================================================================
// chat-import — stage Synology Chat property history for family verification
// =============================================================================
// The Poe Properties history lives in the chat app on the NAS: one channel
// per property, named by the short address. A sovereign Python endpoint on the
// NAS (DR-0218 zero-n8n; replacing the old wf) exposes that history as JSON at
// GET /property-history?channel=<short-address>; the PWA reaches it through the
// same-origin transport (never the absolute Funnel URL). Not live until that
// endpoint + its Caddy route are stood up.
// (No schema dependency — imported entries live on the rental's
// device-local conversationLog until leases/notes sync exists.)
//
// Nothing imports silently. Messages are STAGED, Darrell or Christina
// check what's true, and only accepted items land on the property's
// conversation log — system-as-mirror, the family verifies
// (QUALITY-OF-LIFE-AS-NORTH-STAR rule 1; SEED-DATA-AS-ASPIRATION keeps
// fabricated data out; this path carries only their real history).

// Accepts the bridge's JSON in any of its shapes — a bare message array,
// { messages: [...] }, or n8n's item-array wrapper [{ messages: [...] }] —
// tolerating the field-name variants Synology exports use.
export function parseChatHistory(payload) {
  let arr = [];
  if (Array.isArray(payload)) {
    arr = (payload.length && payload[0] && Array.isArray(payload[0].messages))
      ? payload.flatMap((p) => (p && Array.isArray(p.messages)) ? p.messages : [])
      : payload;
  } else if (payload && Array.isArray(payload.messages)) {
    arr = payload.messages;
  }
  return arr
    .map((m) => {
      if (!m) return null;
      const text = m.text ?? m.message ?? m.content ?? '';
      const tsRaw = m.ts ?? m.time ?? m.created_at ?? m.date ?? null;
      let date = '';
      if (typeof tsRaw === 'number') {
        // Synology exports use epoch seconds or milliseconds.
        date = new Date(tsRaw > 1e12 ? tsRaw : tsRaw * 1000).toISOString().slice(0, 10);
      } else if (tsRaw) {
        const d = new Date(tsRaw);
        date = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
      }
      const id = String(m.id ?? m.post_id ?? `${tsRaw ?? ''}-${String(text).slice(0, 24)}`);
      return text ? {
        sourceId: id,
        date,
        person: m.user ?? m.username ?? m.creator ?? m.author ?? '',
        text: String(text),
      } : null;
    })
    .filter(Boolean);
}

// Convert ACCEPTED staged messages into conversation-log entries, skipping
// anything already imported (dedup by sourceId — re-running the import is
// always safe).
export function toConversationEntries(messages, existingLog = []) {
  const seen = new Set(
    (existingLog || []).filter((e) => e && e.sourceId).map((e) => e.sourceId)
  );
  return (messages || [])
    .filter((m) => m && m.sourceId && !seen.has(m.sourceId))
    .map((m) => ({
      id: `cv-chat-${m.sourceId}`,
      date: m.date || '',
      person: m.person || '',
      summary: m.text,
      notes: 'Imported from the property chat (NAS) — verified by family',
      source: 'synology-chat',
      sourceId: m.sourceId,
    }));
}
