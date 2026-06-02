// Cart · Subscriptions Audit — extracted from monolith (r29) per
// MODULAR-EXTENSIBILITY.md. Adds full inline edit per row in addition to the
// existing delete + status-quickedit (was edit-blind otherwise).
import React, { useState } from 'react';
import { MetricCell } from './shared.jsx';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };

const SUB_CATEGORIES = ['software', 'streaming', 'music', 'news', 'business', 'productivity', 'fitness', 'family', 'education', 'cloud-storage', 'other'];
const STATUS_OPTIONS = [
  { key: 'keep',      label: '✓ Keep',      desc: 'Worth it · necessary' },
  { key: 'review',    label: '⚠ Review',    desc: 'Not sure · check usage' },
  { key: 'cancel',    label: '✗ Cancel',    desc: 'Decided to cancel' },
  { key: 'cancelled', label: '— Cancelled', desc: 'Already done' },
];
const statusColor = (s) => s === 'keep' ? '#5A6E3D' : s === 'review' ? '#B85838' : s === 'cancel' ? '#8B6F47' : '#5A5751';

export function Cart({ subscriptions = [], entities = [], addSubscription, updateSubscription, deleteSubscription }) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [subError, setSubError] = useState('');
  const blankSub = { name: '', category: 'software', monthly: 0, status: 'keep', entityId: 'e-personal', notes: '', billingCycle: 'monthly' };
  const [newSub, setNewSub] = useState(blankSub);
  // r29 — inline edit state per IN-PLACE-FIRST + EDITABLE-EVERYWHERE.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(blankSub);

  const submitSub = () => {
    if (!newSub.name || !newSub.monthly) { setSubError('Name and monthly amount are required.'); return; }
    setSubError('');
    addSubscription({ ...newSub, monthly: parseFloat(newSub.monthly) });
    setNewSub(blankSub);
    setShowForm(false);
  };

  const startEdit = (s) => {
    setEditForm({
      name: s.name || '',
      category: s.category || 'software',
      monthly: s.monthly || 0,
      status: s.status || 'keep',
      entityId: s.entityId || 'e-personal',
      notes: s.notes || '',
      billingCycle: s.billingCycle || 'monthly',
    });
    setEditingId(s.id);
    setShowForm(false);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    if (!editingId) return;
    updateSubscription(editingId, { ...editForm, monthly: parseFloat(editForm.monthly) || 0 });
    setEditingId(null);
  };

  const filtered = subscriptions.filter(s => filterStatus === 'all' || s.status === filterStatus);
  const active = subscriptions.filter(s => s.status !== 'cancelled');
  const totalMonthly = active.reduce((sum, s) => sum + (s.monthly || 0), 0);
  const reviewTotal = subscriptions.filter(s => s.status === 'review').reduce((sum, s) => sum + (s.monthly || 0), 0);
  const cancelTotal = subscriptions.filter(s => s.status === 'cancel').reduce((sum, s) => sum + (s.monthly || 0), 0);
  const potentialSavings = reviewTotal + cancelTotal;
  const annualSpend = totalMonthly * 12;
  const potentialAnnualSavings = potentialSavings * 12;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Cart · Subscriptions Audit</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>What are you actually paying for every month?</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Every recurring purchase you have. See the total monthly bleed. Decide what to <strong>keep</strong>, what to <strong>review</strong>, and what to <strong>cancel</strong>. A simple audit reveals what's actually serving the family vs. what's just running in the background.
        </p>
      </section>

      {subscriptions.length > 0 && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Active monthly" value={fmt(totalMonthly)} sub={`${active.length} subs`} small />
            <MetricCell label="Active annual" value={fmtCompact(annualSpend)} sub="/year" small accent="rust" />
            <MetricCell label="Potential savings" value={fmt(potentialSavings)} sub="/mo if cancelled" small accent="green" />
            <MetricCell label="Annual savings" value={fmtCompact(potentialAnnualSavings)} sub="/yr if cancelled" small accent="green" />
          </div>
          {potentialAnnualSavings > 0 && (
            <p className="text-xs text-[#5A6E3D] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Cancelling your "review" + "cancel" subs frees <strong>{fmt(potentialAnnualSavings)}/yr</strong>. That's real money you could redirect to the debt snowball.
            </p>
          )}
        </section>
      )}

      <section className="bg-white border-2 border-dashed border-[#B85838] p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1.5">🔌 Plaid Integration · Vision</div>
        <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Future build: Plaid bank account integration automatically detects recurring charges and adds them here for you to review. For now, add subscriptions manually as you find them — checking the last 90 days of bank/card statements is a great Saturday morning exercise. The local-first architecture means your transaction data stays on your device even when Plaid is added.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Subscriptions</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <button type="button" onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add subscription'}</button>
          </div>
        </div>

        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New subscription</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Name (e.g., Netflix, Spotify, QuickBooks, Adobe)" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly cost</label>
                <input type="number" min="0" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="0.00" value={newSub.monthly} onChange={e => setNewSub({...newSub, monthly: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Billing cycle</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newSub.billingCycle} onChange={e => setNewSub({...newSub, billingCycle: e.target.value})}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (÷3 for monthly)</option>
                  <option value="annual">Annual (÷12 for monthly)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newSub.category} onChange={e => setNewSub({...newSub, category: e.target.value})}>
                  {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newSub.entityId} onChange={e => setNewSub({...newSub, entityId: e.target.value})}>
                  {entities.length > 0 ? entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>) : <><option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option></>}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.key} type="button" onClick={() => setNewSub({...newSub, status: opt.key})} className={`text-xs px-2 py-1.5 border text-left ${newSub.status === opt.key ? 'border-[#B85838] bg-[#FAF8F4] text-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[9px]">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes (e.g., started Jan 2024, used weekly, kids use it)" value={newSub.notes} onChange={e => setNewSub({...newSub, notes: e.target.value})} />
            {subError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{subError}</div>}
            <button type="button" onClick={submitSub} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save Subscription</button>
          </div>
        )}

        {filtered.length === 0 && !showForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
              No subscriptions tracked yet. Start with the obvious ones — Netflix, Spotify, software, gym, news, cloud storage. Add them as you find them in bank statements. The audit becomes valuable when you see them all together.
            </p>
            <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              The average American family pays $273/mo across 12 subscriptions according to recent surveys — and 84% underestimate by 50%. The first audit is always eye-opening.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="bg-white border border-[#1A1815]">
            {filtered.sort((a,b) => (b.monthly || 0) - (a.monthly || 0)).map((s, i) => (
              <div key={s.id} className={`p-4 ${i < filtered.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${s.status === 'cancel' || s.status === 'review' ? 'bg-[#FAF8F4]' : ''}`}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">{s.category}</span>
                      {s.billingCycle && s.billingCycle !== 'monthly' && <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">· {s.billingCycle}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(s.monthly)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                    <div className="text-[10px] text-[#5A5751]">{fmt((s.monthly || 0) * 12)}/yr</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.key} type="button" onClick={() => updateSubscription(s.id, { status: opt.key })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${s.status === opt.key ? 'border-[#1A1815] bg-[#1A1815] text-[#FAF8F4]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`} style={s.status === opt.key ? {} : { color: statusColor(opt.key) }}>
                      {opt.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => editingId === s.id ? cancelEdit() : startEdit(s)} aria-expanded={editingId === s.id} aria-label={editingId === s.id ? `Cancel edit for ${s.name}` : `Edit ${s.name}`} className="text-[10px] px-2 py-1 border border-[#5A5751] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
                    {editingId === s.id ? '× Cancel' : '✎ Edit'}
                  </button>
                  <button type="button" onClick={() => { if (window.confirm('Delete this subscription record?')) deleteSubscription(s.id); }} className="text-[10px] px-2 py-1 text-[#5A5751] hover:text-[#B85838] uppercase tracking-wider">Delete</button>
                </div>
                {s.notes && <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{s.notes}</p>}
                {/* r29 — Inline edit per IN-PLACE-FIRST.md + EDITABLE-EVERYWHERE.md. */}
                {editingId === s.id && (
                  <div className="mt-3 p-3 bg-white border-2 border-[#B85838] space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {s.name}</div>
                    <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly cost</label><input type="number" min="0" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={editForm.monthly} onChange={e => setEditForm({...editForm, monthly: e.target.value})} /></div>
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Billing cycle</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={editForm.billingCycle} onChange={e => setEditForm({...editForm, billingCycle: e.target.value})}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>{SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={editForm.entityId} onChange={e => setEditForm({...editForm, entityId: e.target.value})}>{entities.length > 0 ? entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>) : <><option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option></>}</select></div>
                    </div>
                    <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                      <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Cart;
