// =============================================================================
// DoorFeedback — "this is broken" on the door itself, signed in or not
// =============================================================================
// DR-0376. The affordance that did not exist when Sterling's order silently
// failed. Deliberately plain and deliberately LOW in the page: it is a safety
// net, not a call to action competing with her order form.
//
// It is open to a signed-out customer on purpose (0216). That is the whole
// point -- the person meeting a broken door is the least likely to be signed
// in, and the old alternative was "tell the owner in person and hope."
// =============================================================================
// React in scope explicitly: this project uses the CLASSIC JSX runtime, so a
// component importing only hooks compiles fine, lints clean, and throws
// "React is not defined" the moment it renders. Caught by mounting it.
import React, { useState } from 'react';
import { DOOR_FEEDBACK_AREAS, submitDoorFeedback } from '../lib/door-feedback-sync.js';

export default function DoorFeedback({ doorSlug, instanceSlug, brandLabel = 'this business', accent = '#B85838' }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ area: 'other', body: '', contact: '' });
  const [state, setState] = useState('idle'); // idle | sending | ok | error
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.body.trim()) return;
    setState('sending');
    const r = await submitDoorFeedback(doorSlug, instanceSlug, f);
    setState(r.ok ? 'ok' : 'error');
  };

  if (!open) {
    return (
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-xs text-[#5A5751] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ '--tw-ring-color': accent }}
        >
          Something not working on this page? Tell us.
        </button>
      </div>
    );
  }

  if (state === 'ok') {
    return (
      <div className="mt-4 rounded-xl border border-[#5A6E3D] bg-white p-3 text-sm text-[#5A6E3D]">
        ✓ Thank you — this went straight to {brandLabel}. If you left a way to reach you, someone will follow up.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
      <h3 className="font-semibold text-[#1A1815]">Tell us what went wrong</h3>
      <p className="mt-1 text-xs text-[#5A5751]">
        You do not need an account, and you do not have to leave your name.
      </p>

      <label className="mt-2 block text-xs text-[#5A5751]" htmlFor="df-area">Where on the page?</label>
      <select
        id="df-area" value={f.area} onChange={set('area')}
        className="mt-1 w-full rounded border border-[#E8E2D8] px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ '--tw-ring-color': accent }}
      >
        {DOOR_FEEDBACK_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>

      <label className="mt-2 block text-xs text-[#5A5751]" htmlFor="df-body">What happened?</label>
      <textarea
        id="df-body" required rows={3} value={f.body} onChange={set('body')}
        placeholder="What you were trying to do, and what the page did instead."
        className="mt-1 w-full rounded border border-[#E8E2D8] px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ '--tw-ring-color': accent }}
      />

      <label className="mt-2 block text-xs text-[#5A5751]" htmlFor="df-contact">
        How to reach you <span className="text-[#5A5751]">(optional)</span>
      </label>
      <input
        id="df-contact" value={f.contact} onChange={set('contact')} autoComplete="email"
        placeholder="Email or @handle — only if you want a reply"
        className="mt-1 w-full rounded border border-[#E8E2D8] px-3 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ '--tw-ring-color': accent }}
      />

      <div className="mt-3 flex gap-2">
        <button
          type="submit" disabled={state === 'sending'}
          className="rounded-lg px-3 py-2.5 font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ backgroundColor: accent, '--tw-ring-color': accent }}
        >
          {state === 'sending' ? 'Sending…' : 'Send this report'}
        </button>
        <button
          type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-[#E8E2D8] px-3 py-2.5 text-[#5A5751] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ '--tw-ring-color': accent }}
        >
          Cancel
        </button>
      </div>

      {state === 'error' && (
        <div role="alert" className="mt-2 rounded-lg border p-2.5 text-xs" style={{ borderColor: accent, color: accent }}>
          <strong>This report did not send.</strong>{' '}
          Nothing you typed is lost — it is still on this screen. Please try once more, and if it still
          will not go, reach {brandLabel} the way you normally would.
        </div>
      )}
    </form>
  );
}
