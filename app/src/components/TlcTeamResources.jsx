// =============================================================================
// TlcTeamResources — the TLC team's own documents, INSIDE the app (DR-0344)
// =============================================================================
// Darrell, 2026-09-10, on seeing Drive links here: "I want this built into
// the App!" / "why would you use Google?! fix it build the whole process
// workflows!" Nothing here links out. The handbook and both agreements are
// read in place (their text is data); the training notes are the six courses
// on Training; the intake form is the Onboarding tab; the launch tracker is a
// live board here; the "Finding Peace" manuscript is the client lesson track
// on Training. `onOpen(tabId)` moves the slider to a sister tab.
import React, { useEffect, useMemo, useState } from 'react';
import { TLC_HANDBOOK } from '../lib/tlc-handbook.js';
import { readOfficeDocuments } from '../lib/tlc-office-forms-sync.js';
import TlcFormPreview from './TlcFormPreview.jsx';
import { TLC_CONTRACTOR_AGREEMENT, TLC_CONFIDENTIALITY_AGREEMENT } from '../lib/tlc-agreements.js';
import { PACKET_STATUSES, TLC_APP_PATH } from '../lib/tlc-onboarding.js';
import { myPacketStatus, readPacket, patchPacket } from '../lib/tlc-onboarding-sync.js';
import TlcRecordEditor from './TlcRecordEditor.jsx';
import { liveSections } from '../lib/tlc-office-forms.js';
import { AgreementBody } from './TlcAgreementReader.jsx';
import TlcLaunchBoard from './TlcLaunchBoard.jsx';
import SectionTabs from './SectionTabs.jsx';
import TlcGovernance from './TlcGovernance.jsx';
import { canManageTeam } from '../lib/instance-role.js';
import UiIcon from './UiIcon.jsx';

const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]';

