// =============================================================================
// ReadingVoiceControl — pick YOUR reading voice once; it's the default everywhere
// =============================================================================
// The global voice picker. Writes the ONE persistent preference (lib/reading-voice
// via use-read-aloud), so the floating read-aloud control and every reading page
// read in the chosen voice — no re-picking per page. Sits beside the text-size
// control in the header (the accessibility / settings slot), with a fuller panel
// variant for the About/Settings page.
//
// Grouped <select> (System / Your voices / Voices & accents) so it scales to many
// browser voices and accents. A "Test" button speaks a short sample in the pick so
// the choice is audible before it's committed. Personal (cloned) voices are
// AI-labeled; until the voice studio is live they play a stand-in (honest).
import React from 'react';
import { useReadAloud } from '../lib/use-read-aloud.js';

const SAMPLE = 'This is your reading voice. The Lord is my shepherd; I shall not want.';

export default function ReadingVoiceControl({ variant = 'header', isOwner = false, className = '' }) {
  const ra = useReadAloud({ isOwner });
  const isPanel = variant === 'panel';

  if (!ra.supported) return null; // device can't read aloud — show nothing

  // Group the catalog for the <select> (System, Your voices, Voices & accents).
  const groups = ra.catalog.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {});
  const order = ['Default', 'Your voices', 'Voices & accents'];
  const orderedGroups = order.filter((g) => groups[g] && groups[g].length);

  const onChange = (e) => {
    const item = ra.catalog.find((c) => c.id === e.target.value);
    if (item && !item.usable) return; // entitlement-gated (subscriber voice)
    ra.setVoiceId(e.target.value);
  };

  const select = (
    <select
      aria-label="Reading voice — used everywhere read-aloud is offered"
      value={ra.voiceId}
      onChange={onChange}
      className={[
        'border-2 bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]',
        isPanel ? 'w-full text-sm border-[#E8E4DC] px-3 py-2.5 rounded-md' : 'text-[11px] border-[#E8E4DC] px-2 py-1.5 rounded-md max-w-[10rem]',
      ].join(' ')}
    >
      {orderedGroups.map((g) => (
        <optgroup key={g} label={g}>
          {groups[g].map((item) => (
            <option key={item.id} value={item.id} disabled={!item.usable}>
              {item.label}{item.ai ? ' · AI' : ''}{item.standIn ? ' (stand-in)' : ''}{item.deviceVoice ? ` · ${item.deviceVoice}` : ''}{!item.usable ? ' — subscriber' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  if (!isPanel) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span aria-hidden="true" className="text-sm" title="Reading voice">🔊</span>
        {select}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">🔊 Reading voice</div>
      <p className="text-[12px] text-[#5A5751] mb-2 leading-relaxed">
        Pick the voice that reads to you anywhere in the app. It’s saved to your account, so it
        follows you to any device.
      </p>
      {select}
      <div className="mt-2 flex items-center gap-2">
        {!ra.isReading ? (
          <button type="button" onClick={() => ra.read(SAMPLE)}
            className="text-[11px] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Test</button>
        ) : (
          <button type="button" onClick={ra.stop}
            className="text-[11px] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
        )}
        {ra.currentItem && ra.currentItem.ai && <span className="text-[10px] text-[#5A5751]">AI-generated voice{ra.currentItem.standIn ? ' — stand-in until the studio is live' : ''}</span>}
      </div>
      {ra.notice && <p className="text-[11px] text-[#5A5751] mt-2">{ra.notice}</p>}
    </div>
  );
}
