// =============================================================================
// AdventureTrail — a Bible Adventure's trail, lit from real rows (DR-1523, J1)
// =============================================================================
// Five stops in a row: read the story, put it in order, learn the verse, who
// am I?, watch the episode. A stop lights only from a learner record
// (lib/kids/trail.js); the guide waits at the next one; the stops after it
// are locked here (the Games tab still opens every game); a stop that cannot
// be done yet (the episode before it is published) reads "coming soon" and
// never blocks the trail. Tapping a stop opens it, or says kindly what to
// finish first.
import React, { useState } from 'react';
import { GUIDES } from '../../lib/kids/guides.js';
import { trailProgress, stopTap } from '../../lib/kids/trail.js';
import { EPISODES } from '../../lib/kids/theater.js';
import { KidsIcon, kidsAsset, KZ_FOCUS } from './GuideArt.jsx';

export default function AdventureTrail({ book, records = [], signedIn = false, episodes = EPISODES, onOpen = null, compact = false }) {
  const [says, setSays] = useState('');
  if (!book) return null;
  const p = trailProgress(book, signedIn ? records : [], episodes);
  const nextStop = p.next >= 0 ? p.stops[p.next] : null;
  const tap = (i) => {
    const r = stopTap(p, i);
    setSays(r.says);
    if (r.open && onOpen) onOpen(r.open);
  };
  if (compact) {
    return (
      <div className="kz-trail compact" data-testid={`trail-${book.id}`} data-lit={p.lit} data-total={p.total} data-next={p.next}>
        <div className="kz-trail-head">
          <b>{book.title}</b>
          <small>{signedIn ? `${p.lit} of ${p.total} stops` : 'sign in to light the stops'}</small>
        </div>
        {nextStop ? (
          <button type="button" className={`kz-act teal ${KZ_FOCUS}`} onClick={() => tap(p.next)} data-testid={`trail-${book.id}-next`}>
            Next: {nextStop.title} ▶
          </button>
        ) : (
          <p className="lc-small">Every stop is lit. Well done!</p>
        )}
      </div>
    );
  }
  return (
    <div className="kz-trail" data-testid={`trail-${book.id}`} data-lit={p.lit} data-total={p.total} data-next={p.next} data-done={p.done ? 'true' : 'false'}>
      <div className="kz-trail-head">
        <b>{book.title} · your trail</b>
        <small>{signedIn ? `${p.lit} of ${p.total} stops lit` : 'sign in and every stop you finish lights'}</small>
      </div>
      <ol className="kz-trail-stops" aria-label={`${book.title} trail`}>
        {p.stops.map((s, i) => (
          <li key={s.id} className={`kz-stop ${s.state}`} data-testid={`stop-${book.id}-${s.id}`} data-state={s.state}>
            {s.state === 'next' && (
              <img className="kz-stop-guide" src={kidsAsset(i % 2 ? GUIDES.boy.face : GUIDES.girl.face)} alt="" data-interim="true" aria-hidden="true" />
            )}
            <button
              type="button"
              className={`kz-stop-btn ${KZ_FOCUS}`}
              onClick={() => tap(i)}
              aria-label={`${s.title}: ${s.state === 'lit' ? 'done' : s.state === 'next' ? 'your next stop' : s.state === 'locked' ? 'locked until the stop before is done' : 'coming soon'}`}
              aria-disabled={s.state === 'locked' || s.state === 'soon'}
            >
              <span className="kz-stop-ic" aria-hidden="true">
                {s.state === 'lit' ? (
                  <KidsIcon name="starfill" />
                ) : s.state === 'locked' ? (
                  <KidsIcon name="flag" />
                ) : s.state === 'soon' ? (
                  <KidsIcon name="theater" />
                ) : (
                  <KidsIcon name="starline" />
                )}
              </span>
              <b>{s.title}</b>
              <small>{s.state === 'lit' ? 'Done' : s.state === 'next' ? 'Next ▶' : s.state === 'soon' ? 'Coming soon' : 'Locked'}</small>
            </button>
          </li>
        ))}
      </ol>
      {says && (
        <p className="lc-small" role="status" data-testid={`trail-${book.id}-says`}>
          {says}
        </p>
      )}
      {p.done && (
        <p className="lc-small kz-yes" data-testid={`trail-${book.id}-done`}>
          Every stop on this trail is lit. Look at your badges!
        </p>
      )}
    </div>
  );
}
