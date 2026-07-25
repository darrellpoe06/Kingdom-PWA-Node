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
import React, { useEffect, useMemo, useState } from 'react';
import supabase, { onAuthChange } from '../lib/supabase.js';
import DirectMessages from './DirectMessages.jsx';
import { publishDmPublicKey, loadDmContacts } from '../lib/direct-messages-sync.js';
import { getInstanceId } from '../lib/table-sync.js';
import {
  GROUP_ROSTERS, loadGroupMessages, sendGroupMessage, threadsByRoster,
} from '../lib/group-messages.js';

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
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className={FIELD} placeholder="Words that edify (Ephesians 4:29)…" />
      </label>
      <div className="flex justify-end">
        <button type="button" disabled={busy || !draft.trim()} onClick={send} className={`${BTN} bg-[#B85838] text-white disabled:opacity-50`}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default function Messages() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('direct');
  const [contacts, setContacts] = useState([]);

  useEffect(() => onAuthChange(setSession), []);
  useEffect(() => {
    if (!session) { setContacts([]); return; }
    // Publish this device's public key so others can encrypt TO us, then load
    // the people the server says we may message (list_dm_contacts mirrors
    // users_can_dm — the surface never invents access).
    publishDmPublicKey().catch(() => {});
    loadDmContacts().then(setContacts).catch(() => setContacts([]));
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
          {contacts.length === 0 && (
            <p className="text-xs text-[#5A5751]">
              No one to message yet. You can message the leaders of any space
              you belong to; a leader can invite you into their space from
              Admin → Role &amp; stewards.
            </p>
          )}
          <DirectMessages roster={contacts} title="Direct messages" />
        </>
      )}
      {tab === 'groups' && <GroupsPanel session={session} />}
    </div>
  );
}
