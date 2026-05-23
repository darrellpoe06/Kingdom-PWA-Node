import { useState, useEffect, useRef, useMemo } from 'react';
import { askCouncilChamber } from '../lib/councilChamberLLM.js';
import { isVoiceSupported, createRecognizer } from '../lib/councilChamberVoice.js';

// Counseling.jsx — the Council Chamber sub-surface, rendered as a sub-tab inside
// Church.jsx. Pastoral conversation only: voice + text in, AI four-section
// response out, local journal, licensed-care handoff, always-on crisis resources.
// Foundation (free) tier — no gate. Spec: COUNCIL-CHAMBER.md / BEHAVIORAL-MIRROR.md
// / THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md / THE-ROOT.md.
//
// Banned clinical vocabulary (therapy / therapist / clinical / diagnose /
// diagnosis / treatment / patient / client) is confined to the single TLC
// referral block below — pastoral copy elsewhere avoids it deliberately.

const JOURNAL_KEY = 'councilChamberEntries';
const API_KEY_LS = 'councilChamberApiKey';
const DISCLAIMER_SESSION_KEY = 'councilChamberDisclaimerDismissed';

// Lightweight in-browser crisis signal — only used to visually highlight the
// always-on resources panel. The warm hand-off copy itself comes from the model.
const CRISIS_PATTERNS = [
  /\bkill myself\b/i, /\bend (?:it|my life)\b/i, /\bsuicid/i, /\bself[-\s]?harm\b/i,
  /\bhurt myself\b/i, /\bdon'?t want to (?:be here|live|wake up)\b/i,
  /\bwant to die\b/i, /\bbeing (?:hit|abused|hurt)\b/i, /\bnot safe\b/i,
];
function looksLikeCrisis(text) {
  return CRISIS_PATTERNS.some((re) => re.test(text || ''));
}

function resolveApiKey() {
  const envKey = import.meta.env?.VITE_ANTHROPIC_API_KEY;
  if (envKey) return envKey;
  try {
    return localStorage.getItem(API_KEY_LS) || '';
  } catch {
    return '';
  }
}

