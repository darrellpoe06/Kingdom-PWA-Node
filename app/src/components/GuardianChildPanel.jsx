// =============================================================================
// GuardianChildPanel — set what a child can see & do + the approval queue
// =============================================================================
// MOVED here from Relationships.jsx as part of the one-home consolidation
// (DR-0095; Darrell 2026-07-03: "we have too many places that are similar…
// consolidate the inputs from users inside one that has all the features and
// conditions of the others"). The ONE input home for family is the Family
// Roster (Center → Serve): add a member there and decide what they can see
// and do right there — this panel is that decision surface. Relationships
// keeps its landlord↔tenant domain and points here for family.
//
// Two corrections carried in the move:
//   1. The old panel note said family finances "are locked and cannot be
//      granted" — contradicting the Governor's standing decision (DR-0094).
//      Money VISIBILITY is the guardian's call (No / Ask / Yes); spending and
//      security stay locked because they ACT.
//   2. Personas were hardcoded twin placeholders and the config was flattened
//      across children. Personas now come from the REAL roster rows and the
//      config is per-persona — one child's grant never bleeds onto another.
//
// Presentational: personas, per-persona config, and handlers are props, so the
// panel is fully testable with injected IO and can never self-fetch stale data.
import React, { useMemo, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import { MetricCell } from './shared.jsx';
import {
  SETTING, CHILD_CAPABILITIES, CAPABILITIES, isChildCapabilityLocked, CHILD_CAPABILITY_POLICY,
} from '../lib/relationships.js';
import { childAccessSummary, decideChildAction } from '../lib/guardian-child.js';

// Setting -> themeable classes (text + border + active fill). Class hexes remap
// per-theme; inline hexes would not (and would fail on midnight).
export const SETTING_CLASS = {
  [SETTING.ALLOW]:    { text: 'text-[#5A6E3D]', border: 'border-[#5A6E3D]', fill: 'bg-[#5A6E3D]', label: 'Allowed' },
  [SETTING.APPROVAL]: { text: 'text-[#2A5A8E]', border: 'border-[#2A5A8E]', fill: 'bg-[#2A5A8E]', label: 'Needs approval' },
  [SETTING.DENY]:     { text: 'text-[#5A5751]', border: 'border-[#5A5751]', fill: 'bg-[#5A5751]', label: 'Not allowed' },
};
export const verdictToSetting = (v) => (v === 'allow' ? SETTING.ALLOW : v === 'needs-approval' ? SETTING.APPROVAL : SETTING.DENY);

function Badge({ children, cls }) {
  return (
    <span className={`inline-block px-2 py-0.5 border text-xs font-semibold ${cls.border} ${cls.text}`}>
      {children}
    </span>
  );
}

function Panel({ title, icon, children, note }) {
  return (
    <section className="bg-white border-2 border-[#1A1815] mb-4">
      <div className="px-4 py-3 border-b border-[#E8E4DC]">
        <h3 className="text-sm font-bold flex items-center gap-1.5 text-[#1A1815]"><UiIcon name={icon} className="w-4 h-4" /> {title}</h3>
        {note ? <p className="text-xs text-[#5A5751] mt-0.5">{note}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function GuardianChildPanel({ personas, configByPersona, onSetCapability, requests, onResolve, saving }) {
  const [persona, setPersona] = useState(personas[0]?.id || 'child');
  const activePersona = personas.some((p) => p.id === persona) ? persona : (personas[0]?.id || 'child');
  const config = useMemo(
    () => (configByPersona && configByPersona[activePersona]) || {},
    [configByPersona, activePersona],
  );
  const summary = useMemo(() => childAccessSummary(config), [config]);
  const pending = (requests || []).filter((r) => r.status === 'pending');

  return (
    <>
      <Panel title="Set what each child can see & do" icon="sliders"
        note="Defaults are child-safe. Outbound actions can be set to ask-first at most; spending and security stay locked because they act. What a child SEES — including the family finances, for money education — is the guardian's decision (DR-0094). Every change here is a deliberate guardian action, per child.">
        {personas.length > 1 ? (
          <div className="flex gap-2 mb-4 flex-wrap">
            {personas.map((p) => (
              <button key={p.id} type="button" onClick={() => setPersona(p.id)}
                className={`px-3 py-1.5 border border-[#1A1815] text-sm font-semibold min-h-[36px] ${activePersona === p.id ? 'bg-[#1A1815] text-white' : 'bg-white text-[#1A1815]'}`}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <MetricCell label="Can do" value={summary.can.length} />
          <MetricCell label="Ask first" value={summary.withApproval.length} />
          <MetricCell label="Never" value={summary.never.length} />
        </div>

        <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815]">
          {CHILD_CAPABILITIES.map((cap) => {
            const meta = CAPABILITIES[cap];
            const locked = isChildCapabilityLocked(cap);
            const current = decideChildAction(cap, config);
            const maxRank = CHILD_CAPABILITY_POLICY[cap].maxGrant;
            const activeSetting = verdictToSetting(current.verdict);
            const choices = [SETTING.DENY, SETTING.APPROVAL, SETTING.ALLOW];
            return (
              <li key={cap} className="px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1 text-[#1A1815]">
                    {meta.label}
                    {locked ? <UiIcon name="lock" className="w-3 h-3" /> : null}
                    {meta.outbound ? <span className="text-xs text-[#B85838]" title="leaves the family">↗</span> : null}
                  </div>
                  <div className="text-xs text-[#5A5751]">{meta.desc}</div>
                </div>
                {locked ? (
                  <Badge cls={SETTING_CLASS[SETTING.DENY]}>Locked</Badge>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    {choices.map((choice) => {
                      const allowedChoice = choice === SETTING.DENY
                        || (choice === SETTING.APPROVAL && maxRank !== SETTING.DENY)
                        || (choice === SETTING.ALLOW && maxRank === SETTING.ALLOW);
                      if (!allowedChoice) return null;
                      const active = activeSetting === choice;
                      const cs = SETTING_CLASS[choice];
                      const lbl = choice === SETTING.DENY ? 'No' : choice === SETTING.APPROVAL ? 'Ask' : 'Yes';
                      return (
                        <button key={choice} type="button" disabled={saving}
                          onClick={() => onSetCapability(activePersona, cap, choice)}
                          className={`px-2 py-1 min-h-[36px] border text-xs font-semibold ${cs.border} ${active ? `${cs.fill} text-white` : `bg-white ${cs.text}`}`}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Approval queue" icon="check"
        note="When a child tries something set to ask-first, it lands here for a guardian to approve or deny. A child can never approve their own request.">
        {pending.length === 0 ? (
          <p className="text-sm text-[#5A5751]">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815]">
            {pending.map((req) => (
              <li key={req.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1815]">
                    {(CAPABILITIES[req.capability]?.label) || req.capability}
                    {req.child_persona ? <span className="ml-1 text-xs text-[#5A5751]">· {req.child_persona}</span> : null}
                  </div>
                  {req.context ? <div className="text-xs text-[#5A5751]">{req.context}</div> : null}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => onResolve(req, 'approved')} className="px-2 py-1 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] text-xs font-semibold">Approve</button>
                  <button type="button" onClick={() => onResolve(req, 'denied')} className="px-2 py-1 min-h-[36px] border border-[#5A5751] text-[#5A5751] text-xs font-semibold">Deny</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
