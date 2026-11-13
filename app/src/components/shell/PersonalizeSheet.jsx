// =============================================================================
// PersonalizeSheet — "🎨 Personalize My App" (DR-1483; Screen 2 of the previews)
// =============================================================================
// One sheet in place of the header's row of color circles, the "Aa" cluster
// and the voice picker. Nothing new underneath: the theme cards are the shared
// THEMES registry through the same setTheme the circles called (same key, same
// per-device memory, DR-0524); text size is TextSizeControl's panel variant;
// the voice is ReadingVoiceControl's panel variant (saved to the account as
// before); reading speed is tts.js's own RATE_STEPS and prefs. Reset returns
// this device to the church's look and Normal text. Your choice is yours
// alone: it never changes the church's colors for anyone else.
import React, { useEffect, useState } from 'react';
import Modal from '../Modal.jsx';
import TextSizeControl from '../TextSizeControl.jsx';
import ReadingVoiceControl from '../ReadingVoiceControl.jsx';
import { THEMES, CHURCH_DEFAULT_THEME } from '../../lib/theme-css.js';
import { setTextSize, DEFAULT_TEXT_SIZE } from '../../lib/text-size.js';
import { RATE_STEPS, loadTTSPrefs, saveTTSPrefs, DEFAULT_RATE } from '../../lib/tts.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';

/** Pure. The Love Corner's own palettes first, then the rest in registry order. */
export function orderedThemes(themes = THEMES) {
  const night = themes.filter((t) => t.key === 'night');
  const cream = themes.filter((t) => t.key === 'lovecorner');
  return [...night, ...cream, ...themes.filter((t) => t.key !== 'night' && t.key !== 'lovecorner')];
}

export default function PersonalizeSheet({ open, onClose, theme, setTheme, isOwner = false }) {
  const [rate, setRate] = useState(DEFAULT_RATE);
  useEffect(() => {
    if (!open) return;
    try {
      setRate(loadTTSPrefs().rate || DEFAULT_RATE);
    } catch (_) {
      setRate(DEFAULT_RATE);
    }
  }, [open]);
  const pickRate = (v) => {
    setRate(v);
    try {
      const p = loadTTSPrefs();
      saveTTSPrefs({ ...p, rate: v });
    } catch (_) {
      /* no store */
    }
  };
  const reset = () => {
    if (setTheme) setTheme(CHURCH_DEFAULT_THEME);
    setTextSize(DEFAULT_TEXT_SIZE);
    pickRate(DEFAULT_RATE);
  };
  return (
    <Modal open={open} onClose={onClose} label="Personalize My App" maxWidthClass="max-w-md">
      {/* The Modal portals to <body>, outside the shell's themed wrapper, so the sheet carries the theme scope itself. */}
      <div className="lch-sheet" data-theme={theme || undefined} data-testid="lch-personalize-sheet">
        <h2 className="lch-sheet-h">🎨 Personalize My App</h2>
        <section aria-labelledby="lch-p-theme">
          <h3 id="lch-p-theme" className="lch-group-h">
            Choose your theme
          </h3>
          <div className="lch-themes" role="radiogroup" aria-label="Theme">
            {orderedThemes().map((t) => {
              const on = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTheme && setTheme(t.key)}
                  className={`lch-theme ${on ? 'lch-theme-on' : ''} ${FOCUS}`}
                  data-testid={`lch-theme-${t.key}`}
                  title={t.label}
                >
                  <span className="lch-swatch" style={{ backgroundColor: t.color, '--b': t.border }} aria-hidden="true" />
                  <small>
                    {t.label.split(' · ')[0]}
                    {t.key === 'night' ? ' · night' : ''}
                  </small>
                  {on && (
                    <span className="lch-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <section aria-labelledby="lch-p-access">
          <h3 id="lch-p-access" className="lch-group-h">
            Accessibility
          </h3>
          <TextSizeControl variant="panel" />
          <div className="lch-opt" style={{ marginTop: '.5rem' }}>
            <span>
              Reading voice<small>Read aloud is the Read button on every page</small>
            </span>
          </div>
          <ReadingVoiceControl variant="panel" isOwner={isOwner} />
          <div className="lch-opt" style={{ marginTop: '.5rem' }}>
            <span>Reading speed</span>
            <span className="lch-seg" role="radiogroup" aria-label="Reading speed">
              {RATE_STEPS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={Math.abs(rate - s.value) < 0.01}
                  onClick={() => pickRate(s.value)}
                  className={`lch-seg-btn ${Math.abs(rate - s.value) < 0.01 ? 'lch-seg-on' : ''} ${FOCUS}`}
                  data-testid={`lch-rate-${s.value}`}
                >
                  {s.name}
                </button>
              ))}
            </span>
          </div>
          <p className="lch-note">Motion follows your phone's reduce-motion setting.</p>
        </section>
        <section aria-labelledby="lch-p-mine">
          <h3 id="lch-p-mine" className="lch-group-h">
            Personal preferences
          </h3>
          <p className="lch-note">
            Your choice is saved on this phone as you tap it, and your voice follows your account. The church's colors stay the same for everyone else.
          </p>
          <div className="lch-row">
            <button type="button" onClick={reset} className={`lch-pill ${FOCUS}`} data-testid="lch-reset">
              Reset to the church's look
            </button>
            <button type="button" onClick={onClose} className={`lch-pill lch-pill-gold ${FOCUS}`} data-testid="lch-done">
              Done
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