export default function Counseling({ church, onBackToHome }) {
  const c = church || {};

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(JOURNAL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [crisisActive, setCrisisActive] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const [apiKey, setApiKey] = useState(() => resolveApiKey());
  const [keyDraft, setKeyDraft] = useState('');

  const [disclaimerDismissed, setDisclaimerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISCLAIMER_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });

  const recognizerRef = useRef(null);
  const voiceSupported = useMemo(() => isVoiceSupported(), []);
  const tlcRef = useRef(null);
  const crisisRef = useRef(null);
  const counselorRef = useRef(null);

  // Persist the conversation as the local journal. Per Christina's pending
  // confirmation this is local-only (option b): nothing leaves the device
  // except the single Claude API call.
  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable (private mode / quota) — conversation stays in memory.
    }
  }, [messages]);

  useEffect(() => () => {
    if (recognizerRef.current) recognizerRef.current.stop();
  }, []);

  const dismissDisclaimer = () => {
    setDisclaimerDismissed(true);
    try {
      sessionStorage.setItem(DISCLAIMER_SESSION_KEY, '1');
    } catch {
      // session storage unavailable — disclaimer simply re-shows next load.
    }
  };

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const toggleVoice = () => {
    if (!voiceSupported) return;
    if (listening) {
      recognizerRef.current?.stop();
      return;
    }
    const rec = createRecognizer({
      onTranscript: (t) => setInput(t),
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (!rec) return;
    recognizerRef.current = rec;
    rec.start();
    setListening(true);
  };

  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k) return;
    try {
      localStorage.setItem(API_KEY_LS, k);
    } catch {
      // ignore storage failure; key still set in memory for this session.
    }
    setApiKey(k);
    setKeyDraft('');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;
    if (listening) recognizerRef.current?.stop();

    const source = listening ? 'voice' : 'text';
    const isFirstMessage = messages.filter((m) => m.role === 'user').length === 0;
    setCrisisActive(looksLikeCrisis(text));

    const userMsg = {
      role: 'user',
      content: text,
      source,
      timestamp: new Date().toISOString(),
    };
    const history = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');
    setPending(true);

    try {
      const { sections, rawText } = await askCouncilChamber({
        apiKey,
        history,
        userMessage: text,
        isFirstMessage,
      });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: rawText,
        sections,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      if (err?.message === 'NO_API_KEY') {
        setError('No API key configured. Add one below to begin.');
      } else {
        setError('The Chamber could not respond just now. Check your connection or API key and try again.');
      }
      // Roll back the user message so they can retry cleanly.
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setInput(text);
    } finally {
      setPending(false);
    }
  };

  const clearJournal = () => {
    if (!confirm('Clear this journal? Saved reflections on this device will be removed.')) return;
    setMessages([]);
  };

  // Compile the conversation into a portable plain-text summary the person can
  // bring to a counselor in their church. Triggers a .txt download.
  const exportForCounselor = () => {
    if (messages.length === 0) return;
    const lines = ['The Council Chamber — reflections to share with a counselor in my church', `Saved ${new Date().toLocaleString()}`, ''];
    messages.forEach((m) => {
      if (m.role === 'user') {
        lines.push(`ME (${m.source || 'text'}): ${m.content}`, '');
      } else {
        const s = m.sections || {};
        lines.push('REFLECTION:');
        if (s.hear) lines.push(`  Hear: ${s.hear}`);
        if (s.mirror) lines.push(`  Mirror: ${s.mirror}`);
        if (s.anchor) lines.push(`  Anchor: ${s.anchor}`);
        if (s.invite) lines.push(`  Invite: ${s.invite}`);
        lines.push('');
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-chamber-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const transcript = useMemo(() => [...messages].reverse(), [messages]);

  // Palette tokens (match Church Home).
  const fieldCls = 'w-full p-2.5 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const serif = { fontFamily: '"Fraunces", serif' };
  const mono = { fontFamily: '"JetBrains Mono", monospace' };

  return (
    <div className="space-y-6">
      {/* MODE BADGE */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-semibold px-3 py-1.5" style={{ background: '#E7EBE2', color: '#5A6E3D' }}>
          🕊 Counseling
        </span>
        {onBackToHome && (
          <button type="button" onClick={onBackToHome} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
            ← Switch back to Home
          </button>
        )}
      </div>

      {/* HEADER + ANCHOR VERSE */}
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1">The Council Chamber</div>
        <h2 className="text-2xl sm:text-3xl" style={{ ...serif, fontWeight: 600, letterSpacing: '-0.02em' }}>The Council Chamber</h2>
        <div className="text-base text-[#5A5751] italic mt-0.5" style={serif}>A quiet room to think with Scripture</div>
        <blockquote className="mt-3 border-l-2 border-[#B85838] pl-3 text-sm italic" style={serif}>
          "Where there is no guidance, a people falls, but in an abundance of counselors there is safety."
          <span className="not-italic text-[#5A5751] text-xs"> — ESV · Proverbs 11:14</span>
        </blockquote>
      </section>

      {/* BRIGHT-LINE DISCLAIMER — session-scoped, dismissable. No banned words. */}
      {!disclaimerDismissed && (
        <section className="bg-[#FAF8F4] border-2 border-[#5A6E3D] p-4" role="note" aria-label="About this room">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: '#5A6E3D' }}>Before you begin</div>
            <button type="button" onClick={dismissDisclaimer} aria-label="Dismiss" className="text-sm text-[#5A5751] hover:text-[#B85838] px-2 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
          </div>
          <div className="text-sm leading-relaxed space-y-2" style={serif}>
            <p>This is a space to think with Scripture — AI-grounded biblical reflection, pastoral conversation only. It is <strong>not</strong> licensed mental-health care, it is <strong>not</strong> a medical record, and it is <strong>not</strong> a replacement for the counselors in your church or for licensed care.</p>
            <p className="italic">The reflection corrects the walk, not the worth.</p>
            <p>If you need to bring this to a real person who knows you, <button type="button" onClick={() => scrollTo(counselorRef)} className="underline text-[#B85838] hover:text-[#1A1815]">bring it to a counselor in your church →</button>. If you need licensed help, <button type="button" onClick={() => scrollTo(tlcRef)} className="underline text-[#B85838] hover:text-[#1A1815]">here are real people who can help →</button>. In a crisis, <button type="button" onClick={() => scrollTo(crisisRef)} className="underline text-[#B85838] hover:text-[#1A1815]">crisis resources are here →</button>.</p>
          </div>
        </section>
      )}

      {/* API KEY CONFIG STATE — only when no key is available. */}
      {!apiKey && (
        <section className="bg-white border border-[#B85838] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Configure API key</div>
          <p className="text-sm text-[#5A5751] mb-2" style={serif}>
            The Chamber needs an Anthropic API key to respond. Set <code style={mono}>VITE_ANTHROPIC_API_KEY</code> in your environment, or paste one below to store it on this device only.
          </p>
          <div className="flex gap-2 flex-wrap">
            <input type="password" className={`${fieldCls} flex-1 min-w-[200px]`} placeholder="sk-ant-…" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
            <button type="button" onClick={saveKey} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save key</button>
          </div>
        </section>
      )}

      {/* INPUT ROW */}
      <section className="bg-white border border-[#1A1815] p-4 space-y-3">
        <label htmlFor="cc-input" className="text-[9px] uppercase tracking-wider text-[#5A5751]">When you're ready to think something through, this is the room. Type or speak — the system will listen first.</label>
        <textarea
          id="cc-input"
          rows="4"
          className={fieldCls}
          style={serif}
          placeholder="What's on your mind today?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {voiceSupported ? (
            <button
              type="button"
              onClick={toggleVoice}
              aria-pressed={listening}
              className={`px-3 py-2.5 text-xs uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-[#B85838] ${listening ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#1A1815] hover:bg-[#FAF8F4]'}`}
            >
              {listening ? '⏹ Stop' : '🎙 Speak'}
            </button>
          ) : (
            <span title="Voice input not supported in this browser" className="px-3 py-2.5 text-xs uppercase tracking-wider border border-[#E8E4DC] text-[#9A958C] cursor-not-allowed">🎙 Voice n/a</span>
          )}
          <button
            type="button"
            onClick={send}
            disabled={pending || !input.trim()}
            className="flex-1 bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            Send to the Chamber →
          </button>
        </div>
        {listening && <p className="text-[10px] uppercase tracking-wider" style={{ color: '#5A6E3D' }}>● Listening — speak, then stop to edit before sending.</p>}
        {pending && <p className="text-sm italic text-[#5A5751]" style={serif}>Thinking with you…</p>}
        {error && <p role="alert" className="text-xs text-[#B85838]" style={serif}>{error}</p>}
      </section>

      {/* CITATIONS REMINDER */}
      {transcript.length > 0 && (
        <p className="text-[10px] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] bg-white px-3 py-2">
          ⚠ Citations may be approximate — verify against your Bible.
        </p>
      )}

      {/* CONVERSATION DISPLAY — most recent at top */}
      {transcript.length === 0 ? (
        <p className="text-sm text-[#5A5751] italic" style={serif}>When you're ready to think something through, this is the room. Type or speak — the system will listen first.</p>
      ) : (
        <div className="space-y-4">
          {transcript.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="bg-white border border-[#E8E4DC] p-3">
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1" style={mono}>
                  {m.source === 'voice' ? '🎙 voice' : '⌨ text'} · {(m.timestamp || '').slice(0, 16).replace('T', ' ')}
                </div>
                <p className="text-sm" style={serif}>{m.content}</p>
              </div>
            ) : (
              <div key={i} className="bg-white border border-[#1A1815] p-4 space-y-3">
                <Section label="Hear" body={m.sections?.hear} serif={serif} />
                <Section label="Mirror" body={m.sections?.mirror} serif={serif} accent />
                <Section label="Anchor" body={m.sections?.anchor} serif={serif} anchor />
                <Section label="Invite" body={m.sections?.invite} serif={serif} invite />
              </div>
            )
          ))}
        </div>
      )}

      {/* LOCAL JOURNAL — persisted across reloads as councilChamberEntries */}
      <section className="border border-[#E8E4DC] bg-white">
        <div className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
          <button type="button" onClick={() => setShowJournal(!showJournal)} className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {showJournal ? '▾' : '▸'} Journal · {messages.length} saved on this device
          </button>
          {messages.length > 0 && (
            <button type="button" onClick={clearJournal} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Clear</button>
          )}
        </div>
        {showJournal && (
          <div className="p-3 text-xs space-y-1.5" style={mono}>
            {messages.length === 0 ? (
              <p className="text-[#5A5751] italic" style={serif}>Saved reflections live here on your device and survive a reload.</p>
            ) : (
              messages.filter((m) => m.role === 'user').map((m, i) => (
                <div key={i} className="text-[#5A5751]">{(m.timestamp || '').slice(0, 16).replace('T', ' ')} — {m.content.slice(0, 60)}{m.content.length > 60 ? '…' : ''}</div>
              ))
            )}
          </div>
        )}
      </section>

      {/* COUNSELORS IN THE CHURCH — quieter than the TLC banner; the gentle next step */}
      <section ref={counselorRef} className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Bring this to a counselor in your church</div>
        <p className="text-sm text-[#5A5751] leading-relaxed" style={serif}>
          This room is preparation — the counselors in the church are the conversation. When you're ready to bring this to a real person who knows you, here's how.
        </p>
        {/* Vocabulary note: COUNCIL-CHAMBER.md Pathway 3 currently says "the pastor
            or designated care leader" for this same hand-off. This card uses the
            founder's phrasing — "counselors in the church" — as canonical; a
            follow-up card will reconcile Pathway 3 to the same vocabulary. */}
        <button type="button" onClick={exportForCounselor} disabled={messages.length === 0} className="mt-3 text-xs uppercase tracking-wider px-3 py-2 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#E7EBE2] disabled:opacity-40 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]">
          Save these reflections to share →
        </button>
        {(c.links?.stayConnected || c.site) && (
          <p className="text-xs text-[#5A5751] mt-3" style={serif}>
            Your home church: {c.name || 'The Church of The Living God'}. <a href={c.links?.stayConnected || c.site} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Stay connected →</a>
          </p>
        )}
      </section>

      {/* ===================================================================
          TLC THERAPY SOLUTIONS REFERRAL BANNER
          The ONLY block where clinical vocabulary is permitted. Copied verbatim
          from Practice.jsx (same URLs, same copy, same structure). Do not let
          the words below ("therapy", "Therapist", "clinical") leak into any
          pastoral copy region outside this block.
          =================================================================== */}
      <div ref={tlcRef}>
        <p className="text-sm text-[#5A5751] italic mb-2" style={serif}>
          When something is bigger than a quiet room to think — TLC Therapy Solutions has licensed therapists ready to walk with you.
        </p>
        <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">TLC Therapy Solutions</div>
              <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Real Solutions for Real Life.</h2>
              <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Faith-integrated therapy. Online & in-person. Christina Poe, LCSW + clinical team.</p>
            </div>
            <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="bg-[#1A1815] text-[#FAF8F4] px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] whitespace-nowrap">📅 Book a Session →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <a href="https://tlctherapysolutions.me/" target="_blank" rel="noopener noreferrer" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Site</div>
              <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>tlctherapysolutions.com →</div>
            </a>
            <a href="https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities" target="_blank" rel="noopener noreferrer" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Match a Therapist</div>
              <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Find Your Therapist →</div>
            </a>
            <a href="mailto:contact@tlctherapysolutions.com" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direct Contact</div>
              <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>contact@tlctherapysolutions.com</div>
            </a>
          </div>
        </section>
      </div>
      {/* ===================== END TLC BANNER BLOCK ======================= */}

      {/* CRISIS RESOURCES — Pathway 1, always on. Highlights on a crisis signal. */}
      <section
        ref={crisisRef}
        className={`p-4 ${crisisActive ? 'border-2 border-[#B85838] bg-[#FBF1EC]' : 'border border-[#E8E4DC] bg-white'}`}
        aria-label="Crisis resources"
      >
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">If you need help right now</div>
        <ul className="text-sm space-y-1.5" style={serif}>
          <li><a href="tel:988" className="underline text-[#B85838] hover:text-[#1A1815]">988</a> — Suicide & Crisis Lifeline (call or text), 24/7</li>
          <li>Crisis Text Line — text <strong>HOME</strong> to <a href="sms:741741" className="underline text-[#B85838] hover:text-[#1A1815]">741741</a>, 24/7</li>
          <li><a href="tel:18007997233" className="underline text-[#B85838] hover:text-[#1A1815]">1-800-799-7233</a> — National Domestic Violence Hotline, 24/7</li>
          <li><a href="tel:18009506264" className="underline text-[#B85838] hover:text-[#1A1815]">1-800-950-6264</a> — NAMI HelpLine, M–F 10a–10p ET</li>
        </ul>
      </section>

      {/* FOOTER DISCLAIMER */}
      <p className="text-[10px] text-[#5A5751] italic" style={serif}>
        This room holds no protected health information. Pastoral conversation only. For licensed care, see TLC above or the resources here.
      </p>
    </div>
  );
}

// One labeled section of the four-section assistant response.
// Hear / Mirror / Anchor / Invite (the dialog labels for DATA → TRUTH →
// IDENTITY → INVITATION). Anchor gets a distinct emphasis to underline
// identity-in-Christ; Invite renders italic with a soft chevron.
function Section({ label, body, serif, accent, anchor, invite }) {
  if (!body) return null;
  const base = 'text-sm leading-relaxed';
  return (
    <div className={anchor ? 'border-l-2 border-[#5A6E3D] pl-3' : ''}>
      <div className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color: accent ? '#B85838' : anchor ? '#5A6E3D' : '#5A5751' }}>
        {invite ? '› ' : ''}{label}
      </div>
      <p className={`${base} ${invite ? 'italic' : ''}`} style={serif}>{body}</p>
    </div>
  );
}
