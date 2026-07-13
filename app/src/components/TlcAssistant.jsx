// =============================================================================
// TlcAssistant — TLC's mount of the reusable office-assistant module
// =============================================================================
// The whole TLC referral + assistant workspace is now the standalone, config-
// driven module (app/src/modules/office-assistant/). This component is the thin
// mount: it renders OfficeAssistant with the TLC config + the singleton TLC store.
// A different office is the SAME <OfficeAssistant> with a different config — one
// implementation, reused, never forked (Darrell's standalone-App-Module request).
//
// NO PHI: referral SOURCES only (organizations + office contacts), never clients
// or protected health information — the Practice boundary, held (config.noPhiNote).
import React from 'react';
import OfficeAssistant from '../modules/office-assistant/OfficeAssistant.jsx';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';
import { tlcStore } from '../lib/use-referral-ops.js';

export default function TlcAssistant({ isGovernor = false } = {}) {
  return <OfficeAssistant config={TLC_CONFIG} store={tlcStore} isGovernor={isGovernor} />;
}
