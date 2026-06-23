// =============================================================================
// Presenter — the shared two-screen "present this to a room" primitive
// =============================================================================
// The screen the PRESENTER sees on their laptop: the current scene as the room
// sees it, PLUS presenter-only notes, a session timer, and big prev/next controls.
// "Open the class screen" pops the projected AudienceWindow (?audience=1) onto the
// second display; the two sync live over a same-origin BroadcastChannel, so
// advancing here advances there.
//
// This is the GENERALIZED version of the original TeachMode (which was welded to the
// youth A.I. course). It now renders ANY `presentable` (see lib/presentable.js) —
// every Learn course, The Word's sermon library, and later creation-workspace
// documents / "family works" — by reading the surface-agnostic Scene contract.
// TeachMode.jsx is kept as a thin adapter so the standalone ?teach=1 boot and the
// in-app A.I.-course button are unchanged.
//
// What stays true to the original (DR-0076): the broadcast carries ONLY audience
// fields, so notes can never leak to the projector; the projector window closing is
// reflected honestly in the status; nothing is painted.
//
// UX rules honored:
//   • Controls-in-context — scene prev/next, blank, and timer live in the STICKY top
//     bar, reachable at any scroll position (never forced scroll-to-top), in addition
//     to the big bottom buttons.
//   • Age-adaptive hook — a child/teen/adult selector coaches the presenter for the
//     room (presenter-only; it never changes what the audience sees).
//   • "Through the church to present" — the projected kicker and an invitational
//     caption frame the canonical path: works go on the screen through the church.
//
// Keyboard / clicker: -> / Space / PageDown advance, <- / PageUp back, Esc exits —
// a presentation remote drives it hands-free.
//
// Contrast (WCAG AA on #FAF8F4): #1A1815 body (>16:1), #5A5751 secondary (~7:1),
// #5A6E3D + #7A1F1F + #B85838 accents (>=4.5:1), focus ring #B85838, controls >=36px.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  formatClock, TEACH_CHANNEL, buildSlideForScene, holdingSlide,
  PRESENT_AGE_BANDS, DEFAULT_PRESENT_AGE, ageHint,
} from '../lib/presentable.js';

function NoteSection({ note }) {
  const card = { border: '1px solid #E8E4DC', padding: 16, marginBottom: 16 };
  const calloutCard = { ...card, background: '#FBF3EE', borderColor: '#E7C9BC' };
  const h = { fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7A1F1F', margin: '0 0 10px' };
  if (note.kind === 'steps') {
    return (
      <div style={card}>
        <h4 style={h}>{note.heading}</h4>
        <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, lineHeight: 1.6 }}>
          {note.items.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
        </ol>
      </div>
    );
  }
  if (note.kind === 'list') {
    return (
      <div style={card}>
        <h4 style={h}>{note.heading}</h4>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.6 }}>
          {note.items.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
        </ul>
      </div>
    );
  }
  // 'body' and 'callout' both render a heading + paragraph; callout is tinted.
  return (
    <div style={note.kind === 'callout' ? calloutCard : card}>
      <h4 style={h}>{note.heading}</h4>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{note.body}</p>
    </div>
  );
}

