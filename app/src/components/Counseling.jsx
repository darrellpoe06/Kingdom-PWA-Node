import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { askCouncilChamber, SUPPORTED_BIBLE_VERSIONS, DEFAULT_BIBLE_VERSION } from '../lib/councilChamberLLM.js';
import { isVoiceSupported, createRecognizer } from '../lib/councilChamberVoice.js';
import {
  isCryptoSupported, generateSalt, deriveKey, encryptJSON, decryptJSON, makeVerifier, checkVerifier,
} from '../lib/councilChamberCrypto.js';

// Counseling.jsx — the Council Chamber sub-surface, rendered as a sub-tab inside
// Church.jsx. Pastoral conversation only: voice + text in, AI four-section
// response out, PIN-gated encrypted journal, licensed-care handoff, always-on
// crisis resources. Foundation (free) tier — no gate.
//
// Banned clinical vocabulary (therapy / therapist / clinical / diagnose /
// diagnosis / treatment / patient / client) is confined to the single TLC
// referral block below — pastoral copy elsewhere avoids it deliberately.

const ENTRIES_KEY = 'councilChamberEntries'; // encrypted { iv, ct } blob
const SALT_KEY = 'councilChamberSalt';
const VERIFIER_KEY = 'councilChamberVerifier';
const VERSION_KEY = 'councilChamberVersion';
const API_KEY_LS = 'councilChamberApiKey';
const DISCLAIMER_SESSION_KEY = 'councilChamberDisclaimerDismissed';

const IDLE_LOCK_MS = 15 * 60 * 1000; // configurable idle timeout (default 15 min)

// Counselor domains. Counseling depends on the experience/domain of the
// counselor — this serves individual believers AND church leaders / business
// owners thinking through how to run their organization.
const COUNSELOR_TYPES = [
  'Pastor',
  'Elder',
  'Lay counselor',
  'Ministry / department leader',
  'Business mentor',
  'Spiritual knowledge / Bible teacher',
  'Technology / systems counselor',
  'Other',
];
// Types that reveal a free-text subfield (e.g., which ministry/department).
const COUNSELOR_DETAIL_TYPES = ['Ministry / department leader', 'Other'];

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

function lsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Group the flat message list into user→assistant exchanges for per-entry
// display, delete, and export.
function groupExchanges(messages) {
  const out = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      const next = messages[i + 1];
      out.push({ user: messages[i], assistant: next && next.role === 'assistant' ? next : null, userIndex: i });
    }
  }
  return out;
}

