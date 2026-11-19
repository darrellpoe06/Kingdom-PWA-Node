// =============================================================================
// ChurchCalendarPlanning — what past years held at this time of year, and a
// way to say something about it while it still matters (DR-1587)
// =============================================================================
// Darrell 2026-11-18: "historical events... so users and office staff can
// review and so can parishioners so they can expect what will potentially be
// this year and maybe suggest something before it's too late... feedback when
// it matters... so we can plan as a team."
//
// THE LOOK BACK IS THE RECORD, NOT A PROMISE. A past event is shown with the
// year it happened; the words never say it will happen again. When no past
// year is on record the section says so and names the way to fill it (the
// office's upload), never an example event.
//
// A SUGGESTION goes to the app's feedback list, the same one the Feedback
// button uses. Signed out, nothing would leave this device, so the form is
// replaced by words saying so.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { comingUpFromPastYears, upcomingEvents, yearsOnRecord, suggestionText, extractCalendarSuggestions, whenLine, longDate, partsOf, SUGGESTION_MAX } from '../../lib/church-calendar.js';

const NEW_IDEA = 'A new idea';
const ago = (n) => (n === 1 ? 'last year' : `${n} years ago`);

export default function ChurchCalendarPlanning({ events = [], todayKey, signedIn = false, canManage = false, onSuggest = null, feedback = [] }) {
  const dated = useMemo(() => events.filter((e) => e.source !== 'service'), [events]);
  const past = useMemo(() => comingUpFromPastYears(dated, todayKey), [dated, todayKey]);
  const soon = useMemo(() => upcomingEvents(dated, todayKey), [dated, todayKey]);
  const years = useMemo(() => yearsOnRecord(dated), [dated]);
  const received = useMemo(() => extractCalendarSuggestions(feedback), [feedback]);
  const [about, setAbout] = useState(NEW_IDEA);
  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [said, setSaid] = useState({ kind: '', text: '' });
  const thisYear = todayKey ? partsOf(todayKey).year : 0;
  const pastYears = years.filter((y) => y.year < thisYear);
  const topics = [NEW_IDEA, ...soon.map((e) => `${e.name} (${whenLine(e)}, ${partsOf(e.date).year})`), ...past.map((p) => `${p.event.name} (held ${partsOf(p.event.date).year})`)];

  const send = (e) => {
    e.preventDefault();
    const body = suggestionText({ about, text, from });
    if (!body) return setSaid({ kind: 'bad', text: 'Write a few words first.' });
    let row;
    try {
      row = onSuggest({ area: 'church', category: 'feature-request', text: body });
    } catch {
      row = null;
    }
    if (!row) return setSaid({ kind: 'bad', text: 'That did not send. Your words are still here; try again.' });
    setText('');
    return setSaid({ kind: 'good', text: `Sent to the church app’s feedback list${row.id ? ` (reference ${row.id})` : ''}. Thank you for helping plan.` });
  };

  return (
    <div className="cc-tools" data-testid="church-calendar-planning">
      <div className="cc-list-h">This time of year, in past years</div>
      {past.length > 0 ? (
        <ul className="cc-list" data-testid="church-calendar-past">
          {past.map((p) => (
            <li key={`${p.event.id}-${p.around}`} className="cc-item">
              <div className="cc-item-main">
                <b className="cc-item-name">{p.event.name}</b>
                <span className="cc-item-meta">
                  Held {whenLine(p.event)}, {partsOf(p.event.date).year} ({ago(p.yearsAgo)}){p.event.place ? ` · ${p.event.place}` : ''}
                </span>
                <span className="cc-item-detail">The same time this year would be around {longDate(p.around)}. It is not on this year’s calendar unless it is listed above.</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cc-empty" data-testid="church-calendar-past-empty">
          {pastYears.length === 0
            ? 'No events from past years are on record yet, so there is nothing to compare this season with. When the church office uploads past years’ calendars, what was held at this time of year will show here.'
            : `Nothing from past years falls in the next 60 days. On record: ${pastYears.map((y) => `${y.year} (${y.count})`).join(', ')}. Open “Month and year” to look through them.`}
        </p>
      )}
      <p className="cc-note" data-testid="church-calendar-years">
        {years.length === 0 ? 'No dated events are on record.' : `Dated events on record: ${years.map((y) => `${y.year} (${y.count})`).join(', ')}.`}
      </p>

      <div className="cc-list-h">Suggest an event, or say something about one</div>
      {!signedIn || !onSuggest ? (
        <p className="cc-empty" data-testid="church-calendar-suggest-signed-out">
          Sign in to send a suggestion. Signed out, it would stay on this device and reach no one.
        </p>
      ) : (
        <form className="cc-form" onSubmit={send} data-testid="church-calendar-suggest">
          <label className="cc-field">
            <span>What is it about?</span>
            <select value={about} onChange={(e) => setAbout(e.target.value)} data-testid="church-calendar-suggest-about">
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="cc-field">
            <span>Your suggestion or feedback</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={SUGGESTION_MAX} data-testid="church-calendar-suggest-text" />
          </label>
          <label className="cc-field">
            <span>Your name (optional)</span>
            <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={80} data-testid="church-calendar-suggest-from" />
          </label>
          <button type="submit" className="cc-btn cc-btn-solid" data-testid="church-calendar-suggest-send">
            Send it
          </button>
          <p className="cc-note">It goes to the church app’s feedback list, the same one the Feedback button uses, where it is read and answered.</p>
        </form>
      )}
      {said.text && (
        <p className={`cc-said ${said.kind === 'bad' ? 'is-bad' : 'is-good'}`} role={said.kind === 'bad' ? 'alert' : 'status'} data-testid="church-calendar-suggest-said">
          {said.text}
        </p>
      )}

      {canManage && (
        <>
          <div className="cc-list-h">Suggestions received</div>
          {received.length > 0 ? (
            <ul className="cc-list" data-testid="church-calendar-received">
              {received.map((s) => (
                <li key={s.id} className="cc-item">
                  <div className="cc-item-main">
                    <b className="cc-item-name">{s.about || NEW_IDEA}</b>
                    <span className="cc-item-detail">{s.text}</span>
                    <span className="cc-item-meta">
                      {s.who}
                      {s.at ? ` · ${String(s.at).slice(0, 10)}` : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-empty" data-testid="church-calendar-received-empty">
              No calendar suggestions have reached this account’s feedback list yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}
