// =============================================================================
// Calendar — the recurring-obligations / incident-log / events / tax-calendar
// surface, extracted from the monolith shell (hybrid-modular cutover, Stage 3).
// Fully props-driven: every record and mutation arrives via props from the shell
// (data, reserves, add/update/delete handlers, notifPermission, upcomingEvents).
// Moved verbatim (DR-0076 characterize-before-change); shared calendar config +
// the relativeWhen helper live in lib/calendar-shared.js (core), so this feature
// module imports core only — never the shell (module-boundary law).
// =============================================================================
import React, { useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { DateField } from './Projects.jsx';
import { fmt, MONTHS_ABBR } from '../lib/format.js';
import { relativeWhen, REMINDER_OPTIONS, EVENT_CATEGORIES } from '../lib/calendar-shared.js';

export default function Calendar({ data, reserves, addRecurring, addIncident, addEvent, completeEvent, deleteRecurring, deleteIncident, deleteEvent, updateRecurring, updateEvent, notifPermission, requestNotif, upcomingEvents }) {
  // r22 — Per-row inline edit (was delete-only). Tracks which row of which
  // collection is currently expanded. One target at a time keeps the UI quiet.
  const [editingRecurId, setEditingRecurId] = useState(null);
  const [editRecurForm, setEditRecurForm] = useState({ name: '', amount: 0, frequency: 'monthly', category: 'compliance', nextDue: '', entityId: 'e-personal' });
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventForm, setEditEventForm] = useState({ title: '', date: '', time: '', notes: '' });
  // Inline-edit validation error (was: silent no-op / silent data loss). A blank
  // date on an event made it VANISH from the list; a cleared amount silently
  // became $0. Surface a message and BLOCK the save instead (review, 2026-07-18).
  const [editError, setEditError] = useState('');
  const startEditRecur = (r) => { setEditError(''); setEditRecurForm({ name: r.name || '', amount: r.amount || 0, frequency: r.frequency || 'monthly', category: r.category || 'other', nextDue: r.nextDue || '', entityId: r.entityId || 'e-personal' }); setEditingRecurId(r.id); setEditingEventId(null); };
  const cancelEditRecur = () => { setEditingRecurId(null); setEditError(''); };
  const saveEditRecur = () => {
    if (!editingRecurId) return;
    if (!String(editRecurForm.name).trim()) { setEditError('Name is required.'); return; }
    const amt = parseFloat(editRecurForm.amount);
    if (!Number.isFinite(amt) || amt < 0) { setEditError('Enter a valid amount (0 or more).'); return; }
    setEditError('');
    updateRecurring(editingRecurId, { ...editRecurForm, amount: amt });
    setEditingRecurId(null);
  };
  const startEditEvent = (e) => { setEditError(''); setEditEventForm({ title: e.title || '', date: e.date || '', time: e.time || '', notes: e.notes || '' }); setEditingEventId(e.id); setEditingRecurId(null); };
  const cancelEditEvent = () => { setEditingEventId(null); setEditError(''); };
  const saveEditEvent = () => {
    if (!editingEventId) return;
    // Title AND date are required — a blank date computes an Invalid Date and the
    // event drops out of the upcoming list forever (silent loss). Block it.
    if (!String(editEventForm.title).trim() || !String(editEventForm.date).trim()) { setEditError('Title and date are both required — an event with no date disappears.'); return; }
    setEditError('');
    updateEvent(editingEventId, editEventForm);
    setEditingEventId(null);
  };
  const [showRecurForm, setShowRecurForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  // Local YYYY-MM-DD (was new Date().toISOString().slice(0,10), which is UTC — an
  // evening entry rolled to "tomorrow"). Local matches DateField + eventDateTime.
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const [newRecur, setNewRecur] = useState({ name: '', amount: '', frequency: 'annual', nextDue: '', entityId: 'e-personal', category: 'other' });
  const [newIncident, setNewIncident] = useState({ date: localToday(), amount: '', category: 'other', entityId: 'e-personal', description: '', contractorIds: [] });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', allDay: true, description: '', entityId: 'e-personal', category: 'appointment', reminders: ['1d-before', 'at-time'], repeat: 'none' });

  // Create-form guards: surface WHY nothing happened instead of a silent no-op.
  const submitRecur = () => {
    if (!String(newRecur.name).trim()) { alert('Give the obligation a name.'); return; }
    const amt = parseFloat(newRecur.amount);
    if (!Number.isFinite(amt) || amt < 0) { alert('Enter a valid amount (0 or more).'); return; }
    addRecurring({ ...newRecur, amount: amt }); setNewRecur({ name: '', amount: '', frequency: 'annual', nextDue: '', entityId: 'e-personal', category: 'other' }); setShowRecurForm(false);
  };
  const submitIncident = () => {
    if (!String(newIncident.description).trim()) { alert('Describe the expense first.'); return; }
    const amt = parseFloat(newIncident.amount);
    if (!Number.isFinite(amt) || amt < 0) { alert('Enter a valid amount (0 or more).'); return; }
    addIncident({ ...newIncident, amount: amt }); setNewIncident({ date: localToday(), amount: '', category: 'other', entityId: 'e-personal', description: '', contractorIds: [] }); setShowIncidentForm(false);
  };
  const submitEvent = () => {
    if (!newEvent.title || !newEvent.date) { alert('Title and date are required.'); return; }
    addEvent(newEvent);
    setNewEvent({ title: '', date: '', time: '', allDay: true, description: '', entityId: 'e-personal', category: 'appointment', reminders: ['1d-before', 'at-time'], repeat: 'none' });
    setShowEventForm(false);
  };
  const toggleReminder = (key) => setNewEvent(ev => ({ ...ev, reminders: ev.reminders.includes(key) ? ev.reminders.filter(k => k !== key) : [...ev.reminders, key] }));

  const applicableTax = data.taxCalendar.filter(t => t.applies);
  const enabledRecur = data.recurringObligations.filter(r => r.enabled);

  return (
    <div className="space-y-6">
      {/* EVENTS — top of calendar */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Recurring Obligations</h2>
          <button type="button" onClick={() => setShowRecurForm(!showRecurForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showRecurForm ? '× Cancel' : '+ Add'}</button>
        </div>
        {showRecurForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Name" value={newRecur.name} onChange={e => setNewRecur({...newRecur, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Amount" value={newRecur.amount} onChange={e => setNewRecur({...newRecur, amount: e.target.value})} />
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newRecur.frequency} onChange={e => setNewRecur({...newRecur, frequency: e.target.value})}>
                <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="semi-annual">Semi-annual</option><option value="annual">Annual</option><option value="biennial">Biennial</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newRecur.entityId} onChange={e => setNewRecur({...newRecur, entityId: e.target.value})}>
                <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
              </select>
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newRecur.category} onChange={e => setNewRecur({...newRecur, category: e.target.value})}>
                <option value="compliance">Compliance</option><option value="vehicle">Vehicle</option><option value="insurance">Insurance</option><option value="professional">Professional</option><option value="business">Business</option><option value="housing">Housing</option><option value="health">Health</option><option value="subscription">Subscription</option><option value="other">Other</option>
              </select>
            </div>
            <DateField value={newRecur.nextDue} onChange={v => setNewRecur({...newRecur, nextDue: v})} className="w-full" />
            <button type="button" onClick={submitRecur} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider">Add</button>
          </div>
        )}
        <div className="bg-white border border-[#1A1815]">
          {enabledRecur.map((r, i) => (
            <div key={r.id} className={`p-3 ${i < enabledRecur.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.name}</div>
                  <div className="text-xs text-[#5A5751]">{r.frequency} · {r.category}{r.nextDue ? ` · next ${r.nextDue}` : ''}</div>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(r.amount)}</div>
                  <button type="button" onClick={() => editingRecurId === r.id ? cancelEditRecur() : startEditRecur(r)} aria-expanded={editingRecurId === r.id} aria-label={editingRecurId === r.id ? `Cancel edit for ${r.name}` : `Edit ${r.name}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingRecurId === r.id ? '× Cancel' : '✎ Edit'}</button>
                  <button type="button" onClick={() => deleteRecurring(r.id)} aria-label={`Delete ${r.name}`} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                </div>
              </div>
              {/* r22 — Inline quick-edit per IN-PLACE-FIRST.md + IDENTITY-ROLES-AUDIT.md. */}
              {editingRecurId === r.id && (
                <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {r.name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.name} onChange={e => setEditRecurForm({ ...editRecurForm, name: e.target.value })} /></div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Amount</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.amount} onChange={e => setEditRecurForm({ ...editRecurForm, amount: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Frequency</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.frequency} onChange={e => setEditRecurForm({ ...editRecurForm, frequency: e.target.value })}><option value="monthly">monthly</option><option value="quarterly">quarterly</option><option value="semi-annual">semi-annual</option><option value="annual">annual</option><option value="biennial">biennial</option></select></div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.category} onChange={e => setEditRecurForm({ ...editRecurForm, category: e.target.value })}><option value="compliance">compliance</option><option value="vehicle">vehicle</option><option value="insurance">insurance</option><option value="professional">professional</option><option value="business">business</option><option value="housing">housing</option><option value="health">health</option><option value="subscription">subscription</option><option value="other">other</option></select></div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.entityId} onChange={e => setEditRecurForm({ ...editRecurForm, entityId: e.target.value })}><option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option></select></div>
                  </div>
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Next due date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.nextDue} onChange={e => setEditRecurForm({ ...editRecurForm, nextDue: e.target.value })} /></div>
                  {editError && <div className="text-[0.6875rem] text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{editError}</div>}
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEditRecur} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                    <button type="button" onClick={cancelEditRecur} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Incident Log</h2>
          <button type="button" onClick={() => setShowIncidentForm(!showIncidentForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showIncidentForm ? '× Cancel' : '+ Log'}</button>
        </div>
        {showIncidentForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="What happened?" value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <DateField value={newIncident.date} onChange={v => setNewIncident({...newIncident, date: v})} />
              <input type="number" className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Amount" value={newIncident.amount} onChange={e => setNewIncident({...newIncident, amount: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newIncident.entityId} onChange={e => setNewIncident({...newIncident, entityId: e.target.value})}>
                <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
              </select>
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newIncident.category} onChange={e => setNewIncident({...newIncident, category: e.target.value})}>
                <option value="vehicle">Vehicle</option><option value="medical">Medical</option><option value="property">Property repair</option><option value="travel">Travel</option><option value="legal">Legal</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors involved (optional)</label>
              {(data.contractors1099 || []).length === 0 ? (
                <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(data.contractors1099 || []).map(k => {
                    const assigned = (newIncident.contractorIds || []).includes(k.id);
                    return (
                      <button type="button" key={k.id} onClick={() => setNewIncident({ ...newIncident, contractorIds: assigned ? (newIncident.contractorIds || []).filter(id => id !== k.id) : [...(newIncident.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                        {assigned ? '✓ ' : ''}{k.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button type="button" onClick={submitIncident} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider">Log</button>
          </div>
        )}
        <div className="bg-white border border-[#1A1815]">
          {data.incidents.map((inc, i) => (
            <div key={inc.id} className={`p-3 ${i < data.incidents.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{inc.description}</div>
                  <div className="text-xs text-[#5A5751]">{(inc.date || '').slice(5)} · {inc.category}</div>
                  {Array.isArray(inc.contractorIds) && inc.contractorIds.length > 0 && (
                    <div className="text-[10px] text-[#5A5751] mt-1 flex flex-wrap gap-1.5">
                      <span className="uppercase tracking-wider">👤 1099:</span>
                      {inc.contractorIds.map(cid => {
                        const k = (data.contractors1099 || []).find(c => c.id === cid);
                        return k ? <span key={cid} className="px-1.5 py-0.5 border border-[#E8E4DC] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>{k.name}</span> : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <div className="text-[#B85838]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(inc.amount)}</div>
                  <button type="button" onClick={() => deleteIncident(inc.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Events</h2>
          <div className="flex items-center gap-3">
            {notifPermission === 'default' && (
              <button type="button" onClick={requestNotif} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">🔔 Enable notifications</button>
            )}
            {notifPermission === 'granted' && (
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">🔔 Notifications on</span>
            )}
            {notifPermission === 'denied' && (
              <span className="text-[10px] uppercase tracking-wider text-[#B85838]">🔔 Blocked in browser</span>
            )}
            <button type="button" onClick={() => setShowEventForm(!showEventForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showEventForm ? '× Cancel' : '+ Add event'}</button>
          </div>
        </div>

        {showEventForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New event</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Event title (e.g., Dr. Shafer ortho follow-up)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                <DateField value={newEvent.date} onChange={v => setNewEvent({...newEvent, date: v})} className="w-full" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Time {newEvent.allDay && '(all-day)'}</label>
                <input type="time" disabled={newEvent.allDay} className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] disabled:opacity-50" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newEvent.allDay} onChange={e => setNewEvent({...newEvent, allDay: e.target.checked, time: e.target.checked ? '' : newEvent.time})} /> All-day event</label>
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Description / notes" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newEvent.entityId} onChange={e => setNewEvent({...newEvent, entityId: e.target.value})}>
                <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
              </select>
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">Reminders</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {REMINDER_OPTIONS.map(opt => (
                  <label key={opt.key} className={`text-xs px-2 py-1.5 border cursor-pointer ${newEvent.reminders.includes(opt.key) ? 'border-[#B85838] bg-[#FAF8F4] text-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                    <input type="checkbox" checked={newEvent.reminders.includes(opt.key)} onChange={() => toggleReminder(opt.key)} className="hidden" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newEvent.repeat} onChange={e => setNewEvent({...newEvent, repeat: e.target.value})}>
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button type="button" onClick={submitEvent} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save Event</button>
            {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
              <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>For reminder pop-ups outside the app, click "Enable notifications" above. Visual reminders work either way.</p>
            )}
          </div>
        )}

        {upcomingEvents.length === 0 && !showEventForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No events scheduled. Click "+ Add event" to create one with reminders.</p>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="bg-white border border-[#1A1815]">
            {upcomingEvents.map((e, i) => (
              <div key={e.id} className={`p-3 ${i < upcomingEvents.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex justify-between items-baseline gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{e.title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">
                      {e.date}{e.time ? ` · ${e.time}` : ' · all day'} · {e.category} · {relativeWhen(e.dateTime)}
                    </div>
                    {e.description && <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic' }}>{e.description}</div>}
                    {e.reminders && e.reminders.length > 0 && (
                      <div className="text-[10px] text-[#5A5751] mt-1">🔔 {e.reminders.length} reminder{e.reminders.length>1?'s':''}</div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <button type="button" onClick={() => completeEvent(e.id)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">✓ Done</button>
                    <button type="button" onClick={() => editingEventId === e.id ? cancelEditEvent() : startEditEvent(e)} aria-expanded={editingEventId === e.id} aria-label={editingEventId === e.id ? `Cancel edit for ${e.title}` : `Edit ${e.title}`} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-2 py-1.5 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingEventId === e.id ? '× Cancel' : '✎ Edit'}</button>
                    <button type="button" onClick={() => deleteEvent(e.id)} aria-label={`Delete ${e.title}`} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
                {/* r22 — Inline event quick-edit. */}
                {editingEventId === e.id && (
                  <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {e.title}</div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Title</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editEventForm.title} onChange={ev => setEditEventForm({ ...editEventForm, title: ev.target.value })} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editEventForm.date} onChange={ev => setEditEventForm({ ...editEventForm, date: ev.target.value })} /></div>
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Time (optional)</label><input type="time" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editEventForm.time} onChange={ev => setEditEventForm({ ...editEventForm, time: ev.target.value })} /></div>
                    </div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</label><textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" value={editEventForm.notes} onChange={ev => setEditEventForm({ ...editEventForm, notes: ev.target.value })} /></div>
                    {editError && <div className="text-[0.6875rem] text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{editError}</div>}
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEditEvent} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                      <button type="button" onClick={cancelEditEvent} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Tax & Compliance Calendar</SectionTitle>
        <div className="bg-white border border-[#1A1815]">
          {applicableTax.sort((a,b)=>a.month-b.month).map((t, i) => (
            <div key={t.id} className={`p-3 ${i < applicableTax.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="flex justify-between items-baseline">
                <div>
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{t.name}</div>
                  <div className="text-xs text-[#5A5751]">{t.desc}</div>
                </div>
                <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{MONTHS_ABBR[t.month-1]} {t.day}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
