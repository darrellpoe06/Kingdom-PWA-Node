// =============================================================================
// WhereThingsAre — what the landlord chose to tell this tenant about where
// things are in their home (the water shutoff, the breaker panel, the
// baseboard heat). Read-only; name and place only (DR-1598, 0338).
// =============================================================================
import React, { useEffect, useState } from 'react';
import { loadWhereThingsAre } from './staff-chat.js';

const serif = { fontFamily: '"Fraunces", serif' };

export default function WhereThingsAre({ tenancyId, load = loadWhereThingsAre }) {
  const [read, setRead] = useState({ state: 'loading', things: [] });
  useEffect(() => {
    let live = true;
    load(tenancyId).then((r) => {
      if (live) setRead(r.ok ? { state: 'ok', things: r.things } : { state: r.reason, things: [] });
    });
    return () => {
      live = false;
    };
  }, [tenancyId, load]);
  if (!tenancyId || (read.state === 'ok' && read.things.length === 0)) return null;
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="where-things-are">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">Where things are</h3>
      {read.state !== 'ok' && read.state !== 'loading' ? (
        <p className="text-xs text-[#9B2C1E]" style={serif} role="status">
          This list could not be read just now ({read.state}).
        </p>
      ) : (
        <ul className="list-none p-0 m-0">
          {read.things.map((t) => (
            <li key={t.id} className="text-sm py-1 border-b border-[#F0EDE6]" style={serif}>
              <span className="text-[#1A1815]">{t.name}</span>
              <span className="text-[#5A5751]"> · {t.location_note || 'ask your landlord'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
