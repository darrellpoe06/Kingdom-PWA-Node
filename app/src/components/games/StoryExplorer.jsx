// =============================================================================
// StoryExplorer — "Explore Your Story": read your life by His Word (the exact
// question from Living Lesson L27, made interactive)
// =============================================================================
// Darrell 2026-07-11: "Let's ask that exact question in the app and games so
// people explore like Yahweh wants us to." This is that surface — a gentle,
// NON-competitive exploration (no score, no winner): you bring one real memory,
// the three Joseph-method questions guide you (each shown with its verbatim
// anchor verse), and you reflect in the box. "Type OR speak" parity via the same
// voice hook the rest of the app uses.
//
// REAL DATA (DR-0061): reflections persist DEVICE-LOCAL only (lib/story-
// exploration.js over window.localStorage) and are read back below — nothing
// painted, nothing sent anywhere. Private by design (DATA-AS-EMPOWERMENT).
//
// Theme CLASSES + rem only (no inline hex beyond the shared Games palette
// constants), so the global text-size control scales every reading line.
// =============================================================================
import React, { useState, useRef, useMemo, useEffect } from 'react';
import UiIcon from '../UiIcon.jsx';
import { useVoiceDictation } from '../../lib/voice-dictation.js';
import {
  explorationFor, loadReflections, saveReflection, deleteReflection, reflectionHasContent,
} from '../../lib/story-exploration.js';

const T_INK = 'text-[#1A1815]';
const T_MUTE = 'text-[#5A5751]';
const T_ACCENT = 'text-[#B85838]';
const T_VERSE = 'text-[#5A6E3D]';
const BG_CARD = 'bg-white';
const BG_CREAM = 'bg-[#FAF8F4]';
const BG_INK = 'bg-[#1A1815]';
const BORDER = 'border-[#E8E4DC]';

// Split the "// " joined multi-verse strings back into their parts for display.
function verseLines(verse) {
  return String(verse || '').split('//').map((s) => s.trim()).filter(Boolean);
}

function safeStorage() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}

function nowIso() {
  // Component land — the clock is allowed here (the pure helpers stay clock-free).
  try { return new Date().toISOString(); } catch { return null; }
}
function freshId() {
  try { return `sx_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`; } catch { return `sx_${Math.random()}`; }
}

