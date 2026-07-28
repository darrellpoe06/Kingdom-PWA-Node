// =============================================================================
// TenantRoster — the people who live in a door (rentals build step b2)
// =============================================================================
// Darrell 2026-07-27: "add tenants to the apts." This is the SURFACE over the
// household model (lib/tenants.js): the door's PRIMARY tenant (the active
// lease's renter — the same renter the rent_payments ledger uses) plus the
// co-tenants (renter_household_members) you add here. One household, integrated
// with the lease and the paid-vs-due history, not a parallel list.
//
// HONEST STATES (DR-0076): signed-out; no primary tenant yet (the door needs a
// synced lease first — save Lease & Tenant while signed in); load error. Each
// says what is true instead of an empty or fake roster.
// =============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase.js';
import { getInstanceId } from '../lib/table-sync.js';
import { loadDoorHousehold, addHouseholdTenant, markTenantMovedOut, TENANT_RELATIONSHIPS } from '../lib/tenants.js';
import { inviteRenterPortal } from '../lib/renter-portal.js';

const relLabel = (v) => (TENANT_RELATIONSHIPS.find(([k]) => k === v) || [null, v])[1];

export default function TenantRoster({ rental }) {
  const [state, setState] = useState({ phase: 'loading', head: null, members: [], error: '' });
  const [form, setForm] = useState({ name: '', relationship: 'roommate', email: '', phone: '', moveIn: '', isLeaseSigner: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'loading', error: '' }));
    try {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess || !sess.user) { setState({ phase: 'signed-out', head: null, members: [], error: '' }); return; }
      if (!rental || !rental.remoteUuid) { setState({ phase: 'no-primary', head: null, members: [], error: '' }); return; }
      const tenantId = await getInstanceId();
      const { head, members } = await loadDoorHousehold(supabase, { tenantId, rentalUuid: rental.remoteUuid });
      if (!head) { setState({ phase: 'no-primary', head: null, members: [], error: '' }); return; }
      setState({ phase: 'ready', head, members, error: '' });
    } catch (e) {
      setState({ phase: 'error', head: null, members: [], error: (e && e.message) || 'load failed' });
    }
  }, [rental]);

  useEffect(() => { load(); }, [load]);

  const activeCount = 1 + state.members.filter((m) => !m.movedOut).length;

  const submit = async () => {
    setMsg(''); setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const tenantId = await getInstanceId();
      const res = await addHouseholdTenant(supabase, {
        tenantId, userId: sess?.user?.id, headRenterId: state.head?.id,
        name: form.name, email: form.email, phone: form.phone,
        relationship: form.relationship, isLeaseSigner: form.isLeaseSigner, moveIn: form.moveIn,
      });
      if (!res.ok) { setMsg(`Couldn't add: ${res.reason.replace(/-/g, ' ')}.`); setBusy(false); return; }
      setForm({ name: '', relationship: 'roommate', email: '', phone: '', moveIn: '', isLeaseSigner: false });
      setMsg(`Added ${form.name || 'tenant'} to this door.`);
      await load();
    } catch (e) {
      setMsg(`Couldn't add: ${(e && e.message) || 'error'}.`);
    }
    setBusy(false);
  };

  const invitePortal = async () => {
    if (!state.head?.id) return;
    setMsg('Inviting to the portal…');
    const r = await inviteRenterPortal(state.head.id);
    if (r.ok) setMsg('Invited. When they sign in with their email, they see their own rent history (once the portal is enabled).');
    else if (r.reason === 'not-enabled-yet') setMsg('The tenant portal isn’t enabled on the server yet — the statement (in Rent — paid vs due) shares their record in the meantime.');
    else setMsg(`Couldn’t invite: ${(r.reason || 'error').replace(/-/g, ' ')}.`);
  };

  const moveOut = async (member) => {
    if (typeof confirm === 'function' && !confirm(`Record ${member.name} as moved out of this door?`)) return;
    const { data: sess } = await supabase.auth.getUser();
    const res = await markTenantMovedOut(supabase, { memberId: member.id, userId: sess?.user?.id });
    if (res.ok) { setMsg(`${member.name} recorded as moved out.`); await load(); }
    else setMsg(`Couldn't update: ${(res.reason || 'error').replace(/-/g, ' ')}.`);
  };

  const label = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
  const field = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';

  return (
    <details className="bg-white border border-[#E8E4DC] p-3 mb-2">
      <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
        Tenants
        {state.phase === 'ready' && <span className="ml-2 text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {activeCount} in this door</span>}
      </summary>

      {state.phase === 'loading' && <p className="mt-3 text-xs text-[#5A5751]" role="status">Loading the household…</p>}
      {state.phase === 'signed-out' && <p className="mt-3 text-xs text-[#5A5751]">Sign in to see and add tenants.</p>}
      {state.phase === 'no-primary' && (
        <p className="mt-3 text-xs text-[#5A5751]">
          No primary tenant on this door yet. Save the <span className="font-semibold">Lease &amp; Tenant</span> panel above
          (with a tenant name, start, end, and monthly rent) while signed in — that person becomes the primary tenant, and you can add others here.
        </p>
      )}
      {state.phase === 'error' && (
        <p className="mt-3 text-xs text-[#B85838]" role="alert">Couldn&rsquo;t load tenants — a connection hiccup. <button type="button" onClick={load} className="underline">Try again</button>.</p>
      )}

      {state.phase === 'ready' && (
        <div className="mt-3 space-y-3">
          {/* PRIMARY — the lease signer, the renter the ledger uses */}
          <div className="border border-[#5A6E3D] bg-[#FAF8F4] p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#1A1815]">{state.head.name}</span>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Primary · lease</span>
            </div>
            <div className="text-[0.625rem] text-[#5A5751] mt-0.5">
              {state.head.phone ? <a href={`tel:${state.head.phone}`} className="underline text-[#B85838]">{state.head.phone}</a> : 'no phone'}
              {' · '}
              {state.head.email ? <a href={`mailto:${state.head.email}`} className="underline text-[#B85838]">{state.head.email}</a> : 'no email'}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-[0.5625rem] text-[#5A5751]">Edit the primary in Lease &amp; Tenant above.</p>
              <button type="button" onClick={invitePortal} className="text-[0.5625rem] uppercase tracking-wider border border-[#5A6E3D] text-[#5A6E3D] px-2 py-1 hover:bg-[#5A6E3D] hover:text-white">Invite to see their rent</button>
            </div>
          </div>

          {/* CO-TENANTS */}
          {state.members.length > 0 && (
            <ul className="space-y-1.5">
              {state.members.map((m) => (
                <li key={m.id} className={`border border-[#E8E4DC] p-2 ${m.movedOut ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1A1815]">{m.name}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{relLabel(m.relationship)}{m.isLeaseSigner ? ' · signer' : ''}</span>
                  </div>
                  <div className="text-[0.625rem] text-[#5A5751] mt-0.5">
                    {m.phone ? <a href={`tel:${m.phone}`} className="underline text-[#B85838]">{m.phone}</a> : 'no phone'}
                    {' · '}
                    {m.email ? <a href={`mailto:${m.email}`} className="underline text-[#B85838]">{m.email}</a> : 'no email'}
                    {m.movedOut && <span className="ml-1 italic">· moved out {m.movedOut}</span>}
                  </div>
                  {!m.movedOut && <button type="button" onClick={() => moveOut(m)} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] mt-1">Mark moved out</button>}
                </li>
              ))}
            </ul>
          )}

          {/* ADD */}
          <div className="border border-[#E8E4DC] p-2 space-y-2">
            <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">Add a tenant to this door</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label htmlFor={`tn-add-name-${rental.id}`} className={label}>Name</label><input id={`tn-add-name-${rental.id}`} className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label htmlFor={`tn-add-rel-${rental.id}`} className={label}>Relationship</label><select id={`tn-add-rel-${rental.id}`} className={field} value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>{TENANT_RELATIONSHIPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div><label htmlFor={`tn-add-movein-${rental.id}`} className={label}>Move-in</label><input id={`tn-add-movein-${rental.id}`} type="date" className={field} value={form.moveIn} onChange={(e) => setForm({ ...form, moveIn: e.target.value })} /></div>
              <div><label htmlFor={`tn-add-phone-${rental.id}`} className={label}>Cellphone</label><input id={`tn-add-phone-${rental.id}`} type="tel" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label htmlFor={`tn-add-email-${rental.id}`} className={label}>Email</label><input id={`tn-add-email-${rental.id}`} type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-[0.625rem] text-[#5A5751]">
              <input type="checkbox" checked={form.isLeaseSigner} onChange={(e) => setForm({ ...form, isLeaseSigner: e.target.checked })} /> On the lease (signer)
            </label>
            <div className="flex items-center gap-2">
              <button type="button" disabled={busy || !form.name.trim()} onClick={submit} className="bg-[#1A1815] text-white py-2 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-50">{busy ? 'Adding…' : 'Add tenant'}</button>
              {msg && <span className="text-[0.625rem] text-[#5A5751]" role="status">{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </details>
  );
}
