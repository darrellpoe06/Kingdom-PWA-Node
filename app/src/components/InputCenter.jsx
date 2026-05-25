// =============================================================================
// InputCenter — the reusable voice / link / text "processing center"
//
// Per Darrell's 2026-05-25 direction: *"I want to use this voice and link
// processing center, make sure they can also type of course any way to
// interact with the app, whatever isn't too difficult."*
//
// This is the extracted, reusable form of the Add Your Voice section first
// landed inline on the Church tab in app/src/poe-financial-mvp-v28.jsx.
//
// Three input modes, all native, no paid dependency:
//   - VOICE — Web Speech API (SpeechRecognition / webkitSpeechRecognition).
//             Feature-detected; falls back gracefully to type-only when unavailable.
//   - LINK  — paste a URL; light http(s) sanity check; URL stored verbatim.
//   - TEXT  — type into the same field the voice transcript appends to.
//
// The component is STATELESS about persistence. The caller supplies:
//   - onSubmit(entry)            — called when the user taps "Save Note"
//   - contributions[]            — the displayed log (optional; pass [] or omit
//                                  to hide the log entirely)
//   - onSendContribution(id)     — optional; renders a Send button per entry
//   - onDeleteContribution(id)   — optional; renders an × delete button per entry
//   - mailtoBuilder(entry)       — optional; called by Send to construct the
//                                  mailto URL. Default opens entry.link or "#".
//
// Where it gets used today:
//   - Church tab (Add Your Voice) — currently inline; future commit swaps to
//     `<InputCenter ... />` once the post-handoff-patches push has settled.
//
// Where it could get used next:
//   - The Council Chamber surface (per docs/00-foundations/_root/COUNCIL-CHAMBER.md
//     — same input pattern, different routing of the submission).
//   - Any module that wants a "drop a voice note, paste a link, jot a thought"
//     surface — Practice intake, Books transaction notes, Project capture, etc.
//
// POE binding: the user controls the mic, the link, the topic, and the moment
// to share. Nothing leaves the device until they tap Send. Feature detection
// is graceful — when voice isn't available the user can still type or link.
// =============================================================================

import React, { useState, useRef } from 'react';

// Shared style tokens. Match the inline version in poe-financial-mvp-v28.jsx
// so the visual is identical when the inline version is swapped for this one.
const FIELD_CLS = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL_CLS = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

