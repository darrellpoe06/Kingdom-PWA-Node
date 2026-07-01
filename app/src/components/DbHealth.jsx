// =============================================================================
// DbHealth — the app verifies its own schema (Governor surface)
// =============================================================================
// Darrell 2026-07-01: "stop waiting for me to apply migrations." The db-migrate
// lane now applies forward migrations itself, resiliently (DR-0084). This panel
// is the WATCHING half: it reads the real ledger (public._schema_migrations, via
// the family-gated schema_migrations_health RPC) so a governor can verify schema
// state from INSIDE the app — what is applied, what FAILED and why, when the lane
// last ran. Read-only: it never executes DDL in the browser and cannot break the
// lane (DR-0084 §4). No painted status — every value is a real ledger row.
import React, { useEffect, useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import {
  fetchSchemaHealth,
  summaryTiles,
  healthKpiStatus,
  healthKpiLabel,
  failedList,
  migrations,
  fmtWhen,
} from '../lib/db-health.js';

const serif = { fontFamily: '"Fraunces", serif' };

function Tile({ label, value }) {
  return (
    <div className="border border-[#1A1815] p-2">
      <div className="text-xs uppercase tracking-wider text-[#5A5751]">{label}</div>
      <div className="text-lg" style={{ ...serif, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default function DbHealth() {
  const [res, setRes] = useState({ status: 'loading' });

  async function load() {
    setRes({ status: 'loading' });
    setRes(await fetchSchemaHealth());
  }
  useEffect(() => { load(); }, []);

  const data = res.status === 'ok' ? res.data : null;
  const kpi = { status: healthKpiStatus(data), label: healthKpiLabel(data) };
  const failed = failedList(data);
  const rows = migrations(data);

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5" aria-labelledby="db-health-h">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-[0.3em] text-[#B85838] font-semibold">DB Health</div>
        <div className="flex items-center gap-3 shrink-0">
          {res.status === 'ok' && (
            <KpiDot status={kpi.status} label={kpi.label} className="text-xs uppercase tracking-wider text-[#5A5751]" />
          )}
          <button
            type="button"
            onClick={load}
            className="text-xs uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            {res.status === 'loading' ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
      <h2 id="db-health-h" className="text-xl sm:text-2xl mb-1" style={{ ...serif, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Is the database schema actually applied?
      </h2>
      <p className="text-xs text-[#5A5751] mb-4" style={serif}>
        The real migration ledger the deploy lane writes on every apply — no shell, no Studio. Forward migrations apply
        themselves when a change merges to <strong>main</strong>; this is where you confirm they landed.
      </p>

      {res.status === 'loading' && !data ? (
        <p className="text-sm text-[#5A5751] italic" style={serif}>Loading schema health…</p>
      ) : res.status === 'unauthorized' ? (
        <p className="text-sm text-[#5A5751] italic" style={serif}>
          DB Health is limited to family governors. You're signed in, but not in the poe-family circle.
        </p>
      ) : res.status === 'unavailable' ? (
        <p className="text-sm text-[#5A5751] italic" style={serif}>
          Couldn't load schema health right now — the <code>schema_migrations_health</code> function may not be on the
          cloud database yet (the migration applies it). The rest of this surface is unaffected.
        </p>
      ) : data && data.ledger_initialized === false ? (
        <p className="text-sm text-[#5A5751] italic" style={serif}>
          The migration ledger isn't initialized on this database yet. It's created the first time the resilient
          db-migrate runner applies a migration — dispatch the <strong>db-migrate</strong> lane to populate it.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {summaryTiles(data).map((t) => <Tile key={t.label} label={t.label} value={t.value} />)}
          </div>

          {failed.length > 0 && (
            <div className="border-2 border-[#DC2626] p-3 mb-4">
              <div className="text-xs uppercase tracking-wider text-[#DC2626] font-semibold mb-2">
                {failed.length} migration{failed.length === 1 ? '' : 's'} failed — applied nothing, blocked nothing else
              </div>
              <ul className="space-y-2">
                {failed.map((f) => (
                  <li key={f.filename} className="text-sm" style={serif}>
                    <div className="font-medium text-[#1A1815]">{f.filename}</div>
                    {f.last_error && <div className="text-xs text-[#5A5751] break-words">{f.last_error}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs uppercase tracking-wider text-[#5A5751] mb-2">Recently applied</div>
          {rows.length === 0 ? (
            <p className="text-sm text-[#5A5751] italic" style={serif}>No ledger rows yet.</p>
          ) : (
            <ul className="divide-y divide-[#E5E1D8]">
              {rows.map((m) => (
                <li key={m.filename} className="flex items-center justify-between gap-3 py-1.5">
                  <span className="text-sm text-[#1A1815] truncate" style={serif}>{m.filename}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <KpiDot
                      status={m.status === 'applied' ? 'good' : 'problem'}
                      label={m.status}
                      className="text-xs uppercase tracking-wider text-[#5A5751]"
                    />
                    <span className="text-xs text-[#5A5751] tabular-nums">{fmtWhen(m.applied_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-[#5A5751] mt-4" style={serif}>
            To apply a new schema change: merge its <code>.sql</code> to <strong>main</strong> (the db-migrate lane runs
            itself), or a governor re-runs the lane from GitHub Actions. Applying stays on the deploy path — never
            in-browser DDL — so no database credential lives in the app.
          </p>
        </>
      )}
    </section>
  );
}
