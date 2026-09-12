// =============================================================================
// AccessRequests — the office queue, and my own asks (0211)
// =============================================================================
// Darrell 2026-09-11: "...for the office staff and tech team to give access
// based on BG and have an request and approval process for changing or giving
// access to the tabs that are staff and work related"
//
// Two panels on one surface, because they are two sides of the same row:
//   Mine    — what I asked for and where it stands. Anybody signed in.
//   The queue — what the house has asked for, and the decision. Office only,
//               and the SERVER decides that, not this screen.
//
// APPROVING GRANTS. There is no "approved" state that leaves somebody still
// looking at a locked tile: 0211 puts the grant inside the decision, through
// 0126's guarded door, and a grant that cannot happen makes the whole decision
// refuse. So this surface has no second button to press and nothing to forget.
//
// And it says the part people would otherwise discover: one yes opens every
// staff tab, because those tabs share one key today.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import UiIcon from './UiIcon.jsx';
import {
  myAccessRequests, withdrawAccessRequest, accessRequestQueue, decideAccessRequest,
  queueSummary, REQUEST_STATES, GRANT_IS_ALL_STAFF_TABS,
} from '../lib/access-requests.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_GOOD = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';

const day = (iso) => (iso ? String(iso).slice(0, 10) : '');
const stateOf = (s) => REQUEST_STATES[s] || { label: s, tone: 'plain' };

function StateChip({ status }) {
  const st = stateOf(status);
  const cls = st.tone === 'good' ? 'text-[#3F5226] border-[#5A6E3D]'
    : st.tone === 'waiting' ? 'text-[#B85838] border-[#B85838]'
      : 'text-[#5A5751] border-[#C9BFA8]';
  return (
    <span className={`text-[0.5625rem] uppercase tracking-wider font-semibold px-2 py-0.5 border ${cls}`}>{st.label}</span>
  );
}

