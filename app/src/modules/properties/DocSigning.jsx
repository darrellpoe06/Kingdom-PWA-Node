// =============================================================================
// DocSigning — papers on a door, sent for signature, signed, filed where they
// belong (DR-0901, migration 0263)
// =============================================================================
// Darrell, 2026-10-10: "Documents should be able to work integrated with the
// options to digitally sign... so all necessary documents are populated into
// their respective places... also have paper documents we can upload to keep
// as records for tenants".
//
// ONE PANEL, TWO SEATS.
//   * The family (landlord) sees every paper on the door and its tenancies,
//     sends one for signature (tenant, landlord, or both), and countersigns.
//   * The tenant sees their own tenancy's papers, signs what waits for them,
//     and files a paper of their own — a photo of it or the file.
// A signature is a typed legal name, two stated agreements, and the SHA-256 of
// the exact bytes on the screen; the database refuses any other version
// (0263). A signed paper stays in the tenancy it was filed to, so it is in the
// tenant's Documents and the door's Files without being copied.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { boundedRead } from '../../lib/bounded-read.js';
import { loadDoorPapers, loadSignatures, requestSignatures, signDocument, addDocument } from './cloud.js';
import { sha256Hex, signingState, canSign, dataUrlText, ESIGN_CONSENT, acknowledgmentAttestation } from './doc-signing.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const READ_MS = 8000;
const MAX_BYTES = 3 * 1024 * 1024;
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';
const stamp = (iso) => (iso ? new Date(iso).toLocaleString() : '');

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

/** The paper itself, as the signer reads it. */
export function DocView({ doc }) {
  const url = String(doc?.storage_path || '');
  const text = dataUrlText(url);
  if (text !== null) {
    return <pre className="text-xs whitespace-pre-wrap text-[#1A1815] border border-[#E8E4DC] p-2 max-h-96 overflow-auto" style={serif} data-testid="doc-text">{text}</pre>;
  }
  if (/^data:image\//.test(url)) return <img src={url} alt={doc.title} className="max-w-full border border-[#E8E4DC]" />;
  if (/^data:application\/pdf/.test(url)) return <iframe src={url} title={doc.title} className="w-full h-96 border border-[#E8E4DC]" />;
  return <a href={url} download={doc.title} className="text-sm underline text-[#2F5D50]">Open {doc.title}</a>;
}

/** Sign one paper as `role`. */
function SignForm({ doc, role, onDone }) {
  const [read, setRead] = useState(false);
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const attestation = acknowledgmentAttestation(doc.title);
  const ready = read && consent && name.trim().length >= 2;
  const sign = async () => {
    setBusy(true); setSaid('');
    const version = await sha256Hex(doc.storage_path);
    const r = await signDocument({ documentId: doc.id, role, signature: name, version, attestation, consent: ESIGN_CONSENT, deviceAt: new Date().toISOString() });
    setBusy(false);
    if (!r.ok) { setSaid(`Not signed: ${r.reason}`); return; }
    onDone(r.state === 'signed' ? `Signed ${new Date().toLocaleString()}. Everyone has signed; it is filed.` : `Signed ${new Date().toLocaleString()}. Waiting for the other signature.`);
  };
  return (
    <div className="mt-2 border-l-2 border-[#2F5D50] pl-3" data-testid="sign-form">
      <DocView doc={doc} />
      <label className="flex items-start gap-2 mt-2 text-sm text-[#1A1815]" style={serif}>
        <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} aria-label="I have read it" />
        <span>{attestation}</span>
      </label>
      <label className="flex items-start gap-2 mt-2 text-sm text-[#1A1815]" style={serif}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-label="I agree to sign electronically" />
        <span>{ESIGN_CONSENT}</span>
      </label>
      <label className="block text-xs text-[#5A5751] mt-2">Your full legal name
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Your full legal name" className={`${field} block w-full`} style={serif} maxLength={120} />
      </label>
      <div className="mt-2"><Btn tone="primary" disabled={!ready || busy} onClick={sign}>{busy ? 'Signing…' : `Sign as ${role}`}</Btn></div>
      {said && <p className="text-xs text-[#B85838] mt-2" role="alert">{said}</p>}
    </div>
  );
}