export default function InputCenter({
  // Header
  title = 'Add Your Voice · Speak or Share a Link',
  description = "Drop in a voice note or paste a link about anything you see here. Logged on your device; send to the right people when you're ready.",

  // Field placeholders
  placeholderTopic = "e.g., Today's sermon · An article · A question",
  placeholderText  = 'Type here, or tap the mic to speak.',
  placeholderLink  = 'https://…',

  // Visible-section toggles
  showTopic = true,
  showLink  = true,
  showLog   = true,

  // Action callbacks (caller-owned state)
  onSubmit,                  // (entry) => void
  contributions = [],
  onSendContribution,        // (id) => void  — optional
  onDeleteContribution,      // (id) => void  — optional
  mailtoBuilder,             // (entry) => string  — optional

  // Misc
  className = '',
  initiallyOpen = false,     // expand the form on mount?
  speechLang = 'en-US',
}) {
  const [form, setForm] = useState({ topic: '', text: '', link: '' });
  const [error, setError] = useState('');
  const [open, setOpen] = useState(!!initiallyOpen);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Web Speech API feature detection
  const speechSupported = typeof window !== 'undefined'
    && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleSpeech = () => {
    if (!speechSupported) {
      setError('Voice input is not supported in this browser. Type your note or paste a link instead.');
      return;
    }
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous     = false;
    r.interimResults = false;
    r.lang           = speechLang;
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(res => res[0].transcript)
        .join(' ')
        .trim();
      if (transcript) {
        setForm(prev => ({
          ...prev,
          text: prev.text ? `${prev.text} ${transcript}`.trim() : transcript,
        }));
      }
    };
    r.onerror = (e) => {
      setError(`Voice input error: ${e.error || 'unknown'}. Type your note instead.`);
      setIsListening(false);
    };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    setError('');
    try {
      r.start();
      setIsListening(true);
    } catch (err) {
      setError('Could not start voice input. Type your note or paste a link instead.');
      setIsListening(false);
    }
  };

  const submit = () => {
    const topic = (form.topic || '').trim();
    const text  = (form.text  || '').trim();
    const link  = (form.link  || '').trim();
    if (!text && !link) {
      setError('Add a note (speak or type) or paste a link before saving.');
      return;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      setError('Links should start with http:// or https://. Edit and re-save.');
      return;
    }
    setError('');
    const entry = {
      id:        `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic, text, link,
      createdAt: new Date().toISOString(),
      sentAt:    null,
    };
    if (typeof onSubmit === 'function') onSubmit(entry);
    setForm({ topic: '', text: '', link: '' });
    setOpen(false);
  };

  const defaultMailtoBuilder = (entry) => entry.link || '#';
  const buildMailto = mailtoBuilder || defaultMailtoBuilder;

  return (
    <section
      aria-labelledby="input-center-h"
      className={`bg-white border-2 border-[#B85838] p-4 ${className}`}
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3
          id="input-center-h"
          className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold"
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={() => { setOpen(!open); setError(''); }}
          className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {open ? '× Cancel' : '+ Add a note'}
        </button>
      </div>

      {description && (
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {description}
        </p>
      )}

      {open && (
        <div className="mt-3 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
          {showTopic && (
            <div>
              <label htmlFor="ic-topic" className={LABEL_CLS}>
                What's this about? (optional)
              </label>
              <input
                id="ic-topic"
                className={FIELD_CLS}
                placeholder={placeholderTopic}
                value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })}
              />
            </div>
          )}

          <div>
            <label htmlFor="ic-text" className={LABEL_CLS}>
              Your note (type or speak)
            </label>
            <textarea
              id="ic-text"
              rows="3"
              className={FIELD_CLS}
              placeholder={placeholderText}
              value={form.text}
              onChange={e => setForm({ ...form, text: e.target.value })}
            />
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button
                type="button"
                onClick={toggleSpeech}
                aria-pressed={isListening}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                disabled={!speechSupported}
                className={`text-xs uppercase tracking-wider px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                  isListening
                    ? 'bg-[#B85838] text-white border-[#B85838] animate-pulse'
                    : speechSupported
                      ? 'border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white'
                      : 'border-[#E8E4DC] text-[#5A5751] opacity-60 cursor-not-allowed'
                }`}
              >
                {isListening ? '⏹ Stop' : '🎤 Speak'}
              </button>
              {!speechSupported && (
                <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                  Voice input not available in this browser — type your note instead.
                </span>
              )}
              {isListening && (
                <span className="text-[10px] text-[#B85838] uppercase tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  listening…
                </span>
              )}
            </div>
          </div>

          {showLink && (
            <div>
              <label htmlFor="ic-link" className={LABEL_CLS}>
                Or paste a link
              </label>
              <input
                id="ic-link"
                type="url"
                className={FIELD_CLS}
                placeholder={placeholderLink}
                value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
              />
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            Save Note
          </button>

          {error && (
            <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {showLog && contributions.length > 0 && (
        <div className="mt-3 border border-[#1A1815]">
          {contributions.map((entry, i, arr) => (
            <div
              key={entry.id}
              className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {(entry.createdAt || '').slice(0, 10)}{entry.topic ? ` · ${entry.topic}` : ''}
                  </div>
                  {entry.text && (
                    <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                      {entry.text}
                    </div>
                  )}
                  {entry.link && (
                    <div className="text-xs mt-0.5">
                      <a
                        href={entry.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[#B85838] hover:text-[#1A1815] break-all"
                      >
                        {entry.link}
                      </a>
                    </div>
                  )}
                  <div className="text-[10px] uppercase tracking-wider mt-1 text-[#5A5751]">
                    {entry.sentAt
                      ? `✓ sent ${entry.sentAt.slice(0, 10)}`
                      : 'private (on this device)'}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!entry.sentAt && typeof onSendContribution === 'function' && (
                    <a
                      href={buildMailto(entry)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onSendContribution(entry.id)}
                      className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] inline-flex items-center focus:outline focus:outline-2 focus:outline-[#B85838]"
                    >
                      Send →
                    </a>
                  )}
                  {typeof onDeleteContribution === 'function' && (
                    <>
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window === 'undefined' || window.confirm('Delete this note?')) {
                            onDeleteContribution(entry.id);
                          }
                        }}
                        aria-label="Delete this note"
                        className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
