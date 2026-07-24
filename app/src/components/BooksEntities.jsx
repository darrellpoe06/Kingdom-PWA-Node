// Books → Entities — extracted from monolith (r30) per MODULAR-EXTENSIBILITY.md.
// Adds inline edit per IN-PLACE-FIRST + EDITABLE-EVERYWHERE; was display-only.
// Skips delete (entities are referenced by accounts/debts/contractors/transactions —
// orphan risk would corrupt the data graph; deletion belongs in a future "merge or
// retire entity" workflow that handles the references explicitly).
import React, { useState } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

const ENTITY_TYPES = ['personal', 'business', 'nonprofit', 'trust', 'joint', 'other'];

export function BooksEntities({ entityRollups, entityFilter, setEntityFilter, data, updateEntity }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', type: 'business', notes: '' });

  const visible = entityFilter === 'all' ? entityRollups : entityRollups.filter(r => r.entity.id === entityFilter);

  const startEdit = (entity) => {
    setEditForm({ name: entity.name || '', type: entity.type || 'business', notes: entity.notes || '' });
    setEditingId(entity.id);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    if (!editingId || !updateEntity) return;
    if (!editForm.name.trim()) { window.alert('Entity name is required.'); return; }
    updateEntity(editingId, editForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Entities</SectionTitle>
        <div className="flex gap-1 flex-wrap text-xs">
          <button type="button" onClick={() => setEntityFilter('all')} className={`px-3 py-1.5 border ${entityFilter === 'all' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>
          {data.entities.map(e => (
            <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
              {e.name.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </section>
      {visible.map((r) => (
        <section key={r.entity.id} className="bg-white border border-[#1A1815] p-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name}</h3>
              <div className="text-xs text-[#5A5751] mt-0.5 mb-3">{r.entity.notes || <span className="italic text-[#5A5751]">No notes</span>}</div>
            </div>
            {updateEntity && (
              <button
                type="button"
                onClick={() => editingId === r.entity.id ? cancelEdit() : startEdit(r.entity)}
                aria-expanded={editingId === r.entity.id}
                aria-label={editingId === r.entity.id ? `Cancel edit for ${r.entity.name}` : `Edit ${r.entity.name}`}
                className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {editingId === r.entity.id ? '× Cancel' : '✎ Edit'}
              </button>
            )}
          </div>
          {/* r30 — Inline edit per IN-PLACE-FIRST + EDITABLE-EVERYWHERE. */}
          {editingId === r.entity.id && (
            <div className="mb-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {r.entity.name}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Entity name</label>
                  <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Type</label>
                  <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Notes</label>
                <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" placeholder="What this entity is for · DBA · EIN status · key dates" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                Renaming or retyping an entity does not move the records under it — accounts, debts, transactions, contractors stay linked by ID. Safe to edit.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={saveEdit} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Cash" value={fmt(r.cashBalance)} small accent={r.cashBalance < 0 ? 'rust' : 'green'} sub="spendable" />
            <MetricCell label="Credit" value={fmt(r.creditBalance)} small accent={r.creditBalance < 0 ? 'rust' : null} sub="cards + loans" />
            <MetricCell label="Inflow" value={fmt(r.inflow)} small sub="per mo" />
            <MetricCell label="Debt total" value={fmt(r.debtBalance)} small accent={r.debtBalance > 0 ? 'rust' : null} sub="from Debts tab" />
            <MetricCell label="Accounts" value={`${r.accounts.length}`} small sub="all types" />
          </div>
        </section>
      ))}
    </div>
  );
}

export default BooksEntities;
