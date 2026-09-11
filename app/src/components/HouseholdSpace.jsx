// =============================================================================
// HouseholdSpace — the household's own record, shelf and findings (DR-0357)
// =============================================================================
// Darrell 2026-09-11: "Create the same type of intake forms for PoeTech...
// We also need a PoeTech family documents upload and a process for analytics
// and services to be created based on the information."
//
// Three areas, one household, all of it this household's own rows:
//   The record   — every question of the household intake, a cell for each,
//                  filled by any adult with a seat, at any time, plus the
//                  covenant signed in place with the app's own clock.
//   The shelf    — documents: a file in the private bucket, or a pointer to
//                  where the paper actually is. Private until shared.
//   The findings — what the rows above can honestly say, each one showing
//                  what it read, and the ladder a workflow climbs from a
//                  noticed friction to a hardened system.
//
// Nothing here paints a number. Where there are no rows, it says so.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import UiIcon from './UiIcon.jsx';
import TlcRecordEditor from './TlcRecordEditor.jsx';
import TlcDocumentAcknowledge from './TlcDocumentAcknowledge.jsx';
import { householdProgress } from '../lib/household-intake.js';
import { readHousehold, patchHousehold, acknowledgeHouseholdDocument, exportHouseholdRecord } from '../lib/household-sync.js';
import { liveSectionsFor, originalProduct } from '../lib/product-forms.js';
import { readProductForms } from '../lib/product-forms-sync.js';
import { VAULT_CATEGORIES, categoryLabel, documentSlug, validateDocument, shelfSummary, expiringSoon } from '../lib/family-vault.js';
import { listDocuments, saveDocument, shareDocument, signedDocumentUrl, removeDocument, uploadDocumentFile } from '../lib/family-vault-sync.js';
import { householdInsights, workflowCandidates, WORKFLOW_LADDER } from '../lib/household-insights.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_GOOD = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const SMALL = 'w-full min-h-[36px] px-2 py-1 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';

