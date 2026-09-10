// =============================================================================
// TlcOnboarding — Christina's control for bringing a new colleague on board
// =============================================================================
// (DR-0344) Darrell, 2026-09-10: the intake form inside the TLC Therapy
// Solutions App "so Christina can on-board new colleagues inside the TLC
// Therapy Solutions App." This panel is the office side of that: mint a
// one-time link for a colleague's email, watch their packet arrive, read it,
// open their documents, reveal direct-deposit details (logged), and approve it
// onto the roster or return it with a note. Visible to the office owner/admin
// (the same gate TlcTeamAccess uses); the database is the wall (0187).
//
// Access to the APP is a separate act: approving a packet writes the
// clinicians row, it does not make anyone a member — that stays the two-party
// Team access handshake (DR-0187 / DR-0271), by design.
import React, { useCallback, useEffect, useState } from 'react';
import { useInstanceRole, canManageTeam } from '../lib/instance-role.js';
import { PACKET_STATUSES, buildOnboardLink, formatDate, TLC_ONBOARDING_SOURCE } from '../lib/tlc-onboarding.js';
import { mintInvite, revokeInvite, listOffice, readPacket, readBanking, reviewPacket, deletePacket } from '../lib/tlc-onboarding-sync.js';
import { rosterCardFromPacket, ROSTER_ROLE_DEFAULT } from '../lib/tlc-roster-cards.js';
import { listRoster, upsertRosterCard, removeRosterCard } from '../lib/tlc-roster.js';
import TlcOnboardingReadout from './TlcOnboardingReadout.jsx';
import UiIcon from './UiIcon.jsx';
import SectionTabs from './SectionTabs.jsx';

// The public card, drawn the way the door draws it — so what Christina sees
// here is what a client will see on "Match a Preferred Provider".
function RosterCardPreview({ card }) {
  if (!card) return null;
  return (
    <div className="bg-white border border-[#E8E4DC] p-3 flex items-start gap-3 sm:w-96">
      {card.photo
        ? <img src={card.photo} alt="" width="72" height="72" className="w-[72px] h-[72px] object-cover bg-[#E8E4DC] shrink-0" />
        : <div aria-hidden="true" className="w-[72px] h-[72px] bg-[#E8E4DC] shrink-0" />}
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold min-w-0 break-words" style={{ fontFamily: '"Fraunces", serif' }}>{card.name || 'Name'}</span>
          <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] whitespace-nowrap">View →</span>
        </div>
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{card.role || ROSTER_ROLE_DEFAULT}</div>
        <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{card.specialty || 'Specialty line'}</p>
      </div>
    </div>
  );
}

function RosterCardFields({ card, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div><label htmlFor="rc-name" className="block text-xs font-semibold text-[#1A1815] mb-1">Name as shown</label><input id="rc-name" value={card.name || ''} onChange={(e) => onChange({ ...card, name: e.target.value })} className={INPUT} /></div>
      <div><label htmlFor="rc-role" className="block text-xs font-semibold text-[#1A1815] mb-1">Role line</label><input id="rc-role" value={card.role || ''} onChange={(e) => onChange({ ...card, role: e.target.value })} className={INPUT} /></div>
      <div className="sm:col-span-2"><label htmlFor="rc-spec" className="block text-xs font-semibold text-[#1A1815] mb-1">Specialty line</label><input id="rc-spec" value={card.specialty || ''} onChange={(e) => onChange({ ...card, specialty: e.target.value })} className={INPUT} /></div>
      <div className="sm:col-span-2"><label htmlFor="rc-url" className="block text-xs font-semibold text-[#1A1815] mb-1">Their page on tlctherapysolutions.me (optional; the team page is used until you add one)</label><input id="rc-url" value={card.url || ''} onChange={(e) => onChange({ ...card, url: e.target.value })} placeholder="https://tlctherapysolutions.me/…" className={INPUT} /></div>
    </div>
  );
}

