// =============================================================================
// TlcOnboardingReadout — one packet, read plainly (DR-0344)
// =============================================================================
// The SAME readout the colleague sees after submitting and Christina sees when
// reviewing: every field of the intake under the label it was asked with,
// documents as openable pointers (a short-lived signed URL fetched on tap —
// never a stored public link), banking as the masked view the server returns.
// Presentation only; who may read a packet is decided in migration 0187.
import React from 'react';
import { SECTIONS, DAYS, NO_CLIENTS, applicantName, formatDate } from '../lib/tlc-onboarding.js';
import { signedDocumentUrl } from '../lib/tlc-onboarding-sync.js';
import UiIcon from './UiIcon.jsx';
import { useDocumentViewer } from './DocumentViewer.jsx';
import { onboardingDocRecord } from '../lib/document-record.js';

function DocumentLink({ pointer, label }) {
  // DR-1086: an onboarding file opens INSIDE the app, in the one viewer every
  // shelf uses, with its record beside it (DR-1085). The signed url is still
  // fetched on tap and still short-lived; it is no longer handed to a new tab.
  // Only the colleague and the office ever reach this readout (0187), so both
  // see the full record.
  const viewer = useDocumentViewer();
  if (!pointer || !pointer.path) return <span className="text-xs text-[#8A857C]">not attached</span>;
  const open = () => viewer.open({
    title: label || pointer.fileName || 'Document',
    name: pointer.fileName || pointer.path,
    resolve: async () => {
      const u = await signedDocumentUrl(pointer.path);
      return u ? { ok: true, url: u } : { ok: false, reason: 'unknown' };
    },
    record: onboardingDocRecord(pointer, label, { admin: true }),
  });
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {viewer.element}
      <span className="text-xs text-[#1A1815] break-all">{pointer.fileName || 'file'}</span>
      <button type="button" onClick={open} aria-label={`Open ${label}`}
        className="min-h-[36px] px-2.5 text-xs font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
        Open
      </button>
    </span>
  );
}

function Row({ label, children }) {
  return (
    <div className="py-1.5 border-b border-[#F0ECE4] last:border-b-0">
      <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">{label}</div>
      <div className="text-sm text-[#1A1815] break-words">{children}</div>
    </div>
  );
}

function valueOf(field, packet) {
  const v = packet[field.key];
  if (field.type === 'multiselect') {
    const list = Array.isArray(v) ? v : [];
    if (!list.length) return <span className="text-[#8A857C]">none chosen</span>;
    return <ul className="list-disc pl-4">{list.map((id) => <li key={id}>{(field.options.find((o) => o.id === id) || {}).label || id}</li>)}</ul>;
  }
  if (field.type === 'yesno') return v === true ? 'Yes' : v === false ? 'No' : <span className="text-[#8A857C]">not answered</span>;
  if (field.type === 'date') return v ? formatDate(v) : <span className="text-[#8A857C]">not given</span>;
  const s = String(v || '').trim();
  return s ? <span className="whitespace-pre-wrap">{s}</span> : <span className="text-[#8A857C]">not given</span>;
}

export default function TlcOnboardingReadout({ view, sections = SECTIONS }) {
  if (!view || !view.packet) return null;
  const p = view.packet;
  const docs = p.documents || {};
  const acks = p.acknowledgments || {};
  const avail = p.availability || {};
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {view.headshot_thumb
          ? <img src={view.headshot_thumb} alt="" width="72" height="72" className="w-[72px] h-[72px] object-cover bg-[#E8E4DC] shrink-0" />
          : <div aria-hidden="true" className="w-[72px] h-[72px] bg-[#E8E4DC] flex items-center justify-center text-[#5A5751] shrink-0"><UiIcon name="users" /></div>}
        <div className="min-w-0">
          <div className="text-base font-bold text-[#1A1815]">{applicantName(p) || view.email || 'New colleague'}</div>
          <div className="text-xs text-[#5A5751]">{[p.licenseType, p.employmentStatus].filter(Boolean).join(' · ')}</div>
          {view.submitted_at && <div className="text-xs text-[#5A5751]">Submitted {formatDate(view.submitted_at)}</div>}
        </div>
      </div>

      {sections.map((s) => (
        <section key={s.id} className="border border-[#E8E4DC] bg-white p-3" aria-labelledby={`ro-${s.id}`}>
          <h4 id={`ro-${s.id}`} className="text-sm font-bold text-[#1A1815] mb-1">{s.title}</h4>
          {s.id === 'banking' && (
            <Row label="Direct deposit">
              {view.banking
                ? <>{view.banking.bank_name} · {view.banking.account_type} · routing ····{view.banking.routing_last4} · account ····{view.banking.account_last4}</>
                : <span className="text-[#8A857C]">not given</span>}
            </Row>
          )}
          {s.fields.map((f) => {
            if (f.type === 'file') return <Row key={f.key} label={f.label}><DocumentLink pointer={docs[f.key]} label={f.label} /></Row>;
            if (f.type === 'availability') {
              return (
                <Row key={f.key} label={f.label}>
                  <ul className="space-y-0.5">
                    {DAYS.map((d) => {
                      const slots = Array.isArray(avail[d]) ? avail[d] : [];
                      return <li key={d}><span className="font-semibold">{d}:</span> {slots.length ? (slots.includes(NO_CLIENTS) ? NO_CLIENTS : slots.join(', ')) : <span className="text-[#8A857C]">not set</span>}</li>;
                    })}
                  </ul>
                </Row>
              );
            }
            if (f.type === 'acknowledgment') {
              const a = acks[f.key] || {};
              return (
                <Row key={f.key} label={f.label}>
                  {a.agreed && a.signature
                    ? <>Signed <b>{a.signature}</b>{a.signedOn ? ` on ${formatDate(a.signedOn)}` : ''}{a.docVersion ? ` · document version ${a.docVersion}` : ''}{a.signedAt ? ` · ${a.signedAt.replace('T', ' ').slice(0, 16)} on their device` : ''}{a.signedAtServer ? ` · received ${a.signedAtServer.replace('T', ' ').slice(0, 16)} UTC by the office` : ''}{a.attestation ? <><br /><span className="text-[#5A5751]">Acknowledged:</span> “{a.attestation}”{a.agreedAt ? ` (checked ${a.agreedAt.replace('T', ' ').slice(0, 16)})` : ''}</> : null}</>
                    : <span className="text-[#B85838]">not signed</span>}
                  {f.attach && <div className="mt-1"><DocumentLink pointer={docs[`${f.key}Signed`]} label={`signed ${f.docName}`} /></div>}
                </Row>
              );
            }
            return <Row key={f.key} label={f.label}>{valueOf(f, p)}</Row>;
          })}
        </section>
      ))}
    </div>
  );
}
