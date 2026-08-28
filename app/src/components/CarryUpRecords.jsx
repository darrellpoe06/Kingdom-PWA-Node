// =============================================================================
// CarryUpRecords — the strip that says what is on this phone only, and moves it
// =============================================================================
// Darrell, 2026-08-28: "need all data to be reflected in the apps... review
// comprehensive and complete review of the how the data must flow from one
// location to another without dead-ends."
//
// The dead-end, measured: conversationLog, maintenanceLog, rooms, equipment and
// room photos are written to localStorage and to nothing else. They exist in
// one browser on one phone.
//
// WHY THIS IS VISIBLE RATHER THAN AUTOMATIC. A silent background sweep would be
// faster to write and would leave the landlord with no idea whether his records
// are safe — which is the state he is in right now, and the actual complaint.
// The strip states the number BEFORE he presses, and states what landed and
// what did not AFTER. If the count is zero it renders nothing at all, so a door
// whose record is already whole shows no clutter.
//
// IT NEVER MOVES DEVICE-LOCAL DATA OUT. Nothing is deleted from the browser and
// nothing local is rewritten. This copies UP. If the upload fails halfway, the
// phone still holds everything it held a second earlier.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { planRescue, describePlan } from '../lib/rescue-local-records.js';
import { carryUpRecords, describeResult } from '../lib/rescue-upload.js';
import { loadPropertyNotes, getSessionUser } from '../lib/relationships-sync.js';

export default function CarryUpRecords({ rental }) {
  const [signedIn, setSignedIn] = useState(false);
  const [cloudNotes, setCloudNotes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSessionUser().then((u) => { if (!cancelled) setSignedIn(!!u); });
    return () => { cancelled = true; };
  }, []);

  // The cloud's current notes for this door, so a note already on the server is
  // never offered for rescue a second time. A failed read leaves this empty,
  // which over-offers rather than under-offers — the legacy_id check in
  // rescue-upload is the real guard against a duplicate, and it runs server-side
  // against what is actually filed.
  useEffect(() => {
    let cancelled = false;
    if (!signedIn || !rental?.id) { setCloudNotes([]); return; }
    loadPropertyNotes(rental.id).then((res) => {
      if (!cancelled && res && res.ok) setCloudNotes(res.data || []);
    });
    return () => { cancelled = true; };
  }, [signedIn, rental?.id]);

  const plan = useMemo(() => planRescue(rental, {
    instanceId: 'pending',              // the real one is resolved at upload time
    rentalUuid: rental?.remoteUuid || null,
    existingNotes: cloudNotes,
  }), [rental, cloudNotes]);

  // Nothing on this device only → nothing to say. The quiet case is the common
  // one and it should cost the landlord no screen space.
  if (!plan.ok || (!plan.total && !plan.deferred.length)) return null;

  const run = async () => {
    setBusy(true);
    try {
      const res = await carryUpRecords(rental, {
        rentalUuid: rental?.remoteUuid || null,
        existingNotes: cloudNotes,
      });
      setResult(res);
      // Re-read so a second press sees what the first one filed.
      if (signedIn && rental?.id) {
        const fresh = await loadPropertyNotes(rental.id);
        if (fresh && fresh.ok) setCloudNotes(fresh.data || []);
      }
    } catch (e) {
      setResult({ ok: false, reason: 'unexpected', carried: 0, error: e });
    } finally { setBusy(false); }
  };

  return (
    <div className="mb-2 border border-[#B85838] bg-[#FAF8F4] px-3 py-2">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
        On this device only
      </div>
      <p className="text-xs text-[#5A5751] mt-1">{describePlan(plan)}</p>
      {plan.deferred.map((d) => (
        <p key={d} className="text-[0.6875rem] text-[#5A5751] mt-1 italic">{d}</p>
      ))}
      {plan.total > 0 && (
        <button
          type="button"
          onClick={run}
          disabled={busy || !signedIn}
          className="mt-2 bg-[#1A1815] text-white py-2 px-3 text-[0.625rem] uppercase tracking-wider font-semibold min-h-[36px] hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {busy ? 'Carrying up…' : 'Carry up to the server'}
        </button>
      )}
      {!signedIn && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-1">
          Sign in to carry these up — they go to your account, not to a public place.
        </p>
      )}
      {result && (
        <p className={`text-[0.6875rem] mt-2 ${result.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
          {describeResult(result)}
        </p>
      )}
    </div>
  );
}