const bytes = (n) => (!n ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// ---------------------------------------------------------------------------
// THE SHELF
// ---------------------------------------------------------------------------
function FileRow({ row, onShare, onRemove }) {
  const [opening, setOpening] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const open = async () => {
    setOpening(true);
    const url = await signedDocumentUrl(row.storagePath);
    setOpening(false);
    if (url) { try { window.open(url, '_blank', 'noopener'); } catch { /* the shelf still shows the row */ } }
  };
  return (
    <li className="py-2 border-t border-[#F0ECE4] first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm text-[#1A1815] font-semibold">{row.label}</div>
          <div className="text-[0.6875rem] text-[#5A5751]">
            {categoryLabel(row.category)}
            {row.dateOf ? ` · dated ${row.dateOf}` : ''}
            {row.expiresOn ? ` · expires ${row.expiresOn}` : ''}
            {row.storagePath ? ` · ${row.fileName || 'a file'}${row.fileSize ? ` (${bytes(row.fileSize)})` : ''}` : ` · kept at: ${row.whereFiled}`}
          </div>
          {row.note && <div className="text-xs text-[#5A5751] mt-0.5">{row.note}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {row.storagePath && <button type="button" onClick={open} disabled={opening} className={`${BTN}`}>{opening ? 'Opening…' : 'Open'}</button>}
          <button type="button" onClick={() => onShare(row, !row.sharedWithHousehold)}
            aria-pressed={row.sharedWithHousehold}
            className={row.sharedWithHousehold ? `${BTN_GOOD}` : `${BTN}`}>
            {row.sharedWithHousehold ? 'Shared with the household' : 'Only me'}
          </button>
          {!confirm
            ? <button type="button" onClick={() => setConfirm(true)} className="text-xs underline text-[#5A5751] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Remove</button>
            : <span className="inline-flex items-center gap-2 text-xs">Remove it and its file?
                <button type="button" onClick={() => onRemove(row)} className={`${BTN_WARN}`}>Yes</button>
                <button type="button" onClick={() => setConfirm(false)} className={`${BTN}`}>Keep</button>
              </span>}
        </div>
      </div>
    </li>
  );
}

function Shelf({ instanceId }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loaded: false, message: '' });
  const [draft, setDraft] = useState({ label: '', category: 'home', dateOf: '', expiresOn: '', whereFiled: '', note: '', sharedWithHousehold: false });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);
  const [flash, setFlash] = useState('');

  const refresh = useCallback(async () => {
    const res = await listDocuments(instanceId);
    setRows(res.rows);
    setState({ loaded: true, message: res.ok ? '' : res.message });
  }, [instanceId]);
  useEffect(() => { refresh(); }, [refresh]);

  const summary = useMemo(() => shelfSummary(rows), [rows]);
  const soon = useMemo(() => expiringSoon(rows, 60), [rows]);

  const file_it = async () => {
    setBusy(true); setErrors([]); setFlash('');
    const slug = documentSlug(draft.label, rows.map((r) => r.slug));
    let pointer = {};
    if (file) {
      const up = await uploadDocumentFile({ file, slug });
      if (!up.ok) { setErrors([up.message]); setBusy(false); return; }
      pointer = up.pointer;
    }
    const doc = { ...draft, slug, ...pointer };
    const bad = validateDocument(doc);
    if (bad.length) { setErrors(bad); setBusy(false); return; }
    const res = await saveDocument(doc, instanceId);
    setBusy(false);
    if (!res.ok) { setErrors(res.errors && res.errors.length ? res.errors : [res.message]); return; }
    setDraft({ label: '', category: 'home', dateOf: '', expiresOn: '', whereFiled: '', note: '', sharedWithHousehold: false });
    setFile(null);
    setFlash(`Filed “${res.row.label}” under ${categoryLabel(res.row.category)}.`);
    refresh();
  };

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">The household shelf</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>File a document, or say where the paper is</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3" style={SERIF}>
          Both count. A scan is not more real than the deed in your fire safe — record where the paper lives and the shelf knows about it.
          What you file is <b>yours alone</b> until you share it with the household. Files sit in private storage only your account can open and every open is a fresh five-minute link;
          they are <b>not</b> encrypted with a key only you hold. A private shelf, not a safe deposit box.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block text-xs text-[#5A5751]">What is it?
            <input value={draft.label} onChange={set('label')} placeholder="e.g. The deed on Maple" className={`${SMALL} mt-0.5`} />
          </label>
          <label className="block text-xs text-[#5A5751]">Which shelf
            <select value={draft.category} onChange={set('category')} className={`${SMALL} mt-0.5`}>
              {VAULT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#5A5751]">Dated (optional)
            <input type="date" value={draft.dateOf} onChange={set('dateOf')} className={`${SMALL} mt-0.5`} />
          </label>
          <label className="block text-xs text-[#5A5751]">Expires (optional)
            <input type="date" value={draft.expiresOn} onChange={set('expiresOn')} className={`${SMALL} mt-0.5`} />
          </label>
          <label className="block text-xs text-[#5A5751] sm:col-span-2">Where the paper is, if you are not uploading one
            <input value={draft.whereFiled} onChange={set('whereFiled')} placeholder="e.g. the fire safe, top shelf" className={`${SMALL} mt-0.5`} />
          </label>
          <label className="block text-xs text-[#5A5751] sm:col-span-2">A note for later (optional)
            <input value={draft.note} onChange={set('note')} className={`${SMALL} mt-0.5`} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input id="vault-file" type="file" onChange={(e) => setFile((e.target.files && e.target.files[0]) || null)}
            accept=".pdf,.doc,.docx,.txt,image/*"
            className="text-xs file:min-h-[36px] file:px-3 file:border file:border-[#1A1815] file:bg-white file:text-[#1A1815] file:text-xs file:font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]" />
          <label className="inline-flex items-center gap-1.5 text-xs text-[#1A1815] min-h-[36px]">
            <input type="checkbox" checked={draft.sharedWithHousehold} onChange={(e) => setDraft((d) => ({ ...d, sharedWithHousehold: e.target.checked }))}
              className="h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" />
            Share it with the household
          </label>
          <button type="button" onClick={file_it} disabled={busy} className={`${BTN}`}>{busy ? 'Filing…' : 'File it'}</button>
        </div>
        {errors.length > 0 && <ul className="text-xs text-[#B85838] list-disc pl-4 mt-2" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {flash && <p className="text-xs text-[#3F5226] mt-2" role="status">{flash}</p>}
      </section>

      {soon.length > 0 && (
        <section className="border border-[#B85838] bg-white p-3" role="status">
          <div className="text-xs font-semibold text-[#B85838] mb-1">Expiring within 60 days</div>
          <ul className="text-xs text-[#1A1815]">{soon.map((d) => <li key={d.id}>{d.label} — {d.expiresOn}</li>)}</ul>
        </section>
      )}

      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <div className="text-sm font-bold text-[#1A1815]">What is on the shelf</div>
          <span className="text-[0.6875rem] text-[#5A5751]">
            {summary.total === 0 ? 'nothing yet' : `${summary.total} in all · ${summary.files} file${summary.files === 1 ? '' : 's'} · ${summary.pointers} pointer${summary.pointers === 1 ? '' : 's'} · ${summary.shared} shared`}
          </span>
        </div>
        {state.message && <p className="text-xs text-[#B85838] mb-2" role="alert">The shelf could not be read: {state.message}</p>}
        {!state.loaded && <p className="text-xs text-[#5A5751]">Opening…</p>}
        {state.loaded && rows.length === 0 && <p className="text-xs text-[#5A5751]">Nothing filed yet. The first document you add shows up here.</p>}
        {VAULT_CATEGORIES.map((c) => {
          const mine = rows.filter((r) => r.category === c.id);
          if (!mine.length) return null;
          return (
            <div key={c.id} className="mb-3">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{c.label}</div>
              <ul>{mine.map((r) => (
                <FileRow key={r.id} row={r}
                  onShare={async (row, shared) => { await shareDocument(row.id, shared); refresh(); }}
                  onRemove={async (row) => { await removeDocument(row); refresh(); }} />
              ))}</ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE FINDINGS
// ---------------------------------------------------------------------------
function Findings({ record, documents }) {
  const result = useMemo(() => householdInsights({ record, documents }), [record, documents]);
  const candidates = useMemo(() => workflowCandidates({ record }), [record]);
  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#5A6E3D] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">What your own rows say</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>Findings</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3" style={SERIF}>
          Every line below is arithmetic over answers this household wrote, computed here, sent nowhere. Each one names what it read, so you can open it and check.
          Where there is nothing to read, it says nothing rather than filling the space.
        </p>
        {!result.ok && <p className="text-sm text-[#1A1815]" style={SERIF}>{result.unavailable}</p>}
        {result.ok && (
          <ol className="space-y-2">
            {result.findings.map((f) => (
              <li key={f.id} className="border border-[#E8E4DC] p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-bold text-[#1A1815]">{f.title}</div>
                  <div className="text-[0.6875rem] text-[#5A5751]">{f.data}</div>
                </div>
                <p className="text-sm text-[#1A1815] mt-1" style={SERIF}>{f.truth}</p>
                <p className="text-xs text-[#3F5226] mt-1"><b>Next:</b> {f.invitation}</p>
                <details className="mt-1">
                  <summary className="text-[0.625rem] uppercase tracking-wider text-[#8A857C] cursor-pointer min-h-[36px]">What this read</summary>
                  <ul className="text-[0.6875rem] text-[#5A5751] font-mono break-all">{f.basis.map((b) => <li key={b}>{b}</li>)}</ul>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">The process</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>How a friction becomes a system</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3" style={SERIF}>
          Nothing here is automatic. A workflow climbs one rung at a time, and it only climbs when the household says it has —
          so “in progress” never hides what is really a wish.
        </p>
        <ol className="space-y-1 mb-3">
          {WORKFLOW_LADDER.map((s, i) => (
            <li key={s.id} className="text-xs text-[#1A1815]">
              <b>{i + 1}. {s.label}.</b> <span className="text-[#5A5751]">{s.means}</span>
            </li>
          ))}
        </ol>
        <div className="text-xs font-semibold text-[#1A1815] mb-1">What this household has named so far</div>
        {candidates.length === 0
          ? <p className="text-xs text-[#5A5751]">Nothing yet. Answer “the thing that wastes the most of our time or peace” on the record and it appears here as the first candidate.</p>
          : (
            <ul className="space-y-1">
              {candidates.map((c) => (
                <li key={c.id} className="text-xs text-[#1A1815] border border-[#E8E4DC] p-2">
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">{c.stage}</span>
                  {' · '}<b>{c.title}</b>
                  <div className="text-[#5A5751] mt-0.5">“{c.said}”</div>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE HOUSEHOLD SPACE
// ---------------------------------------------------------------------------
export default function HouseholdSpace() {
  const [view, setView] = useState(null);
  const [error, setError] = useState('');
  const [forms, setForms] = useState(() => originalProduct('poetech'));
  const [documents, setDocuments] = useState([]);
  const [exported, setExported] = useState('');

  const refreshRecord = useCallback(async () => {
    const res = await readHousehold();
    if (res.ok) { setView(res.view); setError(''); } else setError(res.message);
  }, []);
  useEffect(() => { refreshRecord(); }, [refreshRecord]);

  useEffect(() => {
    let alive = true;
    readProductForms('poetech').then((res) => { if (alive) setForms(res.resolved); });
    return () => { alive = false; };
  }, []);

  const instanceId = view ? view.instanceId : null;
  useEffect(() => {
    let alive = true;
    if (!instanceId) return () => { alive = false; };
    listDocuments(instanceId).then((res) => { if (alive) setDocuments(res.rows); });
    return () => { alive = false; };
  }, [instanceId]);

  const intake = forms['household-intake'] || null;
  const sections = useMemo(() => liveSectionsFor('poetech', 'household-intake', intake ? intake.form : null), [intake]);
  const covenant = forms['household-covenant'] || null;
  const record = view ? view.record : null;
  const progress = useMemo(() => householdProgress(record), [record]);
  const canFill = view ? ['owner', 'admin'].includes(view.myRole) : false;

  const doExport = () => {
    const payload = exportHouseholdRecord(view, sections);
    setExported(JSON.stringify(payload, null, 2));
  };

  if (error) {
    return (
      <section className="border border-[#E8E4DC] bg-white p-4">
        <p className="text-sm text-[#1A1815] font-semibold mb-1">The household record could not be opened.</p>
        <p className="text-xs text-[#5A5751]">{error}</p>
      </section>
    );
  }
  if (!view) return <p className="text-sm text-[#5A5751]">Opening the household record…</p>;

  const areas = [
    { id: 'record', label: `Record · ${progress.pct}%`, icon: 'pencil', render: () => (
      <div className="space-y-4">
        <section className="bg-white border-2 border-[#1A1815] p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{view.householdName || 'This household'}</div>
          <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>The household record</h3>
          <p className="text-xs text-[#5A5751] leading-relaxed" style={SERIF}>
            {progress.done} of {progress.total} questions answered. Every question here earns its place by feeding a real surface of this app —
            and the app holds no account number, no password, no medical record, and nothing about a named child.
            {canFill ? '' : ' You can read this record; filling it is an owner or admin.'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button type="button" onClick={doExport} className={`${BTN}`}>Export this record</button>
            {exported && <button type="button" onClick={() => setExported('')} className={`${BTN}`}>Hide it</button>}
          </div>
          {exported && (
            <pre className="mt-2 text-[0.625rem] bg-[#FAF8F4] border border-[#E8E4DC] p-2 overflow-x-auto max-h-64">{exported}</pre>
          )}
        </section>

        {canFill && (
          <TlcRecordEditor
            sections={sections} record={record} who="self" title="Fill or correct any cell"
            onSave={async (patch, note) => {
              const res = await patchHousehold(patch, note);
              if (res.ok) setView(res.view);
              return res;
            }} />
        )}

        <section className="bg-white border border-[#E8E4DC] p-4">
          <div className="text-sm font-bold text-[#1A1815] mb-1">{covenant ? covenant.doc.title : 'Household Covenant'}</div>
          <p className="text-xs text-[#5A5751] mb-2" style={SERIF}>{covenant ? covenant.doc.preamble : ''}</p>
          <div className="space-y-2 text-xs text-[#1A1815] leading-relaxed">
            {(covenant ? covenant.doc.sections : []).map((s) => (
              <section key={s.n}>
                <h4 className="font-semibold">{s.n}. {s.title}</h4>
                {s.text && <p>{s.text}</p>}
                {s.items && <ul className="list-disc pl-4">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>}
                {s.after && <p>{s.after}</p>}
              </section>
            ))}
          </div>
          <TlcDocumentAcknowledge
            docKey="householdCovenant" docName={covenant ? covenant.doc.title : 'Household Covenant'}
            packetId={view.recordId}
            version={covenant ? `v${covenant.version}` : 'v0'}
            record={(record && record.acknowledgments && record.acknowledgments.householdCovenant) || null}
            onSign={canFill ? (args) => acknowledgeHouseholdDocument('householdCovenant', args) : null}
            onAcknowledged={(v) => setView(v)} />
        </section>
      </div>
    ) },
    { id: 'shelf', label: 'Documents', icon: 'book', render: () => <Shelf instanceId={instanceId} /> },
    { id: 'findings', label: 'Findings', icon: 'chart', render: () => <Findings record={record} documents={documents} /> },
  ];

  return (
    <div className="space-y-4">
      <SectionTabs variant="sub" sections={areas} ariaLabel="Household areas" idBase="household" defaultId="record" />
      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed flex items-start gap-1.5">
        <UiIcon name="lock" className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          This household&apos;s record and shelf live in this household&apos;s own instance and are walled there by the database, not by the screen.
          Nothing here is sold, sent to an insurer or an employer, or used to train anything outside this household.
        </span>
      </p>
    </div>
  );
}
