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
  formatClock, TEACH_CHANNEL, buildSlideForScene, holdingSlide, resolveAudienceLead,
  PRESENT_AGE_BANDS, DEFAULT_PRESENT_AGE, ageHint,
  PRIORITY, fitToBudget, makeScene,
  loadOverlay, saveOverlay, applyOverlay, EMPTY_OVERLAY,
} from '../lib/presentable.js';
import AudienceSlide from './AudienceSlide.jsx';

// The presenter's own device localStorage, guarded (SSR / private-mode safe). The
// living-curriculum overlay is personal to the presenter and never touches the
// shared/broadcast contract — see lib/presentable.js applyOverlay.
function defaultStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

// Budget presets (minutes) offered as one-tap chips next to the free input.
const BUDGET_PRESETS = [15, 30, 45, 60, 90];

function NoteSection({ note }) {
  const card = { border: '1px solid #E8E4DC', padding: 16, marginBottom: 16 };
  const calloutCard = { ...card, background: '#FBF3EE', borderColor: '#E7C9BC' };
  const h = { fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7A1F1F', margin: '0 0 10px' };
  if (note.kind === 'steps') {
    return (
      <div style={card}>
        <h4 style={h}>{note.heading}</h4>
        <ol style={{ margin: 0, paddingLeft: 22, fontSize: '0.875rem', lineHeight: 1.6 }}>
          {note.items.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
        </ol>
      </div>
    );
  }
  if (note.kind === 'list') {
    return (
      <div style={card}>
        <h4 style={h}>{note.heading}</h4>
        <ul style={{ margin: 0, paddingLeft: 22, fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {note.items.map((s, i) => <li key={i} style={{ marginBottom: 6 }}>{s}</li>)}
        </ul>
      </div>
    );
  }
  // 'body' and 'callout' both render a heading + paragraph; callout is tinted.
  return (
    <div style={note.kind === 'callout' ? calloutCard : card}>
      <h4 style={h}>{note.heading}</h4>
      <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>{note.body}</p>
    </div>
  );
}

// The session's RUN OF SHOW — reflowable timed segments (presenter-only; never
// broadcast). The authored per-segment minutes ARE the proportional-reflow weights,
// so when a budget is set every line rescales and shows "original -> adjusted" (e.g.
// "Hands-on 25 -> 17"), with the same percentage preserved + floors + skip fallback.
function RunOfShowPanel({ segments, budgetMin }) {
  const fit = useMemo(() => fitToBudget(segments, budgetMin), [segments, budgetMin]);
  const reflowed = budgetMin > 0 && Math.round(budgetMin) !== Math.round(fit.fullMin);
  const card = { border: '1px solid #E8E4DC', padding: 16, marginBottom: 16, background: '#fff' };
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <h4 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: '0.8125rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7A1F1F' }}>Run of show</h4>
        <span style={{ fontSize: '0.75rem', color: reflowed ? '#5A6E3D' : '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>
          {reflowed ? `rescaled to ${Math.round(budgetMin)} min (full ${fit.fullMin})` : `${fit.fullMin} min total`}
        </span>
      </div>
      {fit.plan.map((seg, i) => (
        <div key={seg.id || i} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: i < fit.plan.length - 1 ? '1px solid #F0EDE6' : 'none', opacity: seg.skipped ? 0.5 : 1 }}>
          <span style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontFamily: '"Fraunces", serif', fontSize: '0.875rem', textDecoration: seg.skipped ? 'line-through' : 'none' }}>{seg.name}</strong>
            {seg.detail && <span style={{ fontSize: '0.75rem', color: '#5A5751', lineHeight: 1.4, fontFamily: '"Fraunces", serif' }}>{seg.detail}</span>}
          </span>
          <span title={seg.atFloor ? 'At its minimum time' : (seg.skipped ? 'Dropped to fit the budget' : (reflowed ? 'original → adjusted' : 'authored minutes'))}
            style={{ fontSize: '0.8125rem', fontFamily: '"JetBrains Mono", monospace', color: seg.skipped ? '#7A1F1F' : (seg.atFloor ? '#B85838' : '#1A1815'), minWidth: reflowed ? 96 : 56, textAlign: 'right', whiteSpace: 'nowrap' }}>
            {seg.skipped
              ? 'skip'
              : reflowed
                ? `${seg.estimatedMin} → ${seg.allocatedMin}${seg.atFloor ? ' ⤓' : ''}`
                : `${seg.estimatedMin} min`}
          </span>
        </div>
      ))}
    </div>
  );
}

