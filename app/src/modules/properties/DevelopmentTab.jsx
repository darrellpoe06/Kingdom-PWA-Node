// =============================================================================
// DevelopmentTab — building from the ground up, inside Poe Properties
// (DR-1158, migration 0305)
// =============================================================================
// Darrell, 2026-10-21: "Find and create processes for these types of
// real-estate solutions", "Poe Properties can build from scratch like we did
// our home", and "features to be inside our Poe Properties Apps for building
// businesses and apartment deals with investors".
//
// One project at a time: its budget (land, soft, hard, the TI allowance, the
// cost of money, the contingency), the change orders drawn on it, each
// commercial bay's allowance, the phases in build order with their dated and
// signed checks, what it is worth, and the deal as investors see it. Beside
// them, the build-to-rent comparison for choosing what to put on a lot. The
// arithmetic is development.js; the records are 0305, behind the books' wall.
// The work and its hours stay on PoeTech's Projects tab, named by project_ref.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LINE_KINDS, CHANGE_SOURCES, PROJECT_KINDS, CAPITAL_KINDS, budgetSummary, tiCheck, phaseProgress,
  valuation, dealReturns, compareBuildToRent,
} from './development.js';
import {
  developmentInstanceId, loadProjects, loadProject, createProject, patchProject, addRow, patchRow, deleteRow,
  setCheck, projectForEngine,
} from './development-cloud.js';
import { toCents, money } from '../../lib/door-economics.js';
import { confirmThen } from '../../lib/confirm-action.js';

export const DEFAULT_API = {
  instanceId: developmentInstanceId, loadProjects, loadProject, createProject, patchProject, addRow, patchRow, deleteRow, setCheck,
};

const WHY = {
  'not-enabled-yet': 'The development records are not on this database yet. They arrive with the next database update.',
  'timed-out': 'The server did not answer in time. Try again in a moment.',
  'no-instance': 'Sign in to the Poe Properties space to keep a project.',
  'needs-a-name': 'Give the project a name.',
  'needs-a-date': 'Say the date the check was made.',
  'signed-out': 'Sign in again to save.',
  failed: 'That could not be saved. Only the owner or an admin writes here.',
};
const say = (r) => (r && r.ok ? '' : WHY[r && r.reason] || 'Something went wrong.');
const today = () => new Date().toISOString().slice(0, 10);
const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);
const centsOrNull = (v) => { const c = toCents(v); return Number.isFinite(c) ? c : null; };
const bpOrNull = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 100));

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

