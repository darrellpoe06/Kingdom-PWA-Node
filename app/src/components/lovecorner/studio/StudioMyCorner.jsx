// =============================================================================
// StudioMyCorner — the "My Corner" tab of the redesigned bottom bar
// =============================================================================
// A personal door, not a new system: every row opens a place that exists today
// (a church tab, a section of the home, or one of the header's own sheets by
// the same events the homepage's Customize strip already uses). A tab that
// needs an account (My Record, Members) appears only for a signed-in member,
// and its own gate is unchanged; a signed-out visitor is offered the one
// sign-in the app already has.
import React from 'react';
import UiIcon from '../../UiIcon.jsx';
import { MY_CORNER_DOORS } from '../../../lib/home-studio.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

export default function StudioMyCorner({ signedIn = false, onSignIn = null, open = () => {} }) {
  const fire = (name) => {
    try {
      window.dispatchEvent(new CustomEvent(name));
    } catch {
      /* no window */
    }
  };
  const doors = MY_CORNER_DOORS.filter((d) => !d.needsSignIn || signedIn);
  return (
    <section className="hs-corner" aria-labelledby="hs-corner-h" data-testid="hs-my-corner">
      <h3 id="hs-corner-h" className="hs-h2">
        My Corner
      </h3>
      {!signedIn && (
        <div className="hs-corner-in">
          <p className="hs-p">Sign in to keep your place, your prayer requests and your progress across devices. Everything public stays open without an account.</p>
          {onSignIn && (
            <button type="button" onClick={onSignIn} className={`hs-btn hs-btn-red ${FOCUS}`} data-testid="hs-corner-sign-in">
              Sign in / Create account
            </button>
          )}
        </div>
      )}
      <ul className="hs-corner-grid">
        {doors.map((d) => (
          <li key={d.key}>
            <button
              type="button"
              className={`hs-corner-door ${FOCUS}`}
              data-testid={`hs-corner-${d.key}`}
              onClick={() => (d.event ? fire(d.event) : open(d.go.sub, d.go.section || null))}
            >
              <span className="hs-corner-ic" aria-hidden="true">
                <UiIcon name={d.icon} />
              </span>
              <span className="hs-corner-t">
                <b>{d.words}</b>
                <small>{d.note}</small>
              </span>
              <span aria-hidden="true" className="hs-chev">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
