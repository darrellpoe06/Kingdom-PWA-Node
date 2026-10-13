// =============================================================================
// business-messages — the Shay ↔ customer message lane (0091), factory-reusable
// =============================================================================
// Thin client over the two SECURITY DEFINER RPCs: the server forces sender +
// thread ownership; this lib just calls, groups, and never invents. Any client
// business door reuses it with its own instance slug.
// =============================================================================
import supabase from './supabase.js';

export async function fetchMessages(instanceSlug, customerUserId = null) {
  const { data, error } = await supabase.rpc('fetch_business_messages', {
    p_instance_slug: instanceSlug, p_customer: customerUserId,
  });
  if (error) return { ok: false, rows: [], error };
  return { ok: true, rows: data || [] };
}

export async function sendMessage(instanceSlug, body, customerUserId = null) {
  const { data, error } = await supabase.rpc('send_business_message', {
    p_instance_slug: instanceSlug, p_body: body, p_customer: customerUserId,
  });
  if (error) return { ok: false, error };
  return { ok: true, id: data };
}

// Pure: flat rows → threads (one per customer), newest activity first. The
// steward inbox renders this; counts are real tallies, never stored.
export function groupThreads(rows = []) {
  const by = new Map();
  for (const m of rows || []) {
    if (!m || !m.customer_user_id) continue;
    const t = by.get(m.customer_user_id) || { customerUserId: m.customer_user_id, messages: [], lastAt: null, unansweredFromCustomer: false };
    t.messages.push(m);
    if (!t.lastAt || String(m.created_at) > String(t.lastAt)) t.lastAt = m.created_at;
    by.set(m.customer_user_id, t);
  }
  const threads = [...by.values()];
  for (const t of threads) {
    t.messages.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const last = t.messages[t.messages.length - 1];
    t.last = last || null;
    t.unansweredFromCustomer = !!last && last.sender === 'customer';
  }
  threads.sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)));
  return threads;
}