const Card = ({ title, children, right }) => (
  <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3">
    {(title || right) && (
      <div className="flex items-baseline justify-between gap-3 mb-2">
        {title && <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">{title}</h3>}
        {right}
      </div>
    )}
    {children}
  </section>
);

const Fact = ({ label, value, note }) => (
  <div className="min-w-0">
    <div className="text-[0.625rem] uppercase tracking-wider text-[#6B665E]">{label}</div>
    <div className="text-[1.125rem] text-[#1A1815] tabular-nums">{value}</div>
    {note && <div className="text-[0.75rem] text-[#6B665E]">{note}</div>}
  </div>
);

const Field = ({ id, label, value, onChange, type = 'text', step, children }) => (
  <div className="min-w-0">
    <label htmlFor={id} className="block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1">{label}</label>
    {children || (
      <input id={id} type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#E8E4DC] px-2 py-1.5 text-[0.875rem] bg-white" placeholder="not entered" />
    )}
  </div>
);

const Select = ({ id, label, value, onChange, options }) => (
  <Field id={id} label={label}>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-[#E8E4DC] px-2 py-1.5 text-[0.875rem] bg-white">
      {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  </Field>
);

/** Start a project. */
function NewProject({ onCreate, busy }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState('home');
  return (
    <Card title="Start a project">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <Field id="dev-new-name" label="Name" value={name} onChange={setName} />
        <Select id="dev-new-kind" label="What is being built" value={kind} onChange={setKind} options={PROJECT_KINDS} />
        <div className="self-end">
          <Btn tone="primary" disabled={busy || !name.trim()} onClick={() => onCreate({ name: name.trim(), kind })}>Start it</Btn>
        </div>
      </div>
      <p className="text-[0.75rem] text-[#6B665E]">{PROJECT_KINDS.find((k) => k.key === kind)?.plain}</p>
    </Card>
  );
}

function Budget({ project, data, api, reload }) {
  const [form, setForm] = useState({ kind: 'hard', label: '', budget: '', actual: '' });
  const [msg, setMsg] = useState('');
  const b = budgetSummary({ lines: data.lines, changeOrders: data.changeOrders });
  const add = async () => {
    const r = await api.addRow('dev_budget_lines', project, {
      kind: form.kind, label: form.label.trim(), budget_cents: centsOrNull(form.budget), actual_cents: centsOrNull(form.actual),
    });
    setMsg(say(r));
    if (r.ok) { setForm({ ...form, label: '', budget: '', actual: '' }); reload(); }
  };
  return (
    <Card title="Budget" right={<span className="text-[0.75rem] text-[#6B665E]">{money(b.budgetCents)} budgeted · {money(b.spentCents)} spent</span>}>
      <table className="w-full text-[0.8125rem] mb-2" data-testid="dev-budget">
        <caption className="sr-only">The budget by category</caption>
        <thead><tr className="text-[#6B665E]"><th scope="col" className="text-left font-normal">Category</th><th scope="col" className="text-right font-normal">Budget</th><th scope="col" className="text-right font-normal">Spent</th></tr></thead>
        <tbody>
          {LINE_KINDS.map((k) => (
            <tr key={k.key} className="border-t border-[#F0ECE4]">
              <td className="py-1">{k.label}{b.byKind[k.key].unpriced ? <span className="text-[#B85838]"> · {b.byKind[k.key].unpriced} not priced</span> : null}</td>
              <td className="text-right tabular-nums">{money(b.byKind[k.key].budgetCents)}</td>
              <td className="text-right tabular-nums">{money(b.byKind[k.key].actualCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="text-[0.8125rem] mb-2">
        {data.lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-2 border-t border-[#F0ECE4] py-1">
            <span>{l.label} <span className="text-[#6B665E]">· {LINE_KINDS.find((k) => k.key === l.kind)?.label}</span></span>
            <span className="tabular-nums">{l.budgetCents == null ? 'not priced' : money(l.budgetCents)}
              <button type="button" className="ml-2 text-[#B85838] underline focus:outline focus:outline-2 focus:outline-[#2F5D50]" onClick={confirmThen(`Remove the budget line "${l.label}"?`, async () => { await api.deleteRow('dev_budget_lines', l.id); reload(); })}>remove</button></span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Select id="dev-line-kind" label="Category" value={form.kind} onChange={(v) => setForm({ ...form, kind: v })} options={LINE_KINDS} />
        <Field id="dev-line-label" label="Line" value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
        <Field id="dev-line-budget" label="Budget ($)" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
        <Field id="dev-line-actual" label="Spent ($)" value={form.actual} onChange={(v) => setForm({ ...form, actual: v })} />
        <div className="self-end"><Btn tone="primary" disabled={!form.label.trim()} onClick={add}>Add line</Btn></div>
      </div>
      {msg && <p role="alert" className="text-[0.75rem] text-[#B85838] mt-1">{msg}</p>}
    </Card>
  );
}

function Bays({ project, data, api, reload }) {
  const [form, setForm] = useState({ name: '', sqFt: '', ti: '' });
  const t = tiCheck({ bays: data.bays, lines: data.lines });
  const verdict = {
    missing: 'Not funded: a building with commercial space needs a tenant improvement allowance in its budget before it is built.',
    short: `Short: the bays are promised ${money(t.shortCents)} more than the budget carries.`,
    funded: `Funded: ${money(t.tiBudgetCents)} carried, ${money(t.promisedCents)} promised, ${money(t.drawnCents)} drawn.`,
    'not-needed': 'No commercial bays yet.',
  }[t.status];
  return (
    <Card title="Commercial bays and their allowance">
      <p role="status" data-testid="dev-ti" className={`text-[0.8125rem] mb-2 ${t.status === 'funded' || t.status === 'not-needed' ? 'text-[#2F5D50]' : 'text-[#B85838] font-semibold'}`}>{verdict}</p>
      <p className="text-[0.75rem] text-[#6B665E] mb-2">Each bay is delivered as a shell: a gravel floor and four walls, with water, sewer, gas and electric brought to it. The allowance is what the developer gives the tenant toward their slab, framing, plumbing and HVAC.</p>
      <ul className="text-[0.8125rem] mb-2">
        {t.perBay.map((b, i) => (
          <li key={data.bays[i].id} className="border-t border-[#F0ECE4] py-1">
            {b.name} · {b.sqFt.toLocaleString()} sq ft · {b.promisedCents == null ? 'allowance not set' : `${money(b.promisedCents)} (${money(b.perSqFtCents)} a foot), ${money(b.leftCents)} left`}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field id="dev-bay-name" label="Bay" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field id="dev-bay-sqft" label="Square feet" type="number" value={form.sqFt} onChange={(v) => setForm({ ...form, sqFt: v })} />
        <Field id="dev-bay-ti" label="Allowance ($)" value={form.ti} onChange={(v) => setForm({ ...form, ti: v })} />
        <div className="self-end"><Btn tone="primary" disabled={!form.name.trim()} onClick={async () => {
          const r = await api.addRow('dev_bays', project, { name: form.name.trim(), sq_ft: form.sqFt === '' ? null : Number(form.sqFt), ti_cents: centsOrNull(form.ti) });
          if (r.ok) { setForm({ name: '', sqFt: '', ti: '' }); reload(); }
        }}>Add bay</Btn></div>
      </div>
    </Card>
  );
}

function ChangeOrders({ project, data, api, reload }) {
  const [form, setForm] = useState({ label: '', amount: '', source: 'contingency' });
  const b = budgetSummary({ lines: data.lines, changeOrders: data.changeOrders });
  const decide = async (c, status) => { await api.patchRow('dev_change_orders', c.id, { status, decided_on: today() }); reload(); };
  return (
    <Card title="Change orders and the contingency">
      <p role="status" data-testid="dev-contingency" className={`text-[0.8125rem] mb-2 ${b.contingencyOverdrawn ? 'text-[#B85838] font-semibold' : 'text-[#1A1815]'}`}>
        {b.contingencyCents > 0
          ? `${money(b.contingencyUsedCents)} of the ${money(b.contingencyCents)} contingency drawn (${pct(b.contingencyUsedPct)}); ${money(b.contingencyLeftCents)} left${b.contingencyOverdrawn ? ' — overdrawn' : ''}.${b.pendingCount ? ` ${b.pendingCount} proposed, ${money(b.pendingChangeCents)}, waiting on a yes.` : ''}`
          : 'No contingency in the budget yet. Add a contingency line above the contractor’s own.'}
      </p>
      <ul className="text-[0.8125rem] mb-2">
        {data.changeOrders.map((c) => (
          <li key={c.id} className="flex flex-wrap justify-between gap-2 border-t border-[#F0ECE4] py-1">
            <span>{c.label} · {money(c.amountCents)} · from {CHANGE_SOURCES.find((s) => s.key === c.source)?.label.toLowerCase()}</span>
            <span>{c.status === 'proposed'
              ? <><Btn onClick={() => decide(c, 'approved')}>Approve</Btn> <Btn onClick={() => decide(c, 'rejected')}>Reject</Btn></>
              : `${c.status} ${c.decidedOn || ''}`}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Field id="dev-co-label" label="Change" value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
        <Field id="dev-co-amount" label="Amount ($)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
        <Select id="dev-co-source" label="Paid from" value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={CHANGE_SOURCES} />
        <div className="self-end"><Btn tone="primary" disabled={!form.label.trim() || !(centsOrNull(form.amount) > 0)} onClick={async () => {
          const r = await api.addRow('dev_change_orders', project, { label: form.label.trim(), amount_cents: centsOrNull(form.amount), source: form.source, status: 'proposed' });
          if (r.ok) { setForm({ label: '', amount: '', source: form.source }); reload(); }
        }}>Propose</Btn></div>
      </div>
    </Card>
  );
}

function Phases({ project, engine, api, reload }) {
  const [signer, setSigner] = useState('');
  const [msg, setMsg] = useState('');
  const p = phaseProgress({ results: engine.results, kind: engine.kind, hasElevator: engine.hasElevator });
  const mark = async (phaseKey, checkKey, state) => {
    const r = await api.setCheck(project, { phaseKey, checkKey, state, checkedOn: state === 'pending' ? null : today(), signedBy: signer.trim() || null });
    setMsg(say(r));
    if (r.ok) reload();
  };
  return (
    <Card title="Phases and their checks" right={<span className="text-[0.75rem] text-[#6B665E]" data-testid="dev-phase-count">{p.completeCount} of {p.total} complete</span>}>
      <div className="max-w-xs mb-2"><Field id="dev-signer" label="Signed by (inspector, lab, trade)" value={signer} onChange={setSigner} /></div>
      {msg && <p role="alert" className="text-[0.75rem] text-[#B85838] mb-1">{msg}</p>}
      <ol className="space-y-2">
        {p.phases.map((ph) => (
          <li key={ph.key} className={`border p-2 ${ph.status === 'held' ? 'border-[#B85838]' : 'border-[#F0ECE4]'}`}>
            <div className="flex justify-between gap-2 text-[0.875rem]">
              <span className="font-semibold">{ph.label}</span>
              <span className={ph.status === 'held' ? 'text-[#B85838]' : 'text-[#6B665E]'}>{{ 'not-started': 'not started', 'under-way': 'under way', held: 'held by a failed check', complete: 'complete' }[ph.status]}</span>
            </div>
            <p className="text-[0.75rem] text-[#6B665E]">{ph.work.join(' · ')}</p>
            <ul className="mt-1">
              {ph.checks.map((c) => (
                <li key={c.key} className="flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] py-0.5">
                  <span>{c.label}{c.required ? '' : ' (if it applies)'} — <span className={c.state === 'failed' ? 'text-[#B85838]' : c.state === 'passed' ? 'text-[#2F5D50]' : 'text-[#6B665E]'}>{c.state}{c.date ? ` ${c.date}` : ''}{c.by ? `, ${c.by}` : ''}</span></span>
                  <span className="flex gap-1">
                    <Btn onClick={() => mark(ph.key, c.key, 'passed')} aria-label={`${c.label} passed`}>Passed</Btn>
                    <Btn onClick={() => mark(ph.key, c.key, 'failed')} aria-label={`${c.label} failed`}>Failed</Btn>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Value({ project, engine, data, api, reload }) {
  const v0 = engine.valuationInput;
  const [form, setForm] = useState({
    units: v0.units ?? '', sqft: v0.grossSqFt ?? '',
    resNoi: v0.residentialNoiCents == null ? '' : String(v0.residentialNoiCents / 100), resCap: v0.residentialCapRatePct ?? '',
    comNoi: v0.commercialNoiCents == null ? '' : String(v0.commercialNoiCents / 100), comCap: v0.commercialCapRatePct ?? '',
  });
  const b = budgetSummary({ lines: data.lines, changeOrders: data.changeOrders });
  const v = valuation({ ...v0, totalCostCents: b.projectedCents || null });
  const d = dealReturns({ capital: engine.capital, noiCents: (v0.residentialNoiCents ?? null) === null ? null : (v0.residentialNoiCents || 0) + (v0.commercialNoiCents || 0), asBuiltCents: v.asBuiltCents });
  const [cap, setCap] = useState({ kind: 'investor', name: '', amount: '', rate: '', share: '' });
  return (
    <>
      <Card title="What it is worth">
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2">
          <Field id="dev-v-units" label="Apartments" type="number" value={form.units} onChange={(x) => setForm({ ...form, units: x })} />
          <Field id="dev-v-sqft" label="Gross sq ft" type="number" value={form.sqft} onChange={(x) => setForm({ ...form, sqft: x })} />
          <Field id="dev-v-resnoi" label="Apartments' NOI a year ($)" value={form.resNoi} onChange={(x) => setForm({ ...form, resNoi: x })} />
          <Field id="dev-v-rescap" label="Their cap rate (%)" type="number" step="0.05" value={form.resCap} onChange={(x) => setForm({ ...form, resCap: x })} />
          <Field id="dev-v-comnoi" label="Commercial NOI a year ($)" value={form.comNoi} onChange={(x) => setForm({ ...form, comNoi: x })} />
          <Field id="dev-v-comcap" label="Its cap rate (%)" type="number" step="0.05" value={form.comCap} onChange={(x) => setForm({ ...form, comCap: x })} />
        </div>
        <Btn tone="primary" onClick={async () => {
          await api.patchProject(project.id, {
            units: form.units === '' ? null : Number(form.units), gross_sq_ft: form.sqft === '' ? null : Number(form.sqft),
            residential_noi_cents: centsOrNull(form.resNoi), residential_cap_bp: bpOrNull(form.resCap),
            commercial_noi_cents: centsOrNull(form.comNoi), commercial_cap_bp: bpOrNull(form.comCap),
          });
          reload();
        }}>Save</Btn>
        <div data-testid="dev-value" className="mt-2">
          {v.complete ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Fact label="As built" value={money(v.asBuiltCents)} note={`commercial ${money(v.commercialValueCents)}`} />
              <Fact label="Equity created" value={money(v.equityCreatedCents)} note={`${pct(v.marginPct)} over cost`} />
              <Fact label="Cost per unit" value={money(v.costPerUnitCents)} note={v.equivalentUnits ? `${money(v.costPerEquivalentUnitCents)} counting the retail as ${v.equivalentUnits} apartments` : null} />
              <Fact label="Cost per sq ft" value={money(v.costPerSqFtCents)} />
            </div>
          ) : <p className="text-[0.8125rem] text-[#B85838]">Not valued yet: enter {v.missing.join(', ')}.</p>}
        </div>
      </Card>
      <Card title="The deal for investors">
        <p className="text-[0.75rem] text-[#6B665E] mb-2">The loan is paid first, then each investor{'’'}s preferred return, then their share of what is left. Interest-only, so the arithmetic can be checked by hand.</p>
        <ul className="text-[0.8125rem] mb-2">
          {engine.capital.map((c) => (
            <li key={c.id} className="border-t border-[#F0ECE4] py-1">{c.name} · {CAPITAL_KINDS.find((k) => k.key === c.kind)?.label} · {money(c.amountCents)}{c.rateBp ? ` at ${c.rateBp / 100}%` : ''}{c.shareBp ? `, ${c.shareBp / 100}% share` : ''}</li>
          ))}
        </ul>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2">
          <Select id="dev-cap-kind" label="Who" value={cap.kind} onChange={(x) => setCap({ ...cap, kind: x })} options={CAPITAL_KINDS} />
          <Field id="dev-cap-name" label="Name" value={cap.name} onChange={(x) => setCap({ ...cap, name: x })} />
          <Field id="dev-cap-amount" label="Amount ($)" value={cap.amount} onChange={(x) => setCap({ ...cap, amount: x })} />
          <Field id="dev-cap-rate" label="Rate or pref (%)" type="number" step="0.25" value={cap.rate} onChange={(x) => setCap({ ...cap, rate: x })} />
          <Field id="dev-cap-share" label="Share (%)" type="number" step="1" value={cap.share} onChange={(x) => setCap({ ...cap, share: x })} />
          <div className="self-end"><Btn tone="primary" disabled={!cap.name.trim()} onClick={async () => {
            const r = await api.addRow('dev_capital', project, { kind: cap.kind, name: cap.name.trim(), amount_cents: centsOrNull(cap.amount), rate_bp: bpOrNull(cap.rate), share_bp: bpOrNull(cap.share) });
            if (r.ok) { setCap({ ...cap, name: '', amount: '', rate: '', share: '' }); reload(); }
          }}>Add</Btn></div>
        </div>
        <div data-testid="dev-deal">
          {d.complete ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Fact label="Cash flow after the loan" value={money(d.cashFlowCents)} note={`DSCR ${d.dscr ?? '—'}`} />
              <Fact label="Cash on cash" value={pct(d.cashOnCashPct)} note={`${money(d.equityCents)} of equity`} />
              <Fact label="Preferred return" value={d.prefCovered ? 'covered' : `${money(d.prefShortCents)} short`} note={`${money(d.prefOwedCents)} owed a year`} />
              <Fact label="Equity multiple" value={d.equityMultiple ?? '—'} note={`loan to value ${pct(d.loanToValuePct)}`} />
            </div>
          ) : <p className="text-[0.8125rem] text-[#B85838]">Not yet: enter {d.missing.join(', ')}.</p>}
        </div>
      </Card>
    </>
  );
}

/** The PoeTech project that holds this building's work and hours, saved when the field is left. */
function ProjectRef({ value, onSave }) {
  const [v, setV] = useState(value);
  return (
    <div className="min-w-0">
      <label htmlFor="dev-project-ref" className="block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1">PoeTech project (its work and hours)</label>
      <input id="dev-project-ref" value={v} onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v.trim() !== String(value).trim()) onSave(v); }}
        className="w-full border border-[#E8E4DC] px-2 py-1.5 text-[0.875rem] bg-white" placeholder="not entered" />
    </div>
  );
}

/** What to build on a lot: Kleyman's single-family-or-duplex comparison. */
export function BuildToRent() {
  const blank = { name: '', lot: '', units: '1', sqft: '', perFt: '', rent: '' };
  const [rows, setRows] = useState([{ ...blank, name: 'Option A' }, { ...blank, name: 'Option B', units: '2' }]);
  const set = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const ranked = compareBuildToRent(rows.map((r) => ({
    name: r.name || 'Option', lotCostCents: centsOrNull(r.lot), units: r.units === '' ? null : Number(r.units),
    sqFtPerUnit: r.sqft === '' ? null : Number(r.sqft), buildCostPerSqFtCents: centsOrNull(r.perFt), rentPerUnitCents: centsOrNull(r.rent),
  })));
  return (
    <Card title="What to build on a lot">
      <p className="text-[0.75rem] text-[#6B665E] mb-2">Gross yield is a year{'’'}s rent over land and build cost per unit. Smaller units rent for more a foot, so a duplex or an efficient house often beats one large house. Financing and holding costs are left out.</p>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-2">
          <Field id={`btr-name-${i}`} label="Design" value={r.name} onChange={(v) => set(i, 'name', v)} />
          <Field id={`btr-lot-${i}`} label="Lot ($)" value={r.lot} onChange={(v) => set(i, 'lot', v)} />
          <Field id={`btr-units-${i}`} label="Units" type="number" value={r.units} onChange={(v) => set(i, 'units', v)} />
          <Field id={`btr-sqft-${i}`} label="Sq ft each" type="number" value={r.sqft} onChange={(v) => set(i, 'sqft', v)} />
          <Field id={`btr-perft-${i}`} label="Build $ a foot" value={r.perFt} onChange={(v) => set(i, 'perFt', v)} />
          <Field id={`btr-rent-${i}`} label="Rent each ($)" value={r.rent} onChange={(v) => set(i, 'rent', v)} />
        </div>
      ))}
      <Btn onClick={() => setRows([...rows, { ...blank, name: `Option ${String.fromCharCode(65 + rows.length)}` }])}>Add a design</Btn>
      <ol data-testid="btr-ranked" className="mt-2 text-[0.8125rem]">
        {ranked.map((o) => (
          <li key={o.name} className="border-t border-[#F0ECE4] py-1">
            {o.complete
              ? `${o.name}: ${o.grossYieldPct}% gross yield · ${money(o.basisPerUnitCents)} a unit (land ${money(o.landPerUnitCents)}, build ${money(o.buildPerUnitCents)}) · ${money(o.rentPerSqFtCents)} a foot`
              : `${o.name}: enter ${o.missing.join(', ')}`}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function DevelopmentTab({ api = DEFAULT_API }) {
  const [instanceId, setInstanceId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, msg: '' });

  const loadList = useCallback(async () => {
    const id = await api.instanceId();
    setInstanceId(id);
    if (!id) { setState({ loading: false, msg: WHY['no-instance'] }); return; }
    const r = await api.loadProjects(id);
    setState({ loading: false, msg: say(r) });
    if (r.ok) setProjects(r.projects);
  }, [api]);

  useEffect(() => { loadList(); }, [loadList]);

  const project = projects.find((p) => p.id === selected) || null;
  const reload = useCallback(async () => {
    if (!selected) return;
    const [r] = await Promise.all([api.loadProject(selected), loadList()]);
    if (r.ok) setData(r); else setState((s) => ({ ...s, msg: say(r) }));
  }, [api, selected, loadList]);
  useEffect(() => { setData(null); if (selected) reload(); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const engine = useMemo(() => (project && data ? projectForEngine(project, data) : null), [project, data]);
  const hasCommercial = project && ['mixed-use', 'commercial'].includes(project.kind);

  return (
    <div data-testid="development-tab">
      <Card title="Development">
        <p className="text-[0.8125rem] text-[#1A1815]">Count the cost before you build: the budget with every category a build carries, the change orders against the contingency, each phase{'’'}s checks with who signed them, what the finished building is worth, and the deal for investors.</p>
        {state.loading && <p className="text-[0.75rem] text-[#6B665E] mt-1">Reading the projects…</p>}
        {state.msg && <p role="alert" className="text-[0.75rem] text-[#B85838] mt-1">{state.msg}</p>}
        {projects.length > 0 && (
          <div className="mt-2 max-w-sm">
            <Field id="dev-project" label="Project">
              <select id="dev-project" value={selected || ''} onChange={(e) => setSelected(e.target.value || null)} className="w-full border border-[#E8E4DC] px-2 py-1.5 text-[0.875rem] bg-white">
                <option value="">Choose a project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {PROJECT_KINDS.find((k) => k.key === p.kind)?.label}</option>)}
              </select>
            </Field>
          </div>
        )}
      </Card>
      {instanceId && <NewProject busy={state.loading} onCreate={async (fields) => {
        const r = await api.createProject(instanceId, fields);
        setState((s) => ({ ...s, msg: say(r) }));
        if (r.ok) { await loadList(); setSelected(r.project.id); }
      }} />}
      {project && engine && (
        <>
          <Card title={project.name} right={<span className="text-[0.75rem] text-[#6B665E]">{PROJECT_KINDS.find((k) => k.key === project.kind)?.label}</span>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 text-[0.8125rem]">
                <input type="checkbox" checked={!!project.has_elevator} onChange={async (e) => { await api.patchProject(project.id, { has_elevator: e.target.checked }); reload(); }} />
                It has an elevator
              </label>
              <ProjectRef key={project.id} value={project.project_ref || ''}
                onSave={async (v) => { await api.patchProject(project.id, { project_ref: v.trim() || null }); reload(); }} />
            </div>
          </Card>
          <Budget project={project} data={engine} api={api} reload={reload} />
          {hasCommercial && <Bays project={project} data={engine} api={api} reload={reload} />}
          <ChangeOrders project={project} data={engine} api={api} reload={reload} />
          <Phases project={project} engine={engine} api={api} reload={reload} />
          <Value key={project.id} project={project} engine={engine} data={engine} api={api} reload={reload} />
        </>
      )}
      <BuildToRent />
    </div>
  );
}

export default DevelopmentTab;
