// =============================================================================
// RelationshipTracks -- the guided tracks at the top of the Relationships page (DR-1702)
// =============================================================================
// Three walks through lessons already on the Relationships shelf (Couples,
// Parents, Repair), each a picture wearing one of its own lessons' approved
// covers. The data, the wording rules and the progress source are in
// lib/learn-presentation/relationship-tracks.js; this file only draws them.
// Progress is counted from the reader's own saved places and read record;
// a track nobody has begun shows no bar and says "Not started" (DR-0076).
// =============================================================================
import React from 'react';
import { trackAction } from '../../lib/learn-presentation/relationship-tracks.js';
import LessonProgressBar from '../LessonProgressBar.jsx';
import './relationship-tracks.css';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

function stepStatus(s) {
  if (s.finished) return 'Read';
  if (s.progress && s.progress.fraction > 0) return s.progress.label;
  return '';
}

function Track({ t, art, onRead }) {
  const action = trackAction(t);
  return (
    <article className="ls-track" data-testid={`ls-track-${t.id}`}>
      <button type="button" className={`ls-track-thumb ${RING}`} onClick={() => onRead(t.next.step.x)} aria-label={`${t.label}: ${t.title}. ${action}`}>
        {art(t.cover.p, t.label)}
        {/* Steps read out of steps in the track: counted, never estimated; drawn by the one bar (DR-1684). */}
        {t.finishedCount > 0 && (
          <LessonProgressBar
            progress={{ fraction: t.finishedCount / t.total, finished: t.complete, label: `${t.finishedCount} of ${t.total} read` }}
            look="studio"
            silent
          />
        )}
      </button>
      <div className="ls-track-body">
        <h3 className="ls-track-title">
          <span className="ls-track-label">{t.label}</span> {t.title}
        </h3>
        <p className="ls-track-note">{t.note}</p>
        <p className="ls-track-count" data-testid="ls-track-count">
          {t.started ? `${t.finishedCount} of ${t.total} read` : `Not started · ${t.total} steps`}
        </p>
        <button type="button" className={`ls-btn ls-btn--white ls-track-go ${RING}`} data-testid="ls-track-go" onClick={() => onRead(t.next.step.x)}>
          {action}
        </button>
        <details className="ls-track-steps">
          <summary className={RING}>The {t.total} steps</summary>
          <ol>
            {t.steps.map((s, i) => {
              const status = stepStatus(s);
              return (
                <li key={s.x.lesson.id} className={s.finished ? 'is-read' : ''} data-testid={`ls-track-step-${t.id}-${i + 1}`}>
                  <button type="button" className={`ls-track-step-open ${RING}`} onClick={() => onRead(s.x)}>
                    <span className="ls-track-step-n">Step {i + 1}</span> {s.x.p.displayTitle}
                  </button>
                  {s.why && <p className="ls-track-why">{s.why}</p>}
                  {s.prompt && (
                    <p className="ls-track-talk">
                      <strong>Talk about it together:</strong> {s.prompt}
                    </p>
                  )}
                  {status && <p className="ls-track-status">{status}</p>}
                  {s.progress && !s.finished && <LessonProgressBar progress={s.progress} look="studio" className="ls-progress--inline" silent />}
                </li>
              );
            })}
          </ol>
        </details>
      </div>
    </article>
  );
}

/** props: tracks (relationshipTracks()), art(p, headline) -> node, onRead(x) opens the Lesson Experience. */
export default function RelationshipTracks({ tracks, art, onRead }) {
  if (!tracks || !tracks.length) return null;
  return (
    <section className="ls-row ls-tracks-row" data-testid="ls-relationship-tracks">
      <header className="ls-row-head">
        <h2>
          <span className="ls-ico ls-ico--star" aria-hidden="true" />
          Guided Tracks
        </h2>
        <span className="ls-note">Lessons in order, with a question to talk about together</span>
      </header>
      <div className="ls-tracks">
        {tracks.map((t) => (
          <Track key={t.id} t={t} art={art} onRead={onRead} />
        ))}
      </div>
    </section>
  );
}
