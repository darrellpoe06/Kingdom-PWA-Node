// =============================================================================
// ChurchCalendarOffice — the office's two hands on the calendar (DR-1644)
// =============================================================================
// Darrell 2026-11-24:
//   "only certain people can add to the calendar... office staff and sent in
//    by minister leadership over units"  → UNIT LEADERS: the office names a
//    member of the church as the leader of a unit; that leader can then send
//    in events for that unit (and only that unit).
//   "We need to find the churches archives of event flyers etc... on the
//    website or we can add through uploading"  → UPLOAD A PICTURE: an old
//    flyer, a past month's calendar or a letter goes into the church archive;
//    the daily reader reads a calendar or flyer onto its days on its next run,
//    the same way it reads the pictures it finds on the website.
//
// Rendered only for the office; the database is the gate (0343's policies
// and church_site_archive_upload). Every state says what it sees in words:
// reading, could not read (and why), none yet, the list (P15).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { readLeads, addLead, removeLead, uploadPicture, cleanUnit, MAX_PICTURE_BYTES } from '../../lib/church-calendar-office.js';
import { MONTH_NAMES } from '../../lib/church-calendar.js';

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2';
const WHY = {
  'signed-out': 'You are signed out. Sign in and try again.',
  'no-church': 'This account is not in a church yet.',
  refused: 'The church’s records did not accept this. Only the church office can do this.',
  timeout: 'The church’s records took too long to answer. Try again.',
  unavailable: 'The church’s records could not be reached. Try again.',
  invalid: 'Something is missing: choose every field.',
  already: 'That person already leads that unit.',
  'too-big': 'That picture is larger than 12 MB. Save it smaller and try again.',
  'not-a-picture': 'That file is not a picture (JPEG, PNG, GIF or WebP).',
};
const why = (r) => WHY[r && r.skipped] || 'That did not go through. Try again.';

function Said({ said, testid }) {
  if (!said.text) return null;
  return (
    <p className={`cc-said ${said.kind === 'bad' ? 'is-bad' : 'is-good'}`} role={said.kind === 'bad' ? 'alert' : 'status'} data-testid={testid}>
      {said.text}
    </p>
  );
}

