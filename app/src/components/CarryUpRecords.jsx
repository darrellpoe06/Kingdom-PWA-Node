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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { planRescue, describePlan } from '../lib/rescue-local-records.js';
import { carryUpRecords, describeResult, loadCarriedLegacyIds } from '../lib/rescue-upload.js';
import { loadPropertyNotes, getSessionUser } from '../lib/relationships-sync.js';

export default function CarryUpRecords({ rental }) {
  const [signedIn, setSignedIn] = useState(false);
  const [cloudNotes, setCloudNotes] = useState([]);
  const [carried, setCarried] = useState({});
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
  const slug = rental?.id || null;
  const uuid = rental?.remoteUuid || null;

  const readServer = useCallback(async () => {
    if (!signedIn || !slug) return { notes: [], carried: {} };
    const [notes, ids] = await Promise.all([
      loadPropertyNotes(slug),
      loadCarriedLegacyIds(slug, uuid),
    ]);
    return { notes: notes && notes.ok ? (notes.data || []) : [], carried: ids || {} };
  }, [signedIn, slug, uuid]);

  useEffect(() => {
    let cancelled = false;
    if (!signedIn || !slug) { setCloudNotes([]); setCarried({}); return; }
    readServer().then((r) => {
      if (cancelled) return;
      setCloudNotes(r.notes);
      setCarried(r.carried);
    });
    return () => { cancelled = true; };
  }, [signedIn, slug, readServer]);

  const plan = useMemo(() => planRescue(rental, {
    instanceId: 'pending',              // the real one is resolved at upload time
    rentalUuid: uuid,
    existingNotes: cloudNotes,
    carried,                            // so a carried record stops counting as local
  }), [rental, uuid, cloudNotes, carried]);

  // Nothing on this device only → nothing to say. The quiet case is the common
  // one and it should cost the landlord no screen space.
  //
  // UNLESS HE JUST PRESSED IT. A test caught this: after a successful carry the
  // plan is empty, so the strip disappeared — taking the confirmation with it.
  // He presses a button, the whole panel vanishes, and nothing tells him
  // whether his records went anywhere. The result outlives the plan that
  // produced it; the strip closes itself the next time the record is opened.
  if (!result && (!plan.ok || (!plan.total && !plan.deferred.length))) return null;

  const run = async () => {
    setBusy(true);
    try {
      const res = await carryUpRecords(rental, {
        rentalUuid: rental?.remoteUuid || null,
        existingNotes: cloudNotes,
      });
      setResult(res);
      // Re-read so the strip reflects what just landed — otherwise it goes on
      // reporting carried records as device-only, which is the defect this
      // whole re-read exists to prevent.
      const fresh = await readServer();
      setCloudNotes(fresh.notes);
      setCarried(fresh.carried);
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
