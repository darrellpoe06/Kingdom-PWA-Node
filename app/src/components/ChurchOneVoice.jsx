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

export function ChurchOneVoice({ addPrayerRequest, updateConference, conference, addChurchVoice, churchVoice = [], sendToPoeTech, addIncident, addInquiry, officeEmail = null }) {
  return (
    <OneVoiceInput
      surface="church"
      heading="🕊 Yahweh Hears You · Speak · Type · Link"
      intro="One place for everything — today's sermon, a teaching, a prayer, the pastors, serving, a repair, an article link, an idea for the app, a thought you don't want to lose. Speak it or type it; we'll suggest where it goes and you always have the last word. It records right here — nothing jumps you to another page."
      placeholder="e.g., Please pray for Sister Mae's recovery · A word from today's sermon · The app should show giving statements…"
      submitLabel="Send"
      recent={churchVoice}
      officeEmail={officeEmail}
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
