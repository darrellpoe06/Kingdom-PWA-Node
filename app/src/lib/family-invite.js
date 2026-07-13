// =============================================================================
// family-invite — the in-app grant primitive (data-driven, no code change)
// =============================================================================
// Darrell 2026-07-05: adding a family member by hand-editing a migration + a
// shell constant "doesn't work" as a system. This is the client half of the fix
// (server half: migration 0081's invite_to_instance + invite-consuming
// join_default_instance): a governor invites people from inside the app, and
// each invitee auto-joins the family instance on their next sign-in with the
// invited role — no code, no deploy.
//
// "Invite a person AND their family" is supported by accepting MANY emails in
// one action (parseInviteEmails) and issuing one invite per address. Each is an
// instance_invites row created via the SECURITY DEFINER RPC (the only path —
// the table has no client INSERT policy by design).
import supabase from './supabase.js';

// A liberal-but-safe email shape check (mirrors choir-sync's validator).
export function isValidInviteEmail(email) {
  const e = String(email || '').trim();
  return e.length > 3 && /\S+@\S+\.\S+/.test(e);
}

export const INVITE_ROLES = ['member', 'admin', 'viewer'];

// Split a free-text field (commas / semicolons / whitespace / newlines) into a
// deduped, lowercased list of valid emails, plus the invalid fragments so the
// UI can tell the governor exactly what didn't parse. Never throws.
export function parseInviteEmails(text) {
  const raw = String(text || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set();
  const valid = [];
  const invalid = [];
  for (const e of raw) {
    if (!isValidInviteEmail(e)) { invalid.push(e); continue; }
    if (seen.has(e)) continue;
    seen.add(e);
    valid.push(e);
  }
  return { valid, invalid };
}

// Invite ONE email to the caller's (non-church) instance with a role. Returns a
// tagged result; never throws. role defaults to 'member' and can never be
// 'owner' (the RPC enforces this too).
export async function inviteToInstance(email, role = 'member') {
  if (!isValidInviteEmail(email)) return { email, ok: false, reason: 'bad-email' };
  const safeRole = INVITE_ROLES.includes(role) ? role : 'member';
  const { data, error } = await supabase.rpc('invite_to_instance', {
    email_in: String(email).trim().toLowerCase(),
    role_in: safeRole,
  });
  if (error) return { email, ok: false, reason: 'rpc-error', error: error.message || String(error) };
  return { email, ok: true, id: data };
}

// Invite MANY emails (a person + their family) in one action. Runs them
// concurrently and returns a per-email summary the UI can display.
export async function inviteFamily(emails, role = 'member') {
  const { valid, invalid } = parseInviteEmails(Array.isArray(emails) ? emails.join('\n') : emails);
  const results = await Promise.all(valid.map((e) => inviteToInstance(e, role)));
  return {
    invited: results.filter((r) => r.ok),
    failed: results.filter((r) => !r.ok),
    ignored: invalid, // fragments that weren't valid emails
  };
}
