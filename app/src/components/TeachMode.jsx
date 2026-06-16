// =============================================================================
// TeachMode — the screen DARRELL sees (his laptop, in front of him)
// =============================================================================
// Darrell 2026-06-16: facilitate the youth A.I. class comfortably from a laptop,
// students seeing a screen behind him, he seeing the same-or-different screen in
// front. This is the presenter half: the current slide PLUS facilitator notes, a
// run-of-show timer, and big prev/next controls. "Open the class screen" pops a
// second window (AudienceWindow) to drag onto the projector; they sync live over a
// BroadcastChannel, so advancing here advances there.
//
// Decoupled on purpose: this reads the curriculum (and the facilitator notes the
// parallel session is authoring) READ-ONLY off the MODULES objects. Where notes do
// not exist yet it says so honestly (never paints a fake note). When that content
// lands, the panels light up with no change here.
//
// Degrade-to-one-screen: "Hide notes" blanks the teacher panel so if he must MIRROR
// (one display) instead of EXTEND, the talking points never show behind him.
//
// Keyboard / clicker: → / Space / PageDown advance, ← / PageUp go back, Esc exits —
// so a presentation remote (which sends arrow / page keys) drives it hands-free.
//
// Contrast (WCAG AA on white / #FAF8F4): #1A1815 body (>16:1), #5A5751 secondary
// (~7:1), #5A6E3D + #7A1F1F + #B85838 accents (>=4.5:1), focus ring #B85838,
// controls >=36px — verified against the rendered tokens.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MODULES, PROPOSED_COHORT_START, buildSchedule } from '../lib/church-classes.js';
import { TEACH_CHANNEL, SESSION_TARGET_MIN, formatClock, buildSlide, holdingSlide } from '../lib/teach-present.js';

// Split the parallel session's single howToRun string ("seg | seg | seg") into
// readable steps. Returns [] when there is nothing authored yet.
function runOfShowSteps(mod) {
  const raw = mod?.facilitator?.howToRun;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split('|').map((s) => s.trim()).filter(Boolean);
}

