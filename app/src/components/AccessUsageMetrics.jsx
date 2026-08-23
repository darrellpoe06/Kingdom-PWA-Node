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
import SectionTabs from './SectionTabs.jsx';
import AppShareQR from './AppShareQR.jsx';
import FamilyInvitePanel from './FamilyInvitePanel.jsx';
import { fetchAccessSnapshot, currentBuild } from '../lib/access-metrics-sync.js';
import {
  summarize, countByRole, groupByScope, newVsReturning, activityRollup,
  buildFreshness, membersWithoutPresence, pendingInvites, roleLabel, relativeTime,
} from '../lib/access-metrics.js';
import {
  fetchSignupMetrics, summaryTiles, signupRowView, sortSignups,
} from '../lib/signup-metrics.js';
import { fetchUsageFlow, topViews, viewShare } from '../lib/usage-events.js';

// Friendly names for the raw view ids the usage stream records.
export const VIEW_LABELS = {
  overview: 'Big Picture', books: 'Books', tvtime: 'TV Time', church: 'Church',
  practice: 'Practice', library: 'Library', games: 'Games', voice: 'Voice',
  create: 'Create', recipes: 'Recipes', markets: 'Markets', notes: 'Notes',
  crm: 'CRM', relationships: 'Relationships', inventory: 'Inventory',
  forecast: 'Forecast', rentals: 'Rentals', projects: 'Projects',
  opportunities: 'Opportunities', about: 'Pricing', center: 'Command Center',
  inbound: 'Inbound', admin: 'Admin',
};
const viewLabel = (id) => VIEW_LABELS[id] || (id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Unknown');

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

// ── Platform Signups ───────────────────────────────────────────────────────
// The cross-instance window the RLS-scoped roster above CANNOT show: who has
// created an account on poetech.us, across the self-serve `u-*` instances the
// steward is not a member of. Backed by the SECURITY DEFINER admin_signup_metrics
// RPC (DB-gated to the poe-family governor circle). Loads + degrades on its OWN
// (a missing RPC or an unauthorized caller never blanks the rest of the surface).
function CategoryPill({ label }) {
  return (
    <span className="inline-block text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751] border border-[#E3DDD2] bg-[#FAF8F4] px-1.5 py-0.5">
      {label}
    </span>
  );
}

function PlatformSignups() {
  const [res, setRes] = useState({ status: 'loading', data: null });
  const [mask, setMask] = useState(false);
  const load = useCallback(async () => {
    setRes((r) => ({ status: 'loading', data: r.data }));
    setRes(await fetchSignupMetrics());
  }, []);
  useEffect(() => { load(); }, [load]);

  // Signed-out is handled by the parent (it returns early); a non-governor sees
  // an honest one-liner, never the data. Both are real states, not painted.
  if (res.status === 'unauthorized') {
    return (
      <div className="mb-4">
        <div className={sectionH + ' mb-2'}>Platform signups</div>
        <p className={note + ' italic'}>Platform-wide signups are visible to family governors only.</p>
      </div>
    );
  }
  if (res.status === 'signed-out') return null;

  const data = res.data;
  const summary = data && data.summary;
  const rows = sortSignups((data && data.signups) || []);
  const nowMs = Date.now();
  const tiles = summaryTiles(summary);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className={sectionH}>Platform signups — who created an account</div>
        <div className="flex items-center gap-3">
          {rows.length > 0 ? (
            <button
              type="button"
              onClick={() => setMask((m) => !m)}
              className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline"
            >
              {mask ? 'Show emails' : 'Mask emails'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={load}
            className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline"
          >
            {res.status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {res.status === 'loading' && !data ? (
        <p className={note}>Loading platform signups…</p>
      ) : res.status === 'unauthorized' ? (
        <p className={note + ' italic'}>
          Only poe-family governors can see platform signups. If this should be you, your sign-in
          isn't in the poe-family circle at the database level (not just the UI).
        </p>
      ) : res.status === 'unavailable' ? (
        // Show the REAL error, not a guess (DR-0076) — so the exact cause is
        // visible: "function does not exist" (migration not applied) vs a SQL /
        // permission error. The rest of this surface is unaffected.
        <p className={note + ' italic'}>
          Couldn't load platform signups: {(res.error && res.error.message) || 'unknown error'}
          {res.error && res.error.code ? ` (code ${res.error.code})` : ''}.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {tiles.map((t) => <Tile key={t.label} label={t.label} value={t.value} sub={t.sub} />)}
          </div>
          {rows.length === 0 ? (
            <p className={note + ' italic'}>No accounts yet — when someone signs up on poetech.us they'll appear here.</p>
          ) : (
            <div className="border border-[#E8E4DC]">
              {rows.map((row) => {
                const r = signupRowView(row, nowMs, mask);
                return (
                  <div key={r.userId || r.email} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-[0.8125rem] text-[#1A1815] truncate">
                        {r.name || r.email}
                        {r.name ? <span className="text-[#5A5751]"> · {r.email}</span> : null}
                      </div>
                      {/* Two different clocks, named plainly (DR-0100): "account
                          created" is when the account was provisioned — family
                          accounts are allowlisted ahead of first use, so this is
                          NOT days of active use. "last active" is the EFFECTIVE
                          recency (0079): the later of the auth stamp and the real
                          member_presence heartbeat, so a silently-refreshed
                          session that is signed in right now reads "active now" —
                          not a stale weeks-old sign-in stamp. */}
                      <div className="text-[0.625rem] text-[#5A5751]">
                        account created {r.joined} · {r.activeNow ? 'active now' : (r.returned ? `active, last active ${r.lastSeen}` : (r.lastSeen === 'never' ? 'never signed back in' : `last active ${r.lastSeen}`))}
                      </div>
                    </div>
                    <CategoryPill label={r.categoryLabel} />
                  </div>
                );
              })}
            </div>
          )}
          {data && data.signups_truncated ? (
            <p className={note + ' italic mt-1'}>Showing the newest {data.signups_shown}. Older accounts are counted in the totals above but not listed.</p>
          ) : null}
          <p className="text-[0.5625rem] text-[#5A5751] italic mt-2 leading-relaxed">
            Each public signup lands in their OWN private space — they cannot see family, business, or
            church data, and this view shows only their account (email, when the account was created,
            when they were last active), never anything inside their space.
          </p>
        </>
      )}
    </div>
  );
}

// What's getting used — the governor's AGGREGATE flow (Darrell 2026-07-04: "most
// used tab etc"). Reads usage_flow_metrics (poe-family gated, aggregate-only —
// never a person's rows). Real data from the usage stream; honest empty state
// until events accumulate. Degrades silently when signed-out / unauthorized.
function UsageFlow() {
  const [flow, setFlow] = useState(undefined); // undefined loading, null unavailable, {} data
  const load = useCallback(async () => { setFlow(await fetchUsageFlow(30)); }, []);
  useEffect(() => { load(); }, [load]);

  if (flow === null) return null;                 // unavailable / unauthorized — say nothing
  const rows = flow ? topViews(flow, 12) : [];
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className={sectionH}>What&apos;s getting used — most-used tabs (30d)</div>
        <button type="button" onClick={load} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline">
          {flow === undefined ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {flow === undefined ? (
        <p className={note}>Loading usage…</p>
      ) : rows.length === 0 ? (
        <p className={note + ' italic'}>No usage recorded yet — as people move through the app, the most-used tabs show here. This view is the family aggregate; a steward can also see one member&apos;s most-used tabs in Role &amp; stewards → Inspect (0145), and every person still owns — and can delete — their own trail.</p>
      ) : (
        <>
          <p className={note + ' mb-2'}>{flow.active_users || 0} {(flow.active_users === 1) ? 'person' : 'people'} active · {flow.total_views || 0} tab opens</p>
          <div className="border border-[#E8E4DC] divide-y divide-[#F2EEE6]">
            {rows.map((r) => {
              const pct = Math.round(viewShare(r, flow) * 100);
              return (
                <div key={r.name} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[0.8125rem] text-[#1A1815] truncate">{viewLabel(r.name)}</span>
                    <span className="text-[0.6875rem] text-[#5A5751] shrink-0">{r.count} · {r.users} {r.users === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="h-2 border border-[#E8E4DC]" aria-hidden="true">
                    <div className="h-full bg-[#5A6E3D]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AccessUsageMetrics() {
  const [state, setState] = useState({ phase: 'loading', snap: null });
  const [slow, setSlow] = useState(false);  // reveal a Refresh escape if loading drags

  const load = useCallback(async () => {
    setState((s) => ({ phase: 'loading', snap: s.snap }));
    try {
      const snap = await fetchAccessSnapshot();
      setState({ phase: 'ready', snap });
    } catch (e) {
      // Never hang on "Loading…": if the snapshot itself throws, resolve to an
      // honest empty state (signed-in, zero rows, error flag) so the panel renders
      // its "couldn't load — tap Refresh" surface instead of freezing forever.
      setState({ phase: 'ready', snap: { signedIn: true, instances: [], members: [], presence: [], invites: [], subscriptions: [], domains: [], errors: { load: e?.message || String(e) } } });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Never strand the steward on a silent "Loading…": if the snapshot drags (the
  // multi-tab auth-lock case — another PoeTech tab holding navigator.locks), reveal
  // a plain-language note + a Refresh escape after 4s so there's always a way out
  // (Darrell 2026-07-22). The snapshot itself is already timeout-bounded; this is
  // the human-facing agency during that window.
  useEffect(() => {
    if (state.phase !== 'loading') { setSlow(false); return undefined; }
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [state.phase]);

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
        {slow && (
          <div className="mt-2">
            <p className={note}>This is taking longer than usual — another open PoeTech tab may be holding the connection. It’ll resolve on its own, or you can try again.</p>
            <button
              type="button"
              onClick={load}
              className="mt-1 text-[0.625rem] uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Refresh
            </button>
          </div>
        )}
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
  // The roster read itself failed/timed out — showing "0 people with access" then
  // would be a LIE (nobody has access), when really we couldn't read it. Say so.
  const rosterUnavailable = !!(snap && snap.errors && snap.errors.instance_members);
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
            status={rosterUnavailable ? 'idle' : (v.totals && v.totals.totalPeople ? 'good' : 'idle')}
            label={rosterUnavailable
              ? 'Access couldn’t load — tap Refresh'
              : `${(v.totals && v.totals.totalPeople) || 0} ${(v.totals && v.totals.totalPeople) === 1 ? 'person' : 'people'} with access`}
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

      {/* THIRD-ROW sub-tabs (Darrell 2026-07-05: "a 3rd row of sliding tabs if the
          tab scrolls really long"). This report was still 5 long sections stacked;
          each is now one chip away, and each fetch-heavy piece (signups, usage)
          only runs when its chip opens. */}
      <SectionTabs
        variant="sub"
        ariaLabel="Users and usage sections"
        idBase="usage"
        defaultId="signups"
        sections={[
          {
            id: 'signups',
            label: 'Signups',
            render: () => <PlatformSignups />,
          },
          {
            id: 'used',
            label: "What's used",
            render: () => <UsageFlow />,
          },
          {
            id: 'access',
            label: 'Who has access',
            render: () => (
              (!v.scopes || v.scopes.length === 0) ? (
                <p className={note + ' italic'}>No access records yet — no one has joined an instance you steward.</p>
              ) : (
                <div className="space-y-3">
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
              )
            ),
          },
          {
            id: 'activity',
            label: 'Counts & activity',
            render: () => (
              <>
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
                  <ul className="border border-[#E8E4DC]">
                    {v.byRole.map((r) => (
                      <li key={r.role} className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
                        <span className="text-[0.75rem] text-[#1A1815]">{r.label}</span>
                        <span className="text-[0.75rem] font-semibold tabular-nums text-[#1A1815]">{r.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ),
          },
          {
            id: 'builds',
            label: 'Update signals',
            render: () => (
              <>
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
                  <p className={note + ' italic'}>
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
                      <ul className="border border-[#E8E4DC]">
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
                      <p className={note}>Everyone who has reported a session is on the latest build.</p>
                    )}
                  </>
                )}
              </>
            ),
          },
          {
            id: 'invites',
            label: 'Invites & access',
            render: () => (
              <>
                <div className="mb-3">
                  <FamilyInvitePanel />
                </div>
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
                    <span className="font-semibold text-[#1A1815]">Granting access is a deliberate steward action.</span>{' '}
                    Inviting above creates an invitation — the person becomes a member only when they sign in
                    and accept. Nothing changes access on its own; the decision, and the moment, are always a human's.
                  </p>
                </div>
                <div className="mt-3">
                  <AppShareQR />
                </div>
              </>
            ),
          },
        ]}
      />

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
