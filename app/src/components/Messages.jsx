// =============================================================================
// Messages — the app-wide messaging surface (encrypted 1:1 + group threads).
// =============================================================================
// Declared by Darrell 2026-07-25 ("how can he message me whenever encrypted?"
// -> "encryption"): a member — his brother — opens ONE obvious place to reach
// him privately. Before this surface, 1:1 DMs existed but were mounted only
// inside Bus Ministry (a church staff corner a new member never finds), and
// the group-messages rail (0117, DR-0231 P1) had NO surface at all. This
// mounts both where every signed-in user lives:
//
//   · Direct — 1:1 threads, END-TO-END ENCRYPTED (lib/dm-encryption.js):
//     device-held ECDH keys, AES-256-GCM bodies, the server stores ciphertext.
//     Who may DM whom stays server-enforced (users_can_dm, 0096): anyone may
//     message a leader, a leader may message anyone in their instance,
//     roster<->roster. The contact list is list_dm_contacts (0118) — the same
//     grants, materialized.
//   · Groups — the (instance, roster) threads of 0117: Everyone / Choir /
//     Bus / Security. Group bodies are NOT yet E2E (multi-party key agreement
//     is a follow-up, stated honestly in the UI) — RLS remains their gate.
//
// Word-first: "go and tell him his fault between thee and him alone"
// (Matthew 18:15) for the 1:1; "Let no corrupt communication proceed out of
// your mouth, but that which is good to the use of edifying" (Ephesians 4:29)
// over every thread.
// A11y: labelled inputs, visible #B85838 focus outlines, aria-live threads.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import supabase, { onAuthChange } from '../lib/supabase.js';
import DirectMessages, { autoGrow } from './DirectMessages.jsx';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import UiIcon from './UiIcon.jsx';
import { publishDmPublicKey, loadDmContacts, loadDmInvited } from '../lib/direct-messages-sync.js';
import { getInstanceId } from '../lib/table-sync.js';
import {
  GROUP_ROSTERS, loadGroupMessages, sendGroupMessage, threadsByRoster,
} from '../lib/group-messages.js';
import { listMyAdminInstances, inviteToSpace, isInviteEmail } from '../lib/member-roles.js';
import { listPendingClaims, confirmInvite } from '../lib/family-invite.js';
import { canAddContacts, inviteShareText, smsHrefTo, telHref, isLikelyPhone, installPromptText } from '../lib/messages-invite.js';
import { readContacts, upsertContact, removeContact } from '../lib/saved-contacts.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';

const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
};

