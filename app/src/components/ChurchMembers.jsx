// =============================================================================
// ChurchMembers — the Love Corner door governs itself: the way in, the people
// by standing with their pictures, and each person's may / may-not
// =============================================================================
// Darrell, 2026-09-10 (scoped to the PoeTech / Love Corner app): "how can we
// see and edit the onboarding process when we or staff want to make
// adjustments?" — "Assistants and others need hierarchy for making sure we
// have appropriate governance and resources" — "Owners and managers etc need
// to be able to govern using the same app" — "opportunities and constraints".
//
// Before this, governing the church door meant the family Admin tab's "Role &
// stewards" panel with a space picker — a steward's room, gated by the family
// allowlist. A church owner or admin who is not family had no place to govern
// at all. This tab lives ON the church door and is gated by the REAL standing
// the database holds (list_my_admin_instances: a church space where I am
// owner or admin) — the same primitives underneath (set_member_role,
// set_member_capability, invite_to_church, confirm_invite), so nothing here
// is a second rule; it is the one rule, seen from the door it governs.
//
// Three sub-tabs (the third-row chips, DR-0103 §sliding tabs):
//   The way in — the join process as the database runs it (0014), each step
//                with its live count; a signed-in member sees the steps too
//                (the process is public to the door; the numbers are not).
//   People     — the roster grouped by standing, hierarchy order, with each
//                person's picture (useProfiles, DR-0342), their standing as a
//                control (grantableRoles), and their opportunities and
//                constraints as MAY / MAY NOT — extra rights are checkboxes
//                for members and viewers (canEditCapabilities).
//   Invite     — email + standing → access on next sign-in; claim links
//                waiting on confirmation.
// Remove rides the same fold: a first tap asks, a second tap removes
// (remove_instance_member 0130 — never an owner, only an owner removes an
// admin, never yourself; canRemove mirrors it so the button never offers
// what the server refuses).
// Every count is a row the server returned; an error says it is one (the
// STRICT roster read, DR-0100). Signed out → a sign-in note, never a blank.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthChange } from '../lib/supabase.js';
import SectionTabs from './SectionTabs.jsx';
import UiIcon from './UiIcon.jsx';
import { ProfileAvatar } from './ProfileCard.jsx';
import { useProfiles, preferredName } from '../lib/use-profiles.js';
import {
  grantableRoles, roleLabel, setMemberRole, CAPABILITIES, canEditCapabilities,
  setMemberCapability, listMemberCapabilities, inviteToSpace, isInviteEmail, removeInstanceMember,
} from '../lib/member-roles.js';
import { confirmInvite } from '../lib/family-invite.js';
import {
  loadChurchGovernance, rightsFor, countsByRole, groupByRole, wayInSteps, canRemove,
} from '../lib/church-members.js';

const serif = { fontFamily: '"Fraunces", serif' };
const LABEL = 'text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold';
const CHIP_BTN = 'text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';

function Card({ children }) {
  return <section className="bg-white border border-[#1A1815] p-4">{children}</section>;
}

