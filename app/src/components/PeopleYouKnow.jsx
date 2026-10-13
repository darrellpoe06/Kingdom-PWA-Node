// =============================================================================
// PeopleYouKnow — the contacts brought in, each placed where they belong
// =============================================================================
// Darrell 2026-10-09: "how do I add all my contacts at once? Then choosing who
// are tenants... church members... etc... all who we want in whatever space."
// The list is the steward's own contacts (keeper + this device), matched to
// accounts where one exists; a space and a placement are chosen once and
// applied to one person or to every one ticked. The writes are the ones the
// app already trusts: add_user_to_instance (DR-0829), invite_to_instance /
// invite_to_church (DR-0187), property_access_invites (0150). Every result
// is said per person; nothing is painted.
import React, { useEffect, useMemo, useState } from 'react';
import { loadMyContacts, cachedContacts } from '../lib/contacts-store.js';
import { fetchSignupMetrics } from '../lib/signup-metrics.js';
import { listMyAdminInstances, addUserToSpace, inviteToSpace } from '../lib/member-roles.js';
import { inviteToProperties } from '../modules/properties/cloud.js';
import { phoneLoginEmail } from '../lib/supabase.js';
import { formatPhone } from '../lib/member-contact.js';
import { categoryLabel } from '../lib/signup-metrics.js';
import { peopleFromContacts, matchAccounts, placementsFor, placeMany, placementSummary, isPropertiesSpace } from '../lib/people-placement.js';

const serif = { fontFamily: '"Fraunces", serif' };
const btn = 'text-[0.5625rem] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40';