function Leads({ api }) {
  const [state, setState] = useState({ status: 'loading', leads: [], members: [] });
  const [who, setWho] = useState('');
  const [unit, setUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState({ kind: '', text: '' });
  const load = useCallback(() => {
    Promise.resolve()
      .then(() => api.readLeads())
      .then((r) => setState(r && r.status ? r : { status: 'unavailable', leads: [], members: [] }))
      .catch(() => setState({ status: 'unavailable', leads: [], members: [] }));
  }, [api]);
  useEffect(load, [load]);

  const add = async (e) => {
    e.preventDefault();
    const u = cleanUnit(unit);
    if (!who || !u) return setSaid({ kind: 'bad', text: WHY.invalid });
    setBusy(true);
    const r = await Promise.resolve(api.addLead(who, u)).catch(() => ({ skipped: 'unavailable' }));
    setBusy(false);
    if (r && r.saved) {
      const name = (state.members.find((m) => m.userId === who) || {}).name || 'They';
      setSaid({ kind: 'good', text: `${name} can now send in events for ${u}.` });
      setUnit('');
      setWho('');
      load();
    } else setSaid({ kind: 'bad', text: why(r) });
    return undefined;
  };
  const remove = async (lead) => {
    setBusy(true);
    const r = await Promise.resolve(api.removeLead(lead.id)).catch(() => ({ skipped: 'unavailable' }));
    setBusy(false);
    if (r && r.removed) {
      setSaid({ kind: 'good', text: `${lead.name} no longer sends in events for ${lead.unit}. What they already sent stays on the calendar.` });
      load();
    } else setSaid({ kind: 'bad', text: why(r) });
  };

  return (
    <div className="cc-form" data-testid="church-calendar-leads">
      <div className="cc-list-h">Unit leaders who can send in events</div>
      <p className="cc-note">
        The church office adds to the calendar. A unit’s leader can too, once you name them here: their events show on their days, marked as sent in by that
        unit.
      </p>
      {state.status === 'loading' && <p className="cc-empty">Reading the leaders…</p>}
      {state.status !== 'loading' && state.status !== 'ok' && (
        <p className="cc-said is-bad" role="alert" data-testid="church-calendar-leads-unavailable">
          The leaders could not be read just now. {state.status === 'signed-out' ? WHY['signed-out'] : 'Try again in a moment.'}
        </p>
      )}
      {state.status === 'ok' && (
        <>
          {state.leads.length === 0 ? (
            <p className="cc-empty" data-testid="church-calendar-leads-none">
              No unit leaders are named yet, so only the office adds to the calendar.
            </p>
          ) : (
            <ul className="cc-list" data-testid="church-calendar-leads-list">
              {state.leads.map((l) => (
                <li key={l.id} className="cc-item">
                  <div className="cc-item-main">
                    <b className="cc-item-name">{l.unit}</b>
                    <span className="cc-item-meta">{l.name}</span>
                  </div>
                  <button
                    type="button"
                    className={`cc-btn ${FOCUS}`}
                    disabled={busy}
                    onClick={() => remove(l)}
                    aria-label={`Take ${l.name} off ${l.unit}`}
                    data-testid="church-calendar-leads-remove"
                  >
                    Take off
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={add} className="cc-form" data-testid="church-calendar-leads-add">
            <label className="cc-field">
              <span>Member</span>
              <select value={who} onChange={(e) => setWho(e.target.value)} required data-testid="church-calendar-leads-who">
                <option value="">Choose a member</option>
                {state.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="cc-field">
              <span>Unit they lead (like Choir, Bus Ministry, Women’s Fellowship)</span>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={80} required data-testid="church-calendar-leads-unit" />
            </label>
            <button type="submit" className={`cc-btn cc-btn-solid ${FOCUS}`} disabled={busy} data-testid="church-calendar-leads-submit">
              {busy ? 'Saving…' : 'Name them the unit’s leader'}
            </button>
          </form>
        </>
      )}
      <Said said={said} testid="church-calendar-leads-said" />
    </div>
  );
}

function UploadPicture({ api, todayKey }) {
  const now = /^\d{4}-\d{2}/.test(String(todayKey || '')) ? { year: +todayKey.slice(0, 4), month: +todayKey.slice(5, 7) } : { year: 2026, month: 1 };
  const [kind, setKind] = useState('flyer');
  const [year, setYear] = useState(String(now.year));
  const [month, setMonth] = useState(String(now.month));
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState({ kind: '', text: '' });
  const years = [];
  for (let y = now.year + 1; y >= now.year - 15; y -= 1) years.push(y);

  const send = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!file) return setSaid({ kind: 'bad', text: 'Choose the picture first.' });
    if (file.size > MAX_PICTURE_BYTES) return setSaid({ kind: 'bad', text: WHY['too-big'] });
    setBusy(true);
    const r = await Promise.resolve(api.uploadPicture(file, { kind, year: +year, month: +month, title })).catch(() => ({ skipped: 'unavailable' }));
    setBusy(false);
    if (r && r.kept) {
      const when = `${MONTH_NAMES[+month - 1]} ${year}`;
      const next =
        kind === 'letter' ? 'It is in the archive under that month.' : 'It is in the archive, and the next daily reading puts its events on their days.';
      setSaid({ kind: 'good', text: r.kept === 'seen' ? `That picture was already in the archive. ${next}` : `Kept: the ${kind} for ${when}. ${next}` });
      setFile(null);
      setTitle('');
      if (form && form.reset) form.reset();
    } else setSaid({ kind: 'bad', text: why(r) });
    return undefined;
  };

  return (
    <form className="cc-form" onSubmit={send} data-testid="church-calendar-upload-picture">
      <div className="cc-list-h">Add a flyer or calendar from before</div>
      <p className="cc-note">
        For a flyer, a month’s calendar or a letter the website no longer shows. It is kept in the church’s archive; a calendar or flyer is then read onto its
        days, so each event shows on its day for years to come.
      </p>
      <label className="cc-field">
        <span>What it is</span>
        <select value={kind} onChange={(e) => setKind(e.target.value)} data-testid="church-calendar-upload-kind">
          <option value="flyer">A flyer for an event</option>
          <option value="calendar">A month’s calendar</option>
          <option value="letter">A Letter from BG</option>
        </select>
      </label>
      <div className="cc-tools-row">
        <label className="cc-field">
          <span>Month</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)} data-testid="church-calendar-upload-month">
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-field">
          <span>Year</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} data-testid="church-calendar-upload-year">
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="cc-field">
        <span>Name (optional, like Battle Cry Sunday)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} data-testid="church-calendar-upload-title" />
      </label>
      <label className="cc-field">
        <span>The picture</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => setFile((e.target.files && e.target.files[0]) || null)}
          data-testid="church-calendar-upload-file"
        />
      </label>
      <button type="submit" className={`cc-btn cc-btn-solid ${FOCUS}`} disabled={busy} data-testid="church-calendar-upload-submit">
        {busy ? 'Keeping it…' : 'Keep it in the archive'}
      </button>
      <Said said={said} testid="church-calendar-upload-said" />
    </form>
  );
}

const DEFAULT_API = { readLeads, addLead, removeLead, uploadPicture };

export default function ChurchCalendarOffice({ canManage = false, todayKey = '', api = DEFAULT_API }) {
  const [open, setOpen] = useState('');
  if (!canManage) return null;
  return (
    <div className="cc-tools" data-testid="church-calendar-office">
      <div className="cc-tools-row">
        <button
          type="button"
          className={`cc-btn ${FOCUS}`}
          aria-expanded={open === 'leads'}
          onClick={() => setOpen(open === 'leads' ? '' : 'leads')}
          data-testid="church-calendar-leads-open"
        >
          Unit leaders
        </button>
        <button
          type="button"
          className={`cc-btn ${FOCUS}`}
          aria-expanded={open === 'picture'}
          onClick={() => setOpen(open === 'picture' ? '' : 'picture')}
          data-testid="church-calendar-picture-open"
        >
          Add a flyer or calendar from before
        </button>
      </div>
      {open === 'leads' && <Leads api={api} />}
      {open === 'picture' && <UploadPicture api={api} todayKey={todayKey} />}
    </div>
  );
}
