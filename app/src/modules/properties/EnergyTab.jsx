// =============================================================================
// EnergyTab — what this door's meter said, from the utility's own file
// =============================================================================
// Darrell, 2026-10-18: "I want my home energy system to be incorporated into
// the PoeTech App... evaluate the DRs..."  The record is DR-1098.
//
// REALITY-TRACE (DR-0061), before the code, as the rule requires:
//   Reads property_energy_imports and property_energy_hourly() (0302), keyed
//   by rentals.id. Writes through cloud.saveEnergyImport / deleteEnergyImport,
//   RLS-scoped to owner, admin and member: a viewer sees nothing here, because
//   hourly reads show when the house stands empty.
//   NOTHING IS PAINTED. Every number is counted from the stored readings by
//   reckonEnergy(); a figure that cannot be counted (a rate when the file had
//   no cost, an always-on draw from fewer than seven whole days) says why it is
//   missing instead of showing a zero. The file is parsed ON THIS DEVICE and
//   shown before anything is saved, so a person sees what will be filed.
//
// The same tab serves our own home and every rental with its own meter: "like
// all our properties."
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  parseEnergyFile, reckonEnergy, buildImportRow, buildReadingRows, readingFromRow,
  digestText, ENERGY_LIMITS, REFUSAL,
} from './energy.js';
import {
  loadEnergyImports, loadEnergyHours, saveEnergyImport, deleteEnergyImport,
} from './cloud.js';

const DEFAULT_API = {
  loadImports: loadEnergyImports,
  loadHours: loadEnergyHours,
  save: saveEnergyImport,
  remove: deleteEnergyImport,
};

const WHY = {
  'not-enabled-yet': 'The meter store is not on this database yet. It arrives with the next database update.',
  'timed-out': 'The server did not answer in time. Try again in a moment.',
  'read-failed': 'The readings could not be read.',
  'insert-failed': 'The file could not be filed on this door.',
  'readings-failed': 'Some readings could not be saved.',
  'signed-out': 'Sign in again to file a meter file.',
  'not-allowed': 'Only the owner or an admin can take back a file.',
  unexpected: 'Something went wrong.',
};

const HISTORY_DAYS = 730;

const deviceZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'; } catch { return 'America/Chicago'; }
};

const fmtNum = (n, digits = 1) => (n == null || !Number.isFinite(n) ? '—'
  : n.toLocaleString('en-US', { maximumFractionDigits: n >= 100 ? 0 : digits, minimumFractionDigits: 0 }));
