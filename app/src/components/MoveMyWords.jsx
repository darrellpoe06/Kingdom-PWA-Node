// =============================================================================
// MoveMyWords — withdraw a lesson row you sent, or send its words elsewhere
// (DR-1137). Sits on every row of Your lessons and on the spoken-lesson rows
// of Your prompts (DR-1135).
// =============================================================================
import React, { useState } from 'react';
import { withdrawable, withdrawMyWords, moveMyWords, MOVE_ROUTES } from '../lib/withdraw-my-words.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border focus:outline focus:outline-2 focus:outline-[#B85838]';

const when = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
};

const REASONS = {
  'not-available-yet': 'Our own database has not taken this move yet (migration 0304). Until it does, put the words in the box and send them where they belong; the lesson row stays as it is.',
  'not-yours': 'Only the person who sent it can withdraw it.',
  'no-client': 'Sign in, then try again.',
};

/**
 * @param {{item:object, words:string, deps:{supabase:object}, onChanged?:Function}} props
 *   item  a lessonItems() entry (progressTags, withdrawn, withdrawnAt, spoken)
 *   words the words to move: the transcript for a spoken lesson, the text for a typed one
 */
export default function MoveMyWords({ item, words = '', deps = {}, onChanged }) {
  const [route, setRoute] = useState('poetech');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  if (!item) return null;
  const can = withdrawable(item);
  const label = (MOVE_ROUTES.find((r) => r.key === route) || {}).label || route;

  const withdraw = async (undo) => {
    setBusy(true);
    const r = await withdrawMyWords({ supabase: deps.supabase, id: item.id, undo });
    setBusy(false);
    if (!r.ok) { setSaid(REASONS[r.reason] || `Could not ${undo ? 'restore' : 'withdraw'} it: ${r.reason}.`); return false; }
    setSaid(undo ? 'Restored: the lesson door has it again.' : (words ? 'Withdrawn: nothing is built from it. Its words are below; choose where they go.' : 'Withdrawn: nothing is built from it. Its words still come back from Whisper; move them from here when they do.'));
    if (onChanged) onChanged();
    return true;
  };
  const move = async () => {
    if (!item.withdrawn) { const ok = await withdraw(false); if (!ok) return; }
    if (!words) { setSaid('Withdrawn. Its words have not come back yet; when they do, choose where they go from here.'); return; }
    if (moveMyWords({ words, route })) setSaid(`The words are in the box above with ${label} chosen. Read them, then press Send.`);
  };

  return (
    <div className="mt-1 border-l-2 border-[#8B6F47] pl-2" data-testid="move-my-words" data-withdrawn={item.withdrawn ? 'true' : 'false'}>
      {item.withdrawn && (
        <p className="text-[0.6875rem] text-[#8B6F47] font-semibold" style={SERIF} data-testid="words-withdrawn">
          Withdrawn{item.withdrawnAt ? ` ${when(item.withdrawnAt)}` : ''}: nothing is built from it. {words ? 'Its words are here; choose where they go.' : 'Its words still come back from Whisper; move them from here when they do.'}
        </p>
      )}
      {!item.withdrawn && !can && (
        <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF} data-testid="words-not-withdrawable">A lesson is already built or being decided from this one, so it stays. Its words can still go anywhere: put them in the box and choose.</p>
      )}
      {(can || item.withdrawn) && (
        <div className="flex gap-1.5 mt-1 flex-wrap items-center">
          {item.withdrawn
            ? <button type="button" data-testid="words-restore" disabled={busy} onClick={() => withdraw(true)} className={`${BTN} border-[#5A6E3D] text-[#5A6E3D]`}>Restore to lessons</button>
            : <button type="button" data-testid="words-withdraw" disabled={busy} onClick={() => withdraw(false)} className={`${BTN} border-[#8B6F47] text-[#8B6F47]`}>Withdraw from lessons</button>}
          <label className="text-[0.625rem] text-[#5A5751]" style={SERIF}>
            Move to{' '}
            <select data-testid="move-route" value={route} onChange={(e) => setRoute(e.target.value)} className="min-h-[44px] border border-[#E8E4DC] bg-white px-2 text-xs text-[#1A1815]">
              {MOVE_ROUTES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </label>
          <button type="button" data-testid="words-move" disabled={busy} onClick={move} className={`${BTN} border-[#1A1815] text-[#1A1815]`}>{item.withdrawn ? 'Put the words in the box there' : 'Move the words there'}</button>
        </div>
      )}
      {said && <p role="status" className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF} data-testid="move-said">{said}</p>}
    </div>
  );
}