// One guided field: its question label, prompt, anchor verse, and a type-or-speak
// textarea. The mic appends to THIS field when it is the active one.
function StoryField({ id, label, prompt, refLabel, verse, value, onChange, onFocus, active, mic }) {
  return (
    <div className={`${BG_CARD} border ${BORDER} rounded-lg p-3`}>
      <label htmlFor={id} className={`block text-sm font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{label}</label>
      <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>{prompt}</p>
      <div className={`mt-2 border-l-2 border-[#5A6E3D] pl-2`}>
        <div className={`text-[0.625rem] uppercase tracking-[0.15em] font-semibold ${T_VERSE}`}>{refLabel}</div>
        {verseLines(verse).map((v, i) => (
          <p key={i} className={`text-[0.8125rem] leading-relaxed italic ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{v}</p>
        ))}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        rows={3}
        placeholder="Write what comes — or use Speak below."
        className={`mt-2 w-full p-2 text-sm ${BG_CREAM} border ${active && mic.listening ? 'border-[#B85838]' : BORDER} rounded ${T_INK}`}
      />
    </div>
  );
}

export default function StoryExplorer({ level = 'senior', onExit = null, storage = undefined }) {
  const store = storage !== undefined ? storage : safeStorage();
  const ex = useMemo(() => explorationFor(level), [level]);

  const [memory, setMemory] = useState('');
  const [answers, setAnswers] = useState({ where: '', preserving: '', comfort: '' });
  const [activeField, setActiveField] = useState('memory');
  const [saved, setSaved] = useState(() => loadReflections(store));
  const [justSaved, setJustSaved] = useState(false);

  // One mic, appended to whichever field is focused (type-or-speak parity).
  const activeRef = useRef('memory');
  activeRef.current = activeField;
  const setField = (key, v) => {
    if (key === 'memory') setMemory(v);
    else setAnswers((a) => ({ ...a, [key]: v }));
  };
  const getField = (key) => (key === 'memory' ? memory : answers[key]);
  const appendToActive = (t) => {
    const key = activeRef.current;
    const cur = getField(key);
    setField(key, (cur ? `${cur} ${t}` : t).trim());
  };
  const latest = useRef(appendToActive);
  latest.current = appendToActive;
  const mic = useVoiceDictation({ onTranscript: (t) => latest.current(t) });

  const draftEntry = { memory, where: answers.where, preserving: answers.preserving, comfort: answers.comfort };
  const canSave = reflectionHasContent(draftEntry);

  useEffect(() => { if (justSaved) { const t = setTimeout(() => setJustSaved(false), 4000); return () => clearTimeout(t); } }, [justSaved]);

  const doSave = () => {
    if (!canSave) return;
    const next = saveReflection(store, { ...draftEntry, id: freshId(), at: nowIso() });
    setSaved(next);
    setMemory('');
    setAnswers({ where: '', preserving: '', comfort: '' });
    setActiveField('memory');
    setJustSaved(true);
  };
  const doDelete = (id) => setSaved(deleteReflection(store, id));

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold ${T_ACCENT}`}>Explore your story</div>
          <h2 className={`text-lg font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>Read your life by His Word</h2>
        </div>
        {onExit && (
          <button onClick={onExit} className={`text-sm ${T_MUTE} underline whitespace-nowrap`}>Close</button>
        )}
      </div>

      {/* Opening: your tears are kept — it is safe to bring your story */}
      <div className={`${BG_CREAM} border ${BORDER} rounded-lg p-3 mb-3`}>
        <div className={`text-[0.625rem] uppercase tracking-[0.15em] font-semibold ${T_VERSE}`}>{ex.opening.ref}</div>
        <p className={`text-sm leading-relaxed italic ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{ex.opening.verse}</p>
        <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>{ex.opening.note}</p>
      </div>

      {/* The exact question */}
      <p className={`text-sm leading-relaxed ${T_INK} mb-3`}>{ex.invitation}</p>

      {/* The memory */}
      <div className={`${BG_CARD} border ${BORDER} rounded-lg p-3 mb-2`}>
        <label htmlFor="sx-memory" className={`block text-sm font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>The memory</label>
        <p className={`text-sm leading-relaxed ${T_MUTE} mt-1`}>Name it plainly — a garden one or a hard one. Joseph named the real thing: "ye thought evil against me" — before he read God’s hand in it.</p>
        <textarea
          id="sx-memory"
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          onFocus={() => setActiveField('memory')}
          rows={2}
          placeholder="What happened?"
          className={`mt-2 w-full p-2 text-sm ${BG_CREAM} border ${activeField === 'memory' && mic.listening ? 'border-[#B85838]' : BORDER} rounded ${T_INK}`}
        />
      </div>

      {/* The three Joseph-method questions */}
      <div className="space-y-2">
        {ex.steps.map((s) => (
          <StoryField
            key={s.key}
            id={`sx-${s.key}`}
            label={s.label}
            prompt={s.prompt}
            refLabel={s.ref}
            verse={s.verse}
            value={answers[s.key]}
            onChange={(v) => setField(s.key, v)}
            onFocus={() => setActiveField(s.key)}
            active={activeField === s.key}
            mic={mic}
          />
        ))}
      </div>

      {/* Type OR speak — the shared voice control */}
      {(mic.supported || mic.error) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {mic.supported && (
            <button
              type="button"
              onClick={mic.toggle}
              aria-pressed={mic.listening}
              aria-label={mic.listening ? 'Stop voice input' : 'Start voice input — speak instead of typing'}
              className={`text-sm rounded-full px-3 py-2 border ${mic.listening ? `${BG_INK} text-[#FAF8F4] border-[#1A1815]` : `${BG_CARD} ${T_INK} ${BORDER}`}`}
            >
              {mic.listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
          )}
          {mic.listening && <span className={`text-[0.6875rem] ${T_MUTE} italic`}>Listening — speaking into “{activeField === 'memory' ? 'the memory' : ex.steps.find((s) => s.key === activeField)?.label}”…</span>}
          {mic.error && <span role="alert" className={`text-[0.6875rem] ${T_MUTE} italic`}>{mic.error}</span>}
        </div>
      )}

      {/* Save (device-local, private) */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={doSave}
          disabled={!canSave}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium inline-flex items-center gap-2 ${canSave ? `${BG_INK} text-[#FAF8F4]` : `${BG_CREAM} ${T_MUTE} border ${BORDER} cursor-not-allowed`}`}
        >
          <UiIcon name="dove" /> Keep this reflection
        </button>
        <span className={`text-[0.6875rem] ${T_MUTE}`}>Stays on this device only — private to you.</span>
        {justSaved && <span role="status" className={`text-[0.6875rem] ${T_VERSE} font-semibold`}>Kept.</span>}
      </div>

      {/* Guardrail */}
      <div className={`mt-4 border-l-2 border-[#B85838] pl-3 ${BG_CREAM} py-2 rounded-r`}>
        <p className={`text-[0.8125rem] leading-relaxed ${T_INK}`}>{ex.guardrail}</p>
      </div>

      {/* The settled end */}
      <div className={`mt-3 text-center`}>
        <div className={`text-[0.625rem] uppercase tracking-[0.15em] font-semibold ${T_VERSE}`}>{ex.closing.ref}</div>
        <p className={`text-sm leading-relaxed italic ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{ex.closing.verse}</p>
      </div>

      {/* Your kept reflections (real device-local state) */}
      {saved.length > 0 && (
        <div className={`mt-5 pt-4 border-t ${BORDER}`}>
          <div className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold ${T_ACCENT} mb-2`}>Your reflections</div>
          <div className="space-y-2">
            {saved.map((r) => (
              <div key={r.id} className={`${BG_CARD} border ${BORDER} rounded-lg p-3`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${T_INK}`} style={{ fontFamily: 'Fraunces, serif' }}>{r.memory || 'A reflection'}</p>
                  <button onClick={() => doDelete(r.id)} className={`text-[0.6875rem] ${T_MUTE} underline whitespace-nowrap`}>Remove</button>
                </div>
                {r.where && <p className={`text-sm ${T_MUTE} mt-1`}><span className={T_INK}>Where God was:</span> {r.where}</p>}
                {r.preserving && <p className={`text-sm ${T_MUTE} mt-0.5`}><span className={T_INK}>What He was preparing:</span> {r.preserving}</p>}
                {r.comfort && <p className={`text-sm ${T_MUTE} mt-0.5`}><span className={T_INK}>Comfort to give:</span> {r.comfort}</p>}
                {r.at && <p className={`text-[0.625rem] ${T_MUTE} mt-1`}>{String(r.at).slice(0, 10)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