// A controls-in-context form to ADD a new section or EDIT an existing one. Lives
// inline on the presenter screen (never the projector). `initial` seeds the fields
// for an edit; absent => an add. Returns the collected fields to onSave.
function SceneEditor({ initial = null, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.audience?.title || '');
  const [lead, setLead] = useState(initial?.audience?.lead || '');
  const [note, setNote] = useState(initial?.notes?.[0]?.body || '');
  const [minutes, setMinutes] = useState(initial?.estimatedMin != null ? String(initial.estimatedMin) : '5');
  const [floor, setFloor] = useState(initial?.minMin != null ? String(initial.minMin) : '');
  const [importance, setImportance] = useState(initial?.importance != null ? String(initial.importance) : '1');
  const [priority, setPriority] = useState(initial?.priority === PRIORITY.SUPPLEMENTARY ? PRIORITY.SUPPLEMENTARY : PRIORITY.CORE);

  const field = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginTop: 4, border: '1px solid #CFC9BD', fontFamily: '"Fraunces", serif', fontSize: '0.9375rem', background: '#fff', color: '#1A1815' };
  const lbl = { fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' };
  const btn = { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', fontSize: '0.75rem' };

  const submit = () => {
    if (!title.trim()) return;
    const weight = Math.max(1, Math.round(Number(minutes) || 5));
    const patch = {
      audience: { title: title.trim(), lead: lead.trim() },
      estimatedMin: weight,
      priority,
    };
    const f = Math.round(Number(floor));
    if (Number.isFinite(f) && f > 0) patch.minMin = Math.min(f, weight); // floor never above weight
    const imp = Number(importance);
    if (Number.isFinite(imp) && imp > 0) patch.importance = imp; // lesson weight (1 = normal)
    // For a brand-new section we attach the note as the first presenter-only note.
    if (!initial) patch.note = note.trim();
    else patch.notes = note.trim() ? [{ kind: 'body', heading: 'Your note', body: note.trim() }] : [];
    onSave(patch);
  };

  return (
    <div style={{ border: '1px solid #1A1815', padding: 16, marginBottom: 16, background: '#fff' }}>
      <h4 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 12px' }}>
        {initial ? 'Edit this section' : 'Add a section'}
      </h4>
      <label style={lbl}>Title (the room sees this)
        <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Closing prayer" />
      </label>
      <label style={{ ...lbl, display: 'block', marginTop: 12 }}>Big idea (the room sees this)
        <input style={field} value={lead} onChange={(e) => setLead(e.target.value)} placeholder="One line learners see" />
      </label>
      <label style={{ ...lbl, display: 'block', marginTop: 12 }}>Your note (only you see this)
        <textarea style={{ ...field, minHeight: 56, resize: 'vertical' }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Talking points, kept off the screen" />
      </label>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 12 }}>
        <label style={lbl}>Weight (full min)
          <input type="number" min="1" aria-label="Weight in minutes at full depth" style={{ ...field, width: 90 }} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label style={lbl}>Min floor
          <input type="number" min="1" aria-label="Minimum minutes this section can shrink to" placeholder="auto" style={{ ...field, width: 90 }} value={floor} onChange={(e) => setFloor(e.target.value)} />
        </label>
        <label style={lbl}>Weight
          <input type="number" min="0" step="0.5" aria-label="Lesson importance weight (1 = normal, higher = more essential)" style={{ ...field, width: 90 }} value={importance} onChange={(e) => setImportance(e.target.value)} />
        </label>
        <div role="radiogroup" aria-label="Priority" style={{ display: 'flex', gap: 8 }}>
          {[{ id: PRIORITY.CORE, label: 'Core' }, { id: PRIORITY.SUPPLEMENTARY, label: 'Supplementary' }].map((p) => {
            const on = priority === p.id;
            return (
              <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPriority(p.id)}
                style={{ ...btn, border: `1px solid ${on ? '#5A6E3D' : '#5A5751'}`, background: on ? '#5A6E3D' : '#fff', color: on ? '#fff' : '#1A1815' }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#5A5751', margin: '12px 0', fontFamily: '"Fraunces", serif' }}>
        Weight is how essential this is (1 = normal). The weightiest material is protected and gets the
        minutes when time is short; lower-weight material compresses, and supplementary sections drop first.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={submit} disabled={!title.trim()} style={{ ...btn, border: '2px solid #1A1815', background: '#1A1815', color: '#fff', opacity: title.trim() ? 1 : 0.4 }}>
          {initial ? 'Save changes' : 'Add section'}
        </button>
        <button type="button" onClick={onCancel} style={{ ...btn, border: '1px solid #5A5751', background: '#fff', color: '#1A1815' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function Presenter({
  presentable,
  onClose = null,
  // Respect the surface's visibility/permissions: a surface that should not let the
  // presenter grow its curriculum passes canEdit={false} (the add/edit controls then
  // never render). Default true — present mode is already behind each surface's gate.
  canEdit = true,
  // The pace already chosen on the surface (child/teen/adult), so present mode does
  // NOT re-ask it (Darrell 2026-07-16: "shouldn't have to reintroduce everything we
  // wanted before presenting"). Presenter-only; never changes the audience screen.
  initialAge = DEFAULT_PRESENT_AGE,
  // Persistence seam. By default the living-curriculum overlay is saved to the
  // presenter's own localStorage; a surface that wants server-shared curriculum
  // passes onCurriculumChange to persist the overlay itself.
  storage = undefined,
  onCurriculumChange = null,
}) {
  const store = useMemo(() => (storage !== undefined ? storage : defaultStorage()), [storage]);
  const baseScenes = useMemo(
    () => (presentable && Array.isArray(presentable.scenes) ? presentable.scenes : []),
    [presentable],
  );
  const title = presentable?.title || 'Present';
  const kicker = presentable?.kicker;
  const targetMin = presentable?.targetMin || 75;
  const presentableId = presentable?.id || 'default';

  // The living-curriculum overlay (added + edited scenes), loaded per-presentable.
  const [overlay, setOverlay] = useState(EMPTY_OVERLAY);
  useEffect(() => { setOverlay(loadOverlay(presentableId, store)); }, [presentableId, store]);

  // The effective curriculum the presenter walks = base adapter output + overlay.
  // Memoized so the once-bound channel handler below isn't rebound every render.
  const scenes = useMemo(() => applyOverlay(baseScenes, overlay), [baseScenes, overlay]);

  // Persist + notify on any curriculum change (add / edit / retime).
  const commitOverlay = useCallback((next) => {
    setOverlay(next);
    saveOverlay(presentableId, next, store);
    if (typeof onCurriculumChange === 'function') { try { onCurriculumChange(next); } catch (e) { /* noop */ } }
  }, [presentableId, store, onCurriculumChange]);

  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);      // seconds
  const [running, setRunning] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [age, setAge] = useState(PRESENT_AGE_BANDS.some((b) => b.id === initialAge) ? initialAge : DEFAULT_PRESENT_AGE);
  const [audienceState, setAudienceState] = useState('closed'); // closed | open | blocked | live | blank
  // Clean present-on-THIS-screen mode: the room's slide fills this device (a tablet
  // held up / cast to a TV), no popup, no second browser. The age toggle + nav stay
  // reachable so the speaker adjusts the pitch to the room live (Darrell 2026-07-16).
  const [onScreen, setOnScreen] = useState(false);

  // --- time-adaptive: budget + per-scene skip overrides -----------------------
  const [budgetMin, setBudgetMin] = useState(0);  // 0 = no budget (full curriculum)
  const [budgetInput, setBudgetInput] = useState('');
  const [overrides, setOverrides] = useState({}); // sceneKey -> 'keep' | 'skip'
  const [showPlan, setShowPlan] = useState(false);
  const [editorOpen, setEditorOpen] = useState(null); // null | 'add' | sceneKey(edit)

  const chRef = useRef(null);
  const winRef = useRef(null);

  // The reflow plan for the current budget + overrides. When no budget is set this
  // is the full curriculum (fits=true, nothing skipped).
  const fit = useMemo(
    () => fitToBudget(scenes, budgetMin, { overrides }),
    [scenes, budgetMin, overrides],
  );
  const planByKey = useMemo(() => {
    const m = {};
    fit.plan.forEach((row, i) => { m[row.id != null ? String(row.id) : `#${i}`] = row; });
    return m;
  }, [fit]);
  const sceneKeyAt = useCallback((i) => {
    const s = scenes[i];
    return s && s.id != null ? String(s.id) : `#${i}`;
  }, [scenes]);

  const last = Math.max(0, scenes.length - 1);
  const cur = scenes[idx] || null;
  const nxt = scenes[idx + 1] || null;
  const curPlan = cur ? planByKey[sceneKeyAt(idx)] : null;
  // Timer pacing: count toward the budget when one is set, else the curriculum target.
  const effectiveTarget = budgetMin > 0 ? budgetMin : targetMin;

  // Refs so the once-bound channel handler + resend timeouts read the LIVE index /
  // blank state / age without stale closures.
  const idxRef = useRef(idx);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  const blankRef = useRef(false);
  useEffect(() => { blankRef.current = (audienceState === 'blank'); }, [audienceState]);
  const ageRef = useRef(age);
  useEffect(() => { ageRef.current = age; }, [age]);

  // The single broadcast path. Honors "blank": while blanked it sends the holding
  // slide, NOT the scene. Carries the LIVE age so switching the band re-pitches the
  // room's slide instantly (leadByAge), without leaving the current slide.
  const sendCurrent = useCallback(() => {
    const ch = chRef.current;
    if (!ch) return;
    try {
      ch.postMessage(blankRef.current
        ? holdingSlide(title, kicker)
        : buildSlideForScene(scenes, idxRef.current, { kicker, age: ageRef.current }));
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

  // Broadcast on scene change, on AGE change (live re-pitch to the room), and on
  // mount — blank-aware via sendCurrent.
  useEffect(() => { sendCurrent(); }, [idx, age, sendCurrent]);

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

  // Keep the cursor in range as the curriculum changes (e.g. switching surfaces).
  useEffect(() => { setIdx((w) => Math.min(w, Math.max(0, scenes.length - 1))); }, [scenes.length]);

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
    try { chRef.current?.postMessage(buildSlideForScene(scenes, idxRef.current, { kicker, age: ageRef.current })); } catch (e) { /* noop */ }
    setAudienceState('live');
  }, [scenes, kicker]);

  const overMin = Math.floor(elapsed / 60) >= effectiveTarget;
  const a = cur?.audience || {};
  // The lead pitched to the CURRENT age band — switching the band re-pitches the
  // mirror + the projector + the on-screen view instantly, on this same slide.
  const liveLead = resolveAudienceLead(a, age);
  const canRepitch = !!(a.leadByAge && (a.leadByAge.child || a.leadByAge.teen || a.leadByAge.adult));
  // A live PREVIEW of exactly what the class screen shows (age-resolved), so the
  // presenter view holds the slide AND the notes together — no window to drag, no
  // backing out (Darrell 2026-07-16).
  const previewSlide = cur ? buildSlideForScene(scenes, idx, { kicker, age }) : null;
  const notes = Array.isArray(cur?.notes) ? cur.notes : [];
  const hasNotes = notes.length > 0;

  // --- budget + override + curriculum-edit handlers ---
  const applyBudget = useCallback((raw) => {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    setBudgetMin(n);
    setBudgetInput(n > 0 ? String(n) : '');
    if (n > 0) setShowPlan(true);
  }, []);
  const setOverride = useCallback((key, value) => {
    setOverrides((o) => {
      const next = { ...o };
      if (!value || next[key] === value) delete next[key]; // toggle off -> back to auto
      else next[key] = value;
      return next;
    });
  }, []);
  const addUserScene = useCallback((input) => {
    const uid = `${presentableId}-${scenes.length}-${Math.round(elapsed)}`;
    const scn = makeScene({ ...input, uid });
    commitOverlay({ ...overlay, added: [...(overlay.added || []), scn] });
    setEditorOpen(null);
  }, [overlay, commitOverlay, presentableId, scenes.length, elapsed]);
  const saveSceneEdit = useCallback((key, patch) => {
    commitOverlay({ ...overlay, edits: { ...(overlay.edits || {}), [key]: { ...(overlay.edits?.[key] || {}), ...patch } } });
    setEditorOpen(null);
  }, [overlay, commitOverlay]);

  const btn = {
    base: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '2px solid #1A1815', background: '#1A1815', color: '#fff', fontSize: '0.75rem' },
    ghost: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '1px solid #5A5751', background: '#fff', color: '#1A1815', fontSize: '0.75rem' },
    nav: { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', minHeight: 36, minWidth: 40, padding: '6px 12px', border: '1px solid #CFC9BD', background: 'transparent', color: '#FAF8F4', fontSize: '1rem', lineHeight: 1 },
  };
  const card = { border: '1px solid #E8E4DC', padding: 16, marginBottom: 16 };

  if (!cur) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FAF8F4', color: '#1A1815', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label={`Present — ${title}`}>
        <div>
          <p style={{ fontSize: '1.125rem', marginBottom: 16 }}>There’s nothing to present here yet.</p>
          {onClose && <button type="button" onClick={onClose} style={btn.ghost}>Close ✕</button>}
        </div>
      </div>
    );
  }

  // PRESENT ON THIS SCREEN — the room's slide fills THIS device, no popup, no second
  // browser. The speaker taps to advance; the age chips stay on the bar the whole way,
  // so the pitch can be switched to the room instantly, on the same slide, never
  // leaving to the top (Darrell 2026-07-16). A connected class-screen window still
  // mirrors this via the broadcast (age + index carry through sendCurrent).
  if (onScreen) {
    const cleanSlide = buildSlideForScene(scenes, idx, { kicker, age });
    const chip = (on) => ({ cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem', minHeight: 40, padding: '8px 14px', border: `1px solid ${on ? '#C9D9A6' : '#4A453D'}`, background: on ? '#C9D9A6' : 'transparent', color: on ? '#14110E' : '#CFC9BD' });
    const navBtn = { cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', minHeight: 44, minWidth: 52, padding: '8px 16px', border: '1px solid #4A453D', background: 'transparent', color: '#FAF8F4', fontSize: '1.25rem', lineHeight: 1 };
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#14110E', color: '#FAF8F4', display: 'flex', flexDirection: 'column', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label={`Presenting — ${title}`}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(24px, 5vw, 72px)', overflowY: 'auto' }} onClick={() => go(1)} title="Tap to advance">
          <AudienceSlide slide={cleanSlide} />
        </div>
        {/* Always-on speaker bar — never projected content, just the controls. */}
        <div style={{ background: '#0E0C0A', borderTop: '1px solid #2A2620', padding: '8px clamp(10px, 2.5vw, 24px)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
          onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous" style={{ ...navBtn, opacity: idx === 0 ? 0.4 : 1 }}>←</button>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: '#CFC9BD', minWidth: 88, textAlign: 'center' }}>{idx + 1} / {scenes.length}</span>
          <button type="button" onClick={() => go(1)} disabled={idx === last} aria-label="Next" style={{ ...navBtn, opacity: idx === last ? 0.4 : 1 }}>→</button>
          {/* THE audience choice, reachable the whole way through — switch instantly */}
          <div role="radiogroup" aria-label="Who is in the room" style={{ display: 'flex', gap: 6, marginLeft: 6, flexWrap: 'wrap' }}>
            {PRESENT_AGE_BANDS.map((b) => (
              <button key={b.id} type="button" role="radio" aria-checked={age === b.id} onClick={() => setAge(b.id)} style={chip(age === b.id)}>{b.label}</button>
            ))}
          </div>
          {canRepitch && <span style={{ fontSize: '0.6875rem', color: '#C9D9A6', fontFamily: '"JetBrains Mono", monospace' }}>re-pitches live</span>}
          <span aria-live="polite" style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: '1rem', color: overMin ? '#FF9B7A' : '#C9D9A6' }}>{formatClock(elapsed)}</span>
          <button type="button" onClick={() => setRunning((r) => !r)} style={chip(false)}>{running ? 'Pause' : 'Start'}</button>
          <button type="button" onClick={() => { try { document.documentElement.requestFullscreen?.(); } catch (e) { /* F11 */ } }} style={chip(false)}>Full screen</button>
          <button type="button" onClick={() => setOnScreen(false)} style={{ ...chip(false), borderColor: '#EBA77E', color: '#EBA77E' }}>Speaker view ✕</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FAF8F4', color: '#1A1815', overflowY: 'auto', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label={`Present — ${title}`}>
      {/* sticky control bar — controls-in-context: scene nav + timer reachable at any scroll */}
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#1A1815', color: '#FAF8F4', padding: '10px clamp(12px, 3vw, 28px)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6875rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#EBA77E', fontFamily: '"JetBrains Mono", monospace' }}>Presenting</span>
        <button type="button" onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous" title="Previous (←)" style={{ ...btn.nav, opacity: idx === 0 ? 0.4 : 1 }}>←</button>
        <strong style={{ fontFamily: '"Fraunces", serif', fontSize: '0.9375rem' }}>{cur.indexLabel}</strong>
        <button type="button" onClick={() => go(1)} disabled={idx === last} aria-label="Next" title="Next (→)" style={{ ...btn.nav, opacity: idx === last ? 0.4 : 1 }}>→</button>
        <span style={{ color: '#CFC9BD', fontSize: '0.8125rem', maxWidth: '30vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
        <span aria-live="polite" title="Session timer" style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: '1.125rem', color: overMin ? '#FF9B7A' : '#C9D9A6' }}>
          {formatClock(elapsed)} <span style={{ fontSize: '0.6875rem', color: '#CFC9BD' }}>/ {effectiveTarget}:00{budgetMin > 0 ? ' budget' : ''}</span>
        </span>
        <button type="button" onClick={() => setRunning((r) => !r)} style={btn.ghost}>{running ? 'Pause' : 'Start'}</button>
        <button type="button" onClick={() => { setElapsed(0); setRunning(false); }} style={btn.ghost}>Reset</button>
        {onClose && <button type="button" onClick={onClose} style={{ ...btn.ghost, borderColor: '#B85838', color: '#FAF8F4', background: 'transparent' }}>Exit ✕</button>}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px, 3vw, 32px)' }}>
        {/* audience-screen controls + "through the church" framing */}
        <div style={{ ...card, background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* The no-setup path: present on THIS device (tablet held up / cast to a TV) —
              no popup, no second browser, no second person. */}
          <button type="button" onClick={() => setOnScreen(true)} style={btn.base}>▶ Present on this screen</button>
          <span style={{ fontSize: '0.75rem', color: '#5A5751', fontFamily: '"Fraunces", serif' }}>fills this screen — cast or hold it up; the age toggle stays with you.</span>
          <strong style={{ flexBasis: '100%', fontFamily: '"Fraunces", serif', fontSize: '0.875rem', marginTop: 4 }}>Two screens? Class screen (projector):</strong>
          {audienceState === 'closed' && <button type="button" onClick={openAudience} style={btn.ghost}>Open class screen →</button>}
          {audienceState !== 'closed' && audienceState !== 'blocked' && (
            <>
              <span style={{ fontSize: '0.8125rem', color: '#5A6E3D' }}>● {audienceState === 'blank' ? 'holding slide up' : 'live & synced'}</span>
              {audienceState === 'blank'
                ? <button type="button" onClick={resumeAudience} style={btn.base}>Resume</button>
                : <button type="button" onClick={blankAudience} style={btn.ghost}>Blank screen</button>}
              <button type="button" onClick={openAudience} style={btn.ghost}>Re-open</button>
            </>
          )}
          {audienceState === 'blocked' && (
            <span style={{ fontSize: '0.8125rem', color: '#7A1F1F' }}>
              Popup blocked — allow popups for this site, then{' '}
              <button type="button" onClick={openAudience} style={{ ...btn.ghost, display: 'inline' }}>try again</button>.
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>
            ← / → or a clicker to advance
          </span>
          <p style={{ flexBasis: '100%', margin: '4px 0 0', fontSize: '0.75rem', color: '#5A6E3D', fontFamily: '"Fraunces", serif' }}>
            Presented through {kicker || 'The Church of the Living God'} — the works of every family, every age, go up on the screen here.
          </p>
        </div>

        {/* age-adaptive presenter hook (presenter-only — never changes the audience screen) */}
        <div style={{ ...card, background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>Presenting to</span>
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
          {canRepitch && <span style={{ fontSize: '0.6875rem', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>· switches the room’s wording live</span>}
          <span style={{ flexBasis: '100%', margin: 0, fontSize: '0.8125rem', color: '#5A5751', fontFamily: '"Fraunces", serif' }}>{ageHint(age)}</span>
        </div>

        {/* time-adaptive: "I have ___ minutes" -> fit-to-budget reflow + skip-suggest */}
        <div style={{ ...card, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>I have</span>
            <input
              type="number" min="0" inputMode="numeric" aria-label="Minutes available"
              value={budgetInput}
              onChange={(e) => { setBudgetInput(e.target.value); applyBudget(e.target.value); }}
              placeholder="—"
              style={{ width: 80, padding: '8px 10px', border: '1px solid #CFC9BD', fontFamily: '"JetBrains Mono", monospace', fontSize: '1rem', textAlign: 'center', background: '#fff', color: '#1A1815' }}
            />
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>minutes</span>
            {BUDGET_PRESETS.map((m) => (
              <button key={m} type="button" onClick={() => applyBudget(m)}
                style={{ ...btn.ghost, minHeight: 34, padding: '5px 12px', borderColor: budgetMin === m ? '#5A6E3D' : '#5A5751', background: budgetMin === m ? '#5A6E3D' : '#fff', color: budgetMin === m ? '#fff' : '#1A1815' }}>
                {m}
              </button>
            ))}
            {budgetMin > 0 && (
              <button type="button" onClick={() => { applyBudget(0); setOverrides({}); }} style={{ ...btn.ghost, minHeight: 34, padding: '5px 12px' }}>Full curriculum</button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>
              full = {fit.fullMin} min
            </span>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '0.875rem', lineHeight: 1.5, color: fit.overBudget ? '#7A1F1F' : '#5A6E3D', fontFamily: '"Fraunces", serif' }}>
            {fit.summary}
          </p>
          {(budgetMin > 0 || Object.keys(overrides).length > 0) && (
            <button type="button" onClick={() => setShowPlan((s) => !s)} style={{ ...btn.ghost, marginTop: 12 }}>
              {showPlan ? 'Hide plan' : `Show plan (${fit.counts.total} sections)`}
            </button>
          )}

          {showPlan && (
            <div style={{ marginTop: 14, borderTop: '1px solid #E8E4DC', paddingTop: 12 }}>
              {fit.plan.map((row, i) => {
                const key = row.id != null ? String(row.id) : `#${i}`;
                const isCore = row.priority === PRIORITY.CORE;
                const forced = overrides[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < fit.plan.length - 1 ? '1px solid #F0EDE6' : 'none', opacity: row.skipped ? 0.55 : 1 }}>
                    <span aria-hidden style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${isCore ? '#5A6E3D' : '#B85838'}`, color: isCore ? '#5A6E3D' : '#B85838', fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
                      {isCore ? 'Core' : 'Supp'}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', textDecoration: row.skipped ? 'line-through' : 'none', fontFamily: '"Fraunces", serif' }}>
                      {row.audience?.title || row.indexLabel || key}
                    </span>
                    <span title={row.atFloor ? 'At its minimum time' : (row.skipped ? 'Skipped to fit the budget' : 'Computed share of the budget')}
                      style={{ fontSize: '0.75rem', color: row.atFloor ? '#B85838' : '#5A5751', fontFamily: '"JetBrains Mono", monospace', minWidth: 78, textAlign: 'right' }}>
                      {row.skipped ? `skip${row.skipReason === 'forced' ? ' (you)' : ''}` : `${row.allocatedMin} min${row.atFloor ? ' · floor' : ''}`}
                    </span>
                    {canEdit && (
                      <button type="button" onClick={() => setEditorOpen(editorOpen === key ? null : key)} aria-label={`Edit ${row.audience?.title || key}`} style={{ ...btn.ghost, minHeight: 30, padding: '3px 8px', fontSize: '0.6875rem' }}>Edit</button>
                    )}
                    <button type="button" onClick={() => setOverride(key, row.skipped ? 'keep' : 'skip')}
                      aria-label={row.skipped ? `Force keep ${key}` : `Force skip ${key}`}
                      style={{ ...btn.ghost, minHeight: 30, padding: '3px 8px', fontSize: '0.6875rem', borderColor: forced ? '#1A1815' : '#5A5751' }}>
                      {row.skipped ? 'Keep' : 'Skip'}
                    </button>
                  </div>
                );
              })}
              <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#5A5751', fontFamily: '"Fraunces", serif' }}>
                Time is split proportionally — heavier sections keep more of the clock. A section at its{' '}
                <span style={{ color: '#B85838' }}>floor</span> can’t shrink further; when floors don’t fit, supplementary
                sections are skipped first (core is protected). Tap “Keep”/“Skip” to override any of it.
              </p>
            </div>
          )}

          {/* inline editor for a plan row (edit) or the add form */}
          {canEdit && editorOpen && editorOpen !== 'add' && planByKey[editorOpen] && (
            <SceneEditor initial={planByKey[editorOpen]} onSave={(patch) => saveSceneEdit(editorOpen, patch)} onCancel={() => setEditorOpen(null)} />
          )}
          {canEdit && editorOpen === 'add' && (
            <SceneEditor onSave={addUserScene} onCancel={() => setEditorOpen(null)} />
          )}
          {canEdit && editorOpen !== 'add' && (
            <button type="button" onClick={() => setEditorOpen('add')} style={{ ...btn.ghost, marginTop: 12 }}>+ Add a section</button>
          )}
        </div>

        {/* PRESENTER VIEW — a live preview of exactly what the class screen shows,
            ABOVE the readable copy + the flow + notes, so the presenter sees the
            room's slide and their own notes together, automatically (no window to
            drag onto a second display, no backing out). */}
        <div style={{ ...card, background: '#fff', borderLeft: '4px solid #1A1815' }}>
          <div style={{ fontSize: '0.625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B85838', marginBottom: 8, fontFamily: '"JetBrains Mono", monospace', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>What the class screen shows{cur.dateLabel ? ` · ${cur.dateLabel}` : ''}</span>
            {curPlan && budgetMin > 0 && (
              <span style={{ color: curPlan.skipped ? '#7A1F1F' : (curPlan.atFloor ? '#B85838' : '#5A6E3D') }}>
                {curPlan.skipped ? '· planned skip' : `· planned ${curPlan.allocatedMin} min${curPlan.atFloor ? ' (floor)' : ''}`}
              </span>
            )}
          </div>
          {/* the real audience slide, miniaturized — a faithful mirror of the projector */}
          <div style={{ position: 'relative', background: '#14110E', borderRadius: 4, overflow: 'hidden', width: '100%', aspectRatio: '16 / 9', marginBottom: 14 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '200%', height: '200%', transform: 'scale(0.5)', transformOrigin: 'top left', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(24px, 5vw, 72px)', boxSizing: 'border-box', color: '#FAF8F4', fontFamily: '"Fraunces", Georgia, serif' }}>
              <AudienceSlide slide={previewSlide} />
            </div>
          </div>
          <h2 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: 'clamp(1.375rem, 3vw, 2rem)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>{a.title}</h2>
          {liveLead && <p style={{ fontSize: '1.0625rem', lineHeight: 1.5, margin: '0 0 10px' }}>{liveLead}</p>}
          {a.detail && <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#5A5751', margin: '0 0 10px' }}><strong style={{ color: '#1A1815' }}>{a.detailLabel || 'In the app'}:</strong> {a.detail}</p>}
          {a.anchorRef && <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#5A6E3D', margin: 0 }}><strong>{a.anchorRef}{a.anchorTheme ? ' —' : ''}</strong> {a.anchorTheme || ''}</p>}
        </div>

        {/* the session's reflowable run-of-show (rescales with the time budget) */}
        {Array.isArray(cur.runOfShow) && cur.runOfShow.length > 0 && (
          <RunOfShowPanel segments={cur.runOfShow} budgetMin={budgetMin} />
        )}

        {/* presenter-only notes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '20px 0 12px' }}>
          <h3 style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>Your notes <span style={{ fontSize: '0.75rem', color: '#5A5751', fontWeight: 400 }}>(only you see these)</span></h3>
          <button type="button" onClick={() => setShowNotes((s) => !s)} style={btn.ghost}>{showNotes ? 'Hide notes' : 'Show notes'}</button>
        </div>

        {showNotes && (
          <>
            {!hasNotes && (
              <div style={{ ...card, background: '#FBF3EE', borderColor: '#E7C9BC' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#7A1F1F', lineHeight: 1.5 }}>
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
            <div style={{ fontSize: '0.625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#5A5751', marginBottom: 6, fontFamily: '"JetBrains Mono", monospace' }}>Up next · {nxt.indexLabel}</div>
            <strong style={{ fontFamily: '"Fraunces", serif', fontSize: '1rem' }}>{nxt.audience?.title}</strong>
            {nxt.audience?.lead && <p style={{ fontSize: '0.8125rem', color: '#5A5751', margin: '6px 0 0', lineHeight: 1.5 }}>{nxt.audience.lead}</p>}
          </div>
        )}

        {/* big prev / next */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 40 }}>
          <button type="button" onClick={() => go(-1)} disabled={idx === 0} style={{ ...btn.ghost, flex: 1, minHeight: 56, fontSize: '0.875rem', opacity: idx === 0 ? 0.4 : 1 }}>← Previous</button>
          <button type="button" onClick={() => go(1)} disabled={idx === last} style={{ ...btn.base, flex: 2, minHeight: 56, fontSize: '0.875rem', opacity: idx === last ? 0.4 : 1 }}>Next →</button>
        </div>
      </div>
    </div>
  );
}
