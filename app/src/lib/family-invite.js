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

// Build the claim link the guardian DELIVERS to the invitee however they already
// reach them (their own text / WhatsApp / email / in person — "DMs not SMS",
// DR-0187). The invitee opens it, signs in, and it records a PENDING claim that
// the guardian then re-confirms. Uses the current origin so it works on any host.
export function buildClaimLink(token, origin) {
  const base = origin || (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  return `${base}/?join=${encodeURIComponent(String(token || ''))}`;
}

// Read a claim token out of the current URL (?join=... , set when the invitee
// opens the delivered link). Returns '' when absent. Pure over an injected href.
export function readClaimTokenFromUrl(href) {
  try {
    const url = new URL(href || (typeof window !== 'undefined' ? window.location.href : ''), 'https://x');
    return String(url.searchParams.get('join') || '').trim();
  } catch { return ''; }
}

// Invite ONE email to the caller's (non-church) instance with a role. Returns a
// tagged result carrying the one-time claim LINK to deliver; never throws. role
// defaults to 'member' and can never be 'owner' (the RPC enforces this too).
// Pass instanceId to target a SPECIFIC space the caller leads (0125 — the space
// picker means what it says); omitted, the server resolves family-first.
export async function inviteToInstance(email, role = 'member', instanceId = null) {
  if (!isValidInviteEmail(email)) return { email, ok: false, reason: 'bad-email' };
  const safeRole = INVITE_ROLES.includes(role) ? role : 'member';
  const args = {
    email_in: String(email).trim().toLowerCase(),
    role_in: safeRole,
  };
  // Only send the extra arg when targeting, so an un-migrated backend (2-arg
  // RPC) keeps working mid-rollout.
  if (instanceId) args.instance_in = instanceId;
  const { data, error } = await supabase.rpc('invite_to_instance', args);
  if (error) return { email, ok: false, reason: 'rpc-error', error: error.message || String(error) };
  // 0104 returns { id, token, email, role }; tolerate a bare uuid from an
  // un-migrated backend so the app never crashes mid-rollout.
  const id = data && typeof data === 'object' ? data.id : data;
  const token = data && typeof data === 'object' ? data.token : null;
  return { email, ok: true, id, token, link: token ? buildClaimLink(token) : null };
}

// The invitee presents the delivered token (must be signed in). Records a PENDING
// claim only — grants nothing until a guardian confirms. Returns a tagged status.
export async function claimInvite(token) {
  const t = String(token || '').trim();
  if (!t) return { ok: false, reason: 'no-token' };
  const { data, error } = await supabase.rpc('claim_invite', { token_in: t });
  if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error) };
  return { ok: true, status: data?.status || 'pending-confirm', instanceName: data?.instance_name || null, role: data?.role || null };
}

// The inviting guardian/admin lists claims awaiting their re-confirmation.
export async function listPendingClaims() {
  const { data, error } = await supabase.rpc('list_pending_claims');
  if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error), claims: [] };
  return { ok: true, claims: Array.isArray(data) ? data : [] };
}

// The guardian/admin re-confirms a pending claim — ONLY THEN is membership
// granted to the person who claimed. Two-party binding (DR-0187).
export async function confirmInvite(inviteId) {
  if (!inviteId) return { ok: false, reason: 'no-id' };
  const { data, error } = await supabase.rpc('confirm_invite', { invite_id_in: inviteId });
  if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error) };
  return { ok: true, instanceId: data };
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
