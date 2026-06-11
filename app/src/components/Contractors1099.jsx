// 1099 Contractors — extracted from monolith (r25) and rebuilt with inline edit
// per EDITABLE-EVERYWHERE.md + IDENTITY-ROLES-AUDIT.md. The original was a
// read-only one-liner; this version supports Add / Edit / Delete with
// lifecycle log entries written on every save.
import React, { useState } from 'react';
import { SectionTitle } from './shared.jsx';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

const BLANK_CONTRACTOR = {
  direction: 'outbound',
  entityId: 'e-personal',
  name: '',
  role: '',
  // Phone is what makes one-tap dispatch work (DispatchPanel texts the job
  // to this number); email is the fallback contact.
  phone: '',
  email: '',
  ytdPaid: 0,
  ytdReceived: 0,
  monthly: 0,
  monthlyExpected: 0,
  status: 'active',
  notes: '',
};

function ContractorRow({ c, isLast, entities, onEdit, onDelete, editing, editForm, setEditForm, onSave, onCancel }) {
  const value = c.direction === 'outbound' ? c.ytdPaid : c.ytdReceived;
  const rateLabel = c.direction === 'outbound' ? 'YTD paid' : `YTD received · ${fmt(c.monthlyExpected)}/mo expected`;
  return (
    <div className={`p-4 ${!isLast ? 'border-b border-[#E8E4DC]' : ''}`}>
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.name}</div>
          <div className="text-xs text-[#5A5751]">{c.role}{c.status && c.status !== 'active' ? ` · ${c.status}` : ''}</div>
          {(c.phone || c.email) && (
            <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="hover:text-[#1A1815] underline">{c.phone}</a>}
              {c.phone && c.email && ' · '}
              {c.email && <a href={`mailto:${c.email}`} className="hover:text-[#1A1815] underline">{c.email}</a>}
            </div>
          )}
          {c.notes && <div className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{c.notes}</div>}
        </div>
        <div className="text-right shrink-0">
          <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(value)}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{rateLabel}</div>
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        <button
          type="button"
          onClick={() => editing ? onCancel() : onEdit(c)}
          aria-expanded={editing}
          aria-label={editing ? `Cancel edit for ${c.name}` : `Edit ${c.name}`}
          className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {editing ? '× Cancel' : '✎ Edit'}
        </button>
        <button
          type="button"
          onClick={() => { if (window.confirm(`Delete ${c.name}? This removes the YTD totals — make sure they're already captured in Books.`)) onDelete(c.id); }}
          aria-label={`Delete ${c.name}`}
          className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Delete
        </button>
      </div>
      {editing && (
        <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {c.name}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Role</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Phone (for one-tap dispatch)</label><input type="tel" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="e.g., 217-555-0142" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Email</label><input type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direction</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.direction} onChange={e => setEditForm({ ...editForm, direction: e.target.value })}><option value="outbound">outbound (we pay)</option><option value="inbound">inbound (we receive)</option></select></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.entityId} onChange={e => setEditForm({ ...editForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="active">active</option><option value="paused">paused</option><option value="ended">ended</option></select></div>
          </div>
          {editForm.direction === 'outbound' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD paid</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.ytdPaid} onChange={e => setEditForm({ ...editForm, ytdPaid: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly (avg)</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.monthly} onChange={e => setEditForm({ ...editForm, monthly: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD received</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.ytdReceived} onChange={e => setEditForm({ ...editForm, ytdReceived: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly expected</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.monthlyExpected} onChange={e => setEditForm({ ...editForm, monthlyExpected: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          )}
          <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</label><textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          <div className="flex gap-2">
            <button type="button" onClick={onSave} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Contractors1099({ contractors = [], entities = [], addContractor, updateContractor, deleteContractor }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...BLANK_CONTRACTOR, entityId: entities[0]?.id || 'e-personal' });
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...BLANK_CONTRACTOR });

  const submitAdd = () => {
    if (!addForm.name.trim()) { setAddError('Name is required.'); return; }
    setAddError('');
    addContractor && addContractor(addForm);
    setAddForm({ ...BLANK_CONTRACTOR, entityId: entities[0]?.id || 'e-personal' });
    setShowAdd(false);
  };
  const startEdit = (c) => {
    setEditForm({
      direction: c.direction || 'outbound',
      entityId: c.entityId || 'e-personal',
      name: c.name || '',
      role: c.role || '',
      phone: c.phone || '',
      email: c.email || '',
      ytdPaid: c.ytdPaid || 0,
      ytdReceived: c.ytdReceived || 0,
      monthly: c.monthly || 0,
      monthlyExpected: c.monthlyExpected || 0,
      status: c.status || 'active',
      notes: c.notes || '',
    });
    setEditingId(c.id);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => { if (!editingId) return; updateContractor && updateContractor(editingId, editForm); setEditingId(null); };

  const outbound = contractors.filter(c => c.direction === 'outbound');
  const inbound = contractors.filter(c => c.direction === 'inbound');

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>1099 Relationships</SectionTitle>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{contractors.length} contractor{contractors.length === 1 ? '' : 's'} · {outbound.length} we pay, {inbound.length} we receive from</div>
          </div>
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">
            {showAdd ? '× Cancel' : '+ Add contractor'}
          </button>
        </div>
        {showAdd && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New 1099 relationship</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Person or company" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Role</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="What they do for the business" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Phone (for one-tap dispatch)</label><input type="tel" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., 217-555-0142" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Email</label><input type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="worker@example.com" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direction</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.direction} onChange={e => setAddForm({ ...addForm, direction: e.target.value })}><option value="outbound">outbound (we pay)</option><option value="inbound">inbound (we receive)</option></select></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.entityId} onChange={e => setAddForm({ ...addForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}><option value="active">active</option><option value="paused">paused</option><option value="ended">ended</option></select></div>
            </div>
            {addForm.direction === 'outbound' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD paid</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.ytdPaid} onChange={e => setAddForm({ ...addForm, ytdPaid: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly (avg)</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.monthly} onChange={e => setAddForm({ ...addForm, monthly: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD received</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.ytdReceived} onChange={e => setAddForm({ ...addForm, ytdReceived: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly expected</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.monthlyExpected} onChange={e => setAddForm({ ...addForm, monthlyExpected: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            )}
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</label><textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} /></div>
            {addError && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert">{addError}</div>}
            <button type="button" onClick={submitAdd} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save contractor</button>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Outbound · {outbound.length}</h3>
        {outbound.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>None yet. Add a contractor above to track YTD payments and tax-doc readiness.</div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {outbound.map((c, i) => (
              <ContractorRow key={c.id} c={c} isLast={i === outbound.length - 1} entities={entities} onEdit={startEdit} onDelete={deleteContractor} editing={editingId === c.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={cancelEdit} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Inbound · {inbound.length}</h3>
        {inbound.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>None yet. Use this for 1099s you receive (e.g., independent contracting income).</div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {inbound.map((c, i) => (
              <ContractorRow key={c.id} c={c} isLast={i === inbound.length - 1} entities={entities} onEdit={startEdit} onDelete={deleteContractor} editing={editingId === c.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={cancelEdit} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Contractors1099;