export default function PeopleYouKnow() {
  const [contacts, setContacts] = useState({ status: 'loading', table: [], device: [], reason: '' });
  const [signups, setSignups] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState('');
  const [placement, setPlacement] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [t, s, sp] = await Promise.all([
        loadMyContacts().catch(() => ({ ok: false, rows: [], reason: 'unexpected' })),
        fetchSignupMetrics().catch(() => ({ status: 'unavailable', data: null })),
        listMyAdminInstances().catch(() => []),
      ]);
      if (!alive) return;
      const device = (() => { try { return cachedContacts() || []; } catch { return []; } })();
      setContacts({ status: 'ready', table: t && t.ok ? t.rows : [], device, reason: t && t.ok ? '' : ((t && t.reason) || '') });
      setSignups((s && s.data && s.data.signups) || []);
      const list = Array.isArray(sp) ? sp : [];
      setSpaces(list);
      if (list[0]) setSpaceId(list[0].instanceId);
    })();
    return () => { alive = false; };
  }, []);

  const space = spaces.find((s) => s.instanceId === spaceId) || spaces[0] || null;
  const placements = useMemo(() => placementsFor(space), [space]);
  useEffect(() => { if (!placements.some((p) => p.key === placement)) setPlacement((placements[0] && placements[0].key) || ''); }, [placements, placement]);
  const people = useMemo(() => matchAccounts(peopleFromContacts(contacts.table, contacts.device), signups), [contacts, signups]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((p) => p.name.toLowerCase().includes(needle) || p.emails.some((e) => e.includes(needle)) || p.phones.some((d) => d.includes(needle.replace(/\D+/g, '') || '\u0000')));
  }, [people, q]);

  const toggle = (key) => setPicked((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  const allShown = shown.length > 0 && shown.every((p) => picked.has(p.key));
  const pickAll = () => setPicked((prev) => { const n = new Set(prev); if (allShown) shown.forEach((p) => n.delete(p.key)); else shown.forEach((p) => n.add(p.key)); return n; });

  const place = async (list) => {
    if (!space || !placement || list.length === 0) return;
    setBusy(true);
    const r = await placeMany(list, { space, placement, toPhoneEmail: phoneLoginEmail, addUserToSpace, inviteToSpace, inviteToProperties });
    setResults(r);
    setBusy(false);
  };

  const reach = (p) => [p.phones[0] ? formatPhone(p.phones[0]) : '', p.emails[0] || ''].filter(Boolean).join(' · ');

  return (
    <div className="mb-5" data-testid="people-you-know">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">People you know — place each one where they belong</div>
      <p className="text-xs mt-1 text-[#5A5751]" style={serif}>
        Every contact you brought in (Messages &gt; Add a contact: pick one, some or all from your phone, or upload your .vcf), matched to an account where one exists.
        Choose a space and what they are there, then place one person or everyone ticked. An account that exists is added now; a person without one is invited and gets it the first time they sign in.
      </p>
      {contacts.status === 'loading' ? <p className="text-xs mt-2 text-[#5A5751] italic" style={serif}>Reading your contacts…</p> : null}
      {contacts.status === 'ready' && people.length === 0 ? (
        <p className="text-xs mt-2 text-[#5A5751] italic" style={serif} data-testid="people-empty">No contacts brought in yet{contacts.reason ? ` (your server did not answer: ${contacts.reason})` : ''}. Bring them in under Messages &gt; Add a contact.</p>
      ) : null}
      {people.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-2 mt-2" data-testid="people-placement-bar">
            <select aria-label="Space" value={space ? space.instanceId : ''} onChange={(e) => setSpaceId(e.target.value)} className="text-[0.6875rem] p-1 border border-[#E8E4DC] bg-white">
              {spaces.map((s) => <option key={s.instanceId} value={s.instanceId}>{s.displayName || s.slug || s.instanceType}</option>)}
            </select>
            <select aria-label="As" value={placement} onChange={(e) => setPlacement(e.target.value)} className="text-[0.6875rem] p-1 border border-[#E8E4DC] bg-white">
              {placements.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <button type="button" disabled={busy || picked.size === 0 || !space} onClick={() => place(people.filter((p) => picked.has(p.key)))} data-testid="people-place-picked" className={`${btn} border-[#1A1815] text-[#1A1815]`}>
              {busy ? 'Placing…' : `Place ${picked.size} ticked`}
            </button>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a name or number" aria-label="Find a person" className="text-[0.6875rem] p-1 border border-[#E8E4DC] bg-white flex-1 min-w-[10rem]" />
            {space && isPropertiesSpace(space) ? <span className="text-[0.625rem] text-[#5A5751]" style={serif}>Tenants and workers are invited to all doors; set a door under Properties &gt; People when one is theirs.</span> : null}
          </div>
          {spaces.length === 0 ? <p className="text-xs mt-1 text-[#B85838]" style={serif}>You administer no space, so nobody can be placed from here.</p> : null}
          <div className="border border-[#E8E4DC] mt-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#FAF8F4] border-b border-[#E8E4DC] text-[0.625rem] text-[#5A5751]">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={allShown} onChange={pickAll} aria-label="Tick everyone shown" data-testid="people-pick-all" /> everyone shown</label>
              <span>{shown.length} of {people.length} {people.length === 1 ? 'person' : 'people'} · {people.filter((p) => p.account).length} with an account</span>
            </div>
            {shown.map((p) => (
              <div key={p.key} className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0" data-testid="people-row">
                <input type="checkbox" checked={picked.has(p.key)} onChange={() => toggle(p.key)} aria-label={`Tick ${p.name}`} />
                <span className="basis-full sm:basis-auto sm:flex-1 min-w-0 break-words text-[0.8125rem] text-[#1A1815]">
                  <span data-testid="people-row-name">{p.name}</span>
                  <span className="block text-[0.625rem] text-[#5A5751]">{reach(p) || 'no number or email on record'}</span>
                </span>
                <span className="text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751] border border-[#E3DDD2] bg-[#FAF8F4] px-1.5 py-0.5" data-testid="people-row-account">
                  {p.account ? categoryLabel(p.account.category) : 'no account yet'}
                </span>
                <button type="button" disabled={busy || !space} onClick={() => place([p])} className={`${btn} border-[#5A6E3D] text-[#5A6E3D]`} data-testid="people-place-one">
                  {p.account ? 'Add' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
      {results ? (
        <div className="mt-2 border border-[#E8E4DC] p-2.5" role="status" data-testid="people-results">
          <div className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#5A6E3D]">{placementSummary(results)}</div>
          <ul className="mt-1 space-y-0.5">
            {results.map((r, i) => (
              <li key={`${r.name}-${i}`} className={`text-xs ${r.outcome === 'error' ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={serif}>
                <b>{r.name}</b>: {r.outcome === 'error' ? `not placed (${r.detail})` : r.detail}
                {r.link ? <> · <a href={r.link} className="underline break-all">claim link</a></> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
