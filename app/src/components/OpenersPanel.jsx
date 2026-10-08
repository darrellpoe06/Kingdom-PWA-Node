// =============================================================================
// OpenersPanel — register an opener, see what the header will offer, and read
// the record of every press
// =============================================================================
// The header button draws from `household_openers` and nothing else, so until a
// row exists there is no button (DR-0061). This is where the row is made. It is
// family-gated by RLS (migration 0254), not by this component.
//
// WHAT THIS PANEL DELIBERATELY DOES NOT COLLECT. No device address, no GPIO
// pin, no MQTT topic, no vendor URL. Those live in the NAS's own device map
// beside the service that drives the relay, because a browser that can read
// them can leak them. This panel records WHICH opener exists and WHICH adapter
// the NAS should use; the NAS resolves the rest locally.
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { OPENER_KINDS, openersFrom, describeOpener } from '../lib/openers.js';
import { fetchOpeners } from '../lib/openers-sync.js';

export default function OpenersPanel({ instanceId = null }) {
  const [rows, setRows] = useState(null);     // null = not asked yet
  const [presses, setPresses] = useState([]);
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [kind, setKind] = useState(OPENER_KINDS[0].kind);
  const [said, setSaid] = useState('');

  const reload = useCallback(async () => {
    const got = await fetchOpeners();
    setRows(got);
    const { data } = await supabase
      .from('opener_presses')
      .select('id, opener_id, at, result, reason')
      .order('at', { ascending: false })
      .limit(20);
    setPresses(data || []);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setSaid('Give the opener a name first.'); return; }
    if (!instanceId) { setSaid('This account is not in a household, so there is nowhere to register an opener.'); return; }
    const { error } = await supabase.from('household_openers').insert({
      instance_id: instanceId, name: name.trim(), place: place.trim(), kind,
    });
    // ARMED ON PURPOSE, NOT BY DEFAULT: the row lands with enabled = false
    // (migration 0254), so registering an opener does not put a button in the
    // header until somebody turns it on below.
    setSaid(error ? `Not registered: ${error.message}` : `Registered ${name.trim()}. It is OFF until you turn it on, so no button appears yet.`);
    if (!error) { setName(''); setPlace(''); }
    reload();
  };

  const arm = async (row, on) => {
    const { error } = await supabase.from('household_openers').update({ enabled: on }).eq('id', row.id);
    setSaid(error ? `Could not change ${row.name}: ${error.message}` : `${row.name} is now ${on ? 'ON — the header will offer it' : 'OFF — the header will not offer it'}.`);
    reload();
  };

  const ready = openersFrom(rows || []);

  return (
    <section data-testid="openers-panel" className="rounded-lg border border-[#E8E4DC] bg-white p-4 sm:p-6">
      <h3 className="text-base font-semibold text-[#1A1815]">House openers</h3>
      <p className="mt-1 text-sm text-[#5A5751]">
        The garage door and any other opener, offered in the header so a press is one hold away
        while a lesson is playing in the car. The header shows a button only for an opener that is
        registered here AND turned on, so nothing is ever drawn for a device the house cannot drive.
        The press is a hold, not a tap, and a press the house does not answer is reported as
        unanswered rather than as opened.
      </p>

      <h4 className="mt-5 text-sm font-semibold text-[#1A1815]">Registered</h4>
      {rows === null ? (
        <p data-testid="openers-unknown" className="mt-1 text-sm text-[#5A5751]">Asking the household record&hellip;</p>
      ) : rows.length === 0 ? (
        <p data-testid="openers-none" className="mt-1 text-sm text-[#5A5751]">
          No opener is registered for this house yet, so the header shows no button. Register one below.
        </p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">Every opener registered to this household, and whether the header offers it</caption>
          <thead>
            <tr className="text-left text-[#5A5751]">
              <th scope="col" className="py-1 pr-3 font-medium">Opener</th>
              <th scope="col" className="py-1 pr-3 font-medium">How the NAS drives it</th>
              <th scope="col" className="py-1 pr-3 font-medium">In the header</th>
              <th scope="col" className="py-1 font-medium">Turn it</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#E8E4DC]">
                <td className="py-1.5 pr-3">{describeOpener(openersFrom([{ ...r, enabled: true }])[0]) || r.name}</td>
                <td className="py-1.5 pr-3">{(OPENER_KINDS.find((k) => k.kind === r.kind) || {}).label || r.kind}</td>
                <td className="py-1.5 pr-3">{r.enabled && ready.some((o) => o.id === r.id) ? 'Offered' : 'Not offered'}</td>
                <td className="py-1.5">
                  <button
                    type="button"
                    onClick={() => arm(r, !r.enabled)}
                    className="min-h-[44px] px-3 rounded border border-[#E8E4DC] text-[#1A1815] hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    {r.enabled ? 'Off' : 'On'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4 className="mt-6 text-sm font-semibold text-[#1A1815]">Register an opener</h4>
      <form onSubmit={add} className="mt-2 grid gap-2 sm:grid-cols-4 sm:items-end">
        <label className="text-sm text-[#5A5751]">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Garage"
            className="mt-1 w-full min-h-[44px] rounded border border-[#E8E4DC] px-2 text-[#1A1815]" />
        </label>
        <label className="text-sm text-[#5A5751]">
          Where
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="House"
            className="mt-1 w-full min-h-[44px] rounded border border-[#E8E4DC] px-2 text-[#1A1815]" />
        </label>
        <label className="text-sm text-[#5A5751]">
          How the NAS drives it
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="mt-1 w-full min-h-[44px] rounded border border-[#E8E4DC] px-2 text-[#1A1815]">
            {OPENER_KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
          </select>
        </label>
        <button type="submit"
          className="min-h-[44px] px-4 rounded bg-[#1A1815] text-white hover:bg-[#3A3530] focus:outline focus:outline-2 focus:outline-[#B85838]">
          Register
        </button>
      </form>
      <p className="mt-2 text-xs text-[#5A5751]">
        {(OPENER_KINDS.find((k) => k.kind === kind) || {}).needs
          ? `The NAS will also need ${(OPENER_KINDS.find((k) => k.kind === kind) || {}).needs}, kept on the NAS and never in the app.`
          : null}
      </p>
      <p data-testid="openers-said" role="status" aria-live="polite" className="mt-2 text-sm text-[#1A1815]">{said}</p>

      <h4 className="mt-6 text-sm font-semibold text-[#1A1815]">Every press, kept</h4>
      {presses.length === 0 ? (
        <p className="mt-1 text-sm text-[#5A5751]">No press recorded yet.</p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">The twenty most recent presses of a household opener, and what came back</caption>
          <thead>
            <tr className="text-left text-[#5A5751]">
              <th scope="col" className="py-1 pr-3 font-medium">When</th>
              <th scope="col" className="py-1 pr-3 font-medium">Opener</th>
              <th scope="col" className="py-1 font-medium">What came back</th>
            </tr>
          </thead>
          <tbody>
            {presses.map((p) => (
              <tr key={p.id} className="border-t border-[#E8E4DC]">
                <td className="py-1.5 pr-3">{new Date(p.at).toLocaleString()}</td>
                <td className="py-1.5 pr-3">{((rows || []).find((r) => r.id === p.opener_id) || {}).name || p.opener_id}</td>
                <td className="py-1.5">{p.result}{p.reason ? ` — ${p.reason}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
