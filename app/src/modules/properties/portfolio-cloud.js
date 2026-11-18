// =============================================================================
// properties/portfolio-cloud — the one cross-door read behind the Overview
// =============================================================================
// Kept beside cloud.js, not inside it: cloud.js is at its file-budget ceiling
// (scripts/file-budgets.json), and a new capability lands in its own module.
// Same contract as cloud.js: RLS is the gate, the client never scopes by door,
// an injectable client, and it never throws.
// =============================================================================
import supabase from '../../lib/supabase.js';

const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (reason, error) => ({ ok: false, reason, error: (error && error.message) || undefined });

/**
 * EVERY DOOR AT ONCE (DR-1530): every work order, the latest messages and the
 * latest payments the signed-in person can read, across all the doors, for
 * the Overview (portfolio.js rolls them up per door). RLS decides which rows;
 * the client never scopes by door. Messages and payments are capped to the
 * newest PULSE_LIMIT -- the Overview shows the LATEST, and the door's own
 * thread and rent tab still hold the whole record. A part that cannot be read
 * is named in `unreadable`, never returned as an empty list (DR-0076).
 */
export const PULSE_LIMIT = 1000;
export async function loadPortfolioPulse(client = supabase) {
  try {
    const [req, msg, rent] = await Promise.all([
      client.from('tenant_maintenance_requests').select('*').order('created_at', { ascending: false }),
      client.from('tenant_messages').select('id, tenancy_id, from_role, body, sent_at').order('sent_at', { ascending: false }).limit(PULSE_LIMIT),
      client.from('rent_records').select('*').order('reported_at', { ascending: false }).limit(PULSE_LIMIT),
    ]);
    const unreadable = [];
    const part = (res, what) => {
      if (!res || res.error) {
        unreadable.push(what);
        return [];
      }
      return res.data || [];
    };
    const requests = part(req, 'work orders');
    const messages = part(msg, 'messages');
    const payments = part(rent, 'payments');
    if (unreadable.length === 3) return no('read-failed', (req && req.error) || (msg && msg.error) || null);
    return ok({ requests, messages, rent: payments, unreadable });
  } catch (e) {
    return no('unexpected', e);
  }
}
