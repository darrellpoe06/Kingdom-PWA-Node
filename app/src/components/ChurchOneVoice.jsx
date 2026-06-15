// =============================================================================
// ChurchOneVoice — the church family's "say it once" box
// =============================================================================
// Thin configuration of the shared <OneVoiceInput> (the master input). The
// Church surface starts on PRAYER; the words can pull the route anywhere in the
// system (Darrell 2026-06-11), the suggestion is visible, and the person always
// has the last word. Type or speak — the mic appears where the browser supports
// it. Built for Bishop Gwin first: the head shepherd, under the Shepherd and
// Overseer of souls (1 Peter 2:25). Consolidated into OneVoiceInput 2026-06-15.
import React from 'react';
import OneVoiceInput from './OneVoiceInput.jsx';

export function ChurchOneVoice({ addPrayerRequest, updateConference, conference, addChurchVoice, churchVoice = [], sendToPoeTech, addIncident, addInquiry }) {
  return (
    <OneVoiceInput
      surface="church"
      heading="🕊 Speak — one place for everything"
      intro="Prayer, the Assembly, the pastors, serving, a repair, counseling, even an idea for the app — just say it. We'll suggest where it goes; you always have the last word."
      placeholder="e.g., Please pray for Sister Mae's recovery · The fellowship-hall sink is leaking · The app should show giving statements…"
      submitLabel="Send"
      recent={churchVoice}
      addPrayerRequest={addPrayerRequest}
      updateConference={updateConference}
      conference={conference}
      sendToPoeTech={sendToPoeTech}
      addIncident={addIncident}
      addInquiry={addInquiry}
      addChurchVoice={addChurchVoice}
    />
  );
}

export default ChurchOneVoice;
