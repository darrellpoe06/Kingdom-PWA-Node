// =============================================================================
// RecordFreshness — the record says when it was last read, and reads again
// =============================================================================
// Darrell, 2026-11-10: "Are the latest numbers always available when clicked
// on record? If not fix it... latest numbers always... each time." (DR-1417)
//
// Mounted at the top of the class record. Three jobs, all on real events:
//   1. it asks for the record to be read again the moment it appears, and each
//      time the section holding it is opened (a <details> toggle);
//   2. it shows WHEN the figures below were read, from the sync's own stamp
//      (lib/learner-records-sync.js), never a clock of its own;
//   3. it says so plainly when the last try did not reach the record, and
//      keeps a Refresh button for the person who wants to be sure.
// Unknown is never drawn as fresh (DR-0076): before the first read lands it
// says the record is being read, not a time.
// =============================================================================
import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { getRecordsFreshness, subscribeRecordsFreshness, requestLearnerRecordsRefresh } from '../lib/learner-records-sync.js';

const clock = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
};

export function freshnessLine({ at = null, ok = null, reading = false } = {}) {
  if (ok === false) return at ? `Could not reach the record just now. These are the figures read at ${clock(at)}.` : 'Could not reach the record just now.';
  if (!at) return 'Reading the record now.';
  return `${reading ? 'Reading again. ' : ''}Latest figures, read from the record at ${clock(at)}.`;
}

export default function RecordFreshness() {
  const fresh = useSyncExternalStore(subscribeRecordsFreshness, getRecordsFreshness, getRecordsFreshness);
  const ref = useRef(null);
  useEffect(() => {
    requestLearnerRecordsRefresh();
    const holder = ref.current && typeof ref.current.closest === 'function' ? ref.current.closest('details') : null;
    if (!holder) return undefined;
    const onToggle = () => {
      if (holder.open) requestLearnerRecordsRefresh();
    };
    holder.addEventListener('toggle', onToggle);
    return () => holder.removeEventListener('toggle', onToggle);
  }, []);
  return (
    <div ref={ref} data-testid="record-freshness" className="flex flex-wrap items-center gap-2 mb-2">
      <p
        role="status"
        className={`text-[0.6875rem] ${fresh.ok === false ? 'text-[#B45309]' : 'text-[#5A5751]'}`}
        data-state={fresh.ok === false ? 'unreached' : fresh.at ? 'read' : 'reading'}
      >
        {freshnessLine(fresh)}
      </p>
      <button
        type="button"
        data-testid="record-refresh"
        onClick={requestLearnerRecordsRefresh}
        className="min-h-[44px] px-3 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] bg-white rounded-full focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
      >
        Refresh
      </button>
    </div>
  );
}
