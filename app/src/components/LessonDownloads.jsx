// =============================================================================
// LessonDownloads — Download one lesson, a course, or every lesson (DR-0722)
// =============================================================================
// Darrell 2026-10-01: "Also the ability to download all lessons at once or
// individually... of course.... make sense?" and "Make sure the options for
// just adult or all reading levels as an option for those with and without
// children..."
//
// One panel serves all three doors (a lesson, a course, all of Learn):
//   1. the choice: Adult only / All reading levels / pick levels, each with its
//      size BEFORE anything is fetched, remembered as this person's default;
//   2. the words always, the reading voice if wanted;
//   3. the room: the reading-voice limit and the device's free space, and when
//      either is short it says so and offers the words alone or a higher limit;
//   4. the run: "124 of 750 saved", Pause / Resume / Stop, the screen held on,
//      what is already here skipped; a summary with every failure's reason;
//   5. Remove downloads for the same scope.
// Downloading needs a signed-in account (DR-0698): a signed-out reader gets
// the same sign-in prompt every download uses.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DownloadNeedsAccount from './DownloadNeedsAccount.jsx';
import {
  LEVEL_BANDS, bandLabel, lessonVersions, normalizeChoice, choiceWords, loadChoice, saveChoice,
  planDownload, runDownload, removeDownloads, checkRoom, deviceSpace, askToKeep, heldVoiceBytes,
  formatBytes, reasonWords, readRegistry, subscribeDownloads, savedLevels, savedVoiceBand,
  loadJob, saveJob, courseContext, SPACE_MARGIN,
} from '../lib/lesson-downloads.js';
import { loadCapMb, saveCapMb, deviceClipCache } from '../lib/clip-cache.js';
import { useScreenAwake } from '../lib/screen-awake.js';

const MB = 1024 * 1024;
const BTN = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const BTN_DARK = `${BTN} focus:outline focus:outline-2 focus:outline-[#B85838] border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`;
const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

/** Re-renders when anything is saved or removed. */
export function useDownloads() {
  const [reg, setReg] = useState(() => readRegistry());
  useEffect(() => subscribeDownloads((r) => setReg({ ...r })), []);
  return reg;
}

/** true / false from the browser; true when it does not say. */
export function useOnline() {
  const read = () => !(typeof navigator !== 'undefined' && navigator.onLine === false);
  const [on, setOn] = useState(read);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const up = () => setOn(read());
    window.addEventListener('online', up);
    window.addEventListener('offline', up);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', up); };
  }, []);
  return on;
}

/** The small "Saved" mark in a lesson list. */
export function SavedMark({ lessonId, reg = null }) {
  const levels = reg ? ((reg.lessons[lessonId] && reg.lessons[lessonId].levels) || {}) : savedLevels(lessonId);
  const ids = Object.keys(levels);
  if (!ids.length) return null;
  const withVoice = ids.filter((id) => levels[id].voice);
  const says = `Saved on this device: ${ids.map(bandLabel).join(', ')}${withVoice.length ? ` (reading voice: ${withVoice.map(bandLabel).join(', ')})` : ' (words only)'}`;
  return (
    <span
      data-testid="lesson-saved-mark"
      title={says}
      aria-label={says}
      className="inline-block align-middle ml-1.5 px-1.5 py-[1px] text-[0.5625rem] uppercase tracking-wider font-semibold border border-[#5A6E3D] text-[#5A6E3D]"
      style={MONO}
    >
      Saved
    </span>
  );
}

/**
 * Offline, on a downloaded lesson whose chosen level was not saved with its
 * voice: say so, instead of a reading that fails.
 */
export function OfflineLevelNote({ module, ageBand }) {
  const online = useOnline();
  const reg = useDownloads();
  if (online || !module) return null;
  const levels = (reg.lessons[module.id] && reg.lessons[module.id].levels) || {};
  const ids = Object.keys(levels);
  if (!ids.length || savedVoiceBand(module, ageBand)) return null;
  const voiced = ids.filter((id) => levels[id].voice);
  return (
    <p data-testid="offline-level-note" role="status" className="mt-2 pl-2 border-l-2 border-[#B85838] text-[0.75rem] text-[#1A1815]" style={SERIF}>
      You are offline. The {bandLabel(ageBand)} reading voice for this lesson is not saved on this device
      {voiced.length ? `; saved here: ${voiced.map(bandLabel).join(', ')}` : '; only its words are saved'}.
      {' '}The words are all here, and the phone’s own voice can read them.
    </p>
  );
}