/** The family sends one paper for signature. */
function RequestForm({ doc, onDone }) {
  const [tenant, setTenant] = useState(Boolean(doc.tenancy_id));
  const [landlord, setLandlord] = useState(true);
  const [counsel, setCounsel] = useState(false);
  const [said, setSaid] = useState('');
  const generated = doc.source === 'generated';
  const signers = [tenant && 'tenant', landlord && 'landlord'].filter(Boolean);
  const send = async () => {
    const r = await requestSignatures(doc.id, signers, counsel);
    if (!r.ok) { setSaid(`Not sent: ${r.reason}`); return; }
    onDone(`Sent for signature ${new Date().toLocaleString()}.`);
  };
  return (
    <div className="mt-2 border-l-2 border-[#2F5D50] pl-3" data-testid="request-form">
      <label className="flex items-center gap-2 text-sm text-[#1A1815]" style={serif}>
        <input type="checkbox" checked={tenant} disabled={!doc.tenancy_id} onChange={(e) => setTenant(e.target.checked)} aria-label="The tenant signs" />
        The tenant signs{doc.tenancy_id ? '' : ' (file it to a tenancy first)'}
      </label>
      <label className="flex items-center gap-2 text-sm text-[#1A1815] mt-1" style={serif}>
        <input type="checkbox" checked={landlord} onChange={(e) => setLandlord(e.target.checked)} aria-label="The landlord signs" />
        The landlord signs
      </label>
      {generated && (
        <label className="flex items-start gap-2 text-sm text-[#1A1815] mt-2" style={serif}>
          <input type="checkbox" checked={counsel} onChange={(e) => setCounsel(e.target.checked)} aria-label="Counsel has reviewed this document" />
          <span>Counsel has reviewed this document for legal sufficiency. (A draft the app wrote goes to counsel before anyone signs it; your name and the time are kept with this.)</span>
        </label>
      )}
      <div className="mt-2"><Btn tone="primary" disabled={!signers.length || (generated && !counsel)} onClick={send}>Send for signature</Btn></div>
      {said && <p className="text-xs text-[#B85838] mt-2" role="alert">{said}</p>}
    </div>
  );
}

/**
 * What a tenant can say a paper is (Darrell, 2026-10-10: "Make sure tenants
 * can upload receipts etc to share with us... pictures for documentation").
 * Each maps onto property_documents' own kinds (0154).
 */
export const TENANT_PAPER_KINDS = Object.freeze([
  { id: 'receipt', label: 'A receipt' },
  { id: 'inspection', label: 'A picture for the record' },
  { id: 'correspondence', label: 'A letter or notice I got' },
  { id: 'insurance', label: 'Renter\u2019s insurance' },
  { id: 'other', label: 'Something else' },
]);

/** A tenant files papers of their own to their tenancy: one at a time or many. */
function AddPaper({ instanceId, tenancyId, onDone }) {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('receipt');
  const [said, setSaid] = useState('');
  const [busy, setBusy] = useState(false);
  const read = (f) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: f.name, type: f.type || '', size: f.size, url: String(reader.result || '') });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(f);
  });
  // "Multiple photo upload options" (Darrell, 2026-10-10): a picture from the
  // camera, or several chosen at once; each is filed as its own paper.
  const pick = async (e) => {
    const chosen = Array.from((e.target.files) || []);
    e.target.value = '';
    const big = chosen.filter((f) => f.size > MAX_BYTES);
    const ok = chosen.filter((f) => f.size <= MAX_BYTES);
    setSaid(big.length ? `${big.length} file${big.length === 1 ? ' is' : 's are'} over 3 MB and ${big.length === 1 ? 'was' : 'were'} left out. Take the picture a little farther away, or send a smaller file.` : '');
    const loaded = (await Promise.all(ok.map(read))).filter(Boolean);
    if (loaded.length) setFiles((prev) => [...prev, ...loaded]);
  };
  const save = async () => {
    setBusy(true);
    let n = 0;
    for (const [i, f] of files.entries()) {
      const name = title.trim() ? (files.length > 1 ? `${title.trim()} (${i + 1} of ${files.length})` : title.trim()) : f.name.replace(/\.[^.]+$/, '');
      const r = await addDocument({
        instance_id: instanceId, tenancy_id: tenancyId, kind, title: name,
        storage_path: f.url, mime_type: f.type, byte_size: f.size, source: 'upload', author_label: 'tenant',
      });
      if (r.ok) n += 1;
    }
    setBusy(false);
    if (!n) { setSaid('Not saved. Try again.'); return; }
    setFiles([]); setTitle('');
    onDone(`Filed ${n} paper${n === 1 ? '' : 's'} ${new Date().toLocaleString()}.`);
  };
  return (
    <div className="mt-2" data-testid="add-paper">
      <div className="flex flex-wrap gap-2">
        <label className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] bg-white text-[#1A1815] cursor-pointer">
          Take a picture of a paper
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} aria-label="Take a picture of a paper" />
        </label>
        <label className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] bg-white text-[#1A1815] cursor-pointer">
          Choose pictures
          <input type="file" accept="image/*" multiple className="sr-only" onChange={pick} aria-label="Choose pictures" />
        </label>
        <label className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] bg-white text-[#1A1815] cursor-pointer">
          Choose files
          <input type="file" accept="application/pdf,image/*,.txt" multiple className="sr-only" onChange={pick} aria-label="Choose a file" />
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-[#5A5751]" style={serif} data-testid="papers-ready">
            {files.length} ready: {files.map((f) => f.name).join(', ')}
          </p>
          <label className="block text-xs text-[#5A5751] mt-1">What is it
            <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="What kind of paper" className={`${field} block w-full`} style={serif}>
              {TENANT_PAPER_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#5A5751] mt-2">A few words about it (optional)
            <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="What is it" className={`${field} block w-full`} style={serif} />
          </label>
          <div className="mt-2 flex gap-2">
            <Btn tone="primary" disabled={busy} onClick={save}>{files.length > 1 ? `File these ${files.length} with my papers` : 'File it with my papers'}</Btn>
            <Btn onClick={() => setFiles([])}>Clear</Btn>
          </div>
        </div>
      )}
      {said && <p className="text-xs text-[#5A5751] mt-2" role="status">{said}</p>}
    </div>
  );
}

