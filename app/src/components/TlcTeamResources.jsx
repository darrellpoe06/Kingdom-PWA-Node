// =============================================================================
// TlcTeamResources — the TLC team's own documents, inside the TLC app
// =============================================================================
// (DR-0344) Darrell, 2026-09-10: "We have lessons etc can we make sure those
// workflows are inside the TLC Therapy Solutions App… comb our drive for
// documentation of systems we need or should add here." This is the Team
// section of the TLC door for a signed-in colleague: the handbook readable in
// place (lib/tlc-handbook.js, TLC's own words), the agreements, the office's
// other systems documents with what the app carries of each, and the
// colleague's own intake packet status with the next step. No PHI, no client
// data; policy and training only.
import React, { useEffect, useState } from 'react';
import { TLC_HANDBOOK, TLC_OFFICE_DOCUMENTS } from '../lib/tlc-handbook.js';
import { PACKET_STATUSES, TLC_APP_PATH } from '../lib/tlc-onboarding.js';
import { myPacketStatus } from '../lib/tlc-onboarding-sync.js';
import UiIcon from './UiIcon.jsx';

const LINK = 'inline-flex items-center gap-1 text-xs underline text-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

function HandbookSection({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#F0ECE4] last:border-b-0">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full min-h-[36px] py-2 flex items-center justify-between gap-2 text-left text-sm font-semibold text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
        <span>{section.title}</span>
        <UiIcon name={open ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 shrink-0" />
      </button>
      {open && (
        <dl className="pb-2 space-y-2">
          {section.items.map((it) => (
            <div key={it.label}>
              <dt className="text-xs font-semibold text-[#1A1815]">{it.label}</dt>
              <dd className="text-xs text-[#5A5751] leading-relaxed">{it.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export default function TlcTeamResources({ onOpenTraining = null }) {
  const [mine, setMine] = useState(null);
  useEffect(() => {
    let alive = true;
    myPacketStatus().then((res) => { if (alive) setMine(res); });
    return () => { alive = false; };
  }, []);
  const st = mine && mine.status ? (PACKET_STATUSES[mine.status] || PACKET_STATUSES.draft) : null;

  return (
    <div className="space-y-4 pt-3">
      {st && (
        <section className="border border-[#1A1815] bg-white p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">My intake packet</div>
          <div className="text-sm font-bold text-[#1A1815]">{st.label}</div>
          <p className="text-xs text-[#5A5751] leading-relaxed mt-1">
            {mine.status === 'approved'
              ? 'You are on the roster. Your next step is Training: the session scripts and courses are ready for you.'
              : mine.status === 'submitted'
                ? 'Christina is reviewing it. You will see her answer on your packet.'
                : 'Your packet is still open. Reopen the invitation link Christina sent you to continue it.'}
          </p>
          {mine.status === 'approved' && onOpenTraining && (
            <button type="button" onClick={onOpenTraining} className="mt-2 min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Open Training</button>
          )}
        </section>
      )}

      <section className="bg-white border border-[#E8E4DC] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Who we are</div>
        <p className="text-sm text-[#1A1815] leading-relaxed mb-2">{TLC_HANDBOOK.welcome}</p>
        <div className="text-xs text-[#1A1815]"><b>Mission.</b> <span className="text-[#5A5751]">{TLC_HANDBOOK.mission}</span></div>
        <div className="text-xs text-[#1A1815] mt-1"><b>Vision.</b> <span className="text-[#5A5751]">{TLC_HANDBOOK.vision}</span></div>
        <div className="text-xs font-semibold text-[#1A1815] mt-2 mb-1">What we provide</div>
        <ul className="list-disc pl-4 text-xs text-[#5A5751]">{TLC_HANDBOOK.services.map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="text-xs text-[#5A5751] leading-relaxed mt-2">{TLC_HANDBOOK.contractorStatus}</p>
      </section>

      <section className="bg-white border border-[#E8E4DC] p-3">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Handbook · policies & procedures</div>
          <a href={TLC_HANDBOOK.sourceUrl} target="_blank" rel="noopener noreferrer" className={LINK}><UiIcon name="link" className="w-3 h-3" /> Source document</a>
        </div>
        {TLC_HANDBOOK.sections.map((s) => <HandbookSection key={s.id} section={s} />)}
        <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed mt-2">{TLC_HANDBOOK.acknowledgment}</p>
      </section>

      <section className="bg-white border border-[#E8E4DC] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Office documents</div>
        <ul className="divide-y divide-[#F0ECE4]">
          {TLC_OFFICE_DOCUMENTS.map((d) => (
            <li key={d.id} className="py-1.5 flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm text-[#1A1815]">{d.title}</div>
                <div className="text-[0.6875rem] text-[#5A5751]">{d.kind} · in the app: {d.inApp}</div>
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className={LINK} aria-label={`Open ${d.title} in Drive`}><UiIcon name="link" className="w-3 h-3" /> Drive</a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed">
        Colleague resources only. Client records never pass through this app; the clinical record lives in the practice&apos;s clinical system. To install this app on your phone, open <span className="font-mono">poetech.us{TLC_APP_PATH}</span> and add it to your home screen.
      </p>
    </div>
  );
}
