// =============================================================================
// VoicePicker — every voice the device and the house have, in one list (DR-0655)
// =============================================================================
// Darrell 2026-09-25, Android, Living Lesson 191: "I can only pic this fake
// dying voice!!!!!! Why limitations are built into the app!!!!! Fix it!!!!!"
//
// One picker for the reader panel and the header/settings control, so the two
// can never offer different lists. It renders the hook's catalog AS GIVEN: the
// groups in the order the hook built them (studio, your voices, house, phone),
// never a hardcoded group list, which is how a new group used to vanish.
//
//   * Picking a voice saves it (use-read-aloud → reading-voice) and, when
//     nothing is being read, plays a short sample in it: hear before choosing.
//   * "Hear it" replays the sample in the chosen voice.
//   * The chosen voice's one-line truth sits under the list (does it keep
//     playing when you switch apps? is the studio up?).
//   * A TV remote works it: a native <select> and a <button>, both focusable,
//     both with a visible focus ring; Enter opens the list and picks.
import React from 'react';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B85838]';

/** Group the catalog, keeping the order the groups first appear in. Pure. */
export function groupCatalog(catalog) {
  const order = [];
  const groups = {};
  for (const item of (catalog || [])) {
    const g = item.group || 'Voices';
    if (!groups[g]) { groups[g] = []; order.push(g); }
    groups[g].push(item);
  }
  return order.map((g) => ({ name: g, items: groups[g] }));
}

/** The text of one option: its label and its short tags. Pure. */
export function optionText(item) {
  return `${item.label}${item.ai ? ' · AI' : ''}${item.standIn ? ' (stand-in)' : ''}${!item.usable && item.entitled === false ? ' — subscriber' : ''}`;
}

export default function VoicePicker({
  catalog, voiceId, setVoiceId, preview, isReading = false,
  id = 'voice-picker', label = 'Voice (used everywhere)', compact = false, showNote = true, showHear = true,
}) {
  const groups = groupCatalog(catalog);
  const current = (catalog || []).find((c) => c.id === voiceId) || (catalog || [])[0] || null;
  const canHear = typeof preview === 'function';
  // The header slot keeps its old footprint (a 10rem select, no button): a
  // wider header wraps on a phone and eats the lesson's first screen (the
  // chrome-layout probe's 460px budget at 360px). Picking still plays a sample.
  const hearButton = canHear && showHear;

  const onChange = (e) => {
    const next = e.target.value;
    const item = (catalog || []).find((c) => c.id === next);
    if (item && !item.usable) return;
    setVoiceId(next);
    // Hear it as it is chosen — but never cut into a reading under way.
    if (canHear && !isReading) preview(next);
  };

  const options = groups.map((g) => (
    <optgroup key={g.name} label={g.name}>
      {g.items.map((item) => (
        <option key={item.id} value={item.id} disabled={!item.usable}>{optionText(item)}</option>
      ))}
    </optgroup>
  ));

  // COMPACT (the header slot) is the bare <select>, exactly the element the
  // header always had: a flex child that shrinks. Wrapped in extra boxes it
  // took its longest option's width and pushed the header onto a new row at
  // 360px, over the chrome-layout probe's 460px lesson budget (measured:
  // header 343px -> 375px). A closed select is as wide as its longest option,
  // and the honest labels ("Church studio voice (not answering yet)") are
  // long, so it is capped near the old "System voice" width; the open list
  // shows every label in full. Picking still plays a sample here.
  if (compact) {
    return (
      <select
        id={id}
        data-testid="voice-picker-select"
        aria-label={label}
        value={current ? current.id : ''}
        onChange={onChange}
        className={`border-2 bg-white text-[#1A1815] text-[0.6875rem] border-[#E8E4DC] px-2 py-1.5 rounded-md max-w-[6.5rem] ${FOCUS}`}
      >
        {options}
      </select>
    );
  }

  return (
    <div data-testid="voice-picker">
      <label htmlFor={id} className="block text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">{label}</label>
      <div className="flex items-stretch gap-[0.375em]">
        <select
          id={id}
          data-testid="voice-picker-select"
          value={current ? current.id : ''}
          onChange={onChange}
          className={`min-w-0 flex-1 text-[0.6875em] px-[0.5em] py-[0.5em] border border-[#E8E4DC] bg-white text-[#1A1815] ${FOCUS}`}
        >
          {options}
        </select>
        {hearButton && current && current.usable !== false && (
          <button
            type="button"
            data-testid="voice-picker-hear"
            onClick={() => preview(current.id)}
            disabled={isReading}
            aria-label={`Hear ${current.label}`}
            title={isReading ? 'Stop the reading to hear a sample' : `Hear ${current.label}`}
            className={`shrink-0 px-[0.625em] min-h-[2.25em] text-[0.625em] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 ${FOCUS}`}
          >▶ Hear it</button>
        )}
      </div>
      {showNote && current && current.note ? (
        <p data-testid="voice-picker-note" className="text-[0.5625em] text-[#5A5751] leading-snug mt-[0.25em]" style={{ fontFamily: '"Fraunces", serif' }}>
          {current.note}
        </p>
      ) : null}
    </div>
  );
}
