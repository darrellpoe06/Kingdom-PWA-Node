// FollowAlong render — the congregant view mounts safely (no auth, fail-soft) and
// shows the right state: a join box with no code, and a "waiting" hold once a code is
// set. The live slide path itself is covered by follow-along-sync.test.js (the sync)
// + presenter-render.test.jsx (AudienceSlide rendering points); here we prove the
// standalone view renders its branches without a network.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import FollowAlong from '../components/FollowAlong.jsx';

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('FollowAlong — the congregant follow view', () => {
  it('with NO code shows a join box (code input + Follow button), no crash', () => {
    act(() => root.render(createElement(FollowAlong, { code: null })));
    expect(container.querySelector('#follow-code')).toBeTruthy();
    const followBtn = [...container.querySelectorAll('button')].find((b) => /^follow$/i.test(b.textContent.trim()));
    expect(followBtn).toBeTruthy();
    expect(container.textContent).toMatch(/Follow along/i);
  });

  it('with a code shows the following state + a deliberate waiting hold (never a stale slide)', () => {
    act(() => root.render(createElement(FollowAlong, { code: 'love7' })));
    // code is normalized + shown, and the room sees an intentional holding state
    expect(container.textContent).toMatch(/Following · LOVE7/);
    expect(container.textContent).toMatch(/Waiting for the presenter/i);
  });
});
