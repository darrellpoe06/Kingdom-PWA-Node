// =============================================================================
// BooksTaxes — Books → Taxes: the sovereign tax-document archive + strategy view
// =============================================================================
// Darrell 2026-07-21: "Annual tax information is the PDF of years of taxes —
// where should Christina import... still printable later... use those artifacts
// to help build their behavioral strategies." This is the surface for the
// sovereign pipeline that already exists (tax_ingest.py on the NAS → the light
// archive.json → tax-archive.js reader). It READS real state (Reality-Trace /
// DR-0061): the per-year documents the family stored, the original still
// printable, and the year-over-year figures the Behavioral-Mirror strategy layer
// computes on. No painted numbers — a year with no verified figures shows
// `pending`, never invented (DR-0076). Tailwind classes only (contrast +
// legibility guards). The `fetch` is injectable for tests via __setTaxFetcher.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { fetchTaxArchive, printableUrl } from '../lib/tax-archive.js';
import { groupByYear, buildTaxHistory, hasFigures, TAX_FIGURE_KEYS, TAX_DOC_KINDS } from '../lib/tax-documents.js';
import { uploadTaxDoc, uploadFailureMessage, validateUpload } from '../lib/tax-upload.js';
import PaymentsLedgerPanel from './PaymentsLedgerPanel.jsx';
import { resolveN8nBearer } from '../lib/n8n-base.js';

const KIND_LABEL = {
  return: 'Return (1040)', w2: 'W-2', '1099-received': '1099 received',
  k1: 'K-1', schedule: 'Schedule', receipt: 'Receipt', other: 'Document',
};
const FIGURE_LABEL = { grossIncome: 'Gross income', agi: 'AGI', totalTax: 'Total tax', refund: 'Refund' };

function money(n) {
  if (!Number.isFinite(Number(n))) return '—';
  return '$' + Math.round(Number(n)).toLocaleString();
}
function signedMoney(n) {
  if (!Number.isFinite(Number(n))) return null;
  const v = Number(n);
  return (v >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(v)).toLocaleString();
}

const KIND_OPTION_LABEL = {
  return: 'Return (1040)', w2: 'W-2', '1099-received': '1099 received',
  k1: 'K-1', schedule: 'Schedule', receipt: 'Receipt', other: 'Other document',
};
const fieldCls = 'text-sm border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const labelCls = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1';

