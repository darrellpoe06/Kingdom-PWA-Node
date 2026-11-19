// =============================================================================
// ChurchCalendarTools — the office adds events, uploads a set, and anyone
// downloads the calendar (DR-1586)
// =============================================================================
// Darrell 2026-11-18: "Calendar that is there made as an upload/events to add
// to and for the church Calendar inside the church app."
//
// WHO SEES WHAT. Download is for everyone (the calendar is the church's, and
// it leaves in a standard file). Add and Upload render only for the church
// office; the database is the real gate (0099's write policies), this only
// decides what to show.
//
// THE UPLOAD NEVER ADDS ON CHOOSING A FILE. Choosing a file shows what was
// read: how many events are ready, how many are already on the calendar, and
// every row that could not be read with its line and reason. Nothing is filed
// until the office presses the button that names the count.
// =============================================================================
import React, { useRef, useState } from 'react';
import { makeEvent, longDate } from '../../lib/church-calendar.js';
import { parseEventsCsv, notAlreadyThere, eventsToCsv, CSV_TEMPLATE, MAX_FILE_BYTES } from '../../lib/church-calendar-file.js';

const BLANK = { name: '', date: '', endDate: '', time: '', place: '', detail: '' };
const WHY = {
  'signed-out': 'You are signed out. Sign in and try again.',
  'no-church': 'This account is not in a church yet.',
  refused: 'The church’s records did not accept this. Only the church office can add to the calendar.',
  timeout: 'The church’s records took too long to answer. Nothing more was added; try again.',
  unavailable: 'The church’s records could not be reached. Try again.',
  invalid: 'An event needs a name and a real date.',
  empty: 'There is nothing to add.',
};
export const whyNot = (r) => WHY[r && r.skipped] || 'That did not go through. Try again.';