// The live roster editor: every approved card, in the order the door shows
// them after the seed cards. Publish/unpublish, edit, remove — and a copy of
// the card's text for the website editor, which the app cannot write to.
function RosterPanel() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { const res = await listRoster(); if (res.ok) setRows(res.rows); else setMsg(res.message); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const save = async () => {
    setBusy(true);
    const res = await upsertRosterCard({ id: editing.id, name: editing.name, role: editing.role, specialty: editing.specialty, url: editing.url || '', published: editing.published });
    setBusy(false);
    if (!res.ok) { setMsg(res.message); return; }
    setEditing(null); setMsg('Saved. The app roster updates on the next open.'); refresh();
  };
  const toggle = async (r) => { setBusy(true); const res = await upsertRosterCard({ id: r.id, published: !r.published }); setBusy(false); if (!res.ok) setMsg(res.message); refresh(); };
  const remove = async (r) => { setBusy(true); const res = await removeRosterCard(r.id); setBusy(false); if (!res.ok) setMsg(res.message); refresh(); };
  const copyForSite = async (r) => {
    const text = `${r.name}\n${r.role}\n${r.specialty}\n\n${r.bio || ''}`.trim();
    try { await navigator.clipboard.writeText(text); setMsg(`Copied ${r.name}'s card text for the website editor.`); } catch { setMsg('The clipboard is blocked here; open the card and copy by hand.'); }
  };
  return (
    <div className="border border-[#E8E4DC] bg-white p-4">
      <div className="text-sm font-bold text-[#1A1815] mb-1">Live roster · Match a Preferred Provider</div>
      <p className="text-xs text-[#5A5751] leading-relaxed mb-2">Approved colleagues appear on the TLC app, the Moore door and the Practice tab after the current seven, in the same card format. The website has no door the app can write to, so each card&apos;s text copies out for its editor.</p>
      {msg && <p className="text-xs text-[#3F5226] mb-2" role="status">{msg}</p>}
      {rows.length === 0 ? <p className="text-xs text-[#5A5751]">No approved colleagues on the live roster yet.</p> : (
        <ul className="divide-y divide-[#E6E0D6]">
          {rows.map((r) => (
            <li key={r.id} className="py-2 space-y-2">
              {editing && editing.id === r.id ? (
                <>
                  <RosterCardFields card={editing} onChange={setEditing} />
                  <RosterCardPreview card={editing} />
                  <div className="flex flex-wrap gap-2"><button type="button" onClick={save} disabled={busy} className={`${BTN_GOOD}`}>Save card</button><button type="button" onClick={() => setEditing(null)} className={`${BTN}`}>Cancel</button></div>
                </>
              ) : (
                <>
                  <RosterCardPreview card={r} />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={r.published ? 'text-[#3F5226]' : 'text-[#B85838]'}>{r.published ? 'Published' : 'Hidden'}</span>
                    <button type="button" onClick={() => setEditing({ ...r })} className={`${BTN}`}>Edit</button>
                    <button type="button" onClick={() => toggle(r)} disabled={busy} className={`${BTN}`}>{r.published ? 'Hide' : 'Publish'}</button>
                    <button type="button" onClick={() => copyForSite(r)} className={`${BTN}`}>Copy for website</button>
                    <button type="button" onClick={() => remove(r)} disabled={busy} aria-label={`Remove ${r.name} from the roster`} className={`${BTN_WARN}`}>Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const INPUT = 'w-full min-h-[36px] p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_GOOD = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';

function StatusChip({ status }) {
  const st = PACKET_STATUSES[status] || PACKET_STATUSES.draft;
  const tone = st.tone === 'good' ? 'border-[#5A6E3D] text-[#3F5226] bg-[#F0F4EA]' : st.tone === 'alert' ? 'border-[#B85838] text-[#B85838] bg-white' : st.tone === 'warm' ? 'border-[#1A1815] text-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] text-[#5A5751] bg-white';
  return <span className={`inline-block text-[0.6875rem] px-2 py-0.5 border ${tone}`}>{st.label}</span>;
}

function CopyLink({ link }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — the link is shown as text either way */ }
  };
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-[0.6875rem] break-all bg-white border border-[#E8E4DC] p-2">{link}</code>
      <button type="button" onClick={copy} className="min-h-[36px] px-2 text-xs font-semibold border border-[#1A1815] whitespace-nowrap hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">{copied ? 'Copied' : 'Copy'}</button>
    </div>
  );
}

function PacketDetail({ row, onChanged, onClose }) {
  const [view, setView] = useState(null);
  const [error, setError] = useState('');
  const [banking, setBanking] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [removing, setRemoving] = useState(false);
  const [card, setCard] = useState(null);

  useEffect(() => {
    let alive = true;
    readPacket(row.packet_id).then((res) => {
      if (!alive) return;
      if (res.ok) { setView(res.view); setCard(rosterCardFromPacket(res.view)); } else setError(res.message);
    });
    return () => { alive = false; };
  }, [row.packet_id]);

  const reveal = async () => {
    setBusy(true);
    const res = await readBanking(row.packet_id);
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    setBanking(res.banking);
  };
  const decide = async (decision) => {
    setBusy(true); setOutcome('');
    const res = await reviewPacket(row.packet_id, decision, note, decision === 'approve' ? card : null);
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    setView(res.view);
    setOutcome(decision === 'approve'
      ? `Approved. ${res.view && res.view.roster ? 'Their card is live on Match a Preferred Provider.' : 'No public card was written.'} ${res.clinicianCreated ? 'The clinician roster has their row.' : ''} Grant app access from Team access when you are ready.`
      : 'Returned with your note. The colleague sees it the next time they open their packet.');
    onChanged();
  };
  const remove = async () => {
    setBusy(true);
    const res = await deletePacket(view);
    setBusy(false);
    if (!res.ok) { setError(res.message); setRemoving(false); return; }
    onChanged(); onClose();
  };

  return (
    <div className="border border-[#1A1815] bg-white p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-[#1A1815]">{row.applicant_name || row.email || 'Packet'} <StatusChip status={(view && view.status) || row.status} /></div>
        <button type="button" onClick={onClose} className={`${BTN}`}>Back to list</button>
      </div>
      {error && <p className="text-xs text-[#B85838]" role="alert">{error}</p>}
      {!view && !error && <p className="text-xs text-[#5A5751]">Opening…</p>}
      {view && (
        <>
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
            <div className="text-xs font-semibold text-[#1A1815] mb-1 flex items-center gap-1.5"><UiIcon name="lock" className="w-3 h-3" /> Direct deposit</div>
            {banking
              ? (banking.present
                ? <p className="text-sm text-[#1A1815]">{banking.bank_name} · {banking.account_type} · routing <b>{banking.routing_number}</b> · account <b>{banking.account_number}</b> <span className="text-xs text-[#5A5751]">(updated {formatDate(banking.updated_at)})</span></p>
                : <p className="text-xs text-[#5A5751]">No direct-deposit details were given.</p>)
              : <button type="button" onClick={reveal} disabled={busy} className={`${BTN}`}>Reveal banking details (this is logged)</button>}
          </div>
          <TlcOnboardingReadout view={view} />
          {view.status !== 'approved' && (
            <div className="border border-[#E8E4DC] bg-white p-3 space-y-2">
              {card && (
                <div className="space-y-2 pb-2 border-b border-[#F0ECE4]">
                  <div className="text-xs font-semibold text-[#1A1815]">Their card, as clients will see it (edit before approving)</div>
                  <RosterCardFields card={card} onChange={setCard} />
                  <RosterCardPreview card={card} />
                </div>
              )}
              <label htmlFor="review-note" className="block text-xs font-semibold text-[#1A1815]">A note to the colleague (required when returning)</label>
              <textarea id="review-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => decide('approve')} disabled={busy || view.status !== 'submitted'} className={`${BTN_GOOD}`}>Approve · add to roster</button>
                <button type="button" onClick={() => decide('return')} disabled={busy || !note.trim()} className={`${BTN_WARN}`}>Return with note</button>
              </div>
              {view.status !== 'submitted' && <p className="text-xs text-[#5A5751]">A packet can be approved once the colleague submits it.</p>}
            </div>
          )}
          {outcome && <p className="text-xs text-[#3F5226]" role="status">{outcome}</p>}
          <div className="text-right">
            {!removing
              ? <button type="button" onClick={() => setRemoving(true)} className="text-xs underline text-[#5A5751] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Remove this packet…</button>
              : <span className="inline-flex flex-wrap items-center gap-2 text-xs">Delete the packet, its files and banking details for good?
                  <button type="button" onClick={remove} disabled={busy} className={`${BTN_WARN}`}>Yes, remove</button>
                  <button type="button" onClick={() => setRemoving(false)} className={`${BTN}`}>Keep</button>
                </span>}
          </div>
        </>
      )}
    </div>
  );
}

export default function TlcOnboarding() {
  const roleState = useInstanceRole();
  const manager = canManageTeam(roleState);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [minted, setMinted] = useState(null);
  const [error, setError] = useState('');
  const [office, setOffice] = useState({ officeName: '', invites: [], packets: [] });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);

  const refresh = useCallback(async () => {
    if (!manager) return;
    const res = await listOffice();
    if (res.ok) setOffice(res);
  }, [manager]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!roleState.loaded) return <p className="text-sm text-[#5A5751]">Checking your access…</p>;
  if (!manager) {
    return (
      <div className="border border-[#E8E4DC] bg-white p-4">
        <p className="text-sm text-[#1A1815] font-semibold mb-1">Colleague onboarding is run by the office owner.</p>
        <p className="text-xs text-[#5A5751] leading-relaxed">Inviting a colleague and reviewing their packet is an owner/admin control.</p>
      </div>
    );
  }

  const mint = async () => {
    setError(''); setMinted(null); setBusy(true);
    const res = await mintInvite(email, note);
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    setMinted({ email: res.invite.email, link: buildOnboardLink(res.invite.token), expires: res.invite.expires_at });
    setEmail(''); setNote('');
    refresh();
  };
  const revoke = async (id) => { setBusy(true); await revokeInvite(id); setBusy(false); refresh(); };

  if (open) return <PacketDetail row={open} onChanged={refresh} onClose={() => setOpen(null)} />;

  // The areas of Onboarding, side by side on a second row (Darrell
  // 2026-09-10: "another tab slider for each section... any long scrolling
  // tabs"): invite (mint a link + the links still out), the packets, the roster.
  const areas = [
    { id: 'invite', label: 'Invite', icon: 'mail', render: () => (
      <div className="space-y-4">
      <div className="border border-[#1A1815] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-1">Invite a new colleague</div>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3">
          Enter their email to mint a one-time link. They open it in the TLC app, sign in (or create a login), and fill in the same intake the office has always used — license, insurance, paperwork, direct deposit, availability, clinical profile, and the three signed agreements. Their packet shows up under Packets as they go.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); mint(); } }}
            placeholder="colleague@email.com" aria-label="Colleague's email" type="email" className={INPUT} />
          <button type="button" onClick={mint} disabled={busy} className={`${BTN}`}>Create invite link</button>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="A note for your own list (optional) — e.g. LCSW, starts October" aria-label="Note" className={`${INPUT} mt-2`} />
        {error && <p className="text-xs text-[#B85838] mt-2" role="alert">{error}</p>}
        {minted && (
          <div className="mt-3 border border-[#5A6E3D] bg-[#F0F4EA] p-3">
            <div className="text-xs font-semibold text-[#3F5226] mb-1">Invite ready for {minted.email} · good until {formatDate(minted.expires)}</div>
            <p className="text-xs text-[#5A5751] leading-relaxed mb-2">Send them this link any way you already reach them (text, WhatsApp, in person). It opens the TLC app and binds the packet to whoever signs in with it.</p>
            <CopyLink link={minted.link} />
          </div>
        )}
      </div>

      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-2">Links out, not yet opened</div>
        {office.invites.length === 0 ? <p className="text-xs text-[#5A5751]">None waiting.</p> : (
          <ul className="divide-y divide-[#E6E0D6]">
            {office.invites.map((i) => (
              <li key={i.id} className="py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0"><div className="text-sm text-[#1A1815] truncate">{i.email}</div><div className="text-[0.6875rem] text-[#5A5751]">{i.note ? `${i.note} · ` : ''}sent {formatDate(i.created_at)} · expires {formatDate(i.expires_at)}</div></div>
                  <button type="button" onClick={() => revoke(i.id)} disabled={busy} aria-label={`Withdraw the invite for ${i.email}`} className={`${BTN_WARN}`}>Withdraw</button>
                </div>
                <CopyLink link={buildOnboardLink(i.token)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    ) },
    { id: 'packets', label: `Packets${office.packets.length ? ` · ${office.packets.length}` : ''}`, icon: 'pencil', render: () => (
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-2">Packets</div>
        {office.packets.length === 0 ? <p className="text-xs text-[#5A5751]">No one has opened a link yet. A packet appears here the moment a colleague starts.</p> : (
          <ul className="divide-y divide-[#E6E0D6]">
            {office.packets.map((p) => (
              <li key={p.packet_id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-[#1A1815] truncate">{p.applicant_name || p.email || 'New colleague'} {p.license_type ? <span className="text-xs text-[#5A5751]">· {p.license_type}</span> : null}</div>
                  <div className="text-[0.6875rem] text-[#5A5751]"><StatusChip status={p.status} /> {p.submitted_at ? ` · submitted ${formatDate(p.submitted_at)}` : ` · last touched ${formatDate(p.updated_at)}`}</div>
                </div>
                <button type="button" onClick={() => setOpen(p)} aria-label={`Open the packet for ${p.applicant_name || p.email}`} className={`${BTN}`}>Open</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    ) },
    { id: 'roster', label: 'Roster', icon: 'users', render: () => <RosterPanel /> },
  ];
  return (
    <div className="space-y-4">
      <SectionTabs variant="sub" sections={areas} ariaLabel="Onboarding areas" idBase="tlc-onboard" defaultId="invite" />

      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed flex items-start gap-1.5">
        <UiIcon name="lock" className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Built from the office&apos;s own hiring form ({TLC_ONBOARDING_SOURCE.formTitle}), now entirely in the app. Direct-deposit numbers sit apart from the packet and every reveal is logged; no password is ever asked for; documents live in a private vault and open only for you and the colleague. Colleague files are not client records — no PHI passes through here.
        </span>
      </p>
    </div>
  );
}
