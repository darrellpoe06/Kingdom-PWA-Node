// =============================================================================
// ReadingVoiceControl — pick YOUR reading voice once; it's the default everywhere
// =============================================================================
// The global voice picker. Writes the ONE persistent preference (lib/reading-voice
// via use-read-aloud), so the floating read-aloud control and every reading page
// read in the chosen voice — no re-picking per page. Sits beside the text-size
// control in the header (the accessibility / settings slot), with a fuller panel
// variant for the About/Settings page.
//
// EVERY VOICE IS CHOOSABLE (DR-0655): the list is VoicePicker — the same one
// the reader panel shows — with the church studio voice, the house (NAS)
// voices, and every phone voice, each with its one-line truth, and a sample
// played as a voice is picked. It is shown even on a device with no speech
// engine of its own (the house voices play as audio there), which is why the
// old `if (!supported) return null` is gone.
import React from 'react';
import { useReadAloud } from '../lib/use-read-aloud.js';
import VoicePicker from './VoicePicker.jsx';

export default function ReadingVoiceControl({ variant = 'header', isOwner = false, className = '' }) {
  const ra = useReadAloud({ isOwner });
  const isPanel = variant === 'panel';

  const picker = (
    <VoicePicker
      id={isPanel ? 'reading-voice-panel' : 'reading-voice-header'}
      label={isPanel ? 'Reading voice' : 'Reading voice — used everywhere read-aloud is offered'}
      catalog={ra.catalog}
      voiceId={ra.voiceId}
      setVoiceId={ra.setVoiceId}
      preview={ra.preview}
      isReading={ra.isReading}
      compact={!isPanel}
      showNote={isPanel}
    />
  );

  if (!isPanel) {
    return (
      <div className={`flex items-center gap-1 max-w-[16rem] ${className}`} style={{ fontSize: '1rem' }}>
        <span aria-hidden="true" className="text-sm" title="Reading voice">🔊</span>
        <div className="min-w-0 flex-1 [&_label]:sr-only">{picker}</div>
      </div>
    );
  }

  return (
    <div className={className} style={{ fontSize: '1.25rem' }}>
      <div className="text-[0.5rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">🔊 Reading voice</div>
      <p className="text-[0.6rem] text-[#5A5751] mb-2 leading-relaxed">
        Pick the voice that reads to you anywhere in the app. Each one plays a short sample as you pick it.
        It’s saved to your account, so it follows you to any device.
      </p>
      {picker}
      {ra.isReading && (
        <button type="button" onClick={ra.stop}
          className="mt-2 text-[0.55rem] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
      )}
      {ra.notice && <p className="text-[0.55rem] text-[#5A5751] mt-2">{ra.notice}</p>}
    </div>
  );
}