function GroupsPanel({ session }) {
  const [instanceId, setInstanceId] = useState(null);
  const [roster, setRoster] = useState('members');
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const taRef = useRef(null);

  // Speak instead of type + long-input growth (Darrell 2026-07-27) — the one
  // shared dictation primitive (push-to-end, 5-min brake, honest fallback).
  const mic = useVoiceDictation({
    onTranscript: (t) => setDraft((d) => (d ? `${d} ${t}` : t)),
  });
  useEffect(() => { autoGrow(taRef.current); }, [draft]);

  useEffect(() => { getInstanceId().then(setInstanceId).catch(() => setInstanceId(null)); }, []);

  const refresh = React.useCallback(() => {
    if (!instanceId) return;
    loadGroupMessages(supabase, instanceId).then((r) => { if (r.ok) setRows(r.rows); });
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId) return undefined;
    refresh();
    const channel = supabase
      .channel('group_messages-surface')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages' }, refresh)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [instanceId, refresh]);

  const threads = useMemo(() => threadsByRoster(rows, session?.user?.id), [rows, session]);
  const convo = threads[roster] || [];

  const send = async () => {
    if (!draft.trim() || !instanceId) return;
    setBusy(true);
    const r = await sendGroupMessage(supabase, {
      instanceId, roster, body: draft,
      senderUserId: session?.user?.id,
      senderName: session?.user?.email?.split('@')[0] || 'Someone',
    });
    setBusy(false);
    if (r.ok) { setDraft(''); setErr(''); refresh(); }
    else setErr(r.reason === 'not-in-group' ? "You're not on this roster — ask a leader to add you." : `Message not sent (${r.reason}). Try again.`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {GROUP_ROSTERS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => { setRoster(g.key); setErr(''); }}
            className={`${BTN} border ${roster === g.key ? 'border-[#1A1815] text-[#1A1815]' : 'border-[#C9BFA8] text-[#5A5751]'}`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <p className="text-[0.625rem] text-[#5A5751]">
        Group threads are private to the roster (server-enforced), not yet end-to-end encrypted — that follow-up is tracked.
      </p>
      {err && <p className="text-xs text-[#991B1B]" role="alert">{err}</p>}
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 max-h-72 overflow-y-auto space-y-2" aria-live="polite">
        {convo.length === 0 && <p className="text-xs text-[#5A5751]">No messages in this thread yet.</p>}
        {convo.map((m) => (
          <div key={m.id} className={`text-sm ${m.mine ? 'text-right' : 'text-left'}`}>
            {!m.mine && <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{m.senderName}</div>}
            <div className={`inline-block px-3 py-1.5 max-w-[85%] ${m.mine ? 'bg-[#1A1815] text-white' : 'bg-white border border-[#E8E4DC] text-[#1A1815]'}`}>
              {m.body}
            </div>
            <div className="text-[0.5625rem] text-[#5A5751] mt-0.5">{fmtTime(m.atIso)}</div>
          </div>
        ))}
      </div>
      <label className="block">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Message the group</span>
        <textarea ref={taRef} value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className={`${FIELD} overflow-y-auto`} placeholder="Words that edify (Ephesians 4:29)…" />
      </label>
      {mic.error && <p className="text-[0.625rem] text-[#B85838]" role="status">{mic.error}</p>}
      <div className="flex items-center justify-between gap-2">
        {mic.supported ? (
          <button
            type="button"
            onClick={mic.toggle}
            aria-pressed={mic.listening}
            aria-label={mic.listening ? 'Stop voice input' : 'Speak your message instead of typing'}
            className={`${BTN} border-2 ${mic.listening ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white'}`}
          >
            {mic.listening ? <><UiIcon name="stop" /> Stop</> : <><UiIcon name="mic" /> Speak</>}
          </button>
        ) : <span />}
        <button type="button" disabled={busy || !draft.trim()} onClick={send} className={`${BTN} bg-[#B85838] text-white disabled:opacity-50`}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

// Add a contact FROM Messages (Darrell 2026-07-27: "this location makes the
// most sense... begin to text anyone and that could promote and prompt them to
// install the PoeTech App"). Reuses the proven Admin invite lane exactly
// (inviteToSpace; two-party confirm per DR-0187, now surfaced here too) and
// turns the invite into a ready-to-send text (share sheet / sms / copy).
function AddContact({ onInvited }) {
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [share, setShare] = useState({ text: '', link: '', phone: '' });
  const [pending, setPending] = useState([]);
  const [saved, setSaved] = useState([]);

  const refreshSaved = () => { try { setSaved(readContacts()); } catch { setSaved([]); } };

  useEffect(() => {
    listMyAdminInstances().then((s) => { setSpaces(s); if (s[0]) setSpaceId(s[0].instanceId); }).catch(() => setSpaces([]));
    listPendingClaims().then((r) => setPending(r.ok ? r.claims : [])).catch(() => {});
    refreshSaved();
  }, []);

  // Keep every added contact in the returnable address book (name + phone +
  // email), so you can go back to them, text/call/email again, and complete
  // access later. Deterministic timestamp guard for sandboxes without a clock.
  const keepContact = (status) => {
    let at;
    try { at = new Date().toISOString(); } catch { at = ''; }
    upsertContact(undefined, { name, phone, email, spaceId: space?.instanceId || '', spaceName: space?.displayName || '', status }, at);
    refreshSaved();
  };

  if (!canAddContacts(spaces)) {
    return (
      <p className="text-[0.625rem] text-[#5A5751]">
        Contacts here mirror your spaces: you can message the leaders of any space you belong to.
        A leader can add new people; ask them for an invite.
      </p>
    );
  }

  const space = spaces.find((s) => s.instanceId === spaceId) || spaces[0];

  const doInvite = async () => {
    const hasEmail = isInviteEmail(email);
    const hasPhone = isLikelyPhone(phone);
    const hasName = name.trim().length > 0;
    // Email is the account KEY — an access GRANT is matched to a person by the
    // email they sign in with. Phone is contact data that DELIVERS the invite
    // over their own texting app (no gateway). A NAME is just who they are — so
    // you can save and go back to them even before there's a way to reach them.
    if (!hasEmail && !hasPhone && !hasName) { setMsg('Enter at least a name, a cellphone, or an email.'); return; }

    if (!hasEmail && !hasPhone) {
      // Name only: keep the contact so you can return and fill in how to reach them.
      keepContact('saved');
      setMsg(`Saved ${name.trim()}. Add a cellphone to text them, or an email to give access.`);
      setName('');
      return;
    }

    if (!hasEmail && hasPhone) {
      // Cellphone-first: no key yet, so no access grant — save the contact and
      // text the app prompt to that number now; the grant completes once you add
      // their email (a later Add merges onto the same saved person).
      keepContact('texted');
      const t = installPromptText({ spaceName: space?.displayName || '' });
      setShare({ text: t.text, link: '', phone });
      setMsg(`Saved${hasName ? ` ${name.trim()}` : ''} — ready to text ${phone}. Add their email whenever to give access.`);
      setName('');
      return;
    }

    setMsg('Inviting…'); setShare({ text: '', link: '', phone: hasPhone ? phone : '' });
    const r = await inviteToSpace(space?.instanceType, email, 'member');
    if (!r.ok) { setMsg(`Couldn't invite (${r.reason || 'error'}).`); return; }
    keepContact('invited');
    const kind = r.kind === 'church' ? 'church' : 'claim';
    const t = inviteShareText({ kind, link: r.link || '', spaceName: space?.displayName || '' });
    setEmail(''); setName('');
    setMsg(kind === 'church'
      ? `Invited ${r.email}. They get access the next time they sign in — text them the app below.`
      : `Invite ready for ${r.email}. Text them the one-time link below, then confirm them here once they open it.`);
    if (t.ok) setShare({ text: t.text, link: r.link || '', phone: hasPhone ? phone : '' });
    listPendingClaims().then((p) => setPending(p.ok ? p.claims : [])).catch(() => {});
  };

  const forgetContact = (id) => { removeContact(undefined, id); refreshSaved(); };

  const doShare = async () => {
    try {
      if (navigator.share) { await navigator.share({ text: share.text }); return; }
    } catch { /* fall through to copy */ }
    try { await navigator.clipboard.writeText(share.text); setMsg('Invite text copied — paste it into any message.'); } catch { /* no-op */ }
  };

  const doConfirm = async (inviteId) => {
    const r = await confirmInvite(inviteId);
    if (r.ok) {
      setMsg('Confirmed — they can message and be messaged now.');
      listPendingClaims().then((p) => setPending(p.ok ? p.claims : [])).catch(() => {});
      onInvited && onInvited();
    }
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 space-y-2">
      <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Add a contact</h3>
      {spaces.length > 1 && (
        <label className="block">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Into which space</span>
          <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className={FIELD}>
            {spaces.map((s) => <option key={s.instanceId} value={s.instanceId}>{s.displayName || s.instanceType || s.instanceId}</option>)}
          </select>
        </label>
      )}
      <div className="space-y-1.5">
        <input
          type="text" value={name} placeholder="Name" aria-label="Name of the person to add"
          onChange={(e) => setName(e.target.value)} className={FIELD}
        />
        <input
          type="tel" inputMode="tel" value={phone} placeholder="Cellphone (optional) — e.g. 217-555-0142" aria-label="Cellphone of the person to add"
          onChange={(e) => setPhone(e.target.value)} className={FIELD}
        />
        <div className="flex gap-2">
          <input
            type="email" value={email} placeholder="Email — gives them access" aria-label="Email of the person to add"
            onChange={(e) => setEmail(e.target.value)} className={FIELD}
          />
          <button type="button" onClick={doInvite} className={`${BTN} bg-[#B85838] text-white shrink-0`}>Add</button>
        </div>
        <p className="text-[0.5625rem] text-[#5A5751] leading-snug">
          A name is all you need to save a contact. Email is how their access is matched when they sign in;
          a cellphone alone lets you text them the app now — add their email whenever to give access.
        </p>
      </div>
      {msg && <p className="text-xs text-[#1A1815]" role="status">{msg}</p>}
      {share.text && (
        <div className="space-y-1.5">
          <p className="text-xs text-[#1A1815] bg-white border border-[#E8E4DC] p-2 break-words">{share.text}</p>
          <div className="flex flex-wrap gap-1.5">
            <a href={smsHrefTo(share.phone, share.text)} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>{share.phone ? 'Text it to them' : 'Text it'}</a>
            {share.phone && telHref(share.phone) && <a href={telHref(share.phone)} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>Call</a>}
            <button type="button" onClick={doShare} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>Share / copy</button>
          </div>
        </div>
      )}
      {pending.length > 0 && (
        <div className="space-y-1">
          <p className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Awaiting your confirmation (they opened their link)</p>
          {pending.map((c) => (
            <div key={c.inviteId} className="flex items-center justify-between gap-2 text-xs text-[#1A1815]">
              <span>{c.email || c.claimantName || 'Pending person'}</span>
              <button type="button" onClick={() => doConfirm(c.inviteId)} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>Confirm</button>
            </div>
          ))}
        </div>
      )}
      {/* SAVED CONTACTS — the returnable address book (Darrell 2026-07-28): a
          contact you added is KEPT here with its name; go back to text, call,
          email, or complete access. */}
      {saved.length > 0 && (
        <div className="space-y-1.5 border-t border-[#E8E4DC] pt-2">
          <p className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Saved contacts</p>
          {saved.map((c) => {
            // Honest status: "texted" is delivery, not access — a phone-only
            // contact has NO grant until their email is added (review GAP 1).
            const STATUS = { texted: 'texted the app · no access yet', invited: 'invite sent', saved: 'saved' };
            return (
              <div key={c.id} className="bg-white border border-[#E8E4DC] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1A1815]">{c.name || c.phone || c.email || 'Contact'}</span>
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D]">{STATUS[c.status] || c.status}</span>
                </div>
                <div className="text-[0.625rem] text-[#5A5751] mt-0.5">
                  {c.phone ? <a href={telHref(c.phone)} className="underline text-[#B85838]">{c.phone}</a> : 'no cellphone'}
                  {' · '}
                  {c.email ? <a href={`mailto:${c.email}`} className="underline text-[#B85838]">{c.email}</a> : 'no email'}
                  {c.spaceName ? <span> · {c.spaceName}</span> : null}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {c.phone && <a href={smsHrefTo(c.phone, installPromptText({ spaceName: c.spaceName || '' }).text)} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>Text the app</a>}
                  {c.phone && <a href={telHref(c.phone)} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>Call</a>}
                  {c.email && <a href={`mailto:${c.email}`} className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>Email</a>}
                  {!c.email && (
                    <button type="button" onClick={() => { setName(c.name || ''); setPhone(c.phone || ''); setEmail(''); setMsg(`Add ${c.name || 'their'} email above, then Add — it completes their access.`); }} className={`${BTN} border border-[#5A6E3D] text-[#5A6E3D]`}>Give access</button>
                  )}
                  <button type="button" onClick={() => forgetContact(c.id)} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* The old footer blamed the encryption key; the real gate is membership
          (list_dm_contacts projects instance_members — 2026-07-27 review GAP 1).
          Say the truth: email joins, phone only delivers, pending is visible. */}
      <p className="text-[0.625rem] text-[#5A5751]">
        People become messageable when you share a space: adding their <strong>email</strong> gives
        access, and they appear the first time they sign in with it (until then they
        show under &ldquo;Invited&rdquo;). A cellphone alone can&rsquo;t identify an account —
        by design, phone numbers are never account keys here — it only texts them the app.
      </p>
    </div>
  );
}

export default function Messages() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('direct');
  const [contacts, setContacts] = useState([]);
  const [invited, setInvited] = useState([]);

  useEffect(() => onAuthChange(setSession), []);
  useEffect(() => {
    if (!session) { setContacts([]); setInvited([]); return; }
    // Publish this device's public key so others can encrypt TO us, then load
    // the people the server says we may message (list_dm_contacts mirrors
    // users_can_dm — the surface never invents access) AND the open invites
    // (list_dm_invited, 0124) so a person on their way is visible-but-pending,
    // never an empty world.
    publishDmPublicKey().catch(() => {});
    loadDmContacts().then(setContacts).catch(() => setContacts([]));
    loadDmInvited().then(setInvited).catch(() => setInvited([]));
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h2 className="text-xl font-medium text-[#1A1815] mb-2">Messages</h2>
        <p className="text-sm text-[#5A5751]">Sign in to send and receive messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-xl font-medium text-[#1A1815]">Messages</h2>
        <p className="text-xs text-[#5A5751] mt-1">
          Direct messages are end-to-end encrypted between your devices — the
          server keeps only ciphertext it cannot read. Your key lives on this
          device; messages unlock where your key lives.
        </p>
      </div>
      <div className="flex gap-1.5">
        {[['direct', 'Direct'], ['groups', 'Groups']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`${BTN} border ${tab === id ? 'border-[#1A1815] text-[#1A1815]' : 'border-[#C9BFA8] text-[#5A5751]'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'direct' && (
        <>
          {contacts.length === 0 && invited.length === 0 && (
            <p className="text-xs text-[#5A5751]">
              No one to message yet — add someone below with their email, or
              ask a leader of your space to add you.
            </p>
          )}
          <DirectMessages roster={contacts} invited={invited} title="Direct messages" />
          <AddContact onInvited={() => {
            loadDmContacts().then(setContacts).catch(() => {});
            loadDmInvited().then(setInvited).catch(() => {});
          }} />
        </>
      )}
      {tab === 'groups' && <GroupsPanel session={session} />}
    </div>
  );
}
