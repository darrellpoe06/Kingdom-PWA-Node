// =============================================================================
// TlcAssistant — TLC's mount of the reusable office-assistant module
// =============================================================================
// The whole TLC referral + assistant workspace is the standalone, config-driven
// module (app/src/modules/office-assistant/). This component is the thin mount:
// it renders OfficeAssistant with the TLC config + the singleton TLC store.
// A different office is the SAME <OfficeAssistant> with a different config —
// one implementation, reused, never forked.
//
// DR-0271 (Christina 2026-08-04): the mount is ROLE-AWARE from the database —
//   * a granted 'assistant' account OPERATES the workspace (writes on: they
//     work the daily flow) — isGovernor comes from the server role, not only
//     the client email/tier gate;
//   * an owner/admin additionally gets the TEAM ACCESS tab — the control that
//     grants/confirms/revokes assistant rights (TlcTeamAccess.jsx).
// RLS is the real wall either way (migration 0130): the UI only agrees with it.
//
// NO PHI: referral SOURCES only (organizations + office contacts), never
// clients or protected health information — the Practice boundary, held
// (config.noPhiNote).
import React from 'react';
import OfficeAssistant from '../modules/office-assistant/OfficeAssistant.jsx';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';
import { tlcStore } from '../lib/use-referral-ops.js';
import { useInstanceRole, isAssistantRole, canManageTeam } from '../lib/instance-role.js';
import TlcTeamAccess from './TlcTeamAccess.jsx';

export default function TlcAssistant({ isGovernor = false } = {}) {
  const roleState = useInstanceRole();
  const operate = isGovernor || isAssistantRole(roleState);
  const extraSections = canManageTeam(roleState)
    ? [{ id: 'team', label: 'Team access', icon: 'lock', render: () => <TlcTeamAccess /> }]
    : [];
  return <OfficeAssistant config={TLC_CONFIG} store={tlcStore} isGovernor={operate} extraSections={extraSections} />;
}
