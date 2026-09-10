// =============================================================================
// TlcDocumentAcknowledge — the check at the bottom of a document (DR-0356)
// =============================================================================
// Darrell 2026-09-10: "still don't have a check box at the bottom of the
// documents with time stamps for when they agreed... like a green check that
// they acknowledged!"
//
// Under the handbook and the two agreements, wherever a colleague reads them:
//   - not yet acknowledged → the attestation checkbox ("By checking this box,
//     I acknowledge…"), the full legal name typed as the signature, the
//     e-sign consent line, one Acknowledge button;
//   - acknowledged → a GREEN CHECK with who signed, the moment the box was
//     checked (their device), the moment the office received it (its own
//     clock, 0199), and the document version signed;
//   - the document was revised since → the green check stays for the version
//     signed, and the checkbox returns for the new version.
// A person with no packet (a client, the office owner) sees nothing here: an
// acknowledgment is a colleague's own act on their own record.
//
// Presentation only; the write is tlc-onboarding-sync.js acknowledgeDocument
// → migration 0199 (self only, any status, stamped by the office).
// =============================================================================
import React, { useState } from 'react';
import { acknowledgmentAttestation, documentVersion, ESIGN_CONSENT } from '../lib/tlc-signing.js';
import { acknowledgeDocument } from '../lib/tlc-onboarding-sync.js';
import { INPUT } from './TlcFieldInputs.jsx';
import UiIcon from './UiIcon.jsx';

const BTN_GOOD = 'min-h-[36px] px-4 py-2 text-sm font-semibold border border-[#5A6E3D] text-[#3F5226] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const when = (iso) => (iso ? String(iso).replace('T', ' ').slice(0, 16) : '');

/** The stored record, read plainly: is this document acknowledged at the version now shown? */
export function acknowledgmentState(record, version) {
  const a = record && typeof record === 'object' ? record : null;
  const signed = !!(a && a.agreed === true && String(a.signature || '').trim());
  const current = signed && (!version || !a.docVersion || a.docVersion === version);
  return { signed, current, record: a };
}

/**
 * @param {object} props
 * @param {'policies'|'confidentiality'|'contractorAgreement'} props.docKey
 * @param {string} props.docName      the document's title, for the sentence
 * @param {object|null} props.live    the office's live documents (liveDocuments), for the version
 * @param {string|null} props.packetId  the colleague's own packet; null = nothing to show
 * @param {object|null} props.record  packet.acknowledgments[docKey]
 * @param {(view: object) => void} [props.onAcknowledged]  the packet view after the write
 */
export default function TlcDocumentAcknowledge({ docKey, docName, live = null, packetId = null, record = null, onAcknowledged = null }) {
  const [checked, setChecked] = useState(false);
  const [checkedAt, setCheckedAt] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!packetId) return null;
  const version = documentVersion(docKey, live) || '';
  const st = acknowledgmentState(record, version);
  const attestation = acknowledgmentAttestation(docName);
  const id = `ack-${docKey}`;

  const sign = async () => {
    if (!checked || !name.trim() || busy) return;
    setBusy(true); setError('');
    const res = await acknowledgeDocument(packetId, docKey, { signature: name, docVersion: version, attestation, agreedAt: checkedAt });
    setBusy(false);
    if (!res.ok) { setError(res.message || 'That could not be recorded.'); return; }
    setChecked(false); setCheckedAt(''); setName('');
    if (onAcknowledged) onAcknowledged(res.view);
  };

  return (
    <div className="mt-3 border-t border-[#E8E4DC] pt-3" aria-label={`Acknowledge the ${docName}`}>
      {st.signed && (
        <div className={`flex items-start gap-2 p-2 border ${st.current ? 'border-[#5A6E3D] bg-[#F0F4EA]' : 'border-[#E8E4DC] bg-[#FAF8F4]'}`} role="status">
          <span role="img" aria-label="acknowledged" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#5A6E3D] text-white shrink-0"><UiIcon name="check" className="w-4 h-4" /></span>
          <div className="text-xs text-[#1A1815] leading-relaxed">
            <div className="font-semibold text-[#3F5226]">Acknowledged{st.current ? '' : ' — an earlier version'}</div>
            <div>Signed <b>{st.record.signature}</b>{st.record.agreedAt ? ` · checked ${when(st.record.agreedAt)} on your device` : ''}{st.record.signedAtServer ? ` · received by the office ${when(st.record.signedAtServer)} UTC` : ''}{st.record.docVersion ? ` · document version ${st.record.docVersion}` : ''}</div>
            {st.record.attestation && <div className="text-[#5A5751]">“{st.record.attestation}”</div>}
            {!st.current && <div className="text-[#B85838] mt-1">This document has been revised since (now version {version}). Please read it and acknowledge the new version below.</div>}
          </div>
        </div>
      )}
      {!st.current && (
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-2 min-h-[36px] cursor-pointer">
            <input id={`${id}-box`} type="checkbox" checked={checked} disabled={busy} aria-label={attestation}
              onChange={(e) => { setChecked(e.target.checked); setCheckedAt(e.target.checked ? new Date().toISOString() : ''); }}
              className="mt-1 h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" />
            <span className="text-sm text-[#1A1815]">{attestation}</span>
          </label>
          <label htmlFor={`${id}-name`} className="block text-xs font-semibold text-[#1A1815]">Sign by typing your full legal name</label>
          <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} autoComplete="name" className={INPUT} />
          <p className="text-[0.6875rem] text-[#5A5751] leading-relaxed">{ESIGN_CONSENT}{version ? ` Document version ${version}.` : ''}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={sign} disabled={!checked || !name.trim() || busy} className={`${BTN_GOOD}`}>{busy ? 'Recording…' : 'Acknowledge and sign'}</button>
            {error && <span className="text-xs text-[#B85838]" role="alert">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