export default function Presenter({ presentable, onClose = null }) {
  // Memoized so the useCallback broadcast paths below don't see a new array each
  // render (a fresh `scenes` would rebind the channel handler every tick).
  const scenes = useMemo(
    () => (presentable && Array.isArray(presentable.scenes) ? presentable.scenes : []),
    [presentable],
  );
  const title = presentable?.title || 'Present';
  const kicker = presentable?.kicker;
  const targetMin = presentable?.targetMin || 75;

  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);      // seconds
  const [running, setRunning] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [age, setAge] = useState(DEFAULT_PRESENT_AGE);
  const [audienceState, setAudienceState] = useState('closed'); // closed | open | blocked | live | blank
  const chRef = useRef(null);
  const winRef = useRef(null);

  const last = Math.max(0, scenes.length - 1);
  const cur = scenes[idx] || null;
  const nxt = scenes[idx + 1] || null;

  // Refs so the once-bound channel handler + resend timeouts read the LIVE index /
  // blank state without stale closures.
  const idxRef = useRef(idx);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  const blankRef = useRef(false);
  useEffect(() => { blankRef.current = (audienceState === 'blank'); }, [audienceState]);

  // The single broadcast path. Honors "blank": while blanked it sends the holding
  // slide, NOT the scene — so navigating (or a ready/resend) never pops content
  // back onto a deliberately-held projector.
  const sendCurrent = useCallback(() => {
    const ch = chRef.current;
    if (!ch) return;
    try {
      ch.postMessage(blankRef.current
        ? holdingSlide(title, kicker)
        : buildSlideForScene(scenes, idxRef.current, { kicker }));
    } catch (e) { /* non-fatal */ }
  }, [scenes, title, kicker]);

  // --- BroadcastChannel: own it, answer the audience's "ready" handshake ---
  useEffect(() => {
    let ch;
    try { ch = new BroadcastChannel(TEACH_CHANNEL); } catch (e) { return undefined; }
    chRef.current = ch;
    const onMsg = (ev) => {
      if (ev?.data?.type === 'ready') {
        sendCurrent();
        setAudienceState((s) => (s === 'blank' ? 'blank' : 'live'));
      }
    };
    ch.addEventListener('message', onMsg);
    return () => { try { ch.removeEventListener('message', onMsg); ch.close(); } catch (e) { /* noop */ } chRef.current = null; };
  }, [sendCurrent]);

  // Broadcast on scene change (and on mount) — blank-aware via sendCurrent.
  useEffect(() => { sendCurrent(); }, [idx, sendCurrent]);

  // If the projector window is closed (or the display unplugged), reflect it.
  useEffect(() => {
    if (audienceState === 'closed' || audienceState === 'blocked') return undefined;
    const id = setInterval(() => {
      if (winRef.current && winRef.current.closed) { winRef.current = null; setAudienceState('closed'); }
    }, 2000);
    return () => clearInterval(id);
  }, [audienceState]);

  // --- timer ---
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const go = useCallback((dir) => {
    setIdx((w) => Math.min(last, Math.max(0, w + dir)));
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
    try { chRef.current?.postMessage(holdingSlide(title, kicker)); } catch (e) { /* noop */ }
    setAudienceState('blank');
  }, [title, kicker]);

  const resumeAudience = useCallback(() => {
    blankRef.current = false;
    try { chRef.current?.postMessage(buildSlideForScene(scenes, idxRef.current, { kicker })); } catch (e) { /* noop */ }
    setAudienceState('live');
  }, [scenes, kicker]);

  const overMin = Math.floor(elapsed / 60) >= targetMin;
  const a = cur?.audience || {};
  const notes = Array.isArray(cur?.notes) ? cur.notes : [];
  const hasNotes = notes.length > 0;

  const btn = {
    base: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '2px solid #1A1815', background: '#1A1815', color: '#fff', fontSize: 12 },
    ghost: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '1px solid #5A5751', background: '#fff', color: '#1A1815', fontSize: 12 },
    nav: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', minHeight: 36, minWidth: 40, padding: '6px 12px', border: '1px solid #CFC9BD', background: 'transparent', color: '#FAF8F4', fontSize: 16, lineHeight: 1 },
  };
  const card = { border: '1px solid #E8E4DC', padding: 16, marginBottom: 16 };

  if (!cur) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FAF8F4', color: '#1A1815', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label={`Present — ${title}`}>
        <div>
          <p style={{ fontSize: 18, marginBottom: 16 }}>There’s nothing to present here yet.</p>
          {onClose && <button type="button" onClick={onClose} style={btn.ghost}>Close ✕</button>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FAF8F4', color: '#1A1815', overflowY: 'auto', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label={`Present — ${title}`}>
      {/* sticky control bar — controls-in-context: scene nav + timer reachable at any scroll */}
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#1A1815', color: '#FAF8F4', padding: '10px clamp(12px, 3vw, 28px)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#EBA77E', fontFamily: '"JetBrains Mono", monospace' }}>Presenting</span>
        <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous" title="Previous (←)" style={{ ...btn.nav, opacity: idx === 0 ? 0.4 : 1 }}>←</button>
        <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 15 }}>{cur.indexLabel}</strong>
        <button type="button" onClick={() => go(1)} disabled={idx === last} aria-label="Next" title="Next (→)" style={{ ...btn.nav, opacity: idx === last ? 0.4 : 1 }}>→</button>
        <span style={{ color: '#CFC9BD', fontSize: 13, maxWidth: '30vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
        <span aria-live="polite" title="Session timer" style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 18, color: overMin ? '#FF9B7A' : '#C9D9A6' }}>
          {formatClock(elapsed)} <span style={{ fontSize: 11, color: '#CFC9BD' }}>/ {targetMin}:00</span>
        </span>
        <button type="button" onClick={() => setRunning((r) => !r)} style={btn.ghost}>{running ? 'Pause' : 'Start'}</button>
        <button type="button" onClick={() => { setElapsed(0); setRunning(false); }} style={btn.ghost}>Reset</button>
        {onClose && <button type="button" onClick={onClose} style={{ ...btn.ghost, borderColor: '#B85838', color: '#FAF8F4', background: 'transparent' }}>Exit ✕</button>}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px, 3vw, 32px)' }}>
        {/* audience-screen controls + "through the church" framing */}
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
          <p style={{ flexBasis: '100%', margin: '4px 0 0', fontSize: 12, color: '#5A6E3D', fontFamily: '"Fraunces", serif' }}>
            Presented through {kicker || 'The Church of the Living God'} — the works of every family, every age, go up on the screen here.
          </p>
        </div>

        {/* age-adaptive presenter hook (presenter-only — never changes the audience screen) */}
        <div style={{ ...card, background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>Presenting to</span>
          <div role="radiogroup" aria-label="Who is in the room" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESENT_AGE_BANDS.map((b) => {
              const on = age === b.id;
              return (
                <button key={b.id} type="button" role="radio" aria-checked={on} onClick={() => setAge(b.id)}
                  style={{ ...btn.ghost, minHeight: 36, padding: '6px 12px', borderColor: on ? '#5A6E3D' : '#5A5751', background: on ? '#5A6E3D' : '#fff', color: on ? '#fff' : '#1A1815' }}>
                  {b.label}
                </button>
              );
            })}
          </div>
          <span style={{ flexBasis: '100%', margin: 0, fontSize: 13, color: '#5A5751', fontFamily: '"Fraunces", serif' }}>{ageHint(age)}</span>
        </div>

        {/* what the room sees right now (mirror) */}
        <div style={{ ...card, background: '#fff', borderLeft: '4px solid #1A1815' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B85838', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace' }}>
            On the class screen now{cur.dateLabel ? ` · ${cur.dateLabel}` : ''}
          </div>
          <h2 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 'clamp(22px, 3vw, 32px)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>{a.title}</h2>
          {a.lead && <p style={{ fontSize: 17, lineHeight: 1.5, margin: '0 0 10px' }}>{a.lead}</p>}
          {a.detail && <p style={{ fontSize: 14, lineHeight: 1.5, color: '#5A5751', margin: '0 0 10px' }}><strong style={{ color: '#1A1815' }}>{a.detailLabel || 'In the app'}:</strong> {a.detail}</p>}
          {a.anchorRef && <p style={{ fontSize: 14, lineHeight: 1.5, color: '#5A6E3D', margin: 0 }}><strong>{a.anchorRef}{a.anchorTheme ? ' —' : ''}</strong> {a.anchorTheme || ''}</p>}
        </div>

        {/* presenter-only notes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '20px 0 12px' }}>
          <h3 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 18, margin: 0 }}>Your notes <span style={{ fontSize: 12, color: '#5A5751', fontWeight: 400 }}>(only you see these)</span></h3>
          <button type="button" onClick={() => setShowNotes((s) => !s)} style={btn.ghost}>{showNotes ? 'Hide notes' : 'Show notes'}</button>
        </div>

        {showNotes && (
          <>
            {!hasNotes && (
              <div style={{ ...card, background: '#FBF3EE', borderColor: '#E7C9BC' }}>
                <p style={{ margin: 0, fontSize: 14, color: '#7A1F1F', lineHeight: 1.5 }}>
                  No presenter notes for this one — present from the title, the idea, and the anchor on the screen above.
                </p>
              </div>
            )}
            {notes.map((n, i) => <NoteSection key={i} note={n} />)}
          </>
        )}

        {/* next up */}
        {nxt && (
          <div style={{ ...card, background: '#fff', opacity: 0.95 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#5A5751', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace' }}>Up next · {nxt.indexLabel}</div>
            <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 16 }}>{nxt.audience?.title}</strong>
            {nxt.audience?.lead && <p style={{ fontSize: 13, color: '#5A5751', margin: '6px 0 0', lineHeight: 1.5 }}>{nxt.audience.lead}</p>}
          </div>
        )}

        {/* big prev / next */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 40 }}>
          <button type="button" onClick={() => go(-1)} disabled={idx === 0} style={{ ...btn.ghost, flex: 1, minHeight: 56, fontSize: 14, opacity: idx === 0 ? 0.4 : 1 }}>← Previous</button>
          <button type="button" onClick={() => go(1)} disabled={idx === last} style={{ ...btn.base, flex: 2, minHeight: 56, fontSize: 14, opacity: idx === last ? 0.4 : 1 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}
