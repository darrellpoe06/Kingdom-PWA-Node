// =============================================================================
// Relationships.jsx — SEE + configure what every relationship/role can do
// =============================================================================
// The in-app face of the relationship permission model (lib/relationships.js):
// the place Darrell can SEE, plainly, "this child can do X, not Y", "a tenant
// sees their unit, not the portfolio", and CONFIGURE the parts that are his to
// set. Three panels:
//
//   • Matrix    — every relationship/role and exactly what it can / can't do,
//                 derived live from the model (no painted permissions — DR-0076).
//   • Guardian  — set a child's capabilities (clamped to the safety ceiling) and
//                 work the approval queue. Changing access is a deliberate action.
//   • Landlord  — the landlord<->tenant workflows: rent roll, maintenance, rent
//                 records (no money moves), notices, messages — each side scoped.
//
// Family/Governor-gated in the shell (no-leak), with a locked fallback here for
// defense in depth. Persistence is fail-soft (relationships-sync.js); the model
// logic is real and visible whether or not a backend is reachable.
//
// STYLING: all color routes through themeable `text-[#hex]` / `bg-*` / `border-*`
// classes (never inline `style={{ color }}`), so every surface remaps correctly
// in the midnight theme — the legibility-guard property (DR-0076).
// =============================================================================
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import UiIcon from './UiIcon.jsx';
import { TabScroll, MetricCell } from './shared.jsx';
import {
  RELATIONSHIPS, relationshipByType, RELATIONSHIP_TYPES, SETTING,
  buildMatrix,
} from '../lib/relationships.js';
import {
  buildMaintenanceRequest, buildRentRecord, buildNotice, buildMessage,
  landlordView, tenantView, rentSafetyNote,
} from '../lib/tenant-portal.js';
import {
  loadTenancies, loadTenancyWorkflows, insertRow,
} from '../lib/relationships-sync.js';
// The setting palette lives with the guardian panel now (its one home); this
// surface still reads it for the matrix + landlord status badges.
import { SETTING_CLASS } from './GuardianChildPanel.jsx';

