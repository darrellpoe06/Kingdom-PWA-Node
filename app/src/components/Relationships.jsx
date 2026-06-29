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
  buildMatrix, CHILD_CAPABILITIES, CAPABILITIES, isChildCapabilityLocked,
  CHILD_CAPABILITY_POLICY,
} from '../lib/relationships.js';
import {
  childAccessSummary, setChildCapability, decideChildAction,
  resolveApprovalRequest,
} from '../lib/guardian-child.js';
import {
  buildMaintenanceRequest, buildRentRecord, buildNotice, buildMessage,
  landlordView, tenantView, rentSafetyNote,
} from '../lib/tenant-portal.js';
import {
  loadChildCapabilities, saveChildCapability, configFromRows,
  loadChildRequests, patchRow, loadTenancies, loadTenancyWorkflows, insertRow,
} from '../lib/relationships-sync.js';

// Setting -> themeable classes (text + border + active fill). Class hexes remap
// per-theme; inline hexes would not (and would fail on midnight).
const SETTING_CLASS = {
  [SETTING.ALLOW]:    { text: 'text-[#5A6E3D]', border: 'border-[#5A6E3D]', fill: 'bg-[#5A6E3D]', label: 'Allowed' },
  [SETTING.APPROVAL]: { text: 'text-[#2A5A8E]', border: 'border-[#2A5A8E]', fill: 'bg-[#2A5A8E]', label: 'Needs approval' },
  [SETTING.DENY]:     { text: 'text-[#5A5751]', border: 'border-[#5A5751]', fill: 'bg-[#5A5751]', label: 'Not allowed' },
};
const verdictToSetting = (v) => (v === 'allow' ? SETTING.ALLOW : v === 'needs-approval' ? SETTING.APPROVAL : SETTING.DENY);

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
function MatrixPanel({ childConfig }) {
  const [type, setType] = useState(RELATIONSHIP_TYPES.GUARDIAN_CHILD);
  const rel = relationshipByType[type];
  const rows = useMemo(() => buildMatrix(childConfig), [childConfig]);

  return (
    <Panel title="What each relationship grants" icon="users"
      note="Derived live from the permission model — this is the real rule each surface and the database enforce, not a description of one.">
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
// Guardian panel — configure a child + work the approval queue.
// ---------------------------------------------------------------------------
function GuardianPanel({ personas, config, onSetCapability, requests, onResolve, saving }) {
  const [persona, setPersona] = useState(personas[0]?.id || 'child');
  const summary = useMemo(() => childAccessSummary(config), [config]);
  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <>
      <Panel title="Set what a child can do" icon="sliders"
        note="Defaults are child-safe. Outbound actions can be set to ask-first at most; spending, family finances, and security are locked and cannot be granted. Every change here is a deliberate guardian action.">
        {personas.length > 1 ? (
          <div className="flex gap-2 mb-4">
            {personas.map((p) => (
              <button key={p.id} onClick={() => setPersona(p.id)}
                className={`px-3 py-1.5 border border-[#1A1815] text-sm font-semibold ${persona === p.id ? 'bg-[#1A1815] text-white' : 'bg-white text-[#1A1815]'}`}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <MetricCell label="Can do" value={summary.can.length} />
          <MetricCell label="Ask first" value={summary.withApproval.length} />
          <MetricCell label="Never" value={summary.never.length} />
        </div>

        <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815]">
          {CHILD_CAPABILITIES.map((cap) => {
            const meta = CAPABILITIES[cap];
            const locked = isChildCapabilityLocked(cap);
            const current = decideChildAction(cap, config);
            const maxRank = CHILD_CAPABILITY_POLICY[cap].maxGrant;
            const activeSetting = verdictToSetting(current.verdict);
            const choices = [SETTING.DENY, SETTING.APPROVAL, SETTING.ALLOW];
            return (
              <li key={cap} className="px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1 text-[#1A1815]">
                    {meta.label}
                    {locked ? <UiIcon name="lock" className="w-3 h-3" /> : null}
                    {meta.outbound ? <span className="text-xs text-[#B85838]" title="leaves the family">↗</span> : null}
                  </div>
                  <div className="text-xs text-[#5A5751]">{meta.desc}</div>
                </div>
                {locked ? (
                  <Badge cls={SETTING_CLASS[SETTING.DENY]}>Locked</Badge>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    {choices.map((choice) => {
                      const allowedChoice = choice === SETTING.DENY
                        || (choice === SETTING.APPROVAL && maxRank !== SETTING.DENY)
                        || (choice === SETTING.ALLOW && maxRank === SETTING.ALLOW);
                      if (!allowedChoice) return null;
                      const active = activeSetting === choice;
                      const cs = SETTING_CLASS[choice];
                      const lbl = choice === SETTING.DENY ? 'No' : choice === SETTING.APPROVAL ? 'Ask' : 'Yes';
                      return (
                        <button key={choice} disabled={saving}
                          onClick={() => onSetCapability(persona, cap, choice)}
                          className={`px-2 py-1 border text-xs font-semibold ${cs.border} ${active ? `${cs.fill} text-white` : `bg-white ${cs.text}`}`}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Approval queue" icon="check"
        note="When a child tries something set to ask-first, it lands here for a guardian to approve or deny. A child can never approve their own request.">
        {pending.length === 0 ? (
          <p className="text-sm text-[#5A5751]">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815]">
            {pending.map((req) => (
              <li key={req.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1815]">
                    {(CAPABILITIES[req.capability]?.label) || req.capability}
                    {req.child_persona ? <span className="ml-1 text-xs text-[#5A5751]">· {req.child_persona}</span> : null}
                  </div>
                  {req.context ? <div className="text-xs text-[#5A5751]">{req.context}</div> : null}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => onResolve(req, 'approved')} className="px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] text-xs font-semibold">Approve</button>
                  <button onClick={() => onResolve(req, 'denied')} className="px-2 py-1 border border-[#5A5751] text-[#5A5751] text-xs font-semibold">Deny</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Landlord panel — the rent roll + the four landlord<->tenant workflows.
// ---------------------------------------------------------------------------
function LandlordPanel({ tenancies, selected, onSelect, workflows, onAction, busy }) {
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
  const [childConfig, setChildConfig] = useState({});
  const [requests, setRequests] = useState([]);
  const [tenancies, setTenancies] = useState([]);
  const [selectedTenancy, setSelectedTenancy] = useState(null);
  const [workflows, setWorkflows] = useState({ maintenance: [], rent: [], notices: [], messages: [] });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  const personas = useMemo(() => ([{ id: 'twin-a', label: 'Twin A' }, { id: 'twin-b', label: 'Twin B' }]), []);

  // Load real config + queue + tenancies on mount (fail-soft).
  useEffect(() => {
    let live = true;
    (async () => {
      const caps = await loadChildCapabilities();
      if (live && caps.ok) setChildConfig(configFromRows(caps.data));
      const reqs = await loadChildRequests();
      if (live && reqs.ok) setRequests(reqs.data);
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

  const flashMsg = useCallback((m) => { setFlash(m); setTimeout(() => setFlash(''), 2500); }, []);

  const onSetCapability = useCallback(async (persona, cap, choice) => {
    const { config, effective, locked } = setChildCapability(childConfig, cap, choice);
    if (locked) { flashMsg('That one is locked for child safety.'); return; }
    setChildConfig(config); // optimistic
    setSaving(true);
    const res = await saveChildCapability({ childPersona: persona, capability: cap, setting: effective });
    setSaving(false);
    flashMsg(res.ok ? 'Saved.' : 'Saved on this device (sign in to sync).');
  }, [childConfig, flashMsg]);

  const onResolve = useCallback(async (req, decision) => {
    try {
      const patch = resolveApprovalRequest(req, decision, new Date().toISOString());
      setRequests((rs) => rs.map((r) => (r.id === req.id ? { ...r, ...patch } : r)));
      await patchRow('child_action_requests', req.id, { ...patch, resolved_by: currentUserId });
      flashMsg(decision === 'approved' ? 'Approved.' : 'Denied.');
    } catch (e) { flashMsg(String(e.message || e)); }
  }, [currentUserId, flashMsg]);

  const onLandlordAction = useCallback(async (kind, form) => {
    if (!selectedTenancy) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const tenancyId = selectedTenancy.id;
      let table, row;
      if (kind === 'maintenance') { table = 'maintenance_requests'; row = buildMaintenanceRequest({ ...form, tenancyId }, now); }
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

      {tab === 'matrix' && <MatrixPanel childConfig={childConfig} />}
      {tab === 'guardian' && (
        <GuardianPanel personas={personas} config={childConfig} onSetCapability={onSetCapability}
          requests={requests} onResolve={onResolve} saving={saving} />
      )}
      {tab === 'landlord' && (
        <LandlordPanel tenancies={tenancies} selected={selectedTenancy} onSelect={setSelectedTenancy}
          workflows={workflows} onAction={onLandlordAction} busy={saving} />
      )}
    </div>
  );
}

export default Relationships;
