// =============================================================================
// AccessMatrix — "Who sees what", on the People tab (DR-1198)
// =============================================================================
// The evaluated access matrix (access-matrix.js), read where the landlord
// invites people. One face at a time, chosen in a dropdown, so the page is
// not a wall of columns on a phone; every cell says what that face reads,
// what it writes, by what mechanism, and the family's hand on it. The
// 1099 worker's camera cell is the one Darrell asked about: any cameras, by
// name, not limited to what the door offers its tenants.
// =============================================================================
import React, { useState } from 'react';
import { ROLES, accessFor, widerThanTenant } from './access-matrix.js';

const serif = { fontFamily: '"Fraunces", serif' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-[#2F5D50]';

export default function AccessMatrix({ initialRole = 'worker' }) {
  const [role, setRole] = useState(initialRole);
  const rows = accessFor(role);
  const wider = widerThanTenant(role);
  const face = ROLES.find((r) => r.id === role) || ROLES[0];
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="access-matrix" data-role={role}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Who sees what</h3>
        <label className="text-[0.75rem] text-[#5A5751]">Face
          <select
            className={`ml-2 border border-[#E8E4DC] bg-white px-2 py-1 text-sm min-h-[36px] ${FOCUS}`}
            value={role} onChange={(e) => setRole(e.target.value)} data-testid="access-matrix-role"
          >
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
      </div>
      <p className="text-[0.75rem] text-[#6B665E] leading-snug mb-2" style={serif}>
        What {face.label.toLowerCase()} reads and writes at this door, by what road, and your hand on each — the database enforces every line; this page is the family&rsquo;s plain reading of it.
      </p>
      {wider.length > 0 && (
        <p className="text-[0.75rem] text-[#1A1815] leading-snug mb-2" style={serif} data-testid="access-matrix-wider">
          Where you can give this face more than the door&rsquo;s tenant gets: {wider.map((w) => w.label.toLowerCase()).join('; ')}.
        </p>
      )}
      <ul className="divide-y divide-[#F0EDE6]" data-testid="access-matrix-rows">
        {rows.map((r) => (
          <li key={r.id} className="py-2" data-testid={`access-row-${r.id}`}>
            <div className="text-[0.8125rem] text-[#1A1815]" style={serif}>{r.label}</div>
            <dl className="text-[0.75rem] text-[#5A5751] grid grid-cols-[6rem_1fr] gap-x-2 gap-y-0.5 mt-0.5" style={serif}>
              <dt>Reads</dt><dd className="text-[#1A1815]">{r.reads || 'none'}</dd>
              <dt>Writes</dt><dd className="text-[#1A1815]">{r.writes || 'none'}</dd>
              {r.by && (<><dt>By</dt><dd>{r.by}</dd></>)}
              {r.hand && (<><dt>Your hand</dt><dd className="text-[#2F5D50]">{r.hand}</dd></>)}
              {r.wall && (<><dt>The wall</dt><dd className="font-mono text-[0.6875rem]">{r.wall}</dd></>)}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