export default function TeachMode({ cohortStart = PROPOSED_COHORT_START, onClose = null }) {
  const [week, setWeek] = useState(0);            // 0-based index
  const [elapsed, setElapsed] = useState(0);      // seconds
  const [running, setRunning] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [audienceState, setAudienceState] = useState('closed'); // closed | open | blocked | live | blank
  const chRef = useRef(null);
  const winRef = useRef(null);

  const last = MODULES.length - 1;
  // Memoized: the timer re-renders this once a second, but the 8-week schedule
  // only changes when the cohort start does (never mid-session).
  const schedule = useMemo(() => buildSchedule(cohortStart), [cohortStart]);
  const cur = schedule[week] || {};
  const nxt = schedule[week + 1] || null;

  // weekRef + blankRef so the once-bound channel handler and the resend timeouts
  // always read the LIVE week and blank state without stale closures.
  const weekRef = useRef(week);
  useEffect(() => { weekRef.current = week; }, [week]);
  const blankRef = useRef(false);
  useEffect(() => { blankRef.current = (audienceState === 'blank'); }, [audienceState]);

  // The single broadcast path. Honors "blank": while blanked it sends the holding
  // slide, NOT the lesson — so navigating weeks (or a ready/resend) never pops the
  // content back onto a deliberately-held projector.
  const sendCurrent = useCallback(() => {
    const ch = chRef.current;
    if (!ch) return;
    try { ch.postMessage(blankRef.current ? holdingSlide() : buildSlide(weekRef.current, cohortStart)); } catch (e) {}
  }, [cohortStart]);

  // --- BroadcastChannel: own it, answer the audience's "ready" handshake ---
  useEffect(() => {
    let ch;
    try { ch = new BroadcastChannel(TEACH_CHANNEL); } catch (e) { return; }
    chRef.current = ch;
    const onMsg = (ev) => {
      if (ev?.data?.type === 'ready') {
        // audience just opened (or reloaded) — send it the current state
        sendCurrent();
        setAudienceState((s) => (s === 'blank' ? 'blank' : 'live'));
      }
    };
    ch.addEventListener('message', onMsg);
    return () => { try { ch.removeEventListener('message', onMsg); ch.close(); } catch (e) {} chRef.current = null; };
  }, [sendCurrent]);

  // Broadcast on week change (and on mount) — blank-aware via sendCurrent.
  useEffect(() => { sendCurrent(); }, [week, sendCurrent]);

  // If the projector window is closed (or the display unplugged), reflect it in
  // the status instead of claiming "live & synced" forever.
  useEffect(() => {
    if (audienceState === 'closed' || audienceState === 'blocked') return undefined;
    const id = setInterval(() => {
      if (winRef.current && winRef.current.closed) { winRef.current = null; setAudienceState('closed'); }
    }, 2000);
    return () => clearInterval(id);
  }, [audienceState]);

  // --- timer ---
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const go = useCallback((dir) => {
    setWeek((w) => Math.min(last, Math.max(0, w + dir)));
  }, [last]);

  // --- keyboard / presentation-remote control ---
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      else if (e.key === 'Escape' && onClose) { onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const openAudience = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?audience=1`;
    const w = window.open(url, 'poe-audience', 'width=1280,height=720');
    if (!w) { setAudienceState('blocked'); return; }
    winRef.current = w;
    setAudienceState('open');
    // resend a few times in case the window's listener mounts after we post (the
    // {ready} handshake is the real sync; this is a belt for slow first paint).
    [250, 750, 1500].forEach((ms) => setTimeout(() => sendCurrent(), ms));
  }, [sendCurrent]);

  const blankAudience = useCallback(() => {
    blankRef.current = true;
    try { chRef.current?.postMessage(holdingSlide()); } catch (e) {}
    setAudienceState('blank');
  }, []);

  const resumeAudience = useCallback(() => {
    blankRef.current = false;
    try { chRef.current?.postMessage(buildSlide(weekRef.current, cohortStart)); } catch (e) {}
    setAudienceState('live');
  }, [cohortStart]);

  const overMin = Math.floor(elapsed / 60) >= SESSION_TARGET_MIN;
  const steps = runOfShowSteps(MODULES[week]);
  const f = MODULES[week]?.facilitator || {};
  const lesson = MODULES[week]?.lesson;
  const hasNotes = !!(lesson || (f.talkingPoints?.length) || steps.length || (f.discussionPrompts?.length) || f.watchFor);

  const btn = {
    base: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '2px solid #1A1815', background: '#1A1815', color: '#fff', fontSize: 12 },
    ghost: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '1px solid #5A5751', background: '#fff', color: '#1A1815', fontSize: 12 },
  };
  const card = { border: '1px solid #E8E4DC', padding: 16, marginBottom: 16 };
  const h3 = { fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7A1F1F', margin: '0 0 10px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FAF8F4', color: '#1A1815', overflowY: 'auto', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label="Teach this class — presenter view">
      {/* sticky control bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#1A1815', color: '#FAF8F4', padding: '10px clamp(12px, 3vw, 28px)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#EBA77E', fontFamily: '"JetBrains Mono", monospace' }}>Teaching</span>
        <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 16 }}>Week {week + 1} / {MODULES.length}</strong>
        <span style={{ color: '#CFC9BD', fontSize: 13 }}>{cur.title}</span>
        <span aria-live="polite" title="Session timer" style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 18, color: overMin ? '#FF9B7A' : '#C9D9A6' }}>
          {formatClock(elapsed)} <span style={{ fontSize: 11, color: '#CFC9BD' }}>/ {SESSION_TARGET_MIN}:00</span>
        </span>
        <button type="button" onClick={() => setRunning((r) => !r)} style={btn.ghost}>{running ? 'Pause' : 'Start'}</button>
        <button type="button" onClick={() => { setElapsed(0); setRunning(false); }} style={btn.ghost}>Reset</button>
        {onClose && <button type="button" onClick={onClose} style={{ ...btn.ghost, borderColor: '#B85838', color: '#FAF8F4', background: 'transparent' }}>Exit ✕</button>}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px, 3vw, 32px)' }}>
        {/* audience-screen controls */}
        <div style={{ ...card, background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 14 }}>Class screen (projector):</strong>
          {audienceState === 'closed' && <button type="button" onClick={openAudience} style={btn.base}>Open class screen →</button>}
          {audienceState !== 'closed' && audienceState !== 'blocked' && (
            <>
              <span style={{ fontSize: 13, color: '#5A6E3D' }}>● {audienceState === 'blank' ? 'holding slide up' : 'live & synced'}</span>
              {audienceState === 'blank'
                ? <button type="button" onClick={resumeAudience} style={btn.base}>Resume</button>
                : <button type="button" onClick={blankAudience} style={btn.ghost}>Blank screen</button>}
              <button type="button" onClick={openAudience} style={btn.ghost}>Re-open</button>
            </>
          )}
          {audienceState === 'blocked' && (
            <span style={{ fontSize: 13, color: '#7A1F1F' }}>
              Popup blocked — allow popups for this site, then{' '}
              <button type="button" onClick={openAudience} style={{ ...btn.ghost, display: 'inline' }}>try again</button>.
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>
            ← / → or a clicker to advance
          </span>
        </div>

        {/* what the students see right now (mirror) */}
        <div style={{ ...card, background: '#fff', borderLeft: '4px solid #1A1815' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B85838', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace' }}>
            On the class screen now · {cur.date ? cur.weekday + ', ' + cur.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'date TBD'}
          </div>
          <h2 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 'clamp(22px, 3vw, 32px)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>{cur.title}</h2>
          <p style={{ fontSize: 17, lineHeight: 1.5, margin: '0 0 10px' }}>{cur.bigIdea}</p>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: '#5A5751', margin: '0 0 10px' }}><strong style={{ color: '#1A1815' }}>In the app:</strong> {cur.inApp}</p>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: '#5A6E3D', margin: 0 }}><strong>Anchor — {cur.anchor?.ref}:</strong> {cur.anchor?.theme}</p>
        </div>

        {/* facilitator notes — teacher-only */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '20px 0 12px' }}>
          <h3 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 18, margin: 0 }}>Your notes <span style={{ fontSize: 12, color: '#5A5751', fontWeight: 400 }}>(only you see these)</span></h3>
          <button type="button" onClick={() => setShowNotes((s) => !s)} style={btn.ghost}>{showNotes ? 'Hide notes' : 'Show notes'}</button>
        </div>

        {showNotes && (
          <>
            {!hasNotes && (
              <div style={{ ...card, background: '#FBF3EE', borderColor: '#E7C9BC' }}>
                <p style={{ margin: 0, fontSize: 14, color: '#7A1F1F', lineHeight: 1.5 }}>
                  Facilitator notes for this week aren’t written yet — teach from the big idea, the activity, and the anchor above. (The talking points, run-of-show, and discussion prompts are being authored and will appear here once published.)
                </p>
              </div>
            )}
            {lesson && (
              <div style={card}>
                <h4 style={h3}>The deeper idea</h4>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{lesson}</p>
              </div>
            )}
            {steps.length > 0 && (
              <div style={card}>
                <h4 style={h3}>Run of show · ~{SESSION_TARGET_MIN} min</h4>
                <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, lineHeight: 1.6 }}>
                  {steps.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
                </ol>
              </div>
            )}
            {f.talkingPoints?.length > 0 && (
              <div style={card}>
                <h4 style={h3}>Say this</h4>
                <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>
                  {f.talkingPoints.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
                </ul>
              </div>
            )}
            {f.discussionPrompts?.length > 0 && (
              <div style={card}>
                <h4 style={h3}>Ask the room</h4>
                <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>
                  {f.discussionPrompts.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
                </ul>
              </div>
            )}
            {f.watchFor && (
              <div style={{ ...card, background: '#FBF3EE', borderColor: '#E7C9BC' }}>
                <h4 style={h3}>Watch for</h4>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{f.watchFor}</p>
              </div>
            )}
          </>
        )}

        {/* next up */}
        {nxt && (
          <div style={{ ...card, background: '#fff', opacity: 0.95 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#5A5751', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace' }}>Up next · Week {nxt.week}</div>
            <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 16 }}>{nxt.title}</strong>
            <p style={{ fontSize: 13, color: '#5A5751', margin: '6px 0 0', lineHeight: 1.5 }}>{nxt.bigIdea}</p>
          </div>
        )}

        {/* big prev / next */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 40 }}>
          <button type="button" onClick={() => go(-1)} disabled={week === 0} style={{ ...btn.ghost, flex: 1, minHeight: 56, fontSize: 14, opacity: week === 0 ? 0.4 : 1 }}>← Previous week</button>
          <button type="button" onClick={() => go(1)} disabled={week === last} style={{ ...btn.base, flex: 2, minHeight: 56, fontSize: 14, opacity: week === last ? 0.4 : 1 }}>Next week →</button>
        </div>
      </div>
    </div>
  );
}
