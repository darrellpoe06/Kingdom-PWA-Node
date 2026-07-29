// =============================================================================
// AdminConsole — ONE data-driven report: the users KPIs + the system controls
// =============================================================================
// Darrell, 2026-07-04 (looking at the Admin tab): "it should be one tab... a
// report of users like the books financial reports, just data-driven KPIs" — and
// "why does it have all this n8n information if I'm not using that." Chosen shape:
// MERGE Admin + Access into one report and retire the separate Access tab.
//
// So this surface now leads with the REAL users/usage report (AccessUsageMetrics,
// absorbed from the retired Access tab — who has access, roles, activity, signups,
// most-used tabs), then the essential System & Build controls a steward needs
// (live build + backend reachability, reload-to-latest, reset-to-seed, your live
// backend role, and the self-checking CI/quality proof). Everything reads REAL
// state (DR-0061/0076); anything consequential PREVIEWS before a deliberate execute.
//
// REMOVED per Darrell's direction (the n8n/NAS plumbing he doesn't use, and the
// sub-tab clutter): the four-panel tab nav, the "NAS bridge token" device-token
// card, the "Internal Surfaces" dispatch-status-page (an n8n webhook), and the
// n8n-sourced Data-&-Loops rows. The underlying libs stay on disk (reversible);
// they're just off this report.
//
// GATED (isGovernor / trusted host), no-leak: the nav entry is absent from the DOM
// for non-stewards; this component carries a defense-in-depth locked fallback for
// any deep-link. WCAG AA in every theme: accents are THEMEABLE text-[#…] classes
// (never inline color), icons are <UiIcon/> (bundled SVG, currentColor), sizes are
// rem. Keeps consistency-guard + contrast-guard green.
// =============================================================================
import React, { useState } from 'react';
import supabase from '../lib/supabase.js';
import { enterReviewerMode } from '../lib/reviewer-mode.jsx';
import UiIcon from './UiIcon.jsx';
import QualityProof from './QualityProof.jsx';
import AccessUsageMetrics from './AccessUsageMetrics.jsx';
import SupportAccess from './SupportAccess.jsx';
import SectionTabs from './SectionTabs.jsx';
import {
  accessRoster,
  roleMeaning,
  systemFacts,
  previewAction,
} from '../lib/admin-console.js';
import { listInstanceMembers, setMemberRole, grantableRoles, roleLabel, listMyAdminInstances, inviteToSpace, isInviteEmail, CAPABILITIES, canEditCapabilities, listMemberCapabilities, setMemberCapability } from '../lib/member-roles.js';
import { listPendingClaims, confirmInvite } from '../lib/family-invite.js';
import MemberInspect from './MemberInspect.jsx';

const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : null;

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

// A consequential action: shows the plain "what this does" line, and on click
// PREVIEWS the exact consequences before a deliberate execute. `danger` styles the
// confirm in the warn palette. No action fires without the second, deliberate tap.
function GuardedAction({ actionId, onExecute, disabled = false, busy = false, result = null }) {
  const spec = previewAction(actionId);
  const [previewing, setPreviewing] = useState(false);
  if (!spec) return null;
  const confirmCls = spec.danger
    ? 'border-[#7A1F1F] text-[#7A1F1F] hover:bg-[#7A1F1F] hover:text-white'
    : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white';
  return (
    <div className="border border-[#E8E4DC] p-3">
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{spec.label}</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>{spec.what}</p>

      {!previewing ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreviewing(true)}
          className={`mt-2 inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 ${confirmCls}`}
        >
          {spec.label} <span aria-hidden="true" className="ml-1">→</span>
        </button>
      ) : (
        <div className="mt-2 bg-[#FAF8F4] border border-[#B85838] p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Before you do this — here’s exactly what happens</div>
          <ul className="mt-1.5 space-y-1">
            {spec.preview.map((line, i) => (
              <li key={i} className="text-xs text-[#1A1815] leading-relaxed flex gap-1.5" style={serif}>
                <span aria-hidden="true" className="text-[#B85838]">›</span><span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => { setPreviewing(false); onExecute && onExecute(); }}
              className={`inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 ${confirmCls}`}
            >
              {busy ? 'Working…' : spec.confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => setPreviewing(false)}
              className="inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] hover:bg-[#5A5751] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {result && (
        <p className="text-xs text-[#5A6E3D] mt-2" style={serif}>{result}</p>
      )}
    </div>
  );
}

