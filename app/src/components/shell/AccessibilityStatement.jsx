// =============================================================================
// AccessibilityStatement — WCAG 2.1 AA, named and stated honestly (DR-1660)
// =============================================================================
// Lives in the shared "Appearance & Accessibility" sheet, so every app carries
// it. The words come from lib/accessibility-statement.js; this only lays them
// out and sends a barrier report on the feedback pipe.
// =============================================================================
import React, { useState } from 'react';
import { WCAG, STATEMENT, sendBarrierReport } from '../../lib/accessibility-statement.js';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function AccessibilityStatement({ send = sendBarrierReport }) {
  const [words, setWords] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | sign-in | failed
  const go = async () => {
    setState('sending');
    const where = typeof window !== 'undefined' && window.location ? window.location.href : '';
    const r = await send(words, { where });
    setState(r && r.ok ? 'sent' : (r && r.why) || 'failed');
    if (r && r.ok) setWords('');
  };
  const say = {
    sent: 'Thank you. It was sent to the stewards.',
    'sign-in': 'Sign in to send a report.',
    failed: 'It did not send. Try again in a moment.',
  }[state];
  return (
    <section aria-labelledby="lch-a11y-h" data-testid="accessibility-statement">
      <h3 id="lch-a11y-h" className="lch-group-h">
        Accessibility · {WCAG.name}
      </h3>
      <p className="lch-note">{STATEMENT.goal}</p>
      <details>
        <summary className={`lch-pill ${FOCUS}`} data-testid="a11y-details">
          Where we stand (checked {STATEMENT.checkedOn})
        </summary>
        <p className="lch-note">
          <strong>Measured:</strong>
        </p>
        <ul className="lch-note" data-testid="a11y-measured">
          {STATEMENT.measured.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="lch-note">
          <strong>Not yet proven:</strong>
        </p>
        <ul className="lch-note" data-testid="a11y-not-yet">
          {STATEMENT.notYet.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="lch-note">
          The standard:{' '}
          <a href={WCAG.url} target="_blank" rel="noopener noreferrer" className={FOCUS}>
            {WCAG.full}
          </a>
        </p>
      </details>
      <label className="lch-note" htmlFor="lch-a11y-report">
        {STATEMENT.report}
      </label>
      <textarea
        id="lch-a11y-report"
        rows={3}
        value={words}
        onChange={(e) => setWords(e.target.value)}
        style={{ width: '100%', borderRadius: 10, padding: 8, font: 'inherit' }}
        data-testid="a11y-report-text"
      />
      <div className="lch-row">
        <button type="button" onClick={go} disabled={state === 'sending' || !words.trim()} className={`lch-pill ${FOCUS}`} data-testid="a11y-report-send">
          {state === 'sending' ? 'Sending…' : 'Report a barrier'}
        </button>
        {say && (
          <span role="status" className="lch-note">
            {say}
          </span>
        )}
      </div>
    </section>
  );
}