// ---------------------------------------------------------------------------
// MINE
// ---------------------------------------------------------------------------
function MyRequests({ instanceId }) {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const res = await myAccessRequests(instanceId);
    setState({ loading: false, rows: res.rows, error: res.ok ? '' : res.message });
  }, [instanceId]);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">What you asked for</div>
      <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>Your requests</h3>
      <p className="text-xs text-[#5A5751] leading-relaxed mb-3" style={SERIF}>
        Every ask you have made, and exactly where it stands. Nothing here is hidden from you and nothing expires quietly —
        an open request is still with the office until somebody answers it.
      </p>
      {state.loading && <p className="text-xs text-[#5A5751]">Reading your requests…</p>}
      {state.error && <p className="text-xs text-[#7A1F1F]">{state.error}</p>}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <p className="text-sm text-[#1A1815]" style={SERIF}>
          You have not asked for anything. When you meet a tab that is not open to you, it carries the button — you will not have to come here to find it.
        </p>
      )}
      {state.rows.length > 0 && (
        <ul className="space-y-2">
          {state.rows.map((r) => (
            <li key={r.id} className="border border-[#E8E4DC] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-sm font-bold text-[#1A1815]">{r.surfaceLabel}</div>
                <StateChip status={r.status} />
              </div>
              <div className="text-[0.6875rem] text-[#5A5751] mt-0.5">asked {day(r.createdAt)}{r.decidedAt ? ` · answered ${day(r.decidedAt)}` : ''}</div>
              {r.reason && <p className="text-xs text-[#5A5751] mt-1" style={SERIF}>“{r.reason}”</p>}
              {r.decisionNote && <p className="text-xs text-[#1A1815] mt-1" style={SERIF}><b>The office said:</b> {r.decisionNote}</p>}
              {r.status === 'open' && (
                <button type="button" className={`${BTN} mt-2`}
                  onClick={async () => { const res = await withdrawAccessRequest(r.id); if (res.ok) refresh(); }}>
                  Withdraw it
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// THE QUEUE
// ---------------------------------------------------------------------------
function Queue({ instanceId }) {
  const [state, setState] = useState({ loading: true, rows: [], error: '', open: 0 });
  const [note, setNote] = useState({});
  const [busy, setBusy] = useState('');
  const [said, setSaid] = useState('');

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const res = await accessRequestQueue(instanceId);
    setState({ loading: false, rows: res.rows, open: res.open, error: res.ok ? '' : res.message });
  }, [instanceId]);
  useEffect(() => { refresh(); }, [refresh]);

  const decide = async (row, decision) => {
    setBusy(row.id); setSaid('');
    const res = await decideAccessRequest(row.id, decision, note[row.id] || '');
    setBusy('');
    if (!res.ok) { setSaid(res.message); return; }
    setSaid(decision === 'granted'
      ? `Granted. ${row.displayName || row.email || 'They'} can open the staff tabs now — nothing else to do.`
      : 'Recorded. Nothing was granted.');
    refresh();
  };

  const summary = useMemo(() => queueSummary(state.rows), [state.rows]);

  if (state.loading) return <p className="text-sm text-[#5A5751]">Opening the queue…</p>;
  if (state.error) {
    return (
      <section className="border border-[#E8E4DC] bg-white p-4">
        <p className="text-sm text-[#1A1815] font-semibold mb-1">The access queue did not open.</p>
        <p className="text-xs text-[#5A5751]">{state.error}</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#5A6E3D] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">The house is asking</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>Access requests</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed" style={SERIF}>
          {state.open === 0 ? 'Nothing is waiting on you.' : `${state.open} waiting on you.`}
          {' '}Saying yes grants the key on the spot — there is no second step, and no way for this list to say granted while somebody still meets a locked tile.
        </p>
        <p className="text-[0.6875rem] text-[#B85838] mt-2 leading-relaxed">{GRANT_IS_ALL_STAFF_TABS}</p>
        {summary.bySurface.length > 0 && (
          <p className="text-[0.6875rem] text-[#5A5751] mt-2">
            Most asked for: {summary.bySurface.slice(0, 4).map((x) => `${x.label} (${x.n})`).join(' · ')}
          </p>
        )}
        {said && <p className="text-xs text-[#3F5226] mt-2" style={SERIF}>{said}</p>}
      </section>

      {state.rows.length === 0 && (
        <p className="text-sm text-[#5A5751]" style={SERIF}>Nobody has asked for anything yet.</p>
      )}

      {state.rows.map((r) => (
        <section key={r.id} className="bg-white border border-[#E8E4DC] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-bold text-[#1A1815]">
              {r.displayName || r.email || 'A member'}
              <span className="font-normal text-[#5A5751]"> wants </span>
              {r.surfaceLabel}
            </div>
            <StateChip status={r.status} />
          </div>
          <div className="text-[0.6875rem] text-[#5A5751] mt-0.5 break-all">
            {r.email || 'no email on file'}{r.memberRole ? ` · ${r.memberRole}` : ''} · asked {day(r.createdAt)}
          </div>
          {r.reason && <p className="text-sm text-[#1A1815] mt-1" style={SERIF}>“{r.reason}”</p>}
          {r.alreadyGranted && r.status === 'open' && (
            <p className="text-[0.6875rem] text-[#3F5226] mt-1">They already hold this key — approving changes nothing, and refusing does not take it away.</p>
          )}
          {r.status !== 'open' && r.decisionNote && (
            <p className="text-xs text-[#5A5751] mt-1" style={SERIF}><b>Noted:</b> {r.decisionNote}</p>
          )}

          {r.status === 'open' && (
            <div className="mt-2 space-y-2">
              <label className="block text-xs text-[#5A5751]">
                A word back to them (optional)
                <input type="text" value={note[r.id] || ''} maxLength={500}
                  onChange={(e) => setNote({ ...note, [r.id]: e.target.value })}
                  className="w-full min-h-[36px] px-2 py-1 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy === r.id} className={`${BTN_GOOD}`} onClick={() => decide(r, 'granted')}>
                  {busy === r.id ? 'Working…' : 'Grant it'}
                </button>
                <button type="button" disabled={busy === r.id} className={`${BTN_WARN}`} onClick={() => decide(r, 'refused')}>
                  Not this one
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function AccessRequests({ instanceId = null, isOffice = false }) {
  const areas = [
    { id: 'mine', label: 'Your requests', icon: 'pencil', render: () => <MyRequests instanceId={instanceId} /> },
  ];
  if (isOffice) {
    areas.unshift({ id: 'queue', label: 'The queue', icon: 'users', render: () => <Queue instanceId={instanceId} /> });
  }
  return (
    <div className="space-y-4">
      <SectionTabs variant="sub" sections={areas} ariaLabel="Access requests" idBase="access-requests" defaultId={isOffice ? 'queue' : 'mine'} />
      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed flex items-start gap-1.5">
        <UiIcon name="lock" className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Who may decide is settled by the database, not by this screen — the office of this church, and nobody else, and never their own request.
          A grant is a row with a name and a time on it, and it can be taken back the same way it was given.
        </span>
      </p>
    </div>
  );
}

export { MyRequests, Queue };