export default function AdminConsole({
  isGovernor = false,
  email = null,
  instanceId = null,
  backendReachable = false,
  isPublicHost = true,
  onResetSeed = null,
}) {
  const [roleState, setRoleState] = useState({ status: 'idle', role: null, error: null });
  const [members, setMembers] = useState({ status: 'idle', list: [], myRole: null, error: null });
  const [adminInstances, setAdminInstances] = useState([]);         // spaces the steward may administer (family + church)
  const [scopeInstance, setScopeInstance] = useState(instanceId);   // which space "Manage access roles" targets
  const [invite, setInvite] = useState({ email: '', role: 'member', msg: '', link: '' });  // "invite someone" form
  const [pending, setPending] = useState([]);                       // claims awaiting the inviter's confirmation
  const [inspecting, setInspecting] = useState(null);               // member userId whose stewardship record is open (0122)
  const [checklistFor, setChecklistFor] = useState(null);           // member userId whose capability checklist is open (DR-0242)
  const [capGrants, setCapGrants] = useState([]);                   // [{ userId, capability }] for the scoped space (0126)

  // No-leak defense-in-depth. The nav entry is already absent from the DOM for
  // non-stewards; this backstops any ?view=admin deep-link.
  if (!isGovernor) {
    return (
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold inline-flex items-center gap-1.5">
          <UiIcon name="lock" /> Admin
        </div>
        <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
          Admin is a stewardship space. It opens for the family stewards — each serves only their own
          domain, and no one sees another’s people or private data. Sign in with a steward account to enter.
        </p>
      </section>
    );
  }

  const roster = accessRoster(email);

  // READ action: fetch this steward's live backend role from the database
  // (user_role_in_instance RPC). Real query, honest failure — never a painted role.
  const checkRole = async () => {
    if (!instanceId) { setRoleState({ status: 'no-instance', role: null, error: null }); return; }
    setRoleState({ status: 'loading', role: null, error: null });
    try {
      const { data: role, error } = await supabase.rpc('user_role_in_instance', { tenant_uuid: instanceId });
      if (error) { setRoleState({ status: 'error', role: null, error: error.message || 'query failed' }); return; }
      setRoleState({ status: 'ok', role: role || null, error: null });
    } catch (e) {
      setRoleState({ status: 'error', role: null, error: (e && e.message) || 'query failed' });
    }
  };

  // Load the REAL member roster + my role for a given space, so the role controls
  // show live data and only the roles I may actually set (mirrors set_member_role,
  // 0111). Also loads the spaces I may administer (family + COLG/Love Corner church
  // + ministries) so the panel can offer an instance picker.
  const loadMembers = async (targetInstance) => {
    // Populate the picker on first load; keep the current pick if still valid.
    const spaces = await listMyAdminInstances();
    setAdminInstances(spaces);
    const wanted = targetInstance || scopeInstance
      || (spaces.find((s) => s.instanceId === instanceId) ? instanceId : spaces[0]?.instanceId)
      || instanceId;
    setScopeInstance(wanted);
    if (!wanted) { setMembers({ status: 'no-instance', list: [], myRole: null, error: null }); return; }
    setMembers((p) => ({ ...p, status: 'loading' }));
    try {
      const { data: myRole } = await supabase.rpc('user_role_in_instance', { tenant_uuid: wanted });
      const list = await listInstanceMembers(wanted);
      setMembers({ status: 'ok', list, myRole: myRole || null, error: null });
      setCapGrants(await listMemberCapabilities(wanted));
      loadPending();
    } catch (e) {
      setMembers({ status: 'error', list: [], myRole: null, error: (e && e.message) || 'query failed' });
    }
  };
  const changeMemberRole = async (userId, role) => {
    const r = await setMemberRole(scopeInstance, userId, role);
    if (r?.skipped) { setMembers((p) => ({ ...p, error: r.error?.message || r.skipped })); return; }
    await loadMembers(scopeInstance);
  };
  // One checkbox on the governance checklist (DR-0242): grant/revoke, then
  // re-read the real grants so the boxes always show DB truth.
  const toggleCapability = async (userId, capability, enabled) => {
    const r = await setMemberCapability(scopeInstance, userId, capability, enabled);
    if (r?.skipped) { setMembers((p) => ({ ...p, error: r.error?.message || r.skipped })); return; }
    setCapGrants(await listMemberCapabilities(scopeInstance));
  };

  // The type of the space currently being managed (church vs family/other), so the
  // invite uses the right path.
  const scopeType = (adminInstances.find((s) => s.instanceId === scopeInstance) || {}).instanceType || null;

  // Invite someone so they can start USING the app (Darrell 2026-07-22, "I want
  // people using the apps"). Church -> access on their next sign-in; family/other
  // -> a one-time claim LINK to deliver, then confirm below (two-party, DR-0187).
  const doInvite = async () => {
    if (!isInviteEmail(invite.email)) { setInvite((p) => ({ ...p, msg: 'Enter a valid email.', link: '' })); return; }
    setInvite((p) => ({ ...p, msg: 'Inviting…', link: '' }));
    const r = await inviteToSpace(scopeType, invite.email, invite.role, scopeInstance);
    if (!r.ok) { setInvite((p) => ({ ...p, msg: `Couldn't invite (${r.reason || 'error'}).`, link: '' })); return; }
    if (r.kind === 'church') {
      setInvite({ email: '', role: 'member', msg: `Invited ${r.email}. They'll get access the next time they sign in.`, link: '' });
    } else {
      setInvite({ email: '', role: 'member', msg: `Invite ready for ${r.email}. Share this one-time link; then confirm them below once they open it.`, link: r.link || '' });
      loadPending();
    }
  };
  const loadPending = async () => {
    const r = await listPendingClaims();
    setPending(r.ok ? r.claims : []);
  };
  const doConfirm = async (inviteId) => {
    const r = await confirmInvite(inviteId);
    if (r.ok) { await loadPending(); await loadMembers(scopeInstance); }
  };

  const doReload = () => { try { window.location.reload(); } catch (e) { /* no-op */ } };
  const doResetSeed = () => { if (onResetSeed) onResetSeed(); };
  // The steward's "see it as a user" review lens (lib/reviewer-mode.jsx). Sets the
  // per-device flag and reloads into the exact signed-in-user boot; the pinned
  // banner's Exit brings this steward view back.
  const doReviewAsUser = () => enterReviewerMode();

  const facts = systemFacts({ isPublicHost, buildSha: BUILD_SHA, buildTime: BUILD_TIME, backendReachable });

  // The long report, broken into swipeable sections (Darrell 2026-07-04: "sliding
  // tabs instead of a long scroll"). Each section renders only when opened — so the
  // users report and the quality self-check do their fetching lazily, on the tab you
  // actually open. The intro card stays pinned above the strip for constant context.
  const sections = [
    {
      id: 'users',
      label: 'Users & usage',
      icon: 'users',
      // THE USERS REPORT — absorbed from the retired Access tab. Real KPIs, self-
      // fetching, fail-soft, family/governor-gated at the DB.
      render: () => <AccessUsageMetrics />,
    },
    {
      id: 'system',
      label: 'This device',
      icon: 'monitor',
      render: () => (
        <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">This device, right now</div>
          <ul className="mt-3 space-y-2.5">
            {facts.map((f) => (
              <li key={f.label} className="border-b border-[#E8E4DC] pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider text-[#5A5751]">{f.label}</span>
                  <span className="text-sm font-semibold text-[#1A1815] break-all" style={serif}>{f.value}</span>
                </div>
                <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>{f.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: 'tools',
      render: () => (
        <section className="bg-white border border-[#1A1815] p-4">
          <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Actions</div>
          {/* DR-0102 — the standing post-push review discipline, stated where the
              action lives (APP-IS-PRIMARY). Not decoration: this is the habit the
              "Review as a user" action exists to serve. */}
          <div className="mt-2 border border-[#5A6E3D] bg-[#FAF8F4] p-3">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">How we review</div>
            <p className="text-xs text-[#1A1815] mt-1 leading-relaxed" style={serif}>
              After every push to production, review it live <strong>as a user</strong> before trusting it — the CI gates prove the build is sound; this proves it’s right on the screen the user actually meets. Use <strong>Review as a user</strong> below any time; it’s always here. A pinned strip carries the one-tap way back.
            </p>
          </div>
          <div className="mt-2 space-y-2">
            <GuardedAction actionId="reload-latest" onExecute={doReload} />
            <GuardedAction actionId="review-as-user" onExecute={doReviewAsUser} />
            {onResetSeed && <GuardedAction actionId="reset-seed" onExecute={doResetSeed} />}
          </div>
        </section>
      ),
    },
    {
      id: 'role',
      label: 'Role & stewards',
      icon: 'lock',
      // Your live backend role (a real RPC self-check) + who can administer.
      render: () => (
        <section className="bg-white border border-[#1A1815] p-4">
          <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Your live role in the backend</div>
          <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
            Ask the database what role your account actually holds in the family space, right now.
          </p>
          <button
            type="button"
            onClick={checkRole}
            className="mt-2 inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            {roleState.status === 'loading' ? 'Checking…' : 'Check my role'} <span aria-hidden="true" className="ml-1">→</span>
          </button>
          {roleState.status === 'ok' && (
            <p className="text-xs mt-2 text-[#1A1815]" style={serif}>
              <strong className="uppercase tracking-wider text-[#5A6E3D]">{roleState.role || 'no role on record'}</strong>
              {roleMeaning(roleState.role) && <> — {roleMeaning(roleState.role)}</>}
            </p>
          )}
          {roleState.status === 'no-instance' && (
            <p className="text-xs mt-2 text-[#5A5751]" style={serif}>Not connected to the backend on this device — sign in / reconnect to check.</p>
          )}
          {roleState.status === 'error' && (
            <p className="text-xs mt-2 text-[#7A1F1F]" style={serif}>Couldn’t read your role: {roleState.error}</p>
          )}
          <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Who can administer</div>
            <ul className="mt-1.5 space-y-1">
              {roster.map((r) => (
                <li key={r.email} className="flex items-baseline gap-2 text-xs text-[#1A1815]" style={serif}>
                  <span aria-hidden="true" className="text-[#5A6E3D]">●</span>
                  <span className="break-all">{r.email}</span>
                  {r.isYou && <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">you</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Real, guarded role controls (DR-0220 Phase 3). Owner/admin only —
              set_member_role (0111) is the real enforcement; the options shown
              mirror its guards (never owner, only an owner grants admin, no self,
              owners untouchable). Works for family AND the COLG/Love Corner church
              instance — same primitive. */}
          <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Manage access roles</div>
              <button type="button" onClick={loadMembers}
                className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">
                {members.status === 'loading' ? 'Loading…' : members.status === 'ok' ? 'Refresh' : 'Load members'}
              </button>
            </div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
              Change a member’s access in this space. You can’t change an owner, an admin (only an owner can), or yourself — and no one is ever made owner here.
            </p>
            {adminInstances.length > 1 && (
              <label className="flex items-center gap-2 mt-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                Space
                <select className="text-xs p-1 border border-[#E8E4DC] bg-white normal-case tracking-normal"
                  value={scopeInstance || ''} onChange={(e) => { setScopeInstance(e.target.value); loadMembers(e.target.value); }}>
                  {adminInstances.map((s) => (
                    <option key={s.instanceId} value={s.instanceId}>
                      {s.displayName || s.instanceId}{s.instanceType === 'church' ? ' (church)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {members.status === 'no-instance' && <p className="text-xs mt-2 text-[#5A5751]" style={serif}>Not connected to the backend on this device.</p>}
            {members.status === 'error' && <p className="text-xs mt-2 text-[#7A1F1F]" style={serif}>{members.error}</p>}
            {members.status === 'ok' && members.list.length === 0 && <p className="text-xs mt-2 text-[#5A5751]" style={serif}>No members to manage (owner/admin access required).</p>}
            {members.status === 'ok' && members.list.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {members.list.map((m) => {
                  const isSelf = !!(m.email && email && m.email.toLowerCase() === email.toLowerCase());
                  const options = grantableRoles(members.myRole, m.role, { isSelf });
                  return (
                    <li key={m.userId || m.email} className="text-xs text-[#1A1815]" style={serif}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="break-all min-w-0">{m.displayName || m.email || 'member'}{isSelf && <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold ml-1">you</span>}</span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {options.length ? (
                            <select className="text-xs p-1 border border-[#E8E4DC] bg-white" value={m.role}
                              onChange={(e) => changeMemberRole(m.userId, e.target.value)}>
                              <option value={m.role} disabled>{roleLabel(m.role)}</option>
                              {options.filter((o) => o !== m.role).map((o) => <option key={o} value={o}>{roleLabel(o)}</option>)}
                            </select>
                          ) : (
                            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] whitespace-nowrap">{roleLabel(m.role)}</span>
                          )}
                          {/* The governance checklist (DR-0242): additive powers
                              between the roles — per person, DB-enforced. */}
                          {m.userId && canEditCapabilities(members.myRole, m.role, { isSelf }) && (
                            <button type="button"
                              className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#C9BFA8] text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]"
                              aria-expanded={checklistFor === m.userId}
                              onClick={() => setChecklistFor((cur) => (cur === m.userId ? null : m.userId))}>
                              {checklistFor === m.userId ? 'Close' : 'Checklist'}
                            </button>
                          )}
                          {/* Inspect: the stewardship record (position · status ·
                              satisfaction · notes, 0122) — Darrell 2026-07-27. */}
                          {m.userId && (
                            <button type="button"
                              className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#C9BFA8] text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]"
                              aria-expanded={inspecting === m.userId}
                              onClick={() => setInspecting((cur) => (cur === m.userId ? null : m.userId))}>
                              {inspecting === m.userId ? 'Close' : 'Inspect'}
                            </button>
                          )}
                        </span>
                      </div>
                      {checklistFor === m.userId && (
                        <div className="mt-1.5 border border-[#E8E4DC] bg-[#FAF8F4] p-2.5">
                          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">
                            Extra powers for {m.displayName || m.email || 'this person'} — on top of {roleLabel(m.role)}
                          </div>
                          <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
                            Each box adds one specific ability without changing their role. The books, money, and membership are never unlockable here — those stay with Admin.
                          </p>
                          {['Governance', 'Areas'].map((group) => (
                            <div key={group} className="mt-1.5">
                              <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold">{group}</div>
                              <ul className="mt-1 space-y-1">
                                {CAPABILITIES.filter((c) => c.group === group).map((c) => {
                                  const on = capGrants.some((g) => g.userId === m.userId && g.capability === c.key);
                                  return (
                                    <li key={c.key}>
                                      <label className="flex items-start gap-2 text-xs text-[#1A1815] cursor-pointer" style={serif}>
                                        <input type="checkbox" className="mt-0.5 accent-[#5A6E3D]" checked={on}
                                          onChange={(e) => toggleCapability(m.userId, c.key, e.target.checked)} />
                                        <span>
                                          <span className="font-semibold">{c.label}</span>
                                          <span className="block text-[0.6875rem] text-[#5A5751]">{c.note}</span>
                                        </span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      {inspecting === m.userId && (
                        <MemberInspect instanceId={scopeInstance} member={m} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Get people USING the app (Darrell 2026-07-22): invite someone into
              this space by email. Church -> access on next sign-in; family/other
              -> a one-time claim link to deliver, then confirm below. */}
          <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Invite someone to this space</div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
              {scopeType === 'church'
                ? 'They’ll get access the next time they sign in.'
                : 'You’ll get a one-time link to send them; confirm them here once they open it.'}
            </p>
            <div className="mt-2 flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1" htmlFor="ac-invite-email">Email</label>
                <input id="ac-invite-email" type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={invite.email}
                  onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} placeholder="person@email.com" />
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1" htmlFor="ac-invite-role">Role</label>
                <select id="ac-invite-role" className="text-xs p-2 border border-[#E8E4DC] bg-white" value={invite.role}
                  onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="button" disabled={!invite.email.trim()} onClick={doInvite}
                className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] bg-[#5A6E3D] text-white font-semibold disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
                Invite
              </button>
            </div>
            {invite.msg && <p className="text-[0.6875rem] text-[#1A1815] mt-2" style={serif}>{invite.msg}</p>}
            {invite.link && (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <code className="text-[0.625rem] break-all bg-[#FAF8F4] border border-[#E8E4DC] px-2 py-1 max-w-full">{invite.link}</code>
                <button type="button" onClick={() => { try { navigator.clipboard?.writeText(invite.link); } catch { /* noop */ } }}
                  className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">Copy</button>
              </div>
            )}
            {pending.length > 0 && (
              <div className="mt-3">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Waiting for your confirmation</div>
                <ul className="mt-1.5 space-y-1.5">
                  {pending.map((c) => (
                    <li key={c.invite_id} className="flex items-baseline justify-between gap-2 text-xs text-[#1A1815]" style={serif}>
                      <span className="break-all min-w-0">{c.claimed_email || c.email}{c.role ? <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] ml-1">{c.role}</span> : null}</span>
                      <button type="button" onClick={() => doConfirm(c.invite_id)}
                        className="text-[0.625rem] uppercase tracking-wider px-2 py-1 bg-[#1A1815] text-white hover:bg-[#B85838]">Confirm</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ),
    },
    {
      id: 'support',
      label: 'Support access',
      icon: 'lock',
      // The Governed Support Door (DR-0223): fix issues without ambient data access.
      render: () => <SupportAccess instanceId={instanceId} />,
    },
    {
      id: 'quality',
      label: 'Quality proof',
      icon: 'check',
      // The real, self-checking build + quality state (CI, deploy freshness,
      // per-theme WCAG contrast). Composed, not reimplemented.
      render: () => <QualityProof />,
    },
  ];

  return (
    <div className="space-y-4" data-talk-surface="admin">
      {/* Header — the steward at the helm, plain framing. Pinned above the strip. */}
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5">
            <UiIcon name="lock" /> Admin — your users &amp; system, in plain language
          </div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>
            build {BUILD_SHA}{BUILD_TIME ? ` · ${String(BUILD_TIME).slice(0, 10)}` : ''}
          </div>
        </div>
        <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
          One report: who’s using the app and how, then the live build and the controls to run it —
          without touching a database or a command line. Every number is real; anything with a real
          consequence shows you exactly what will happen before it does. Slide between the sections below.
        </p>
      </section>

      <SectionTabs sections={sections} ariaLabel="Admin sections" idBase="admin" defaultId="users" />

      <p className="text-[0.625rem] text-[#5A5751] italic" style={serif}>
        Every reading here is a live view of real system state. No secrets or keys are shown; anything with a
        real consequence previews first, then waits for your deliberate go.
      </p>
    </div>
  );
}
