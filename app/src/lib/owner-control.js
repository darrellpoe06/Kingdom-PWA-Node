// =============================================================================
// owner-control — "WE keep control of the apps" as a platform capability
// =============================================================================
// Darrell 2026-07-23: "I only want us to have control over the apps if a
// dev/ops member leaves or something else more sinister" — and "I'm sure I'm
// not the only user who will find this value necessary." So this is NOT
// hardcoded to the Poe family: OWNERSHIP is the platform's real role system
// (instance_members.role via the list_my_admin_instances RPC, migration
// 0112) — every family/church/business instance owner gets the same control.
//
// THE HONEST MODEL (DR-0076 — say what revocation really is):
//   · ACCESS can be revoked (GitHub roles, app roles, tokens) — instant.
//   · KNOWLEDGE cannot be un-known: anyone who ever SAW the signing key could
//     have kept it. So (a) generation is OWNER-GATED — members never see it,
//     and (b) ROTATION IS THE REVOCATION for the key itself: a new identity,
//     new secrets, one uninstall/reinstall across the fleet (the sideload
//     cost; Play App Signing later removes even that — DR-0152).
// The offboarding drill below enumerates EVERY control an exiting member
// could hold, with its revocation — control as a checklist, not a feeling.

// Is the signed-in user an owner/admin of ANY instance? Generalized: the RPC
// reads instance_members, so a church or client instance owner passes the
// same gate the Poe family does. Injectable client for tests.
export async function fetchOwnerControl(client) {
  try {
    const { data, error } = await client.rpc('list_my_admin_instances');
    if (error) return { state: 'not-owner', instances: [] };
    const instances = Array.isArray(data) ? data : [];
    return { state: instances.length > 0 ? 'owner' : 'not-owner', instances };
  } catch {
    return { state: 'not-owner', instances: [] };
  }
}

// The offboarding drill: run top to bottom the day a dev/ops member leaves —
// or the hour something more sinister is suspected. Each row: what they could
// hold, why it matters, the revocation, and where it happens.
export const OFFBOARDING_DRILL = [
  {
    control: 'GitHub repository role',
    risk: 'Repo write reaches the delivery lane (and a pushed workflow could read Actions secrets).',
    revocation: 'Remove the collaborator — immediate; their tokens die with the role.',
    where: 'GitHub → repo → Settings → Collaborators',
    urgency: 'first',
  },
  {
    control: 'In-app steward roles',
    risk: 'Owner/admin role reaches member data and instance administration.',
    revocation: 'Demote or remove via the roles surface (set_member_role) — RLS enforces it instantly.',
    where: 'Admin → Roles & stewards (any instance they steward)',
    urgency: 'first',
  },
  {
    control: 'The store signing key — IF they ever generated or saw it',
    risk: 'The key is knowledge: a copy could sign a malicious "update" that installs over the real app.',
    revocation: 'ROTATE: generate a new key on this card (owner-gated), place the new secrets, rebuild. Every phone does one uninstall/reinstall of the new identity — the sideload cost of true revocation. (Play App Signing removes this cost when the Play step lands — DR-0152.)',
    where: 'Command & Serve → Store signing key',
    urgency: 'if-exposed',
  },
  {
    control: 'Platform dashboards (Cloudflare, Stripe, Supabase, GitHub org)',
    risk: 'Dashboard access = env keys and money settings.',
    revocation: 'These are OWNER accounts by standing rule — members never hold logins. Verify no session was shared; rotate any key they were ever shown.',
    where: 'Each dashboard → account access / API keys',
    urgency: 'verify',
  },
  {
    control: 'Fine-grained GitHub tokens they created',
    risk: 'A live token acts as them until expiry.',
    revocation: 'Their repo removal kills repo-scoped tokens; tokens the card taught expire ≤ 7 days regardless.',
    where: 'Covered by the collaborator removal above',
    urgency: 'verify',
  },
];