/**
 * The papers on a door. seat: 'landlord' (the family, every paper on the door
 * and its tenancies) or 'tenant' (this tenancy's papers).
 */
export function PapersPanel({ seat, rentalId = null, tenancyIds = [], tenancyId = null, instanceId = null }) {
  const [docs, setDocs] = useState(null);
  const [sigs, setSigs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [mode, setMode] = useState('');
  const [said, setSaid] = useState('');
  const ids = seat === 'tenant' ? [tenancyId].filter(Boolean) : tenancyIds;
  const key = `${rentalId}|${ids.join(',')}`;
  const load = useCallback(async () => {
    const d = await boundedRead(loadDoorPapers({ rentalId: seat === 'tenant' ? null : rentalId, tenancyIds: ids }), READ_MS, { ok: false });
    const list = d.ok ? d.documents : [];
    setDocs(list);
    const s = await boundedRead(loadSignatures(list.map((x) => x.id)), READ_MS, { ok: false });
    setSigs(s.ok ? s.signatures : []);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const done = (msg) => { setSaid(msg); setOpenId(null); setMode(''); load(); };
  const role = seat === 'tenant' ? 'tenant' : 'landlord';
  const list = docs || [];
  const waiting = list.filter((d) => canSign(d, sigs, role));
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid={`papers-${seat}`}>
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">
        {seat === 'tenant' ? 'My papers' : 'Papers and signatures'}{waiting.length ? ` · ${waiting.length} waiting for you to sign` : ''}
      </h3>
      {docs === null && <p className="text-xs text-[#5A5751]" style={serif}>Reading the papers…</p>}
      {docs && list.length === 0 && <p className="text-xs text-[#5A5751]" style={serif}>No papers yet.</p>}
      {list.map((d) => {
        const st = signingState(d, sigs);
        const mine = canSign(d, sigs, role);
        return (
          <div key={d.id} className="border-b border-[#F0EDE6] py-2" data-testid="paper-row">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-[#1A1815]" style={serif}>{d.title}</span>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{d.kind}{d.tenancy_id ? '' : ' · the property'}{d.author_label === 'tenant' ? ' · filed by the tenant' : ''}</span>
            </div>
            <div className="text-[0.6875rem] text-[#5A5751]" style={serif}>
              Filed {stamp(d.uploaded_at)}{d.sign_requested_at ? ` · sent for signature ${stamp(d.sign_requested_at)}` : ''}{st.line ? ` · ${st.line}` : ''}{d.signed_at ? ` ${stamp(d.signed_at)}` : ''}
            </div>
            {st.signed.map((s) => (
              <div key={s.role} className="text-[0.6875rem] text-[#5A5751] pl-2 border-l-2 border-[#E8E4DC]" style={serif}>
                Signed by the {s.role} as “{s.signature}”, {stamp(s.at)}
              </div>
            ))}
            <div className="flex flex-wrap gap-1 mt-1">
              <Btn onClick={() => { setOpenId(openId === d.id && mode === 'view' ? null : d.id); setMode('view'); }}>Read it</Btn>
              {mine && <Btn tone="primary" onClick={() => { setOpenId(d.id); setMode('sign'); }}>Sign it</Btn>}
              {seat === 'landlord' && st.state === 'none' && <Btn onClick={() => { setOpenId(d.id); setMode('request'); }}>Send for signature</Btn>}
            </div>
            {openId === d.id && mode === 'view' && <div className="mt-2"><DocView doc={d} /></div>}
            {openId === d.id && mode === 'sign' && <SignForm doc={d} role={role} onDone={done} />}
            {openId === d.id && mode === 'request' && <RequestForm doc={d} onDone={done} />}
          </div>
        );
      })}
      {seat === 'tenant' && tenancyId && instanceId && (
        <>
          <p className="text-xs text-[#5A5751] mt-3" style={serif}>
            Share a receipt, a picture for the record, or any paper with your landlord. It is filed with your papers, with the date and time, and your landlord sees it.
          </p>
          <AddPaper instanceId={instanceId} tenancyId={tenancyId} onDone={done} />
        </>
      )}
      {said && <p className="text-xs text-[#2F5D50] mt-2" role="status">{said}</p>}
    </section>
  );
}
