// =============================================================================
// AccessUsageMetrics — WHO has access to the PoeTech App, and the obvious metrics
// =============================================================================
// Declared by Darrell 2026-06-29: "We need to be aware of the number of people
// and WHO has access to the PoeTech App, and other obvious metrics for updates."
//
// This is ACCESS GOVERNANCE + AGGREGATE usage — NOT surveillance of members
// (servant-king / served-not-surveilled, DATA-AS-EMPOWERMENT + QUALITY-OF-LIFE).
// It shows: who has access + their role + scope; counts + activity; build-
// freshness (who's on the latest version for managing rollouts); and pending
// invites. It shows NO private content, NO messages, NO per-person behavior.
//
// Every number is REAL (DR-0076): the roster/role/scope come from instance_members
// + instances; activity + build-freshness from member_presence heartbeats; invites
// from external_users — all RLS-gated (this surface is family/governor-only in the
// shell, and member_presence read is owner/admin-only at the DB). Where a signal
// has no data yet, the surface says so honestly — it never paints a number.
//
// ADMIN ACTIONS (prohibited-actions rule): this surface BUILDS the view of access
// and surfaces pending invites; CHANGING access (revoke / adjust / grant) is a
// deliberate human steward action, never auto-performed from here.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import { fetchAccessSnapshot, currentBuild } from '../lib/access-metrics-sync.js';
import {
  summarize, countByRole, groupByScope, newVsReturning, activityRollup,
  buildFreshness, membersWithoutPresence, pendingInvites, roleLabel, relativeTime,
} from '../lib/access-metrics.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const labelCls = 'text-[0.625rem] uppercase tracking-wider text-[#5A5751]';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';

function Tile({ label, value, sub }) {
  return (
    <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
      <div className={labelCls}>{label}</div>
      <div className="text-lg font-semibold tabular-nums text-[#1A1815]">{value}</div>
      {sub ? <div className="text-[0.625rem] text-[#5A5751]">{sub}</div> : null}
    </div>
  );
}

function RolePill({ role }) {
  return (
    <span className="inline-block text-[0.5625rem] uppercase tracking-wider font-semibold text-[#1A1815] border border-[#E3DDD2] bg-[#FAF8F4] px-1.5 py-0.5">
      {roleLabel(role)}
    </span>
  );
}

export default function AccessUsageMetrics() {
  const [state, setState] = useState({ phase: 'loading', snap: null });

  const load = useCallback(async () => {
    setState((s) => ({ phase: 'loading', snap: s.snap }));
    const snap = await fetchAccessSnapshot();
    setState({ phase: 'ready', snap });
  }, []);

  useEffect(() => { load(); }, [load]);

  const snap = state.snap;

  const view = useMemo(() => {
    if (!snap) return null;
    const nowMs = Date.now(); // stamped once per load
    const { members, instances, presence, invites } = snap;
    return {
      nowMs,
      totals: summarize(members),
      byRole: countByRole(members),
      scopes: groupByScope(members, instances),
      activity: activityRollup(presence, nowMs),
      nvr: newVsReturning(members, nowMs, 30),
      fresh: buildFreshness(presence),
      noPresence: membersWithoutPresence(members, presence),
      invitesPending: pendingInvites(invites),
    };
  }, [snap]);

  const build = currentBuild();

  if (state.phase === 'loading' && !snap) {
    return (
      <div className={card}>
        <p className={note}>Loading access &amp; usage…</p>
      </div>
    );
  }

  if (snap && snap.signedIn === false) {
    return (
      <div className={card}>
        <h2 className="text-sm font-semibold text-[#1A1815] mb-1">Access &amp; Usage</h2>
        <p className={note}>Sign in with a steward account to see who has access.</p>
      </div>
    );
  }

  const v = view || {};
  const presenceUnavailable = !!(snap && snap.errors && snap.errors.member_presence);
  const invitesUnavailable = !!(snap && snap.errors && snap.errors.external_users);
  const hasPresence = v.fresh && v.fresh.reporting > 0;

  return (
    <div className={card}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold text-[#1A1815] inline-flex items-center gap-1.5">
          <UiIcon name="monitor" /> Access &amp; Usage
        </h2>
        <div className="flex items-center gap-3">
          <KpiDot
            status={v.totals && v.totals.totalPeople ? 'good' : 'idle'}
            label={`${(v.totals && v.totals.totalPeople) || 0} ${(v.totals && v.totals.totalPeople) === 1 ? 'person' : 'people'} with access`}
          />
          <button
            type="button"
            onClick={load}
            className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline"
          >
            {state.phase === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── WHO HAS ACCESS ─────────────────────────────────────────────── */}
      <div className={sectionH + ' mb-2'}>Who has access</div>
      {(!v.scopes || v.scopes.length === 0) ? (
        <p className={note + ' italic mb-4'}>No access records yet — no one has joined an instance you steward.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {v.scopes.map((g) => (
            <div key={g.instanceId} className="border border-[#E8E4DC]">
              <div className="flex items-center justify-between gap-2 bg-[#FAF8F4] px-2.5 py-1.5 border-b border-[#E8E4DC]">
                <span className="text-[0.6875rem] font-semibold text-[#1A1815]">
                  {g.name} <span className="text-[#5A5751] font-normal">· {g.scopeLabel}</span>
                </span>
                <span className={labelCls}>{g.count} {g.count === 1 ? 'person' : 'people'}</span>
              </div>
              <ul>
                {g.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
                    <span className="text-[0.8125rem] text-[#1A1815] truncate">
                      {m.displayName || 'Member'}
                      {m.title ? <span className="text-[#5A5751]"> · {m.title}</span> : null}
                    </span>
                    <RolePill role={m.role} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ── COUNTS + ACTIVITY ──────────────────────────────────────────── */}
      <div className={sectionH + ' mb-2'}>Counts &amp; activity</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        <Tile label="People" value={(v.totals && v.totals.totalPeople) || 0} sub={`${(v.totals && v.totals.totalMemberships) || 0} memberships`} />
        <Tile
          label="Active (7d)"
          value={hasPresence ? v.activity.active : '—'}
          sub={hasPresence ? `${v.activity.idle} idle · ${v.activity.dormant} dormant` : 'no sessions yet'}
        />
        <Tile label="New (30d)" value={(v.nvr && v.nvr.newCount) || 0} sub={`${(v.nvr && v.nvr.returningCount) || 0} returning`} />
        <Tile label="Reporting" value={hasPresence ? v.activity.reporting : '—'} sub="sessions checked in" />
      </div>
      {v.byRole && v.byRole.length > 0 ? (
        <ul className="border border-[#E8E4DC] mb-4">
          {v.byRole.map((r) => (
            <li key={r.role} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
              <span className="text-[0.75rem] text-[#1A1815]">{r.label}</span>
              <span className="text-[0.75rem] font-semibold tabular-nums text-[#1A1815]">{r.count}</span>
            </li>
          ))}
        </ul>
      ) : <div className="mb-4" />}

      {/* ── UPDATE SIGNALS (build-freshness) ───────────────────────────── */}
      <div className={sectionH + ' mb-2'}>Update signals — build freshness</div>
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 mb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={note}>
            You're viewing on build <span className="font-semibold text-[#1A1815]">{build.sha}</span>
          </span>
          {hasPresence && v.fresh.latestSha ? (
            <span className={labelCls}>
              latest seen: <span className="font-semibold text-[#1A1815]">{v.fresh.latestSha}</span>
              {v.fresh.latestAt ? ` · ${relativeTime(v.fresh.latestAt, v.nowMs)}` : ''}
            </span>
          ) : null}
        </div>
      </div>
      {!hasPresence ? (
        <p className={note + ' italic mb-4'}>
          {presenceUnavailable
            ? 'Build-freshness will appear once the presence migration (0055) is applied — then each session reports the version it runs.'
            : 'No sessions have reported a build yet. Build-freshness appears once people open the app on a signed-in device.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <Tile label="On latest" value={v.fresh.onLatestCount} />
            <Tile label="Behind" value={v.fresh.behindCount} />
            <Tile label="Unknown" value={v.noPresence.length} sub="never reported" />
          </div>
          {v.fresh.behind.length > 0 ? (
            <ul className="border border-[#E8E4DC] mb-2">
              {v.fresh.behind.map((b) => (
                <li key={b.userId} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
                  <span className="text-[0.75rem] text-[#1A1815] truncate">{b.displayName || 'Member'}</span>
                  <span className="text-[0.625rem] text-[#B85838]">
                    build {b.buildSha || '—'} · {b.lastSeenAt ? relativeTime(b.lastSeenAt, v.nowMs) : 'unknown'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={note + ' mb-2'}>Everyone who has reported a session is on the latest build.</p>
          )}
        </>
      )}

      {/* ── ADMIN ACTIONS ──────────────────────────────────────────────── */}
      <div className={sectionH + ' mb-2 mt-2'}>Admin — invites &amp; access</div>
      {invitesUnavailable ? (
        <p className={note + ' italic'}>Couldn't load invites right now.</p>
      ) : (v.invitesPending && v.invitesPending.length > 0) ? (
        <ul className="border border-[#E8E4DC] mb-2">
          {v.invitesPending.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
              <span className="text-[0.75rem] text-[#1A1815] truncate">
                {i.displayName}{i.type ? <span className="text-[#5A5751]"> · {i.type}</span> : null}
              </span>
              <span className="text-[0.625rem] text-[#B85838] inline-flex items-center gap-1">
                <KpiDot status="attention" label="invited — pending" />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={note + ' mb-2'}>No invites are waiting to be accepted.</p>
      )}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5">
        <p className={note}>
          <span className="font-semibold text-[#1A1815]">Granting, adjusting, or revoking access is a deliberate steward action.</span>{' '}
          This surface shows the picture; it never changes someone's access on its own. Make access
          changes yourself so the decision — and the moment — is always a human's.
        </p>
      </div>

      {/* ── PRIVACY FOOTER ─────────────────────────────────────────────── */}
      <p className="text-[0.5625rem] text-[#5A5751] italic mt-3 leading-relaxed">
        Access governance, not surveillance. This shows who has access, their role and scope, aggregate
        engagement, and which build each session runs — for managing access and rollouts. It shows no
        private content, no messages, and no per-person behavior. Steward-scoped (RLS): only governors
        see it.
      </p>
    </div>
  );
}
