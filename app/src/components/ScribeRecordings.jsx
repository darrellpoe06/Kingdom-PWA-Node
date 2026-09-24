// =============================================================================
// ScribeRecordings — "Your recordings": every Scribe recording, where it
// stands, and the words (and minutes) the NAS wrote down (DR-0622)
// =============================================================================
// The chain the flow graph found ending in the dark: a meeting recorded here
// was transcribed on our own machines into a folder no screen ever read. This
// reads it back through the same-origin /scribe route with the family key the
// device already holds (lib/workflow-scribe.js fetchScribeSessions). A failed
// read is said with its reason; nothing is painted as done (DR-0076).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { fetchScribeSessions, fetchScribeWords, SCRIBE_STATES } from '../lib/workflow-scribe.js';
import { bridgeToken } from '../lib/nas-photos.js';

const box = 'rounded-xl border border-[#E5E0D8] bg-white p-4';
const BTN = 'text-xs font-semibold px-3 min-h-[44px] rounded-lg border border-[#1A1815] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const LIVE = { token: null, fetchImpl: null };

export default function ScribeRecordings({ refreshKey = 0, deps = LIVE }) {
  const [state, setState] = useState({ ok: false, sessions: [], reason: 'loading' });
  const [words, setWords] = useState({});
  const token = deps.token != null ? deps.token : bridgeToken();
  const opts = { token, fetchImpl: deps.fetchImpl || undefined };
  const load = useCallback(() => { fetchScribeSessions(opts).then(setState); }, [token, deps.fetchImpl]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load, refreshKey]);

  const read = async (id) => {
    setWords((w) => ({ ...w, [id]: { loading: true } }));
    const r = await fetchScribeWords(id, opts);
    setWords((w) => ({ ...w, [id]: r }));
  };

  return (
    <div className={box} data-testid="scribe-recordings">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-bold text-[#1A1815]">Your recordings · {state.sessions.length}</h3>
        <button type="button" onClick={load} className={`${BTN}`}>Refresh</button>
      </div>
      <p className="text-xs text-[#5A5751] mt-1">Each recording you uploaded, where it stands, and the words Whisper wrote on our own machines.</p>
      {!state.ok && state.reason !== 'loading' && (
        <p className="text-xs text-[#B85838] mt-2" data-testid="scribe-recordings-unavailable">
          Recordings could not be read ({state.reason}).{!token ? ' This device does not hold the family key yet; it provisions itself when you are signed in to the family.' : ''}
        </p>
      )}
      {state.ok && state.sessions.length === 0 && <p className="text-xs text-[#5A5751] mt-2">No recording uploaded yet.</p>}
      <ul className="mt-2 space-y-2">
        {state.sessions.map((s) => {
          const w = words[s.sessionId];
          const hasWords = s.state === 'transcribed' || s.state === 'minuted';
          return (
            <li key={s.sessionId} className="border border-[#E5E0D8] rounded-lg p-2" data-testid="scribe-recording">
              <p className="text-xs text-[#5A5751]">{s.kind || 'recording'} · {String(s.createdAt || '').slice(0, 16).replace('T', ' ')}</p>
              <p className="text-sm font-semibold text-[#1A1815]" data-testid="scribe-state">{SCRIBE_STATES[s.state] || s.state}</p>
              {hasWords && !w && <button type="button" className={`${BTN} mt-1`} onClick={() => read(s.sessionId)}>Read what was said</button>}
              {w && w.loading && <p className="text-xs text-[#5A5751] mt-1">Reading…</p>}
              {w && !w.loading && !w.ok && <p className="text-xs text-[#B85838] mt-1">Could not read the words ({w.reason}).</p>}
              {w && w.ok && (
                <div className="mt-1 space-y-1">
                  {w.minutes && <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words" data-testid="scribe-minutes"><strong>Minutes.</strong> {w.minutes}</p>}
                  <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words" data-testid="scribe-words">{w.transcript || 'No words came back for this recording.'}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