function Fold({ title, kind, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#F0ECE4] last:border-b-0">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full min-h-[36px] py-2 flex items-center justify-between gap-2 text-left focus:outline focus:outline-2 focus:outline-[#B85838]">
        <span className="min-w-0"><span className="text-sm font-semibold text-[#1A1815] block">{title}</span>{kind && <span className="text-[0.6875rem] text-[#5A5751]">{kind}</span>}</span>
        <UiIcon name={open ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 shrink-0" />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function HandbookSections({ handbook = TLC_HANDBOOK }) {
  return (
    <dl className="space-y-2">
      {handbook.sections.map((s) => (
        <div key={s.id}>
          <dt className="text-xs font-semibold text-[#1A1815]">{s.title}</dt>
          {s.items.map((it) => <dd key={it.label} className="text-xs text-[#5A5751] leading-relaxed"><b className="text-[#1A1815]">{it.label}.</b> {it.text}</dd>)}
        </div>
      ))}
    </dl>
  );
}

export default function TlcTeamResources({ onOpen = null, staff = false, roleState = null, userId = null }) {
  const [mine, setMine] = useState(null);
  // The office's LIVE documents (0196): what a colleague reads here is what
  // they sign in the packet, at the version the office last saved.
  const [docs, setDocs] = useState(null);
  useEffect(() => {
    let alive = true;
    readOfficeDocuments().then((res) => { if (alive) setDocs(res.resolved); });
    return () => { alive = false; };
  }, []);
  const handbook = docs ? docs.documents.policies.doc : TLC_HANDBOOK;
  const contractor = docs ? docs.documents.contractorAgreement.doc : TLC_CONTRACTOR_AGREEMENT;
  const confidentiality = docs ? docs.documents.confidentiality.doc : TLC_CONFIDENTIALITY_AGREEMENT;
  useEffect(() => {
    let alive = true;
    myPacketStatus().then((res) => { if (alive) setMine(res); });
    return () => { alive = false; };
  }, []);
  const st = mine && mine.status ? (PACKET_STATUSES[mine.status] || PACKET_STATUSES.draft) : null;
  // MY RECORD (DR-0354): a colleague fills or corrects any cell of their own
  // packet, at any status — opened on demand, saved cell by cell.
  const [record, setRecord] = useState(null); // null = closed; { view } | { error }
  const sections = useMemo(() => liveSections(docs ? docs.intakeForm.form : null), [docs]);
  const openRecord = async () => {
    if (record) { setRecord(null); return; }
    const res = await readPacket(mine.packetId);
    setRecord(res.ok ? { view: res.view } : { error: res.message });
  };
  const go = (id) => (onOpen ? <button type="button" onClick={() => onOpen(id)} className={BTN}>Open {id === 'training' ? 'Training' : id === 'onboarding' ? 'Onboarding' : id}</button> : null);

  const documents = (
    <section className="bg-white border border-[#E8E4DC] p-3">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Office documents · all in the app</div>
      <Fold title="Independent Contractor Handbook" kind="Policies & procedures · read here">
        <HandbookSections handbook={handbook} />
        <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed mt-2">{handbook.acknowledgment}</p>
      </Fold>
      <Fold title={contractor.title} kind="Agreement · read here; signed in the intake packet">
        <AgreementBody agreement={contractor} />
      </Fold>
      <Fold title={confidentiality.title} kind="Agreement · read here; signed in the intake packet">
        <AgreementBody agreement={confidentiality} />
      </Fold>
      <Fold title="Training Notes for Therapists-in-Training" kind="Six session-script courses on Training">
        <p className="text-xs text-[#5A5751] leading-relaxed mb-2">Christina’s six session scripts — finding herself, learning to say no, managing anger, family conflict, household imbalance, healing after an unhealthy relationship — are courses on the Training tab, with her wording and the Word verbatim.</p>
        {go('training')}
      </Fold>
      <Fold title="Therapist Onboarding | Hiring Form" kind="The Onboarding intake packet · read it here">
        <p className="text-xs text-[#5A5751] leading-relaxed mb-2">Every question the hiring form asked is the intake packet a colleague completes from Christina’s invite link{staff ? '; the office manages invites and reviews packets on the Onboarding tab' : ''}.</p>
        {/* THE FORM ITSELF (Darrell 2026-09-10: "Where is the intake form, and
            why can't we see it?"): every question, in order, from the office's
            live definition — the same one the packet renders. */}
        <TlcFormPreview form={docs ? docs.intakeForm.form : null} version={docs ? docs.intakeForm.version : 0} compact />
        {staff ? <div className="mt-2">{go('onboarding')}</div> : null}
      </Fold>
      <Fold title="Finding Peace: Biblical Wisdom for Life’s Stressors" kind="Christina’s book · eleven client lessons on Training">
        <p className="text-xs text-[#5A5751] leading-relaxed mb-2">The eleven chapters are lessons on the client side of Training — the Psalms and prayer, Proverbs for a sound mind, the healing stories, Philippians on anxiety, Corinthians on love, surrender, Romans 12, Thessalonians on gratitude, the Psalms of lament, Ecclesiastes on change, and perfect peace — each with the Word verbatim and her practical tips.</p>
        {go('training')}
      </Fold>
    </section>
  );
  const whoWeAre = (
    <section className="bg-white border border-[#E8E4DC] p-3">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Who we are</div>
      <p className="text-sm text-[#1A1815] leading-relaxed mb-2">{TLC_HANDBOOK.welcome}</p>
      <div className="text-xs text-[#1A1815]"><b>Mission.</b> <span className="text-[#5A5751]">{TLC_HANDBOOK.mission}</span></div>
      <div className="text-xs text-[#1A1815] mt-1"><b>Vision.</b> <span className="text-[#5A5751]">{TLC_HANDBOOK.vision}</span></div>
      <div className="text-xs font-semibold text-[#1A1815] mt-2 mb-1">What we provide</div>
      <ul className="list-disc pl-4 text-xs text-[#5A5751]">{TLC_HANDBOOK.services.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="text-xs text-[#5A5751] leading-relaxed mt-2">{TLC_HANDBOOK.contractorStatus}</p>
    </section>
  );
  const areas = [
    { id: 'documents', label: 'Documents', icon: 'book', render: () => documents },
    staff ? { id: 'launch', label: 'Launch board', icon: 'check', render: () => <section className="bg-white border border-[#E8E4DC] p-3"><TlcLaunchBoard /></section> } : null,
    { id: 'who', label: 'Who we are', icon: 'users', render: () => whoWeAre },
    // Owners and managers govern from the same app (DR-0346): the hierarchy,
    // the live members with guarded seat changes, invites, removal.
    roleState && canManageTeam(roleState) ? { id: 'governance', label: 'Governance', icon: 'crown', render: () => <TlcGovernance instanceId={roleState.instanceId} myRole={roleState.role} myUserId={userId} /> } : null,
  ];

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
          <div className="mt-2 flex flex-wrap gap-2">
            {mine.status === 'approved' && go('training')}
            <button type="button" onClick={openRecord} aria-expanded={!!record} className={`${BTN}`}>{record ? 'Close my record' : 'My record · fill or correct any cell'}</button>
          </div>
          {record && record.error && <p className="text-xs text-[#B85838] mt-2" role="alert">{record.error}</p>}
          {record && record.view && (
            <div className="mt-3">
              <TlcRecordEditor sections={sections} record={record.view.packet} who="self" title="My record"
                onSave={async (patch, n) => { const res = await patchPacket(mine.packetId, patch, n); if (res.ok) setRecord({ view: res.view }); return res; }} />
            </div>
          )}
        </section>
      )}

      {/* The areas of Team, side by side on a second row (Darrell 2026-09-10:
          "another tab slider for each section... and any long scrolling
          tabs... users need to see the areas easier"): the documents, the
          office's launch board (staff), who we are. One shows at a time. */}
      <SectionTabs variant="sub" sections={areas} ariaLabel="Team areas" idBase="tlc-team" defaultId="documents" />

      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed">
        Colleague resources only. Client records never pass through this app; the clinical record lives in the practice&apos;s clinical system. To install this app on your phone, open <span className="font-mono">poetech.us{TLC_APP_PATH}</span> and add it to your home screen.
      </p>
    </div>
  );
}
