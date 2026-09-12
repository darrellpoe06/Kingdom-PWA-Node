// =============================================================================
// ChurchMemberSpace — your record, your shelf, and what the church can see
// =============================================================================
// Darrell 2026-09-11: "Create the same type of intake forms for the Love Corner
// App that we did for the PoeTech and Poe Properties Apps... We also need a
// Love Corner documents upload and a process for analytics and services to be
// created based on the information."
//
// Four areas, one person:
//   My record  — every question of the member intake, filled by the person
//                themselves and nobody else, plus the covenant signed in place.
//   My shelf   — documents: a file in the private bucket, or a pointer to where
//                the paper actually is. Private until shared with the office.
//   The roll   — THE OFFICE'S read, and only theirs. The server decides who
//                sees this tab's contents; this screen only decides whether to
//                draw it. Both walls, on purpose.
//   Findings   — arithmetic over the roll: rides needed, welcomes owed, and the
//                ministries people volunteered for that have no page yet.
//
// Nothing here paints a number. Where there are no rows, it says so (DR-0061).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import UiIcon from './UiIcon.jsx';
import TlcRecordEditor from './TlcRecordEditor.jsx';
import TlcDocumentAcknowledge from './TlcDocumentAcknowledge.jsx';
import { memberProgress } from '../lib/church-member-intake.js';
import {
  readMyChurchRecord, patchMyChurchRecord, signChurchCovenant, readChurchRoll,
  listChurchDocuments, saveChurchDocument, shareChurchDocument, signedChurchDocumentUrl,
  removeChurchDocument, uploadChurchDocumentFile, exportChurchMemberRecord,
} from '../lib/church-member-sync.js';
import { liveSectionsFor, originalProduct } from '../lib/product-forms.js';
import { readProductForms } from '../lib/product-forms-sync.js';
import { CHURCH_DOC_KINDS, churchDocKindLabel, churchDocumentSlug, churchShelfSummary, validateChurchDocument } from '../lib/church-shelf.js';
import { churchInsights } from '../lib/church-insights.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_GOOD = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_WARN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full min-h-[36px] px-2 py-1 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';

const OFFICE_ROLES = ['owner', 'admin'];

