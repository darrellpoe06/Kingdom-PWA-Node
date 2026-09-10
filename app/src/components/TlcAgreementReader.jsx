// =============================================================================
// TlcAgreementReader — a TLC agreement, read in place (DR-0344)
// =============================================================================
// Renders one of the two agreements from lib/tlc-agreements.js, or the
// handbook's policy sections from lib/tlc-handbook.js, section by section —
// where a colleague signs it in the intake and where the Team section shows
// it. Nothing links out of the app.
import React from 'react';
import { TLC_HANDBOOK } from '../lib/tlc-handbook.js';

export function AgreementBody({ agreement }) {
  if (!agreement) return null;
  return (
    <div className="space-y-3 text-xs text-[#1A1815] leading-relaxed">
      <p className="text-[#5A5751]">{agreement.preamble}</p>
      {agreement.sections.map((s) => (
        <section key={s.n}>
          <h5 className="font-semibold">{s.n}. {s.title}</h5>
          {s.text && <p>{s.text}</p>}
          {s.items && <ul className="list-disc pl-4">{s.items.map((it) => <li key={it}>{it}</li>)}</ul>}
          {s.after && <p>{s.after}</p>}
        </section>
      ))}
    </div>
  );
}

export function HandbookBody() {
  return (
    <div className="space-y-3 text-xs text-[#1A1815] leading-relaxed">
      <p className="text-[#5A5751]">{TLC_HANDBOOK.welcome}</p>
      <p><b>Mission.</b> {TLC_HANDBOOK.mission}</p>
      <p><b>Vision.</b> {TLC_HANDBOOK.vision}</p>
      <p>{TLC_HANDBOOK.contractorStatus}</p>
      {TLC_HANDBOOK.sections.map((s) => (
        <section key={s.id}>
          <h5 className="font-semibold">{s.title}</h5>
          <dl>{s.items.map((it) => <div key={it.label}><dt className="font-semibold inline">{it.label}. </dt><dd className="inline text-[#5A5751]">{it.text}</dd></div>)}</dl>
        </section>
      ))}
    </div>
  );
}

// One reader for the three acknowledgments: 'policies' is the handbook,
// the other two are the agreements.
export default function TlcAgreementReader({ agreement = null, docKey = null, title = null }) {
  return (
    <div className="border border-[#E8E4DC] bg-white p-3 max-h-[60vh] overflow-y-auto" role="region" aria-label={title || (agreement && agreement.title) || 'Document'}>
      {title && <div className="text-sm font-bold text-[#1A1815] mb-2">{title}</div>}
      {docKey === 'policies' ? <HandbookBody /> : <AgreementBody agreement={agreement} />}
    </div>
  );
}
