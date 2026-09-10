// =============================================================================
// TlcLaunchBoard — the TLCTS LAUNCH tracker, live inside the app (DR-0344)
// =============================================================================
// The launch tasks (lib/tlc-launch-plan.js, the sheet's own rows) by phase,
// each with the office's status held in tlc_office_tasks (0188) so every
// device sees the same board. Tap a status to change it; the row saves
// through RLS as the signed-in member. Signed out, or without an office, the
// board still reads (the seed statuses) and says why it cannot save.
import React, { useCallback, useEffect, useState } from 'react';
import { launchTasksByPhase, launchProgress, LAUNCH_STATUSES, LAUNCH_STATUS_LABEL } from '../lib/tlc-launch-plan.js';
import { loadLaunchStatuses, setLaunchStatus } from '../lib/tlc-launch-sync.js';

const CHIP = (on, tone) => `min-h-[36px] px-2.5 py-1 text-xs border focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? (tone === 'done' ? 'bg-[#5A6E3D] border-[#5A6E3D] text-white' : tone === 'in-progress' ? 'bg-[#B85838] border-[#B85838] text-white' : 'bg-[#1A1815] border-[#1A1815] text-white') : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`;

export default function TlcLaunchBoard() {
  const [statuses, setStatuses] = useState({});
  const [msg, setMsg] = useState('');
  const [canSave, setCanSave] = useState(true);
  const refresh = useCallback(async () => {
    const res = await loadLaunchStatuses();
    const flat = {};
    for (const [k, v] of Object.entries(res.statuses || {})) flat[k] = v.status;
    setStatuses(flat);
    if (!res.ok) { setCanSave(false); setMsg(res.reason === 'no-instance' ? 'Sign in to the office to update the board; the seed plan shows meanwhile.' : (res.message || 'The board could not be read.')); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const change = async (key, status) => {
    const prev = statuses;
    setStatuses({ ...statuses, [key]: status });
    const res = await setLaunchStatus(key, status);
    if (!res.ok) { setStatuses(prev); setMsg(res.message || 'That change did not save.'); }
    else setMsg('');
  };

  const phases = launchTasksByPhase(statuses);
  const p = launchProgress(statuses);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-bold text-[#1A1815]">TLCTS Launch · {p.done} of {p.total} done · {p.pct}%</div>
        {msg && <span className="text-xs text-[#B85838]" role="status">{msg}</span>}
      </div>
      <div className="h-1.5 bg-[#E8E4DC]"><div className="h-full bg-[#5A6E3D]" style={{ width: `${p.pct}%` }} /></div>
      {phases.map((ph) => (
        <section key={ph.phase} className="border border-[#E8E4DC] bg-white p-3">
          <h5 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">{ph.phase}</h5>
          <ul className="divide-y divide-[#F0ECE4]">
            {ph.tasks.map((t) => (
              <li key={t.key} className="py-2">
                <div className="text-sm text-[#1A1815]">{t.task}</div>
                <div className="text-[0.6875rem] text-[#5A5751] mb-1.5">{t.owner}{t.cadence ? ` · ${t.cadence}` : ''}{t.due ? ` · due ${t.due}` : ''}</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Status for ${t.task}`}>
                  {LAUNCH_STATUSES.map((s) => (
                    <button key={s} type="button" disabled={!canSave} aria-pressed={t.status === s} onClick={() => change(t.key, s)} className={CHIP(t.status === s, s)}>{LAUNCH_STATUS_LABEL[s]}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