// ---------------------------------------------------------------------------
// THE SHELF
// ---------------------------------------------------------------------------
function ShelfRow({ row, mine, onShare, onRemove }) {
  const [opening, setOpening] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const open = async () => {
    setOpening(true);
    const url = await signedChurchDocumentUrl(row.storagePath);
    setOpening(false);
    if (url) { try { window.open(url, '_blank', 'noopener'); } catch { /* the shelf still shows the row */ } }
  };
  return (
    <li className="py-2 border-t border-[#F0ECE4] first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm text-[#1A1815] font-semibold">{row.title}</div>
          <div className="text-[0.6875rem] text-[#5A5751]">
            {churchDocKindLabel(row.kind)}
            {row.storagePath ? ' · a file here' : ` · the paper is ${row.paperLocation}`}
            {row.sharedWithOffice ? ' · the office can see it' : ' · private to you'}
          </div>
          {row.note && <div className="text-[0.6875rem] text-[#5A5751] mt-0.5">{row.note}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          {row.storagePath && (
            <button type="button" onClick={open} disabled={opening} className={`${BTN}`}>{opening ? 'Opening…' : 'Open'}</button>
          )}
          {mine && (
            <button type="button" onClick={() => onShare(row, !row.sharedWithOffice)} className={`${BTN}`}>
              {row.sharedWithOffice ? 'Keep it private' : 'Share with the office'}
            </button>
          )}
          {mine && !confirm && <button type="button" onClick={() => setConfirm(true)} className={`${BTN_WARN}`}>Remove</button>}
          {mine && confirm && (
            <>
              <button type="button" onClick={() => onRemove(row)} className={`${BTN_WARN}`}>Remove for good</button>
              <button type="button" onClick={() => setConfirm(false)} className={`${BTN}`}>Keep it</button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function Shelf({ instanceId, myUserId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ title: '', kind: 'certificate', note: '', paperLocation: '', storagePath: '', sharedWithOffice: false });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');

  const refresh = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    const res = await listChurchDocuments(instanceId);
    setLoading(false);
    if (res.ok) { setRows(res.rows); setError(''); } else setError(res.message);
  }, [instanceId]);
  useEffect(() => { refresh(); }, [refresh]);

  const problems = validateChurchDocument({ ...draft, storagePath: draft.storagePath || (file ? 'pending' : '') });

  const file_it = async () => {
    setBusy(true); setSaid('');
    let pointer = { storagePath: draft.storagePath };
    if (file) {
      const up = await uploadChurchDocumentFile({ file, slug: churchDocumentSlug(draft.title), instanceId });
      if (!up.ok) { setBusy(false); setSaid(up.message); return; }
      pointer = up.pointer;
    }
    const res = await saveChurchDocument({ ...draft, storagePath: pointer.storagePath || '' }, instanceId);
    setBusy(false);
    if (!res.ok) { setSaid(res.message); return; }
    setDraft({ title: '', kind: 'certificate', note: '', paperLocation: '', storagePath: '', sharedWithOffice: false });
    setFile(null);
    setSaid('Filed.');
    refresh();
  };

  const summary = churchShelfSummary(rows);
  const mineRows = rows.filter((r) => !myUserId || r.filedBy === myUserId);

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Yours until you share it</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>Your shelf</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed" style={SERIF}>
          A shelf entry is either a file kept here in a private bucket, or a note of where the paper actually is —
          both count, because most of what a church holds for you is paper somebody already has.
          Nothing on this shelf reaches the office until you say so, and sharing it does not hand over the pen: it stays yours to change or remove.
        </p>
        {rows.length > 0 && (
          <p className="text-[0.6875rem] text-[#5A5751] mt-2">
            {summary.total} filed · {summary.files} {summary.files === 1 ? 'file' : 'files'} · {summary.pointers} pointed at paper · {summary.shared} shared with the office
          </p>
        )}
      </section>

      <section className="bg-white border border-[#E8E4DC] p-4 space-y-2">
        <div className="text-sm font-bold text-[#1A1815]">File something</div>
        <label className="block text-xs text-[#5A5751]">
          What is it?
          <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="My baptism certificate" className={`${FIELD}`} />
        </label>
        <label className="block text-xs text-[#5A5751]">
          Which shelf
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })} className={`${FIELD}`}>
            {CHURCH_DOC_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
        <p className="text-[0.6875rem] text-[#8A857C]">{(CHURCH_DOC_KINDS.find((k) => k.id === draft.kind) || {}).means}</p>
        <label className="block text-xs text-[#5A5751]">
          Upload the file (optional)
          <input type="file" onChange={(e) => setFile((e.target.files && e.target.files[0]) || null)} className={`${FIELD}`} />
        </label>
        <label className="block text-xs text-[#5A5751]">
          Or say where the paper is
          <input type="text" value={draft.paperLocation} onChange={(e) => setDraft({ ...draft, paperLocation: e.target.value })}
            placeholder="the blue folder at home" className={`${FIELD}`} />
        </label>
        <label className="block text-xs text-[#5A5751]">
          A note for yourself (optional)
          <input type="text" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className={`${FIELD}`} />
        </label>
        <label className="flex items-start gap-2 text-xs text-[#5A5751]">
          <input type="checkbox" checked={draft.sharedWithOffice} onChange={(e) => setDraft({ ...draft, sharedWithOffice: e.target.checked })}
            className="mt-0.5" />
          <span>Share it with the church office straight away. You can take that back at any time.</span>
        </label>
        {problems.length > 0 && draft.title !== '' && (
          <ul className="text-[0.6875rem] text-[#B85838] list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={file_it} disabled={busy || problems.length > 0} className={`${BTN_GOOD}`}>
            {busy ? 'Filing…' : 'File it'}
          </button>
          {said && <span className="text-xs text-[#5A5751]">{said}</span>}
        </div>
      </section>

      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-1">What is on the shelf</div>
        {error && <p className="text-xs text-[#B85838]">{error}</p>}
        {loading && <p className="text-xs text-[#5A5751]">Opening the shelf…</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-xs text-[#5A5751]" style={SERIF}>
            Nothing filed yet. This stays empty rather than showing an example — an example on your own shelf would be a lie about what you have.
          </p>
        )}
        {rows.length > 0 && (
          <ul>
            {rows.map((r) => (
              <ShelfRow key={r.id} row={r} mine={!myUserId || r.filedBy === myUserId}
                onShare={async (row, next) => { const res = await shareChurchDocument(row.id, next); if (res.ok) refresh(); else setError(res.message); }}
                onRemove={async (row) => { const res = await removeChurchDocument(row); if (res.ok) refresh(); else setError(res.message); }} />
            ))}
          </ul>
        )}
        {rows.length > 0 && mineRows.length !== rows.length && (
          <p className="text-[0.6875rem] text-[#8A857C] mt-2">
            Rows filed by someone else appear here only because they shared them with the office. You can open them; you cannot change them.
          </p>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE ROLL, AND WHAT IT CAN HONESTLY SAY
// ---------------------------------------------------------------------------
function OfficeRoll({ instanceId, church, onOpen }) {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  useEffect(() => {
    let alive = true;
    readChurchRoll(instanceId).then((res) => {
      if (!alive) return;
      setState({ loading: false, rows: res.ok ? res.rows : [], error: res.ok ? '' : res.message });
    });
    return () => { alive = false; };
  }, [instanceId]);

  const result = useMemo(() => churchInsights({ records: state.rows, church }), [state.rows, church]);

  if (state.loading) return <p className="text-sm text-[#5A5751]">Opening the roll…</p>;
  if (state.error) {
    return (
      <section className="border border-[#E8E4DC] bg-white p-4">
        <p className="text-sm text-[#1A1815] font-semibold mb-1">The roll did not open.</p>
        <p className="text-xs text-[#5A5751]">{state.error}</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#5A6E3D] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">What the congregation&apos;s own answers say</div>
        <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>Findings</h3>
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3" style={SERIF}>
          Every line below is arithmetic over answers people wrote themselves, computed here and sent nowhere.
          There is no giving figure in any of it — the record cannot hold one. No prayer request is read, only counted.
          Nobody is scored, ranked or flagged. Each finding names the rows it read, so you can check it.
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
        {onOpen && (
          <button type="button" onClick={() => onOpen({ view: 'church', sub: 'bus' })} className={`${BTN} mt-3`}>
            Open Bus Ministry
          </button>
        )}
      </section>

      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-sm font-bold text-[#1A1815] mb-1">The roll · {state.rows.length} {state.rows.length === 1 ? 'record' : 'records'}</div>
        <p className="text-xs text-[#5A5751] mb-2" style={SERIF}>
          The office sees a named set of cells and nothing else: who is here, how to reach them, where they stand, where they offered to serve,
          and whether they need a ride. What somebody studies, what their household looks like, and a prayer request they pointed at the pastor alone are not in here at all.
        </p>
        {state.rows.length === 0 && <p className="text-xs text-[#5A5751]">Nobody has filled in a record yet.</p>}
        {state.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <caption className="sr-only">The church roll: each person&apos;s name, standing, how to reach them, whether they need a ride, and the ministries they offered to serve</caption>
              <thead>
                <tr className="text-left text-[0.625rem] uppercase tracking-wider text-[#8A857C]">
                  <th scope="col" className="py-1 pr-3">Name</th>
                  <th scope="col" className="py-1 pr-3">Standing</th>
                  <th scope="col" className="py-1 pr-3">Reach them</th>
                  <th scope="col" className="py-1 pr-3">Ride</th>
                  <th scope="col" className="py-1 pr-3">Offered to serve</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((r) => (
                  <tr key={r.user_id} className="border-t border-[#F0ECE4] align-top">
                    <td className="py-1 pr-3 text-[#1A1815]">{r.fullName || '—'}</td>
                    <td className="py-1 pr-3 text-[#5A5751]">{r.standing || '—'}</td>
                    <td className="py-1 pr-3 text-[#5A5751] break-all">{r.contactEmail || r.contactPhone || '—'}</td>
                    <td className="py-1 pr-3 text-[#5A5751]">{r.needsRide === true ? 'needs a ride' : r.canDrive === true ? 'can drive' : '—'}</td>
                    <td className="py-1 pr-3 text-[#5A5751]">{(Array.isArray(r.servingInterest) ? r.servingInterest : []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE SPACE
// ---------------------------------------------------------------------------
export default function ChurchMemberSpace({ church = COLG_DEFAULT_CHURCH, myUserId = null, onOpen = null }) {
  const [view, setView] = useState(null);
  const [error, setError] = useState('');
  const [forms, setForms] = useState(() => originalProduct('lovecorner'));
  const [exported, setExported] = useState('');

  const refresh = useCallback(async () => {
    const res = await readMyChurchRecord(null, church);
    if (res.ok) { setView(res.view); setError(''); } else setError(res.message);
  }, [church]);
  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    let alive = true;
    readProductForms('lovecorner').then((res) => { if (alive) setForms(res.resolved); });
    return () => { alive = false; };
  }, []);

  const intake = forms['member-intake'] || null;
  const sections = useMemo(
    () => liveSectionsFor('lovecorner', 'member-intake', intake ? intake.form : null),
    [intake]);
  const covenant = forms['church-covenant'] || null;
  const record = view ? view.record : null;
  const progress = useMemo(() => memberProgress(record, church), [record, church]);
  const isOffice = view ? OFFICE_ROLES.includes(view.myRole) : false;

  if (error) {
    return (
      <section className="border border-[#E8E4DC] bg-white p-4">
        <p className="text-sm text-[#1A1815] font-semibold mb-1">Your record could not be opened.</p>
        <p className="text-xs text-[#5A5751]">{error}</p>
      </section>
    );
  }
  if (!view) return <p className="text-sm text-[#5A5751]">Opening your record…</p>;

  const areas = [
    { id: 'record', label: `My record · ${progress.pct}%`, icon: 'pencil', render: () => (
      <div className="space-y-4">
        <section className="bg-white border-2 border-[#1A1815] p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">{view.churchName || 'Your church'}</div>
          <h3 className="text-lg mb-1" style={{ ...SERIF, fontWeight: 600 }}>Your record</h3>
          <p className="text-xs text-[#5A5751] leading-relaxed" style={SERIF}>
            {progress.done} of {progress.total} questions answered, and every one of them earns its place by feeding something the church actually does —
            a ride on a real run, a welcome somebody owes you, a ministry that needs your name.
            This record holds no giving amount and no giving total: what you give is between you and Yahweh, and the database itself refuses to store it.
            Nobody fills this in for you.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button type="button" onClick={() => setExported(JSON.stringify(exportChurchMemberRecord(view, sections), null, 2))} className={`${BTN}`}>
              Export my record
            </button>
            {exported && <button type="button" onClick={() => setExported('')} className={`${BTN}`}>Hide it</button>}
          </div>
          {exported && <pre className="mt-2 text-[0.625rem] bg-[#FAF8F4] border border-[#E8E4DC] p-2 overflow-x-auto max-h-64">{exported}</pre>}
        </section>

        <TlcRecordEditor
          sections={sections} record={record} who="self" title="Fill or correct any answer"
          onSave={async (patch, note) => {
            const res = await patchMyChurchRecord(patch, note, null, church);
            if (res.ok) setView((prev) => ({ ...prev, record: res.view.record, updatedAt: res.view.updatedAt }));
            return res;
          }} />

        <section className="bg-white border border-[#E8E4DC] p-4">
          <div className="text-sm font-bold text-[#1A1815] mb-1">{covenant ? covenant.doc.title : 'What the church holds about you'}</div>
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
            docKey="churchCovenant" docName={covenant ? covenant.doc.title : 'What the church holds about you'}
            packetId={view.recordId}
            version={covenant ? `v${covenant.version}` : 'v0'}
            record={(record && record.acknowledgments && record.acknowledgments.churchCovenant) || null}
            onSign={(args) => signChurchCovenant('churchCovenant', args, null, church)}
            onAcknowledged={(v) => setView((prev) => ({ ...prev, record: v.record, updatedAt: v.updatedAt }))} />
        </section>
      </div>
    ) },
    { id: 'shelf', label: 'My documents', icon: 'book', render: () => <Shelf instanceId={view.instanceId} myUserId={myUserId} /> },
  ];

  if (isOffice) {
    areas.push({ id: 'roll', label: 'The roll', icon: 'users', render: () => (
      <OfficeRoll instanceId={view.instanceId} church={church} onOpen={onOpen} />
    ) });
  }

  return (
    <div className="space-y-4">
      <SectionTabs variant="sub" sections={areas} ariaLabel="My church record" idBase="church-member" defaultId="record" />
      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed flex items-start gap-1.5">
        <UiIcon name="lock" className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Your record and your shelf live in your church&apos;s own instance and are walled there by the database, not by this screen.
          Nothing here is sold, sent to an employer, a lender or an advertiser, used to decide who is welcome, or used to train anything.
        </span>
      </p>
    </div>
  );
}

export { Shelf, OfficeRoll };