function saveFile(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ChurchCalendarTools({ events = [], canManage = false, onAdd = null, onChanged = null, download = saveFile }) {
  const [open, setOpen] = useState('');
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState({ kind: '', text: '' });
  const [read, setRead] = useState(null);
  const fileRef = useRef(null);
  const dated = events.filter((e) => e.source !== 'service');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (which) => {
    setOpen(open === which ? '' : which);
    setSaid({ kind: '', text: '' });
  };

  const file = async (list, done) => {
    if (!onAdd || busy) return;
    setBusy(true);
    let r;
    try {
      r = await onAdd(list);
    } catch {
      r = { skipped: 'unavailable', saved: 0 };
    }
    setBusy(false);
    const saved = (r && r.saved) || 0;
    if (saved > 0 && onChanged) onChanged();
    if (r && r.skipped) setSaid({ kind: 'bad', text: saved > 0 ? `${saved} of ${list.length} were added, then: ${whyNot(r)}` : whyNot(r) });
    else {
      setSaid({ kind: 'good', text: saved === 1 ? `Added: ${list[0].name}, ${longDate(list[0].date)}.` : `Added ${saved} events to the church calendar.` });
      done();
    }
  };

  const submitOne = (e) => {
    e.preventDefault();
    const ev = makeEvent({ ...form, source: 'office' });
    if (!ev) return setSaid({ kind: 'bad', text: WHY.invalid });
    if (form.endDate && !ev.endDate) return setSaid({ kind: 'bad', text: 'The last day must be a real date after the first day.' });
    if (notAlreadyThere([ev], dated).dupes.length) return setSaid({ kind: 'bad', text: `${ev.name} is already on the calendar for ${longDate(ev.date)}.` });
    return file([ev], () => setForm(BLANK));
  };

  const chooseFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    setSaid({ kind: '', text: '' });
    if (!f) return setRead(null);
    if (f.size > MAX_FILE_BYTES) return setRead({ ok: false, error: 'The file is larger than this reader takes (512 KB). Split it by year.', fileName: f.name });
    let text;
    try {
      text = await f.text();
    } catch {
      return setRead({ ok: false, error: 'This device could not open the file.', fileName: f.name });
    }
    const parsed = parseEventsCsv(text);
    const { fresh, dupes } = notAlreadyThere(parsed.events, dated);
    return setRead({ ...parsed, fresh, dupes, fileName: f.name });
  };
  const clearFile = () => {
    setRead(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="cc-tools" data-testid="church-calendar-tools">
      <div className="cc-tools-row">
        {canManage && (
          <>
            <button type="button" className="cc-btn" aria-expanded={open === 'add'} onClick={() => toggle('add')} data-testid="church-calendar-add-open">
              Add an event
            </button>
            <button type="button" className="cc-btn" aria-expanded={open === 'upload'} onClick={() => toggle('upload')} data-testid="church-calendar-upload-open">
              Upload events
            </button>
          </>
        )}
        <button
          type="button"
          className="cc-btn cc-btn-quiet"
          disabled={dated.length === 0}
          onClick={() => download('church-calendar.csv', eventsToCsv(dated))}
          data-testid="church-calendar-download"
        >
          {dated.length === 0 ? 'No dated events to download' : `Download ${dated.length} ${dated.length === 1 ? 'event' : 'events'} (CSV)`}
        </button>
      </div>

      {canManage && open === 'add' && (
        <form className="cc-form" onSubmit={submitOne} data-testid="church-calendar-add-form">
          <label className="cc-field">
            <span>Event name</span>
            <input value={form.name} onChange={set('name')} required maxLength={160} data-testid="church-calendar-add-name" />
          </label>
          <label className="cc-field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} required data-testid="church-calendar-add-date" />
          </label>
          <label className="cc-field">
            <span>Last day (only if it runs more than one day)</span>
            <input type="date" value={form.endDate} onChange={set('endDate')} data-testid="church-calendar-add-end" />
          </label>
          <label className="cc-field">
            <span>Time (as you would say it, like 6:00 PM)</span>
            <input value={form.time} onChange={set('time')} maxLength={60} data-testid="church-calendar-add-time" />
          </label>
          <label className="cc-field">
            <span>Place</span>
            <input value={form.place} onChange={set('place')} maxLength={160} data-testid="church-calendar-add-place" />
          </label>
          <label className="cc-field">
            <span>Note</span>
            <textarea value={form.detail} onChange={set('detail')} rows={2} maxLength={500} data-testid="church-calendar-add-note" />
          </label>
          <button type="submit" className="cc-btn cc-btn-solid" disabled={busy} data-testid="church-calendar-add-submit">
            {busy ? 'Adding…' : 'Add to the church calendar'}
          </button>
          <p className="cc-note">Everyone signed in at this church sees it once it is added.</p>
        </form>
      )}

      {canManage && open === 'upload' && (
        <div className="cc-form" data-testid="church-calendar-upload">
          <p className="cc-note">
            A spreadsheet saved as CSV. The first row names the columns: <b>date</b> and <b>name</b> are required; <b>end_date</b>, <b>time</b>, <b>place</b> and <b>note</b> are
            optional. Dates read as 2026-11-21 or 11/21/2026. Past years are welcome: they are how next year is planned.
          </p>
          <button type="button" className="cc-btn cc-btn-quiet" onClick={() => download('church-calendar-template.csv', CSV_TEMPLATE)} data-testid="church-calendar-template">
            Download a blank file with the column names
          </button>
          <label className="cc-field">
            <span>Choose the file</span>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={chooseFile} data-testid="church-calendar-file" />
          </label>
          {read && !read.ok && (
            <p className="cc-said is-bad" role="alert" data-testid="church-calendar-file-error">
              {read.fileName}: {read.error} Nothing was added.
            </p>
          )}
          {read && read.ok && (
            <div data-testid="church-calendar-file-read">
              <p className="cc-note">
                <b>{read.fileName}</b>: {read.fresh.length} ready to add
                {read.dupes.length > 0 ? `, ${read.dupes.length} already on the calendar (left alone)` : ''}
                {read.rejected.length > 0 ? `, ${read.rejected.length} not read` : ''}.
              </p>
              {read.rejected.length > 0 && (
                <ul className="cc-rejects" data-testid="church-calendar-file-rejected">
                  {read.rejected.slice(0, 25).map((r) => (
                    <li key={r.line}>
                      Line {r.line}: {r.reason}
                    </li>
                  ))}
                  {read.rejected.length > 25 && <li>…and {read.rejected.length - 25} more.</li>}
                </ul>
              )}
              <div className="cc-tools-row">
                <button type="button" className="cc-btn cc-btn-solid" disabled={busy || read.fresh.length === 0} onClick={() => file(read.fresh, clearFile)} data-testid="church-calendar-file-add">
                  {busy ? 'Adding…' : read.fresh.length === 0 ? 'Nothing new to add' : `Add ${read.fresh.length} ${read.fresh.length === 1 ? 'event' : 'events'} to the church calendar`}
                </button>
                <button type="button" className="cc-btn" onClick={clearFile} disabled={busy} data-testid="church-calendar-file-cancel">
                  Cancel, add nothing
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {said.text && (
        <p className={`cc-said ${said.kind === 'bad' ? 'is-bad' : 'is-good'}`} role={said.kind === 'bad' ? 'alert' : 'status'} data-testid="church-calendar-said">
          {said.text}
        </p>
      )}
    </div>
  );
}
