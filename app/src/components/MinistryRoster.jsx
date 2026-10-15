// =============================================================================
// MinistryRoster — who is on this team, for every team (DR-1052)
// =============================================================================
// Darrell, 2026-10-15, on the Choir tab: "Media?!!!!!!!!!! Other members of the
// other teams who should have access..."
//
// The church names 23 ministries. Before 0296 exactly one of them (the choir)
// had a roster, so a Media volunteer could not be ON the media team anywhere
// in the system. This is the room for the seat 0296 created — the smallest
// surface that makes the roster real rather than a table nothing reads, which
// is the built-correct-never-connected class this house keeps paying for.
//
// THE HONESTIES THIS KEEPS, the same two ChurchMinistries states in its own
// header (DR-0061 reality-trace, DR-0076):
//   1. Every line here is a real row read through RLS. An empty roster says
//      "nobody is on this team yet" — it never implies a team exists in some
//      other place the app cannot see.
//   2. A reader who cannot see a roster is TOLD WHY in plain words (the team
//      reads its own roster; owner/admin read them all), rather than being
//      shown a blank that looks like an empty team.
//
// WHO MAY EDIT is the database's answer, not this component's: 0296's
// ministry_members_write/update/delete policies are owner/admin only, and the
// add field is hidden for everyone else purely so the UI does not offer what
// the server will refuse. A refusal is still reported if it happens.
import React, { useEffect, useState } from 'react';
import {
  listMinistryMembers, addMinistryMember, removeMinistryMember,
  myChurchRole, canEditRoster,
} from '../lib/ministry-roster.js';

const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

export function MinistryRoster({ ministry, ministryName }) {
  const [members, setMembers] = useState(null);   // null = not read yet
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => listMinistryMembers(ministry).then(setMembers);
  useEffect(() => {
    let alive = true;
    myChurchRole().then((r) => { if (alive) setRole(r); });
    listMinistryMembers(ministry).then((rows) => { if (alive) setMembers(rows); });
    return () => { alive = false; };
  }, [ministry]);

  const mayEdit = canEditRoster(role);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    const r = await addMinistryMember(ministry, { displayName: name, teamRole });
    setBusy(false);
    if (r?.saved) { setName(''); setTeamRole(''); load(); return; }
    // Say which refusal it was. "Couldn't save" with no reason is the thing
    // that makes a person try the same thing twice.
    setMsg(r?.skipped === 'no-name' ? 'A name is needed.'
      : r?.skipped === 'signed-out' ? 'Sign in first.'
      : r?.skipped === 'no-church' ? 'This account has no church yet.'
      : r?.skipped === 'unknown-ministry' ? 'That ministry is not in the church list.'
      : 'The database refused that (only a director may change a roster).');
  };

  const remove = async (id) => {
    setBusy(true); setMsg('');
    const r = await removeMinistryMember(id);
    setBusy(false);
    if (r?.deleted) { load(); return; }
    setMsg('The database refused that (only a director may change a roster).');
  };

  if (members === null) {
    return <p className="text-xs text-[#5A5751]">Reading the roster…</p>;
  }

  return (
    <div className="space-y-2 border-t border-[#E8E4DC] pt-2">
      <h4 className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]">
        On this team
      </h4>

      {members.length === 0 ? (
        <p className="text-xs text-[#5A5751]">
          {mayEdit
            ? `Nobody is on ${ministryName} yet. Add the first person below.`
            : `Nobody is listed for ${ministryName} that you can see. A team's roster is read by that team and by the directors, so if you are on it and it is empty here, ask a director to add you.`}
        </p>
      ) : (
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-[#1A1815]">
                {m.displayName}
                <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] ml-2">{m.teamRole}</span>
                {!m.linked && (
                  <span className="text-[0.625rem] text-[#5A5751] ml-2" title="On the roster, no app account linked yet">
                    · no app account yet
                  </span>
                )}
              </span>
              {mayEdit && (
                <button type="button" disabled={busy} onClick={() => remove(m.id)}
                  className={`${BTN} text-[#B85838] hover:text-[#1A1815] disabled:opacity-50`}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {mayEdit && (
        <form onSubmit={add} className="space-y-1.5 pt-1">
          <label className="block">
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Add to {ministryName}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD}
              aria-label={`Name of the person to add to ${ministryName}`} placeholder="Their name" />
          </label>
          <label className="block">
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">What they do (optional)</span>
            <input value={teamRole} onChange={(e) => setTeamRole(e.target.value)} className={FIELD}
              aria-label={`What this person does on ${ministryName}`} placeholder="e.g. camera, driver, lead" />
          </label>
          <button type="submit" disabled={busy}
            className={`${BTN} bg-[#1A1815] text-white hover:bg-[#B85838] disabled:opacity-50`}>
            Add to the roster
          </button>
        </form>
      )}

      {msg && <p role="status" className="text-xs text-[#B85838]">{msg}</p>}
    </div>
  );
}

export default MinistryRoster;