function ChoiceRow({ id, checked, onPick, title, sub, size, testid }) {
  return (
    <label className="flex items-start gap-2 py-1 cursor-pointer">
      <input type="radio" name="download-choice" checked={checked} onChange={() => onPick(id)} data-testid={testid} className="mt-1" />
      <span className="text-[0.75rem] text-[#1A1815]" style={SERIF}>
        <strong>{title}</strong>
        {sub ? <span className="text-[#5A5751]"> · {sub}</span> : null}
        {size ? <span className="block text-[0.6875rem] text-[#5A5751]" style={MONO} data-testid={`${testid}-size`}>{size}</span> : null}
      </span>
    </label>
  );
}

const sizeLine = (p, withVoice) => {
  if (!p) return 'Sizing…';
  if (!p.toSave) return 'Already on this device.';
  const words = `words ${formatBytes(p.wordsBytes)}`;
  return withVoice ? `${words} · with the reading voice ${formatBytes(p.wordsBytes + p.voiceBytes)}` : words;
};

/**
 * The one panel. `items` = [{ module, ctx }]; `scope` names it for resume
 * and remove ('lesson:<id>', 'course:<key>', 'all').
 */
export function DownloadPanel({ items, scope, what, removeWhich, deps = null, onClose = null }) {
  const [choice, setChoiceState] = useState(() => loadChoice());
  const [pick, setPick] = useState(() => {
    const c = loadChoice();
    return c && c.pick ? c.pick : ['adult'];
  });
  const [withVoice, setWithVoice] = useState(true);
  const [plans, setPlans] = useState({});
  const [room, setRoom] = useState(null);
  const [capMb, setCapMb] = useState(() => loadCapMb());
  const [run, setRun] = useState(null);       // live progress
  const [summary, setSummary] = useState(null);
  const [removed, setRemoved] = useState(null);
  const signalRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const reg = useDownloads();
  const running = !!run && !run.finished;
  useScreenAwake(running && !paused, 'lesson-download');
  // An unfinished download of this scope, read fresh each render (a few bytes).
  const pending = (() => { const j = loadJob(); return j && j.scope === scope ? j : null; })();

  const c = normalizeChoice(choice);
  const key = (x) => (typeof x === 'string' ? x : `pick:${x.pick.join(',')}`);
  const current = plans[`${key(c)}|${withVoice}`];

  // Size every choice before anything is fetched. Keyed on what changes the
  // sizes (the lessons, the choice, what is saved), never on a re-render, and
  // not while a run is saving: a 750-lesson plan is seconds of work.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const itemsSig = `${scope}:${items.length}`;
  const savedSig = running ? 'running' : Object.values(reg.lessons).reduce((n, l) => n + Object.keys(l.levels || {}).length + Object.values(l.levels || {}).filter((x) => x.voice).length, 0);
  useEffect(() => {
    let live = true;
    const items = itemsRef.current;
    const want = [['adult', true], ['all', true], ['adult', false], ['all', false]];
    if (typeof c !== 'string') want.push([c, true], [c, false]);
    (async () => {
      for (const [ch, v] of want) {
        const k = `${key(ch)}|${v}`;
        const p = await planDownload(items, { choice: ch, withVoice: v });
        if (!live) return;
        setPlans((s) => ({ ...s, [k]: p }));
      }
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSig, key(c), savedSig]);

  // The room for the chosen plan.
  useEffect(() => {
    let live = true;
    if (!current) { setRoom(null); return undefined; }
    (async () => {
      const [held, space] = await Promise.all([heldVoiceBytes((deps && deps.cache) || undefined), (deps && deps.space) ? deps.space() : deviceSpace()]);
      if (live) setRoom(checkRoom(current, { capMb, heldBytes: held, space }));
    })();
    return () => { live = false; };
  }, [current, capMb, deps]);

  const pickChoice = (id) => {
    const next = id === 'pick' ? { pick } : id;
    setChoiceState(next); saveChoice(next);
  };
  const togglePick = (id) => {
    const next = pick.includes(id) ? pick.filter((x) => x !== id) : [...pick, id];
    const safe = next.length ? next : [id];
    setPick(safe);
    const ch = { pick: safe }; setChoiceState(ch); saveChoice(ch);
  };
  const raiseCap = (mb) => { setCapMb(saveCapMb(mb)); };

  const start = async ({ voice = withVoice } = {}) => {
    if (running) return;
    setSummary(null); setRemoved(null);
    const plan = plans[`${key(c)}|${voice}`] || await planDownload(items, { choice: c, withVoice: voice });
    if (!voice && withVoice) setWithVoice(false);
    askToKeep();
    saveJob({ scope, choice: key(c), withVoice: voice, at: Date.now() });
    const sig = { paused: false, aborted: false };
    signalRef.current = sig;
    setPaused(false);
    const cache = (deps && deps.cache) || deviceClipCache();
    let held = await heldVoiceBytes(cache);
    const res = await runDownload({
      plan,
      signal: sig,
      onProgress: (p) => setRun(p),
      deps: {
        ...(deps || {}),
        cache,
        roomFor: async (need) => {
          if (held + need > loadCapMb() * MB) return 'cap';
          const space = (deps && deps.space) ? await deps.space() : await deviceSpace();
          if (space && need > space.free - SPACE_MARGIN) return 'space';
          held += need;
          return null;
        },
      },
    });
    if (!res.cancelled && !res.failed.length) saveJob(null);
    setSummary(res);
    setRun({ ...res, finished: true });
  };
  const pause = () => { if (signalRef.current) { signalRef.current.paused = true; setPaused(true); } };
  const resume = () => { if (signalRef.current) { signalRef.current.paused = false; setPaused(false); } };
  const stop = () => { if (signalRef.current) { signalRef.current.aborted = true; signalRef.current.paused = false; setPaused(false); } };
  const remove = async () => {
    const r = await removeDownloads({ which: removeWhich, deps: deps || {} });
    saveJob(null);
    setRemoved(r); setSummary(null); setRun(null);
  };

  const savedHere = Object.entries(reg.lessons).filter(([lessonId, l]) => removeWhich({ lessonId, course: l.course })).length;
  const versionsNote = items.length === 1
    ? lessonVersions(items[0].module).map((v) => v.label).join(', ')
    : LEVEL_BANDS.map((b) => b.label).join(', ');
  const short = withVoice && room && !room.fits;
  const wordsOnlyPlan = plans[`${key(c)}|false`];

  return (
    <div data-testid="lesson-download-panel" role="group" aria-label={`Download ${what}`} className="basis-full w-full border border-[#1A1815] bg-[#FAF8F4] p-3 mt-1">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Download {what}</div>
        {onClose && <button type="button" onClick={onClose} className="text-[0.75rem] min-h-[36px] min-w-[36px] text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label="Close the download panel">✕</button>}
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={SERIF}>
        Saved lessons open and read aloud with no connection. Reading levels {items.length === 1 ? 'this lesson has' : 'in these lessons'}: {versionsNote}.
      </p>

      {!running && (
        <div role="radiogroup" aria-label="Which reading levels to save">
          <ChoiceRow id="adult" checked={c === 'adult'} onPick={pickChoice} testid="download-choice-adult"
            title="Adult only" sub="the smallest; for readers without children" size={sizeLine(plans[`adult|${withVoice}`], withVoice)} />
          <ChoiceRow id="all" checked={c === 'all'} onPick={pickChoice} testid="download-choice-all"
            title="All reading levels" sub="every age version written (Child, Youth, Teen, Adult, Senior); for families with children" size={sizeLine(plans[`all|${withVoice}`], withVoice)} />
          <ChoiceRow id="pick" checked={typeof c !== 'string'} onPick={pickChoice} testid="download-choice-pick"
            title="Pick levels" size={typeof c !== 'string' ? sizeLine(current, withVoice) : ''} />
          {typeof c !== 'string' && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 mb-1">
              {LEVEL_BANDS.map((b) => (
                <label key={b.id} className="text-[0.75rem] text-[#1A1815] flex items-center gap-1 min-h-[36px]" style={SERIF}>
                  <input type="checkbox" checked={pick.includes(b.id)} onChange={() => togglePick(b.id)} data-testid={`download-pick-${b.id}`} />
                  {b.label} <span className="text-[#5A5751]">({b.range})</span>
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 mt-1 text-[0.75rem] text-[#1A1815] min-h-[36px]" style={SERIF}>
            <input type="checkbox" checked={withVoice} onChange={(e) => setWithVoice(e.target.checked)} data-testid="download-with-voice" />
            Include the reading voice (plays with no connection)
          </label>
        </div>
      )}

      {!running && short && (
        <div data-testid="download-room-short" role="status" className="mt-2 p-2 border-l-2 border-[#B85838] bg-white text-[0.75rem] text-[#1A1815]" style={SERIF}>
          {room.short === 'space'
            ? `This needs ${formatBytes(room.needBytes)}, and this device has ${formatBytes(room.freeBytes)} free.`
            : `With the reading voice this needs ${formatBytes(room.heldBytes + (current ? current.voiceBytes : 0))} of reading voice, over the ${formatBytes(room.capBytes)} limit you set for this device.`}
          {' '}Nothing you saved on purpose is cleared to make room.
          <div className="flex flex-wrap gap-2 mt-2">
            <button type="button" onClick={() => start({ voice: false })} data-testid="download-words-only" className={BTN_DARK}>
              Save the words only{wordsOnlyPlan ? ` (${formatBytes(wordsOnlyPlan.wordsBytes)})` : ''}
            </button>
            {room.short === 'cap' && room.raiseTo && (
              <button type="button" onClick={() => raiseCap(room.raiseTo)} data-testid="download-raise-cap" className={BTN_DARK}>
                Raise the limit to {formatBytes(room.raiseTo * MB)}
              </button>
            )}
          </div>
        </div>
      )}

      {!running && !short && (
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <button
            type="button"
            onClick={() => start()}
            disabled={!current || !current.toSave}
            data-testid="download-start"
            className={`${BTN} font-semibold border-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50`}
          >
            {pending && run == null ? 'Resume the download' : 'Download'}
            {current && current.toSave ? ` ${current.toSave} ${current.toSave === 1 ? 'lesson' : 'lessons'} · ${formatBytes(current.wordsBytes + (withVoice ? current.voiceBytes : 0))}` : ''}
          </button>
          {current && current.already > 0 && (
            <span className="text-[0.6875rem] text-[#5A5751]" style={MONO}>{current.already} already on this device</span>
          )}
        </div>
      )}

      {run && (
        <div className="mt-2" data-testid="download-progress-box">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="text-[0.6875rem] text-[#1A1815]" style={MONO} aria-live="polite" data-testid="download-progress-text">
              {run.saved + run.skipped} of {run.total} saved{run.failed && run.failed.length ? ` · ${run.failed.length} not saved` : ''}{paused ? ' · paused' : ''}
            </span>
            {running && run.current && <span className="text-[0.6875rem] text-[#5A5751] truncate min-w-0 flex-1 text-right" style={SERIF}>{run.current}</span>}
          </div>
          <div className="h-2 bg-[#E8E4DC]" role="progressbar" data-testid="download-progress" aria-label="Download progress"
            aria-valuemin={0} aria-valuemax={run.total} aria-valuenow={run.saved + run.skipped}>
            <div className="h-full bg-[#5A6E3D]" style={{ width: `${run.total ? Math.round(((run.saved + run.skipped + (run.failed ? run.failed.length : 0)) / run.total) * 100) : 0}%` }} />
          </div>
          {running && (
            <div className="flex flex-wrap gap-2 mt-2">
              {paused
                ? <button type="button" onClick={resume} data-testid="download-resume" className={`${BTN_DARK} focus:outline focus:outline-2`}>Resume</button>
                : <button type="button" onClick={pause} data-testid="download-pause" className={`${BTN_DARK} focus:outline focus:outline-2`}>Pause</button>}
              <button type="button" onClick={stop} data-testid="download-stop" className={`${BTN} border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]`}>Stop</button>
            </div>
          )}
          {running && (
            <p className="text-[0.625rem] text-[#5A5751] mt-1" style={SERIF}>
              The screen is kept on while this runs. If the phone stops it in the background, come back and press Download: what is saved is skipped.
            </p>
          )}
        </div>
      )}

      {summary && (
        <div data-testid="download-summary" role="status" className="mt-2 text-[0.75rem] text-[#1A1815]" style={SERIF}>
          <p className="m-0">
            {summary.cancelled ? 'Stopped. ' : 'Done. '}
            Saved {summary.saved} {summary.saved === 1 ? 'lesson' : 'lessons'}
            {summary.skipped ? `; ${summary.skipped} already on this device` : ''}
            {summary.bytes ? `; ${formatBytes(summary.bytes)} of reading voice` : ''}.
            {summary.voiceStopped ? ` ${reasonWords(summary.voiceStopped, { capMb: loadCapMb() })} The rest were saved as words only.` : ''}
          </p>
          {summary.failed.length > 0 && (
            <ul className="mt-1 list-disc pl-5" data-testid="download-failures">
              {summary.failed.slice(0, 20).map((f) => (
                <li key={f.lessonId}>{f.title}: {reasonWords(f.reason, { capMb: loadCapMb() })}</li>
              ))}
              {summary.failed.length > 20 && <li>and {summary.failed.length - 20} more.</li>}
            </ul>
          )}
        </div>
      )}

      {!running && savedHere > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={remove} data-testid="download-remove" className={`${BTN} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}>
            Remove downloads ({savedHere} saved)
          </button>
        </div>
      )}
      {removed && (
        <p data-testid="download-removed" role="status" className="mt-1 text-[0.6875rem] text-[#5A6E3D]" style={SERIF}>
          Removed {removed.lessons} {removed.lessons === 1 ? 'lesson' : 'lessons'}{removed.freed ? `, ${formatBytes(removed.freed)} freed` : ''}.
        </p>
      )}
      <p className="mt-2 text-[0.625rem] text-[#5A5751]" style={SERIF}>Your choice of levels is remembered for next time: {choiceWords(c)}.</p>
    </div>
  );
}

function Door({ signedIn, label, openLabel, testid, panel, savedBadge = false }) {
  const [open, setOpen] = useState(false);
  if (!signedIn) return <DownloadNeedsAccount compact label="Download" />;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={testid}
        title={label}
        className={`${BTN} ${savedBadge ? 'border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
      >
        {openLabel}
      </button>
      {open && panel(() => setOpen(false))}
    </>
  );
}

/** On a lesson's header: Download (or ✓ Saved). */
export function LessonDownloadButton({ module, course, signedIn = true }) {
  const reg = useDownloads();
  const items = useMemo(() => [{ module, ctx: courseContext(course) }], [module, course]);
  if (!module) return null;
  const saved = !!(reg.lessons[module.id] && Object.keys(reg.lessons[module.id].levels || {}).length);
  return (
    <Door
      signedIn={signedIn}
      testid="lesson-download-open"
      label="Keep this lesson's words and reading voice on this device"
      openLabel={saved ? '✓ Saved' : '⤓ Download'}
      savedBadge={saved}
      panel={(close) => (
        <DownloadPanel items={items} scope={`lesson:${module.id}`} what="this lesson" onClose={close}
          removeWhich={({ lessonId }) => lessonId === module.id} />
      )}
    />
  );
}

/** On a course: Download this course (N lessons). */
export function CourseDownloadButton({ course, signedIn = true }) {
  const items = useMemo(
    () => ((course && course.schedule) || []).map((m) => ({ module: m, ctx: courseContext(course) })),
    [course],
  );
  const key = courseContext(course).courseKey;
  return (
    <Door
      signedIn={signedIn}
      testid="download-course-open"
      label="Keep every lesson of this course on this device"
      openLabel={`⤓ Download this course (${items.length} lessons)`}
      panel={(close) => (
        <DownloadPanel items={items} scope={`course:${key}`} what="this course" onClose={close}
          removeWhich={({ course: c }) => c === key} />
      )}
    />
  );
}

/** On Learn: Download every lesson (N). */
export function AllDownloadButton({ courses, signedIn = true }) {
  const items = useMemo(
    () => (courses || []).flatMap((c) => (c.schedule || []).map((m) => ({ module: m, ctx: courseContext(c) }))),
    [courses],
  );
  return (
    <Door
      signedIn={signedIn}
      testid="download-all-open"
      label="Keep every lesson on this device"
      openLabel={`⤓ Download every lesson (${items.length})`}
      panel={(close) => (
        <DownloadPanel items={items} scope="all" what="every lesson" onClose={close} removeWhich={() => true} />
      )}
    />
  );
}

export default LessonDownloadButton;