const fmtCents = (c) => (c == null ? '—' : `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const fmtDay = (ms, timeZone) => new Date(ms).toLocaleDateString('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' });
const fmtHour = (ms, timeZone) => new Date(ms).toLocaleString('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric' });
const fmtMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
};

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

const Card = ({ title, children, right }) => (
  <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3">
    {(title || right) && (
      <div className="flex items-baseline justify-between gap-3 mb-2">
        {title && <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">{title}</h3>}
        {right}
      </div>
    )}
    {children}
  </section>
);

const Fact = ({ label, value, note }) => (
  <div className="min-w-0">
    <div className="text-[0.625rem] uppercase tracking-wider text-[#6B665E]">{label}</div>
    <div className="text-[1.125rem] text-[#1A1815] tabular-nums">{value}</div>
    {note && <div className="text-[0.75rem] text-[#6B665E]">{note}</div>}
  </div>
);

/** One commodity's reckoning, every figure counted. */
function Reckoning({ block, timeZone }) {
  const elec = block.commodity === 'electricity';
  const unit = elec ? 'kWh' : 'therms';
  const rate = elec ? block.cost.ratePerKwhCents : block.cost.ratePerThermCents;
  const rateNote = block.cost.reason === 'no-cost-in-file' ? 'The file carried no cost. Your rate is on your bill.'
    : block.cost.reason === 'partial-cost' ? 'Only some readings carried a cost, so no rate is shown.' : `per ${elec ? 'kWh' : 'therm'}, from the file`;
  const cov = block.coverage;
  return (
    <Card title={elec ? 'Electricity' : 'Gas'}
      right={<span className="text-[0.75rem] text-[#6B665E]">{fmtDay(block.firstMs, timeZone)} to {fmtDay(block.lastEndMs - 1, timeZone)}</span>}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Fact label="Used" value={`${fmtNum(block.delivered)} ${unit}`} note={`over ${block.days} day${block.days === 1 ? '' : 's'}`} />
        <Fact label="A day, on average" value={`${fmtNum(block.perDay)} ${unit}`} />
        <Fact label="Rate" value={rate == null ? '—' : `${fmtNum(rate, 2)}¢`} note={rateNote} />
        {elec
          ? <Fact label="Always on" value={block.baseloadWatts == null ? '—' : `${fmtNum(block.baseloadWatts, 0)} W`}
              note={block.baseloadWatts == null ? `Needs seven whole days of hourly reads; this file has ${block.baseloadDays}.` : `the quietest hour, on ${block.baseloadDays} whole days`} />
          : <Fact label="Cost in the file" value={fmtCents(block.cost.totalCents)} />}
      </div>
      {elec && block.received > 0 && (
        <p className="mt-3 text-[0.875rem] text-[#1A1815]">Sent back to the grid: <span className="tabular-nums">{fmtNum(block.received)} kWh</span>. Net from the grid: <span className="tabular-nums">{fmtNum(block.net)} kWh</span>.</p>
      )}
      {elec && block.peak && block.peak.startMs != null && (
        <p className="mt-3 text-[0.875rem] text-[#1A1815]">The busiest hour: <span className="tabular-nums">{fmtNum(block.peak.kwh, 2)} kWh</span> starting {fmtHour(block.peak.startMs, timeZone)}.</p>
      )}
      <p className="mt-2 text-[0.75rem] text-[#6B665E]">
        {cov.readings.toLocaleString('en-US')} reading{cov.readings === 1 ? '' : 's'}
        {cov.gaps ? `; ${cov.gaps} gap${cov.gaps === 1 ? '' : 's'} totalling ${fmtNum(cov.missingHours)} hours with no reading` : '; no gaps'}
        {cov.estimated ? `; ${cov.estimated} estimated by the utility, not measured` : ''}.
      </p>
      {block.months.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[0.875rem]">
            <caption className="sr-only">{elec ? 'Electricity' : 'Gas'} by month</caption>
            <thead>
              <tr className="text-left text-[0.625rem] uppercase tracking-wider text-[#6B665E]">
                <th scope="col" className="py-1 pr-3 font-normal">Month</th>
                <th scope="col" className="py-1 pr-3 font-normal text-right">Used</th>
                {elec && <th scope="col" className="py-1 pr-3 font-normal text-right">Sent back</th>}
                <th scope="col" className="py-1 font-normal text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {block.months.map((m) => (
                <tr key={m.month} className="border-t border-[#E8E4DC]">
                  <th scope="row" className="py-1 pr-3 font-normal text-left text-[#1A1815]">{fmtMonth(m.month)}</th>
                  <td className="py-1 pr-3 text-right tabular-nums">{fmtNum(m.delivered)} {unit}</td>
                  {elec && <td className="py-1 pr-3 text-right tabular-nums">{m.received ? `${fmtNum(m.received)} kWh` : '—'}</td>}
                  <td className="py-1 text-right tabular-nums">{fmtCents(m.costCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function EnergyTab({ door, canManage = false, canTakeBack = false, doorLabel = '', timeZone = deviceZone(), api = DEFAULT_API }) {
  const rentalRef = door && door.id;
  const [state, setState] = useState({ loading: true, error: null, imports: [], hours: [], truncated: false });
  const [pick, setPick] = useState(null);   // { name, text, parsed } from this device
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!rentalRef) { setState({ loading: false, error: null, imports: [], hours: [], truncated: false }); return; }
    setState((s) => ({ ...s, loading: true, error: null }));
    // The last two years: long enough for two of every season, short enough
    // that the newest hours are never the ones a page ceiling cuts off.
    const since = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString();
    const [imps, hrs] = await Promise.all([api.loadImports(rentalRef), api.loadHours(rentalRef, { since })]);
    const bad = !imps.ok ? imps : (!hrs.ok ? hrs : null);
    setState({
      loading: false,
      error: bad ? (WHY[bad.reason] || WHY.unexpected) : null,
      imports: imps.ok ? imps.imports : [],
      hours: hrs.ok ? hrs.hours : [],
      truncated: !!(hrs.ok && hrs.truncated),
    });
  }, [rentalRef, api]);

  useEffect(() => { load(); }, [load]);

  const blocks = useMemo(() => reckonEnergy(state.hours.map(readingFromRow), { timeZone }), [state.hours, timeZone]);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    setMsg('');
    if (!file) return;
    if (file.size > ENERGY_LIMITS.maxBytes) { setPick({ name: file.name, text: '', parsed: { ok: false, reason: 'too-large' } }); return; }
    const text = await file.text();
    setPick({ name: file.name, text, parsed: parseEnergyFile(text, { timeZone }) });
  };

  const onSave = async () => {
    if (!pick || !pick.parsed.ok || !door) return;
    setBusy(true);
    const sha256 = await digestText(pick.text);
    const importRow = buildImportRow(pick.parsed, { instanceId: door.instance_id, rentalRef, fileName: pick.name, sha256 });
    const res = await api.save({
      importRow,
      buildRows: (importId) => buildReadingRows(pick.parsed.readings, { instanceId: door.instance_id, rentalRef, importId }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg(`Filed ${res.saved.toLocaleString('en-US')} reading${res.saved === 1 ? '' : 's'} on this door.`);
      setPick(null);
    } else if (res.saved != null) {
      setMsg(`${WHY[res.reason] || WHY.unexpected} ${res.saved.toLocaleString('en-US')} of ${res.total.toLocaleString('en-US')} were saved. Choose the same file again to finish; nothing will be doubled.`);
    } else setMsg(`Not filed. ${WHY[res.reason] || WHY.unexpected}`);
    load();
  };

  const onTakeBack = async (imp) => {
    setBusy(true);
    const res = await api.remove(imp.id);
    setBusy(false);
    setMsg(res.ok ? `Took back ${imp.file_name || 'the file'} and the readings it still owned.` : (WHY[res.reason] || WHY.unexpected));
    load();
  };

  if (!rentalRef) return <Card title="Energy"><p className="text-[0.875rem] text-[#6B665E]">Choose a door first.</p></Card>;

  const preview = pick && pick.parsed.ok ? reckonEnergy(pick.parsed.readings, { timeZone }) : null;

  return (
    <div>
      <Card title={doorLabel ? `Energy at ${doorLabel}` : 'Energy'}>
        <p className="text-[0.875rem] text-[#1A1815]">
          What this door{'’'}s utility meter recorded, from the utility{'’'}s own file. The meter is the one measure of the whole building, and the one your bill is figured from.
        </p>
      </Card>

      {state.error && <Card><p role="alert" className="text-[0.875rem] text-[#8A6510]">{state.error}</p></Card>}
      {msg && <Card><p role="status" className="text-[0.875rem] text-[#1A1815]">{msg}</p></Card>}

      {state.loading ? (
        <Card><p className="text-[0.875rem] text-[#6B665E]">Reading the meter{'’'}s record{'…'}</p></Card>
      ) : blocks.length ? (
        <>
          <p className="mb-2 text-[0.75rem] text-[#6B665E]">The last two years of readings.</p>
          {state.truncated && <Card><p className="text-[0.875rem] text-[#8A6510]">This door holds more readings than one screen reads at once. The figures below stop before the newest of them.</p></Card>}
          {blocks.map((b) => <Reckoning key={b.commodity} block={b} timeZone={timeZone} />)}
        </>
      ) : (
        <Card title="No meter readings yet">
          <p className="text-[0.875rem] text-[#1A1815]">
            Sign in to the utility account for this door and look for <strong>Green Button</strong> or <strong>Download My Data</strong>. Choose the longest range it offers, at hourly or 15-minute detail, and save the file (XML or CSV). Then choose it below.
          </p>
        </Card>
      )}

      {canManage && (
        <Card title="Add a meter file">
          <label className="block">
            <span className="sr-only">Choose a Green Button file</span>
            <input type="file" accept=".xml,.csv,text/csv,application/xml,text/xml" onChange={onFile} disabled={busy}
              className="block w-full text-[0.875rem] text-[#1A1815] file:mr-3 file:px-3 file:py-2 file:border file:border-[#E8E4DC] file:bg-white file:text-[0.75rem]" />
          </label>
          {pick && !pick.parsed.ok && (
            <p role="alert" className="mt-3 text-[0.875rem] text-[#8A6510]">{pick.name}: {REFUSAL[pick.parsed.reason] || 'This file could not be read.'}</p>
          )}
          {pick && pick.parsed.ok && (
            <div className="mt-3">
              <p className="text-[0.875rem] text-[#1A1815]">
                {pick.name}: {pick.parsed.readings.length.toLocaleString('en-US')} reading{pick.parsed.readings.length === 1 ? '' : 's'} ({pick.parsed.format === 'csv' ? 'spreadsheet' : 'Green Button XML'}).
                {' '}Nothing is saved until you file it.
              </p>
              {pick.parsed.notes.map((n) => <p key={n} className="mt-1 text-[0.75rem] text-[#6B665E]">{n}</p>)}
              {preview && preview.map((b) => (
                <p key={b.commodity} className="mt-1 text-[0.75rem] text-[#6B665E]">
                  {b.commodity === 'electricity' ? 'Electricity' : 'Gas'}: {fmtNum(b.delivered)} {b.commodity === 'electricity' ? 'kWh' : 'therms'}, {fmtDay(b.firstMs, timeZone)} to {fmtDay(b.lastEndMs - 1, timeZone)}.
                </p>
              ))}
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn tone="primary" onClick={onSave} disabled={busy}>{busy ? 'Filing…' : 'File on this door'}</Btn>
                <Btn onClick={() => setPick(null)} disabled={busy}>Cancel</Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      {state.imports.length > 0 && (
        <Card title="Files on this door">
          <ul className="divide-y divide-[#E8E4DC]">
            {state.imports.map((imp) => (
              <li key={imp.id} className="py-2 flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[0.875rem] text-[#1A1815] break-words">{imp.file_name || 'A meter file'}</div>
                  <div className="text-[0.75rem] text-[#6B665E]">
                    Filed {fmtDay(Date.parse(imp.created_at), timeZone)}; {Number(imp.reading_count).toLocaleString('en-US')} readings
                    {imp.first_start_at && imp.last_end_at ? `, ${fmtDay(Date.parse(imp.first_start_at), timeZone)} to ${fmtDay(Date.parse(imp.last_end_at) - 1, timeZone)}` : ''}.
                    {imp.notes ? ` ${imp.notes}` : ''}
                  </div>
                </div>
                {canTakeBack && <Btn onClick={() => onTakeBack(imp)} disabled={busy}>Take back</Btn>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default EnergyTab;
