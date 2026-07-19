// =============================================================================
// FollowAlong — the congregant's LIVE view of the presenter's slide, on their phone
// =============================================================================
// Booted standalone by main.jsx on ?follow=CODE (a lean, no-auth slide renderer, the
// sibling of AudienceWindow). It holds NO curriculum of its own: it subscribes to the
// session's Supabase Realtime channel by code and renders whatever slide the presenter
// is on — the SAME clean AudienceSlide the room sees on the wall, so a person in the
// pew follows along on their own device (Darrell 2026-07-19, Love Corner staging).
//
// If no code is present it shows a small join box; while connecting or between
// sessions it shows a deliberate holding state (never a stale slide). Dark, large,
// high-contrast — the same projector palette as AudienceWindow.
import React, { useEffect, useReducer, useState, useCallback } from 'react';
import AudienceSlide from './AudienceSlide.jsx';
import {
  subscribeFollow, applyFollowEvent, FOLLOW_INIT, normalizeFollowCode, FOLLOW_ALONG_ENABLED,
} from '../lib/follow-along-sync.js';

function readCodeFromUrl() {
  try { return normalizeFollowCode(new URLSearchParams(window.location.search).get('follow') || ''); } catch { return ''; }
}

export default function FollowAlong({ code: codeProp = null }) {
  const [code, setCode] = useState(() => normalizeFollowCode(codeProp) || readCodeFromUrl());
  const [draft, setDraft] = useState('');
  const [state, dispatch] = useReducer(applyFollowEvent, FOLLOW_INIT);

  useEffect(() => {
    if (!FOLLOW_ALONG_ENABLED || !code) return undefined;
    const unsub = subscribeFollow(code, {
      onSlide: (slide) => dispatch({ type: 'slide', slide }),
      onHold: () => dispatch({ type: 'hold' }),
      onEnd: () => dispatch({ type: 'end' }),
      onStatus: (s) => { if (s === 'SUBSCRIBED') dispatch({ type: 'status', status: 'live' }); },
    });
    return unsub;
  }, [code]);

  const join = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();
    const c = normalizeFollowCode(draft);
    if (c) setCode(c);
  }, [draft]);

  const frame = {
    minHeight: '100vh', background: '#14110E', color: '#FAF8F4',
    // Top-aligned like the LED wall — words at the top, so a follow view cast onto a
    // wall matches the room and the speaker (below the words) never blocks the text.
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
    padding: 'clamp(24px, 5vw, 72px)', fontFamily: '"Fraunces", Georgia, serif',
  };

  // Disabled or no code yet -> a small, warm join box (no auth, no data).
  if (!FOLLOW_ALONG_ENABLED || !code) {
    return (
      <div style={{ ...frame, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#EBA77E', marginBottom: 20 }}>
          The Church of the Living God
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 600, margin: 0 }}>Follow along</h1>
        {!FOLLOW_ALONG_ENABLED ? (
          <p style={{ color: '#CFC9BD', marginTop: 20 }}>Follow-along is not available right now.</p>
        ) : (
          <form onSubmit={join} style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <label htmlFor="follow-code" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Session code</label>
            <input
              id="follow-code"
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              placeholder="Enter code"
              autoCapitalize="characters"
              style={{
                fontSize: 22, letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center',
                padding: '12px 18px', width: 220, background: '#1F1B16', color: '#FAF8F4',
                border: '1px solid #4A453D', borderRadius: 10, fontFamily: '"JetBrains Mono", monospace',
              }}
            />
            <button
              type="submit"
              style={{
                fontSize: 16, fontWeight: 600, padding: '12px 22px', cursor: 'pointer',
                background: 'transparent', color: '#C9D9A6', border: '2px solid #C9D9A6', borderRadius: 10,
              }}
            >
              Follow
            </button>
          </form>
        )}
      </div>
    );
  }

  const holdSlide = state.status === 'ended'
    ? { title: 'The session has ended', kicker: 'The Church of the Living God' }
    : { title: 'Waiting for the presenter…', kicker: 'The Church of the Living God' };

  return (
    <div style={frame}>
      <div style={{ position: 'fixed', top: 14, left: 16, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#CFC9BD', fontFamily: '"JetBrains Mono", monospace' }}>
        Following · {code}
      </div>
      <AudienceSlide slide={state.slide || null} hold={state.slide ? null : holdSlide} />
    </div>
  );
}