function exchangeToMarkdown(ex) {
  const ts = (ex.user?.timestamp || '').slice(0, 16).replace('T', ' ');
  const version = ex.assistant?.version || DEFAULT_BIBLE_VERSION;
  const s = ex.assistant?.sections || {};
  const lines = [
    `# The Council Chamber · ${ts}`,
    '',
    `**Me (${ex.user?.source || 'text'}):** ${ex.user?.content || ''}`,
    '',
    `**Reflection** *(citations in ${version})*`,
    '',
  ];
  if (s.hear) lines.push(`**Hear.** ${s.hear}`, '');
  if (s.mirror) lines.push(`**Mirror.** ${s.mirror}`, '');
  if (s.anchor) lines.push(`**Anchor.** ${s.anchor}`, '');
  if (s.invite) lines.push(`**Invite.** ${s.invite}`, '');
  if (!ex.assistant) lines.push('*(no reflection recorded for this entry)*', '');
  lines.push('---', '_Citations may be approximate — verify against your Bible._');
  return lines.join('\n');
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Counseling({ church, onBackToHome }) {
  const c = church || {};

  const cryptoOk = useMemo(() => isCryptoSupported(), []);
  const [vaultExists, setVaultExists] = useState(() => !!lsGet(SALT_KEY));
  const [cryptoKey, setCryptoKey] = useState(null); // null === locked
  const locked = !cryptoKey;

  const [messages, setMessages] = useState([]); // decrypted, in-memory only

  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinBusy, setPinBusy] = useState(false);

  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [crisisActive, setCrisisActive] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const [bibleVersion, setBibleVersion] = useState(() => lsGet(VERSION_KEY) || DEFAULT_BIBLE_VERSION);
  const [counselorType, setCounselorType] = useState(COUNSELOR_TYPES[0]);
  const [counselorDetail, setCounselorDetail] = useState('');

  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

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
  const idleTimerRef = useRef(null);
  const tlcRef = useRef(null);
  const crisisRef = useRef(null);
  const counselorRef = useRef(null);

  // Persist the conversation, ENCRYPTED, whenever it changes and the vault is
  // unlocked. Guard on cryptoKey so that locking (which clears in-memory
  // messages) never overwrites the stored ciphertext with an empty blob.
  useEffect(() => {
    if (!cryptoKey) return;
    let cancelled = false;
    (async () => {
      try {
        const blob = await encryptJSON(cryptoKey, messages);
        if (!cancelled) localStorage.setItem(ENTRIES_KEY, JSON.stringify(blob));
      } catch {
        // Storage / crypto unavailable — conversation stays in memory only.
      }
    })();
    return () => { cancelled = true; };
  }, [messages, cryptoKey]);

  const lock = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setCryptoKey(null);
    setMessages([]);
  }, []);

  const resetIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => lock(), IDLE_LOCK_MS);
  }, [lock]);

  useEffect(() => () => {
    if (recognizerRef.current) recognizerRef.current.stop();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  const dismissDisclaimer = () => {
    setDisclaimerDismissed(true);
    try {
      sessionStorage.setItem(DISCLAIMER_SESSION_KEY, '1');
    } catch {
      // session storage unavailable — disclaimer simply re-shows next load.
    }
  };

  const changeVersion = (v) => {
    setBibleVersion(v);
    try {
      localStorage.setItem(VERSION_KEY, v);
    } catch {
      // non-fatal; selection just won't persist across reloads.
    }
  };

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ---- PIN: create vault ----
  const createVault = async () => {
    setPinError('');
    if (pin.length < 4) { setPinError('Choose a PIN of at least 4 characters.'); return; }
    if (pin !== pin2) { setPinError('The two PINs do not match.'); return; }
    setPinBusy(true);
    try {
      const salt = generateSalt();
      const key = await deriveKey(pin, salt);
      const verifier = await makeVerifier(key);
      localStorage.setItem(SALT_KEY, salt);
      localStorage.setItem(VERIFIER_KEY, JSON.stringify(verifier));
      localStorage.removeItem(ENTRIES_KEY);
      setVaultExists(true);
      setMessages([]);
      setCryptoKey(key);
      setPin(''); setPin2('');
      resetIdle();
    } catch {
      setPinError('Could not set up the private journal on this device.');
    } finally {
      setPinBusy(false);
    }
  };

  // ---- PIN: unlock existing vault ----
  const unlockVault = async () => {
    setPinError('');
    if (!pin) { setPinError('Enter your PIN.'); return; }
    setPinBusy(true);
    try {
      const salt = lsGet(SALT_KEY);
      const verifierRaw = lsGet(VERIFIER_KEY);
      const key = await deriveKey(pin, salt);
      const verifier = verifierRaw ? JSON.parse(verifierRaw) : null;
      const ok = verifier ? await checkVerifier(key, verifier) : true;
      if (!ok) { setPinError('That PIN does not match. Try again.'); setPinBusy(false); return; }
      const entriesRaw = lsGet(ENTRIES_KEY);
      let loaded = [];
      if (entriesRaw) {
        try { loaded = await decryptJSON(key, JSON.parse(entriesRaw)); } catch { loaded = []; }
      }
      setMessages(Array.isArray(loaded) ? loaded : []);
      setCryptoKey(key);
      setPin('');
      resetIdle();
    } catch {
      setPinError('Could not unlock. Check your PIN and try again.');
    } finally {
      setPinBusy(false);
    }
  };

  const toggleVoice = () => {
    if (!voiceSupported) return;
    if (listening) { recognizerRef.current?.stop(); return; }
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
    try { localStorage.setItem(API_KEY_LS, k); } catch { /* in-memory only */ }
    setApiKey(k);
    setKeyDraft('');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || pending || locked) return;
    if (listening) recognizerRef.current?.stop();
    resetIdle();

    const source = listening ? 'voice' : 'text';
    const isFirstMessage = messages.filter((m) => m.role === 'user').length === 0;
    setCrisisActive(looksLikeCrisis(text));

    const userMsg = { role: 'user', content: text, source, timestamp: new Date().toISOString() };
    const history = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');
    setPending(true);

    try {
      const counselor = counselorDetail.trim() ? `${counselorType} (${counselorDetail.trim()})` : counselorType;
      const { sections, rawText } = await askCouncilChamber({
        apiKey, history, userMessage: text, isFirstMessage, bibleVersion, counselor,
      });
      setMessages((prev) => [...prev, {
        role: 'assistant', content: rawText, sections, version: bibleVersion, timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      if (err?.message === 'NO_API_KEY') {
        setError('No API key configured. Add one below to begin.');
      } else {
        setError('The Chamber could not respond just now. Check your connection or API key and try again.');
      }
      setMessages((prev) => prev.filter((m) => m !== userMsg));
      setInput(text);
    } finally {
      setPending(false);
    }
  };

  const deleteExchange = (userIndex) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setMessages((prev) => {
      const copy = [...prev];
      const removeCount = (copy[userIndex + 1] && copy[userIndex + 1].role === 'assistant') ? 2 : 1;
      copy.splice(userIndex, removeCount);
      return copy;
    });
  };

  const confirmDeleteAll = () => {
    if (deleteConfirm !== 'DELETE') return;
    setMessages([]);
    try { localStorage.removeItem(ENTRIES_KEY); } catch { /* non-fatal */ }
    setShowDeleteAll(false);
    setDeleteConfirm('');
  };

  const exchanges = useMemo(() => groupExchanges(messages), [messages]);
  const transcript = useMemo(() => [...exchanges].reverse(), [exchanges]);

  const exportAll = () => {
    if (exchanges.length === 0) return;
    const detail = counselorDetail.trim() ? ` (${counselorDetail.trim()})` : '';
    const counselorLine = `_For: ${counselorType}${detail} · counselor in the church_\n\n`;
    const body = counselorLine + exchanges.map(exchangeToMarkdown).join('\n\n');
    downloadText(`council-chamber-all-${new Date().toISOString().slice(0, 10)}.md`, body);
  };
  const exportOne = (ex) => downloadText(`council-chamber-${(ex.user?.timestamp || '').slice(0, 10)}.md`, exchangeToMarkdown(ex));

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
        <div className="flex items-center gap-3">
          {!locked && (
            <button type="button" onClick={lock} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">🔒 Lock</button>
          )}
          {onBackToHome && (
            <button type="button" onClick={onBackToHome} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">← Switch back to Home</button>
          )}
        </div>
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

      {/* PRIVATE JOURNAL LOCK GATE — protects the conversation + journal. */}
      {!cryptoOk ? (
        <section className="bg-white border border-[#B85838] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Private journal unavailable</div>
          <p className="text-sm text-[#5A5751]" style={serif}>This browser does not support the encryption this private room requires. Please use a current browser to keep your reflections protected.</p>
        </section>
      ) : locked ? (
        <section className="bg-white border-2 border-[#5A6E3D] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color: '#5A6E3D' }}>{vaultExists ? 'Unlock your private journal' : 'Set up your private journal'}</div>
          <p className="text-sm text-[#5A5751] mb-3" style={serif}>
            {vaultExists
              ? 'Your reflections are encrypted on this device. Enter your PIN to open them. They lock again when you leave or after 15 minutes of quiet.'
              : 'Choose a PIN. Your reflections are encrypted on this device with it, so they can be yours alone — sourced when you need them, without fear of exposure. The PIN is never stored, so if it is forgotten the entries cannot be recovered.'}
          </p>
          <div className="space-y-2 max-w-sm">
            <input type="password" inputMode="numeric" autoComplete="off" className={fieldCls} placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && vaultExists) unlockVault(); }} />
            {!vaultExists && (
              <input type="password" inputMode="numeric" autoComplete="off" className={fieldCls} placeholder="Confirm PIN" value={pin2} onChange={(e) => setPin2(e.target.value)} />
            )}
            <button type="button" disabled={pinBusy} onClick={vaultExists ? unlockVault : createVault} className="w-full bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]">
              {pinBusy ? 'Working…' : vaultExists ? 'Unlock →' : 'Create journal →'}
            </button>
            {pinError && <p role="alert" className="text-xs text-[#B85838]" style={serif}>{pinError}</p>}
          </div>
        </section>
      ) : (
        <>
          {/* INPUT ROW */}
          <section className="bg-white border border-[#1A1815] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label htmlFor="cc-input" className="text-[9px] uppercase tracking-wider text-[#5A5751]">Type or speak — the system will listen first.</label>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] flex items-center gap-1">
                Bible version
                <select value={bibleVersion} onChange={(e) => changeVersion(e.target.value)} className="border border-[#E8E4DC] bg-[#FAF8F4] text-xs p-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                  {SUPPORTED_BIBLE_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </div>
            <textarea id="cc-input" rows="4" className={fieldCls} style={serif} placeholder="What's on your mind today?" value={input} onChange={(e) => setInput(e.target.value)} />
            <div className="flex items-center gap-2 flex-wrap">
              {voiceSupported ? (
                <button type="button" onClick={toggleVoice} aria-pressed={listening} className={`px-3 py-2.5 text-xs uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-[#B85838] ${listening ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#1A1815] hover:bg-[#FAF8F4]'}`}>
                  {listening ? '⏹ Stop' : '🎙 Speak'}
                </button>
              ) : (
                <span title="Voice input not supported in this browser" className="px-3 py-2.5 text-xs uppercase tracking-wider border border-[#E8E4DC] text-[#9A958C] cursor-not-allowed">🎙 Voice n/a</span>
              )}
              <button type="button" onClick={send} disabled={pending || !input.trim()} className="flex-1 bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]">
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
              {transcript.map((ex) => (
                <div key={ex.userIndex} className="bg-white border border-[#1A1815]">
                  <div className="p-3 border-b border-[#E8E4DC]">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={mono}>
                        {ex.user?.source === 'voice' ? '🎙 voice' : '⌨ text'} · {(ex.user?.timestamp || '').slice(0, 16).replace('T', ' ')}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => exportOne(ex)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">⬇ .md</button>
                        <button type="button" onClick={() => deleteExchange(ex.userIndex)} aria-label="Delete this entry" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">× Delete</button>
                      </div>
                    </div>
                    <p className="text-sm mt-1" style={serif}>{ex.user?.content}</p>
                  </div>
                  {ex.assistant && (
                    <div className="p-4 space-y-3">
                      <Section label="Hear" body={ex.assistant.sections?.hear} serif={serif} />
                      <Section label="Mirror" body={ex.assistant.sections?.mirror} serif={serif} accent />
                      <Section label="Anchor" body={ex.assistant.sections?.anchor} serif={serif} anchor />
                      <Section label="Invite" body={ex.assistant.sections?.invite} serif={serif} invite />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LOCAL JOURNAL — encrypted at rest as councilChamberEntries */}
          <section className="border border-[#E8E4DC] bg-white">
            <div className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
              <button type="button" onClick={() => setShowJournal(!showJournal)} className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
                {showJournal ? '▾' : '▸'} Journal · {exchanges.length} encrypted on this device
              </button>
              {exchanges.length > 0 && (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={exportAll} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">⬇ Export all .md</button>
                  <button type="button" onClick={() => { setShowDeleteAll(true); setDeleteConfirm(''); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete all</button>
                </div>
              )}
            </div>
            {showJournal && (
              <div className="p-3 text-xs space-y-1.5" style={mono}>
                {exchanges.length === 0 ? (
                  <p className="text-[#5A5751] italic" style={serif}>Saved reflections live here, encrypted on your device, and survive a reload — opened only with your PIN.</p>
                ) : (
                  exchanges.map((ex) => (
                    <div key={ex.userIndex} className="text-[#5A5751]">{(ex.user?.timestamp || '').slice(0, 16).replace('T', ' ')} — {ex.user?.content.slice(0, 60)}{(ex.user?.content.length || 0) > 60 ? '…' : ''}</div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* DELETE-ALL CONFIRMATION MODAL */}
          {showDeleteAll && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Delete all entries">
              <div className="bg-white border-2 border-[#B85838] p-5 max-w-md w-full">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Permanently delete everything</div>
                <p className="text-sm text-[#5A5751] mb-3" style={serif}>This will permanently delete all your Council Chamber entries on this device. This cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
                <input className={fieldCls} placeholder="DELETE" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setShowDeleteAll(false)} className="flex-1 border border-[#1A1815] py-2 text-xs uppercase tracking-wider hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                  <button type="button" disabled={deleteConfirm !== 'DELETE'} onClick={confirmDeleteAll} className="flex-1 bg-[#B85838] text-white py-2 text-xs uppercase tracking-wider font-semibold disabled:opacity-40 hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete all</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* COUNSELORS IN THE CHURCH — quieter than the TLC banner; the gentle next step */}
      <section ref={counselorRef} className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Bring this to a counselor in your church</div>
        <p className="text-sm text-[#5A5751] leading-relaxed" style={serif}>
          This room is preparation — the counselors in the church are the conversation. When you're ready to bring this to a real person who knows you, here's how.
        </p>
        {/* Vocabulary note: COUNCIL-CHAMBER.md Pathway 3 now uses the canonical
            "counselors in the church" phrasing (reconciled 2026-05-23 from the
            earlier "pastor or designated care leader"). The person chooses which
            kind of counselor below. */}
        {/* TODO (post-MVP): This picker is the seed of a credentialed-counselor
            marketplace — eventually maps to discoverable, bookable counselors
            from the SKOS network (Church of the Living God + affiliated churches
            + business mentors + technology counselors). Domains include pastoral,
            eldership, ministry-leadership (any department), business operations,
            Scripture/teaching, AND technology + systems consulting (the
            originating church's tech department serving smaller churches who
            lack systems understanding). Eventually pairs with two distinct
            productized services: (a) deliberate training of smaller churches on
            SKOS itself, and (b) assisted documentation of those churches'
            procedures and processes. Tonight ships only the local picker UI;
            the marketplace, training, and documentation services are separate
            initiatives. */}
        <div className="mt-3 flex items-end gap-3 flex-wrap">
          <label className="text-[9px] uppercase tracking-wider text-[#5A5751] flex flex-col gap-1">
            Bring this to:
            <select value={counselorType} onChange={(e) => setCounselorType(e.target.value)} className="border border-[#5A6E3D] bg-[#FAF8F4] text-xs p-1.5 focus:outline focus:outline-2 focus:outline-[#B85838]">
              {COUNSELOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {COUNSELOR_DETAIL_TYPES.includes(counselorType) && (
            <label className="text-[9px] uppercase tracking-wider text-[#5A5751] flex flex-col gap-1 flex-1 min-w-[160px]">
              {counselorType === 'Ministry / department leader' ? 'Which ministry / department' : 'Specify'}
              <input value={counselorDetail} onChange={(e) => setCounselorDetail(e.target.value)} placeholder={counselorType === 'Ministry / department leader' ? "e.g., children's, worship, missions, finance" : 'Describe the kind of counselor'} className="border border-[#5A6E3D] bg-[#FAF8F4] text-xs p-1.5 focus:outline focus:outline-2 focus:outline-[#B85838]" />
            </label>
          )}
          <button type="button" onClick={exportAll} disabled={locked || exchanges.length === 0} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#E7EBE2] disabled:opacity-40 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]">
            Save reflections as .md →
          </button>
        </div>
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
      <section ref={crisisRef} className={`p-4 ${crisisActive ? 'border-2 border-[#B85838] bg-[#FBF1EC]' : 'border border-[#E8E4DC] bg-white'}`} aria-label="Crisis resources">
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
  return (
    <div className={anchor ? 'border-l-2 border-[#5A6E3D] pl-3' : ''}>
      <div className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color: accent ? '#B85838' : anchor ? '#5A6E3D' : '#5A5751' }}>
        {invite ? '› ' : ''}{label}
      </div>
      <p className={`text-sm leading-relaxed ${invite ? 'italic' : ''}`} style={serif}>{body}</p>
    </div>
  );
}