export default function BooksTaxes({ entities = [] }) {
  const [archive, setArchive] = useState({ documents: [], served_at: null, source: 'loading' });
  const [form, setForm] = useState({ file: null, entityId: '', year: '', kind: 'return' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = () => fetchTaxArchive().then((a) => setArchive(a));
  useEffect(() => {
    let live = true;
    fetchTaxArchive().then((a) => { if (live) setArchive(a); });
    return () => { live = false; };
  }, []);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const uploadReq = { file: form.file, entityId: form.entityId, year: form.year, kind: form.kind };
  const gate = validateUpload(uploadReq);

  const doUpload = async () => {
    if (!gate.ok || busy) return;
    setBusy(true); setNotice('Uploading to your NAS…');
    const token = (() => { try { return resolveN8nBearer(typeof window !== 'undefined' ? window : undefined); } catch { return null; } })();
    const res = await uploadTaxDoc(uploadReq, { token });
    setBusy(false);
    if (res && res.ok) {
      setNotice('Uploaded. Your return is filed and printable below.');
      setForm({ file: null, entityId: form.entityId, year: '', kind: 'return' });
      if (res.archive && Array.isArray(res.archive.documents)) setArchive({ documents: res.archive.documents, served_at: res.archive.served_at || null, source: 'nas' });
      else refresh();
    } else if (res && res.skipped === 'invalid') {
      setNotice(res.errors.join(' '));
    } else {
      // Say WHICH failure it was. The 2026-09-06 defect (DR-0330) spent seven
      // weeks looking like one undifferentiated "could not reach": the real
      // cause was a Funnel with no /taxes mount and a service nothing had ever
      // started, and a 502 vs a 401 vs a 404 each point at a different piece.
      // A message that names the hop is the difference between a diagnosis and
      // a shrug (DR-0076 §8 — provenance, and honest uncertainty when absent).
      setNotice(uploadFailureMessage(res));
    }
  };

  const docs = archive.documents || [];
  const years = groupByYear(docs);
  const history = buildTaxHistory(docs);
  const entityName = (id) => (entities.find((e) => e.id === id) || {}).name || id || '—';

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Taxes — your filed returns, by year</h3>
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Your returns live on your own NAS (sovereign — no cloud). This reads the light index same-origin; each original PDF stays <strong>printable</strong>. Figures shown are the ones you verified on the return — a year with none shows <em>pending</em>, never a guess.
        </p>
      </div>

      {/* Upload — Christina files a return from inside the app, never Synology
          (Darrell 2026-07-21). Posts to the NAS same-origin; the original lands
          on sovereign disk and stays printable. */}
      <form className="border border-[#5A6E3D] bg-[#FAF8F4] p-3" onSubmit={(e) => { e.preventDefault(); doUpload(); }}>
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">Upload a return</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label htmlFor="tax-entity" className={labelCls}>Whose return</label>
            <select id="tax-entity" className={`${fieldCls} w-full`} value={form.entityId} onChange={(e) => setF('entityId', e.target.value)}>
              <option value="">— choose entity —</option>
              {entities.map((en) => (<option key={en.id} value={en.id}>{en.name || en.id}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="tax-year" className={labelCls}>Tax year</label>
            <input id="tax-year" type="number" inputMode="numeric" placeholder="2024" className={`${fieldCls} w-full`} value={form.year} onChange={(e) => setF('year', e.target.value)} />
          </div>
          <div>
            <label htmlFor="tax-kind" className={labelCls}>Document type</label>
            <select id="tax-kind" className={`${fieldCls} w-full`} value={form.kind} onChange={(e) => setF('kind', e.target.value)}>
              {TAX_DOC_KINDS.map((k) => (<option key={k} value={k}>{KIND_OPTION_LABEL[k] || k}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="tax-file" className={labelCls}>PDF</label>
            <input id="tax-file" type="file" accept="application/pdf,.pdf" className={`${fieldCls} w-full`} onChange={(e) => setF('file', (e.target.files && e.target.files[0]) || null)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!gate.ok || busy}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${gate.ok && !busy ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white hover:bg-[#4A5D30]' : 'border-[#E8E4DC] text-[#5A5751] cursor-not-allowed'}`}>
            {busy ? 'Uploading…' : 'Upload to my NAS'}
          </button>
          {notice && <span className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>{notice}</span>}
        </div>
        <p className="text-[0.5625rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Stays on your own NAS — never a third-party cloud. Add the year&rsquo;s numbers later by uploading, or on the NAS as a small <span className="font-mono">.figures.json</span> beside the PDF.
        </p>
      </form>

      {/* Empty state — the real how-to, since the value is trust (no painted data) */}
      {docs.length === 0 && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">No returns indexed yet</div>
          <ol className="text-xs text-[#1A1815] list-decimal pl-5 space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>Drop each return on the NAS at <span className="font-mono text-[0.6875rem]">/volume1/PoeTech/tax-documents/&lt;entity&gt;/&lt;year&gt;/&lt;name&gt;.pdf</span>.</li>
            <li>Optionally add <span className="font-mono text-[0.6875rem]">&lt;name&gt;.figures.json</span> beside it with the verified numbers.</li>
            <li>Run <span className="font-mono text-[0.6875rem]">python3 infra/nas-tax-ingest/tax_ingest.py</span> (SSH / ConnectBot). This page fills in on refresh.</li>
          </ol>
        </div>
      )}

      {/* Behavioral-strategy history — year-over-year, real figures only */}
      {history.some((r) => r.status === 'ready') && (
        <div className="border border-[#5A6E3D] bg-[#FAF8F4] p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">Year over year · the strategy view</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[0.6875rem] text-[#1A1815]">
              <thead>
                <tr className="text-left text-[#5A5751]">
                  <th scope="col" className="py-1 pr-2 font-semibold">Year</th>
                  {TAX_FIGURE_KEYS.map((k) => (<th scope="col" key={k} className="py-1 px-2 font-semibold text-right">{FIGURE_LABEL[k]}</th>))}
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.year} className="border-t border-[#E8E4DC]">
                    <td className="py-1 pr-2 font-semibold">{r.year}</td>
                    {TAX_FIGURE_KEYS.map((k) => (
                      <td key={k} className="py-1 px-2 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {r.status === 'ready' ? (
                          <>
                            {money(r.figs[k])}
                            {r.deltas && r.deltas[k] != null && (
                              <span className={`ml-1 text-[0.5625rem] ${r.deltas[k] < 0 ? 'text-[#B85838]' : 'text-[#166534]'}`}>{signedMoney(r.deltas[k])}</span>
                            )}
                          </>
                        ) : <span className="text-[#5A5751]">pending</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-year archive — every stored document, the original printable */}
      {years.map((y) => (
        <div key={y.year} className="border border-[#E8E4DC] bg-white p-3">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="text-[0.75rem] font-semibold text-[#1A1815]">{y.year} <span className="text-[#5A5751] font-normal">· {y.count} document{y.count === 1 ? '' : 's'}</span></div>
          </div>
          <ul className="space-y-1.5">
            {y.docs.map((d) => {
              const url = printableUrl(d);
              return (
                <li key={d.id} className="flex items-baseline justify-between gap-2 text-[0.6875rem]">
                  <span className="truncate">
                    <span className="inline-block text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] border border-[#5A6E3D] px-1 py-0.5 mr-1.5 align-middle">{KIND_LABEL[d.kind] || d.kind}</span>
                    <span className="text-[#1A1815]">{d.filename}</span>
                    <span className="text-[#5A5751]"> · {entityName(d.entityId)}</span>
                    {hasFigures(d.figures) && (
                      <span className="text-[#166534]"> · {TAX_FIGURE_KEYS.filter((k) => Number.isFinite(Number(d.figures[k]))).map((k) => `${FIGURE_LABEL[k]} ${money(d.figures[k])}`).join(' · ')}</span>
                    )}
                  </span>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-[0.5625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                      Open / print
                    </a>
                  ) : (
                    <span className="shrink-0 text-[0.5625rem] text-[#B85838]">no file</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {/* DR-0230: the live payments ledger reads beside the tax archive — one
          Books → Taxes surface, always accountant-current. */}
      <PaymentsLedgerPanel entities={entities} />
    </section>
  );
}