function Badge({ children, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-xs font-semibold rounded-sm ${cls.text} ${cls.border}`}>
      {children}
    </span>
  );
}

function Panel({ title, icon, children, note }) {
  return (
    <section className="bg-white border border-[#1A1815] mb-4">
      <header className="px-4 py-3 border-b border-[#1A1815] flex items-center gap-2 text-[#1A1815]">
        {icon ? <UiIcon name={icon} /> : null}
        <h3 className="text-base font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{title}</h3>
      </header>
      <div className="p-4">{children}</div>
      {note ? <p className="px-4 pb-3 text-xs leading-relaxed text-[#5A5751]">{note}</p> : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Matrix panel — the live can/can't grid for every relationship + role.
// ---------------------------------------------------------------------------
function MatrixPanel() {
  const [type, setType] = useState(RELATIONSHIP_TYPES.GUARDIAN_CHILD);
  const rel = relationshipByType[type];
  // The matrix previews the MODEL — the child-safe defaults and ceilings every
  // role starts from. Per-child grants are set AND shown on the Family Roster
  // (Center → Serve). The 2026-07-03 claims audit found the old live-config
  // feed here FLATTENED settings across siblings (configFromRows ignores
  // child_persona), so the preview showed a blend no real child actually has —
  // the defaults are the honest thing this panel can claim.
  const rows = useMemo(() => buildMatrix({}), []);

  return (
    <Panel title="What each relationship grants" icon="users"
      note="Derived live from the permission model — the defaults and safety ceilings each role starts from. Per-child grants are made and shown on the Family Roster (Center → Serve).">
      <TabScroll>
        <div className="flex gap-2 mb-4">
          {RELATIONSHIPS.map((r) => (
            <button key={r.type} onClick={() => setType(r.type)}
              className={`px-3 py-1.5 border border-[#1A1815] text-sm font-semibold whitespace-nowrap ${type === r.type ? 'bg-[#1A1815] text-white' : 'bg-white text-[#1A1815]'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </TabScroll>
      <p className="text-sm mb-4 text-[#5A5751]">{rel.blurb}</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${rel.roles.length}, minmax(0, 1fr))` }}>
        {rel.roles.map((role) => {
          const roleRows = rows.filter((r) => r.relationship === type && r.role === role);
          return (
            <div key={role} className="border border-[#1A1815]">
              <div className="px-3 py-2 border-b border-[#1A1815] text-sm font-bold capitalize text-[#1A1815] bg-[#F4F2EE]">
                {role}{role === rel.steward ? ' · sets access' : ''}
              </div>
              <ul className="divide-y divide-[#E6E0D6]">
                {roleRows.map((r) => {
                  const cls = SETTING_CLASS[r.setting];
                  return (
                    <li key={r.capability} className="px-3 py-2 flex items-center justify-between gap-2">
                      <span className="text-sm text-[#1A1815]">
                        {r.label}
                        {r.outbound ? <span className="ml-1 text-xs text-[#B85838]" title="outbound">↗</span> : null}
                        {!r.configurable && role === 'child' ? <UiIcon name="lock" className="inline ml-1 w-3 h-3" /> : null}
                      </span>
                      <Badge cls={cls}>{cls.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Guardian panel — MOVED to components/GuardianChildPanel.jsx, mounted on the
// Family Roster (Center → Serve): the ONE input home for the family (DR-0095).
// The tab below renders a pointer, not a duplicate.
// ---------------------------------------------------------------------------
// Landlord panel — the rent roll + the four landlord<->tenant workflows.
// ---------------------------------------------------------------------------
function LandlordPanel({ tenancies, selected, onSelect, workflows, onAction, busy, onRefresh, refreshing }) {
  const lv = useMemo(() => landlordView({
    tenancies,
    maintenance: workflows.maintenance,
    rent: workflows.rent,
    notices: workflows.notices,
  }), [tenancies, workflows]);
  const tv = useMemo(() => selected ? tenantView(selected.id, { tenancy: selected, ...workflows }) : null, [selected, workflows]);

  const [mForm, setMForm] = useState({ title: '', detail: '', area: '', priority: 'normal' });
  const [rForm, setRForm] = useState({ amount: '', forPeriod: '', method: 'owner-processor' });
  const [nForm, setNForm] = useState({ title: '', body: '', kind: 'general' });
  const [msg, setMsg] = useState('');

  return (
    <>
      <Panel title="Rent roll" icon="pin" note={rentSafetyNote()}>
        <div className="flex justify-end mb-2">
          <button disabled={refreshing} aria-busy={refreshing} onClick={onRefresh}
            className="px-3 py-1 border border-[#1A1815] bg-white text-[#1A1815] text-xs font-semibold">
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <MetricCell label="Doors" value={lv.doorCount} />
          <MetricCell label="Open requests" value={lv.openRequests.length} />
          <MetricCell label="Rent to confirm" value={lv.reportedUnconfirmed.length} />
        </div>
        {tenancies.length === 0 ? (
          <p className="text-sm text-[#5A5751]">No tenancies yet. A tenancy links a tenant's account to one of your units; create one to open the tenant side.</p>
        ) : (
          <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815]">
            {tenancies.map((t) => {
              const cls = t.status === 'active' ? SETTING_CLASS[SETTING.ALLOW] : SETTING_CLASS[SETTING.DENY];
              return (
                <li key={t.id}>
                  <button onClick={() => onSelect(t)} className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 ${selected?.id === t.id ? 'bg-[#F4F2EE]' : ''}`}>
                    <span className="text-sm font-semibold text-[#1A1815]">
                      {t.property_label || 'Property'}{t.unit_label ? ` · ${t.unit_label}` : ''}
                      <span className="ml-2 text-xs font-normal text-[#5A5751]">{t.tenant_name || 'tenant'}</span>
                    </span>
                    <Badge cls={cls}>{t.status}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {selected ? (
        <Panel title={`Tenancy · ${selected.property_label || ''} ${selected.unit_label || ''}`.trim()} icon="pin"
          note="A tenant signed in to this account sees exactly this slice — their unit, lease, requests, notices and messages. Never the portfolio.">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Maintenance */}
            <div className="border border-[#1A1815] p-3">
              <div className="text-sm font-bold mb-2 flex items-center gap-1 text-[#1A1815]"><UiIcon name="tools" className="w-4 h-4" /> Maintenance</div>
              <ul className="mb-2">
                {(tv?.maintenance || []).map((m) => (
                  <li key={m.id} className="text-xs py-1 flex justify-between text-[#1A1815]">
                    <span>{m.title}</span><span className="text-[#5A5751]">{m.status}</span>
                  </li>
                ))}
                {(tv?.maintenance || []).length === 0 ? <li className="text-xs text-[#5A5751]">No requests.</li> : null}
              </ul>
              <input value={mForm.title} onChange={(e) => setMForm({ ...mForm, title: e.target.value })}
                placeholder="What needs fixing?" className="w-full border border-[#1A1815] px-2 py-1 text-sm mb-1 text-[#1A1815] bg-white" />
              <button disabled={busy} onClick={() => { onAction('maintenance', mForm); setMForm({ title: '', detail: '', area: '', priority: 'normal' }); }}
                className="px-3 py-1 border border-[#B85838] text-[#B85838] text-xs font-semibold">Submit request</button>
            </div>

            {/* Rent record */}
            <div className="border border-[#1A1815] p-3">
              <div className="text-sm font-bold mb-2 flex items-center gap-1 text-[#1A1815]"><UiIcon name="chart" className="w-4 h-4" /> Rent (record only)</div>
              <ul className="mb-2">
                {(tv?.rent || []).map((r) => (
                  <li key={r.id} className="text-xs py-1 flex justify-between text-[#1A1815]">
                    <span>${r.amount} · {r.for_period}</span><span className="text-[#5A5751]">{r.status}</span>
                  </li>
                ))}
                {(tv?.rent || []).length === 0 ? <li className="text-xs text-[#5A5751]">No records.</li> : null}
              </ul>
              <div className="flex gap-1 mb-1">
                <input value={rForm.amount} onChange={(e) => setRForm({ ...rForm, amount: e.target.value })}
                  placeholder="Amount" inputMode="decimal" className="w-1/2 border border-[#1A1815] px-2 py-1 text-sm text-[#1A1815] bg-white" />
                <input value={rForm.forPeriod} onChange={(e) => setRForm({ ...rForm, forPeriod: e.target.value })}
                  placeholder="2026-07" className="w-1/2 border border-[#1A1815] px-2 py-1 text-sm text-[#1A1815] bg-white" />
              </div>
              <button disabled={busy} onClick={() => { onAction('rent', rForm); setRForm({ amount: '', forPeriod: '', method: 'owner-processor' }); }}
                className="px-3 py-1 border border-[#5A6E3D] text-[#5A6E3D] text-xs font-semibold">Record payment</button>
            </div>

            {/* Notice (landlord) */}
            <div className="border border-[#1A1815] p-3">
              <div className="text-sm font-bold mb-2 flex items-center gap-1 text-[#1A1815]"><UiIcon name="bookOpen" className="w-4 h-4" /> Notices</div>
              <ul className="mb-2">
                {(tv?.notices || []).map((n) => (
                  <li key={n.id} className="text-xs py-1 text-[#1A1815]">{n.title}</li>
                ))}
                {(tv?.notices || []).length === 0 ? <li className="text-xs text-[#5A5751]">No notices.</li> : null}
              </ul>
              <input value={nForm.title} onChange={(e) => setNForm({ ...nForm, title: e.target.value })}
                placeholder="Notice to tenant" className="w-full border border-[#1A1815] px-2 py-1 text-sm mb-1 text-[#1A1815] bg-white" />
              <button disabled={busy} onClick={() => { onAction('notice', nForm); setNForm({ title: '', body: '', kind: 'general' }); }}
                className="px-3 py-1 border border-[#1A1815] text-[#1A1815] text-xs font-semibold">Post notice</button>
            </div>

            {/* Messages */}
            <div className="border border-[#1A1815] p-3">
              <div className="text-sm font-bold mb-2 flex items-center gap-1 text-[#1A1815]"><UiIcon name="users" className="w-4 h-4" /> Messages</div>
              <ul className="mb-2 max-h-28 overflow-y-auto">
                {(tv?.messages || []).map((m) => (
                  <li key={m.id} className="text-xs py-0.5 text-[#1A1815]">
                    <span className="font-semibold capitalize">{m.from_role}:</span> {m.body}
                  </li>
                ))}
                {(tv?.messages || []).length === 0 ? <li className="text-xs text-[#5A5751]">No messages.</li> : null}
              </ul>
              <div className="flex gap-1">
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message the tenant"
                  className="flex-1 border border-[#1A1815] px-2 py-1 text-sm text-[#1A1815] bg-white" />
                <button disabled={busy} onClick={() => { onAction('message', { body: msg, fromRole: 'landlord' }); setMsg(''); }}
                  className="px-3 py-1 border border-[#1A1815] text-[#1A1815] text-xs font-semibold">Send</button>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// The surface.
// ---------------------------------------------------------------------------
export function Relationships({ isGovernor = false, currentUserId = null }) {
  const [tab, setTab] = useState('matrix');
  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [workflows, setWorkflows] = useState({ maintenance: [], rent: [], notices: [], messages: [] });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState('');

  // Load tenancies on mount (fail-soft). The guardian↔child INPUT surface
  // (set capabilities + the approval queue) moved to its one home — the Family
  // Roster in the Center's Serve faculty (DR-0095 consolidation; the hardcoded
  // twin placeholder personas died with the move). The matrix here previews
  // the model's DEFAULTS only — per-child live config is roster territory.
  useEffect(() => {
    let live = true;
    (async () => {
      const tn = await loadTenancies();
      if (live && tn.ok) setTenancies(tn.data);
    })();
    return () => { live = false; };
  }, []);

  // Load a tenancy's workflows when selected.
  useEffect(() => {
    let live = true;
    if (!selectedTenancy) { setWorkflows({ maintenance: [], rent: [], notices: [], messages: [] }); return; }
    (async () => {
      const wf = await loadTenancyWorkflows(selectedTenancy.id);
      if (live && wf.ok) setWorkflows(wf.data);
    })();
    return () => { live = false; };
  }, [selectedTenancy]);

  // Staleness is user-recoverable: a tenant-side insert on another device
  // showed up here only on a remount. Refresh re-runs the SAME fail-soft
  // loaders on demand (button) and on window focus — load-based like the rest
  // of this surface, no realtime channel.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const tn = await loadTenancies();
      if (tn.ok) setTenancies(tn.data);
      if (selectedTenancy) {
        const wf = await loadTenancyWorkflows(selectedTenancy.id);
        if (wf.ok) setWorkflows(wf.data);
      }
    } catch (e) { /* fail-soft, same as the loaders */ }
    setRefreshing(false);
  }, [selectedTenancy]);

  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  const flashMsg = useCallback((m) => { setFlash(m); setTimeout(() => setFlash(''), 2500); }, []);

  const onLandlordAction = useCallback(async (kind, form) => {
    if (!selectedTenancy) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const tenancyId = selectedTenancy.id;
      let table, row;
      if (kind === 'maintenance') { table = 'tenant_maintenance_requests'; row = buildMaintenanceRequest({ ...form, tenancyId }, now); }
      else if (kind === 'rent') { table = 'rent_records'; row = buildRentRecord({ ...form, tenancyId }, now); }
      else if (kind === 'notice') { table = 'tenant_notices'; row = buildNotice({ ...form, tenancyId }, now); }
      else if (kind === 'message') { table = 'tenant_messages'; row = buildMessage({ ...form, tenancyId }, now); }
      const res = await insertRow(table, row);
      if (res.ok && res.data) {
        const wf = await loadTenancyWorkflows(tenancyId);
        if (wf.ok) setWorkflows(wf.data);
        flashMsg('Saved.');
      } else {
        flashMsg('Not signed in — nothing saved.');
      }
    } catch (e) { flashMsg(String(e.message || e)); }
    setSaving(false);
  }, [selectedTenancy, flashMsg]);

  if (!isGovernor) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center" style={{ fontFamily: '"Fraunces", serif' }}>
        <div className="mb-2 text-[#1A1815]"><UiIcon name="lock" /></div>
        <p className="text-sm font-semibold text-[#1A1815]">Relationships is a stewardship space.</p>
        <p className="text-xs mt-1.5 leading-relaxed text-[#5A5751]">
          Setting what a child can do and managing landlord/tenant access is steward-only. Sign in with a family/governor account.
        </p>
      </div>
    );
  }

  const TABS = [
    ['matrix', 'Matrix', 'users'],
    ['guardian', 'Guardian & Child', 'sliders'],
    ['landlord', 'Landlord & Tenant', 'pin'],
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-12">
      <header className="mt-6 mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          <UiIcon name="users" /> Relationships
        </h2>
        <p className="text-sm mt-1 text-[#5A5751]">
          Two people, a relationship, and the role each holds — that decides what each can do. See it plainly, and set the parts that are yours to set.
        </p>
      </header>

      <TabScroll>
        <div className="flex gap-2 mb-4">
          {TABS.map(([id, label, icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-3 py-1.5 border border-[#1A1815] text-sm font-semibold whitespace-nowrap flex items-center gap-1 ${tab === id ? 'bg-[#1A1815] text-white' : 'bg-white text-[#1A1815]'}`}>
              <UiIcon name={icon} className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </TabScroll>

      {flash ? <div className="mb-3 text-xs px-3 py-2 border border-[#5A6E3D] text-[#1A1815] bg-[#F2F4EC]">{flash}</div> : null}

      {tab === 'matrix' && <MatrixPanel />}
      {tab === 'guardian' && (
        <Panel title="Guardian & Child — moved to its one home" icon="users"
          note="One place for the family, not four similar ones (DR-0095).">
          <p className="text-sm text-[#1A1815]">
            Adding a family member <strong>and</strong> deciding what each child can see and do — including
            {' '}<strong>See family finances</strong> for money education (your call, DR-0094) — now live together
            on the <strong>Family Roster</strong>: Command, Control &amp; Serve Center → <strong>Serve</strong>.
            The read-only matrix view stays here; landlord &amp; tenant stays here.
          </p>
        </Panel>
      )}
      {tab === 'landlord' && (
        <LandlordPanel tenancies={tenancies} selected={selectedTenancy} onSelect={setSelectedTenancy}
          workflows={workflows} onAction={onLandlordAction} busy={saving}
          onRefresh={refresh} refreshing={refreshing} />
      )}
    </div>
  );
}

export default Relationships;