// ── The way in ──────────────────────────────────────────────────────────────
function WayIn({ gov }) {
  const counts = gov && gov.governs ? countsByRole(gov.members) : null;
  const steps = wayInSteps({ counts, invites: gov && gov.governs ? gov.invites : null, claims: gov && gov.governs ? gov.claims : null });
  return (
    <Card>
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>How a person gets onto this door</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
        This is the process exactly as the church server runs it. The number beside each step is live — read from the door’s own records, never typed in.
      </p>
      <ol className="mt-3 space-y-2" data-way-in>
        {steps.map((s, i) => (
          <li key={s.id} className="border border-[#E8E4DC] p-2.5 flex items-start gap-3" data-step={s.id}>
            <span aria-hidden="true" className="shrink-0 w-6 h-6 rounded-full bg-[#1A1815] text-white text-[0.6875rem] font-semibold inline-flex items-center justify-center">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#1A1815]" style={serif}>{s.title}</div>
              <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>{s.detail}</p>
            </div>
            {s.count != null && (
              <span className="shrink-0 text-right" data-step-count={s.id}>
                <span className="block text-lg font-semibold text-[#1A1815] leading-none" style={serif}>{s.count}</span>
                <span className="block text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">{s.unit}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      {counts && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
          <div className={LABEL}>People by standing, right now</div>
          <ul className="mt-1.5 flex flex-wrap gap-1.5" data-counts>
            {Object.entries(counts).filter(([k, v]) => k !== 'total' && v > 0).map(([k, v]) => (
              <li key={k} className="text-[0.6875rem] border border-[#E8E4DC] bg-[#FAF8F4] px-2 py-1 text-[#1A1815]" style={serif} data-count-role={k}>
                <span className="font-semibold">{v}</span> {roleLabel(k)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!counts && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-3 leading-relaxed" style={serif}>
          The live numbers, the people and the controls open for the door’s owners and admins.
        </p>
      )}
    </Card>
  );
}

// ── People ──────────────────────────────────────────────────────────────────
function Person({ m, myRole, myUserId, grants, onRole, onRight, onRemove, profile }) {
  const [open, setOpen] = useState(false);
  const [askRemove, setAskRemove] = useState(false);
  const isSelf = !!(myUserId && m.userId === myUserId);
  const options = grantableRoles(myRole, m.role, { isSelf });
  const editable = canEditCapabilities(myRole, m.role, { isSelf });
  const rights = rightsFor(m.role, grants, m.userId);
  const name = preferredName(profile, m.displayName, m.email, 'Member');
  const removable = canRemove(myRole, m.role, { isSelf });
  return (
    <li className="border border-[#E8E4DC] p-2.5" data-person={m.userId}>
      <div className="flex items-center gap-3">
        <ProfileAvatar profile={profile || { displayName: name }} size={40} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#1A1815] truncate" style={serif}>
            {name}{isSelf && <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold ml-1">you</span>}
          </div>
          {m.email && <div className="text-[0.6875rem] text-[#5A5751] truncate">{m.email}</div>}
        </div>
        {options.length ? (
          <select
            aria-label={`Standing for ${name}`}
            className="text-xs p-1 border border-[#E8E4DC] bg-white"
            value={m.role}
            onChange={(e) => onRole(m.userId, e.target.value)}
          >
            <option value={m.role} disabled>{roleLabel(m.role)}</option>
            {options.filter((o) => o !== m.role).map((o) => <option key={o} value={o}>{roleLabel(o)}</option>)}
          </select>
        ) : (
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] whitespace-nowrap">{roleLabel(m.role)}</span>
        )}
        <button type="button" className={`${CHIP_BTN} shrink-0`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Rights'}
        </button>
      </div>
      {open && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2" data-rights>
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2">
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">May</div>
            <ul className="mt-1 space-y-0.5 text-[0.6875rem] text-[#1A1815]" style={serif} data-may>
              {rights.may.map((t) => <li key={t}>✓ {t}</li>)}
            </ul>
          </div>
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2">
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">May not</div>
            <ul className="mt-1 space-y-0.5 text-[0.6875rem] text-[#5A5751]" style={serif} data-may-not>
              {rights.mayNot.map((t) => <li key={t}>— {t}</li>)}
            </ul>
          </div>
          {editable && (
            <div className="sm:col-span-2 border border-[#E8E4DC] p-2">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold">Extra rights for {name} — on top of {roleLabel(m.role)}</div>
              <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
                Each box opens one specific door without changing their standing. The books, money and membership are never opened here.
              </p>
              <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {CAPABILITIES.map((c) => {
                  const on = grants.some((g) => g.userId === m.userId && g.capability === c.key);
                  return (
                    <li key={c.key}>
                      <label className="flex items-start gap-2 text-xs text-[#1A1815] cursor-pointer" style={serif}>
                        <input type="checkbox" className="mt-0.5 accent-[#5A6E3D]" checked={on} data-right={c.key}
                          onChange={(e) => onRight(m.userId, c.key, e.target.checked)} />
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
          )}
          {removable && (
            <div className="sm:col-span-2 flex items-center justify-between gap-2 flex-wrap border border-[#E8E4DC] p-2" data-remove>
              <span className="text-[0.6875rem] text-[#5A5751]" style={serif}>
                {askRemove ? `Remove ${name} from this door? Their records stay; their access ends now.` : 'Take this person off the door entirely.'}
              </span>
              <span className="flex items-center gap-1.5">
                {askRemove && (
                  <button type="button" className={`${CHIP_BTN} shrink-0`} onClick={() => setAskRemove(false)}>Keep</button>
                )}
                <button type="button" data-remove-button
                  className="text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border border-[#7A1F1F] text-[#7A1F1F] hover:bg-[#7A1F1F] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  onClick={() => { if (askRemove) { setAskRemove(false); onRemove(m.userId); } else setAskRemove(true); }}>
                  {askRemove ? 'Yes, remove' : 'Remove'}
                </button>
              </span>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function People({ gov, myUserId, onRole, onRight, onRemove }) {
  const ids = useMemo(() => (gov.members || []).map((m) => m.userId), [gov.members]);
  const profiles = useProfiles(ids);
  const groups = groupByRole(gov.members);
  return (
    <Card>
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>The people on this door, by standing</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
        Top down: owner, admin, member, assistant, successor, child, viewer. Tap <strong>Rights</strong> to see what a person may and may not do, and to remove them; change a standing from its box. You cannot change, or remove, an owner or yourself.
      </p>
      {groups.length === 0 && <p className="text-xs mt-2 text-[#5A5751]" style={serif}>No one is on this door yet.</p>}
      {groups.map((g) => (
        <div key={g.role} className="mt-3" data-role-group={g.role}>
          <div className={LABEL}>{g.label} · {g.people.length}</div>
          <ul className="mt-1.5 space-y-1.5">
            {g.people.map((m) => (
              <Person key={m.userId || m.email} m={m} myRole={gov.myRole} myUserId={myUserId} grants={gov.grants}
                onRole={onRole} onRight={onRight} onRemove={onRemove} profile={profiles[m.userId] || null} />
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}

// ── Invite ──────────────────────────────────────────────────────────────────
function Invite({ gov, onInvite, onConfirm, note }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  // invite_to_church (0014) accepts member / viewer / admin from any owner or admin; never owner.
  const roles = ['member', 'viewer', 'admin'];
  return (
    <Card>
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Invite someone onto this door</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
        They get in the next time they sign in with this email. The invite stays open for 14 days.
      </p>
      <div className="mt-2 flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1" htmlFor="cm-invite-email">Email</label>
          <input id="cm-invite-email" type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="person@email.com" />
        </div>
        <div>
          <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1" htmlFor="cm-invite-role">Standing</label>
          <select id="cm-invite-role" className="text-xs p-2 border border-[#E8E4DC] bg-white" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
        </div>
        <button type="button" disabled={!isInviteEmail(email)} onClick={() => { onInvite(email, role); setEmail(''); }}
          className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] bg-[#5A6E3D] text-white font-semibold disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
          Invite
        </button>
      </div>
      {note && <p className="text-[0.6875rem] text-[#1A1815] mt-2" style={serif} role="status" data-invite-note>{note}</p>}
      <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
        <div className={LABEL}>Open invites · {gov.invites.length}</div>
        {gov.invites.length === 0 && <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>None open right now.</p>}
        <ul className="mt-1.5 space-y-1" data-open-invites>
          {gov.invites.map((inv) => (
            <li key={inv.id} className="flex items-baseline justify-between gap-2 text-xs text-[#1A1815]" style={serif}>
              <span className="break-all min-w-0">{inv.email}</span>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] whitespace-nowrap">{roleLabel(inv.role)}{inv.expires_at ? ` · until ${new Date(inv.expires_at).toLocaleDateString()}` : ''}</span>
            </li>
          ))}
        </ul>
      </div>
      {gov.claims.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
          <div className={LABEL}>Waiting for your confirmation · {gov.claims.length}</div>
          <ul className="mt-1.5 space-y-1.5" data-claims>
            {gov.claims.map((c) => (
              <li key={c.invite_id} className="flex items-baseline justify-between gap-2 text-xs text-[#1A1815]" style={serif}>
                <span className="break-all min-w-0">{c.claimed_email || c.email}{c.role ? <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] ml-1">{roleLabel(c.role)}</span> : null}</span>
                <button type="button" onClick={() => onConfirm(c.invite_id)}
                  className="text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Confirm</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

// ── The tab ─────────────────────────────────────────────────────────────────
export default function ChurchMembers() {
  const [session, setSession] = useState(null);
  const [state, setState] = useState({ status: 'idle', gov: null, error: null });
  const [note, setNote] = useState('');
  useEffect(() => onAuthChange((s) => setSession(s)), []);
  const signedIn = !!(session && session.user);
  const myUserId = signedIn ? session.user.id : null;

  const load = useCallback(async () => {
    setState((p) => ({ ...p, status: 'loading', error: null }));
    try {
      const gov = await loadChurchGovernance();
      setState({ status: 'ok', gov, error: null });
    } catch (e) {
      setState({ status: 'error', gov: null, error: (e && e.message) || 'The door’s records could not be read.' });
    }
  }, []);

  useEffect(() => {
    if (!signedIn) { setState({ status: 'idle', gov: null, error: null }); return; }
    load();
  }, [signedIn, load]);

  const gov = state.gov;
  const governs = !!(gov && gov.governs);
  const spaceId = governs ? gov.space.instanceId : null;

  const onRole = async (userId, role) => {
    const r = await setMemberRole(spaceId, userId, role);
    if (r && r.skipped) { setState((p) => ({ ...p, error: (r.error && r.error.message) || r.skipped })); return; }
    await load();
  };
  const onRight = async (userId, capability, enabled) => {
    const r = await setMemberCapability(spaceId, userId, capability, enabled);
    if (r && r.skipped) { setState((p) => ({ ...p, error: (r.error && r.error.message) || r.skipped })); return; }
    const grants = await listMemberCapabilities(spaceId);
    setState((p) => (p.gov ? { ...p, gov: { ...p.gov, grants } } : p));
  };
  const onRemove = async (userId) => {
    const r = await removeInstanceMember(spaceId, userId);
    if (r && r.skipped) { setState((p) => ({ ...p, error: (r.error && r.error.message) || r.skipped })); return; }
    await load();
  };
  const onInvite = async (email, role) => {
    setNote('Inviting…');
    const r = await inviteToSpace('church', email, role, spaceId);
    if (!r.ok) { setNote(`Couldn’t invite (${r.reason || 'error'}).`); return; }
    setNote(`Invited ${r.email} as ${roleLabel(r.role)}. They get in the next time they sign in.`);
    await load();
  };
  const onConfirm = async (inviteId) => {
    const r = await confirmInvite(inviteId);
    if (r.ok) await load();
  };

  if (!signedIn) {
    return (
      <Card>
        <div className={`${LABEL} inline-flex items-center gap-1.5`}><UiIcon name="users" /> Members</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
          The Members tab shows how a person gets onto this door and lets the door’s owners and admins govern it. Sign in to see it.
        </p>
      </Card>
    );
  }

  const sections = [
    { id: 'way-in', label: 'The way in', icon: 'lock', render: () => <WayIn gov={gov} /> },
    governs && { id: 'people', label: 'People', icon: 'users', render: () => <People gov={gov} myUserId={myUserId} onRole={onRole} onRight={onRight} onRemove={onRemove} /> },
    governs && { id: 'invite', label: 'Invite', icon: 'sparkle', render: () => <Invite gov={gov} onInvite={onInvite} onConfirm={onConfirm} note={note} /> },
  ];

  return (
    <div className="space-y-3" data-church-members>
      <Card>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Love Corner · Members</div>
            <div className="text-sm font-semibold text-[#1A1815] mt-0.5" style={serif}>
              {governs ? `You govern this door as ${roleLabel(gov.myRole)}.` : 'The way onto this door, and who governs it.'}
            </div>
          </div>
          <button type="button" onClick={load} className={`${CHIP_BTN} shrink-0`} data-refresh>
            {state.status === 'loading' ? 'Reading…' : 'Refresh'}
          </button>
        </div>
        {state.status === 'error' && <p className="text-xs mt-2 text-[#7A1F1F]" style={serif} role="alert">Couldn’t read the door’s records: {state.error}</p>}
        {state.status === 'ok' && !governs && (
          <p className="text-xs mt-2 text-[#5A5751]" style={serif} data-not-governor>
            Governing — the people, the numbers, invites and standings — opens for this door’s owners and admins. Your standing here is on record with them.
          </p>
        )}
      </Card>
      {gov ? (
        <SectionTabs sections={sections} ariaLabel="Members sections" idBase="cm" variant="sub" defaultId="way-in" />
      ) : null}
    </div>
  );
}
